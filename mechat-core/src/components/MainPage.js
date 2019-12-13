import React, { Component } from "react";

import { Route } from "react-router";
import { HashRouter, withRouter } from "react-router-dom";

import { inject, observer } from "mobx-react";

import honoka from 'honoka';

import "../styles/MainPage.styl";

import config from "../config";

import Navbar from "./Navbar";
import MessageList from './MessageList';
import ChatPage from './ChatPage';
import FriendsList from "./FriendsList";
import ProfilePage from "./ProfilePage";
import ProfileEdit from './ProfileEdit';
import AboutPage from "./AboutPage";
import GroupList from './GroupList';
import CreateNewGroupPage from "./CreateNewGroupPage";
import GroupPage from "./GroupPage";
import GroupChatPage from "./GroupChatPage";

@inject("store")
@observer
class MainPage extends Component {
  createSocketConnection() {
    this.ws = new WebSocket(config.wsUrl);
    const ws = this.ws;

    ws.addEventListener('open', () => {
      console.log('WebSocket opened.');
      ws.send(JSON.stringify({
        uid: this.props.store.uid,
        token: this.props.store.token
      }));
    });

    ws.addEventListener('message', (msg) => {
      msg = JSON.parse(msg.data);
      switch (msg.type) {
        case 'message':
          console.log(msg);
          this.props.store.pushNewMessage(msg.from, msg.payload);
          break;
        default:
          break;
      }
    });


    ws.addEventListener('error', () => {
      alert("连接错误。返回登录页面...");
      this.props.history.push('/');
    });
  }

  forceLogout() {
    alert("身份认证出现问题，请重新登录。");

    sessionStorage.removeItem('userInfo');
    this.props.history.push('/');
  }

  componentWillMount() {
    if (sessionStorage.getItem("userInfo") == null)
      this.props.history.push("/");
    else
      this.props.store.setUserInfo(
        JSON.parse(sessionStorage.getItem("userInfo"))
      );
    
    // establish socket connection
    this.createSocketConnection();

    // get friends list
    const friendUri = this.props.store.API('friends');
    honoka.post(friendUri, {
      data: {
        uid: this.props.store.uid,
        token: this.props.store.token
      }
    }).then(res => {
      if (res.status !== 200)
        this.forceLogout();
      else
        this.props.store.updateFriends(res.payload);
    });

    // get groups list
    const groupUri = this.props.store.API('getUserGroups');
    honoka.post(groupUri, {
      data: {
        uid: this.props.store.uid,
        token: this.props.store.token
      }
    }).then(res => {
      if (res.status !== 200)
        this.forceLogout();
      else
        this.props.store.updateGroups(res.payload);
    });

    this.props.store.reloadMessageList();
  }
  componentWillUnmount() {
    this.ws.close();
  }

  componentDidMount() {
    window.browserWindow.getCurrentWindow().setSize(800, 600);
  }

  render() {
    return (
      <div className="mechat-mainpage">
        <HashRouter history={this.props.history}>
          <Route path='/app'>
            <Navbar />
          </Route>
          
          <Route path='/app/message'>
            <MessageList />
          </Route>

          <Route path='/app/message/:id'>
            <ChatPage />
          </Route>

          <Route path='/app/groupMessage/:id'>
            <MessageList />
            <GroupChatPage />
          </Route>

          <Route path='/app/friends'>
            <FriendsList/>
          </Route>

          <Route path='/app/friends/:id'>
            <ProfilePage/>
          </Route>

          <Route path="/app/groups">
            <GroupList/>
          </Route>

          <Route path="/app/groups/:id">
            <GroupPage/>
          </Route>

          <Route path="/app/createNewGroup">
            <GroupList/>
            <CreateNewGroupPage />
          </Route>

          <Route path='/app/editProfile'>
            <FriendsList />
            <ProfileEdit />
          </Route>

          <Route path='/app/about'>
            <AboutPage />
          </Route>
        </HashRouter>
      </div>
    );
  }
}

export default withRouter(MainPage);