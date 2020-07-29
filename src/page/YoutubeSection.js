import React, { Component } from 'react';
import { Image, TouchableOpacity, View, StatusBar, Dimensions, PixelRatio, TextInput, Alert } from 'react-native';
import { Container, Content, Button, List, ListItem, Picker, Input, Form, Item,
  Header, Body, Tab, Tabs, ScrollableTab, Card, CardItem, Left, Thumbnail, Right, Icon, Label } from 'native-base';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import IconAntDesign from 'react-native-vector-icons/AntDesign';
import Spinner from 'react-native-loading-spinner-overlay';
import RNFetchBlob from 'rn-fetch-blob';
import ImagePicker from 'react-native-image-picker';
import Orientation from 'react-native-orientation';
import axios from 'axios';
import IconSimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';

// Our custom files and classes import
import Text from '../component/Text';
import ErrorMsg from '../component/ErrorMsg';
import Navbar from '../component/Navbar';
import * as styles from "../Styles";
import Colors from "../Colors";
import store from "../store/index";
import * as funcs from "../utils/funcs";
import Storage from "../storage/index";
import * as appActions from "../actions/appActions";
import api from '../utils/api';

const { width, height } = Dimensions.get('window');

class YoutubeSection extends Component {
  constructor(props) {
    super(props);
   
    this.youtubePlayerState = "";
    this.videoId = "";

    this.state = {
      url: "",
      videoDefault:"",
      fullScreen: false,
      heightVideo:300
    };
  }

  componentWillMount() {
    this.app = store.getState().app;    
  }

  async componentDidMount() {
    await this.refreshYoutube();
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  async refreshYoutube() {
    if (this.unmounted) {
      return;
    }

    var result = await api.GetVideoLive();
    if (result.code == 200) {

      var data = result.data;      

      if (!data.success) {
        funcs.showMsg(data.message);
      }

      if(data.videoId == "true")
        getVideoYoutubeCache();
      else  
        this.renderYoutubePlayer(data.videoId);
    }     
    else 
    {
      setTimeout(this.refreshYoutube.bind(this), 2000);
    }
  }

  async getVideoYoutubeCache()
  {
    if (this.unmounted) {
      return;
    }

    var result = await api.GetLiveVideoIdFromCache();
    if (result.code == 200) {
      var data = result.data;
     
      this.renderYoutubePlayer(data.videoId);
     
      if (!data.success) {
        funcs.showMsg(data.message);
      }

      if(data.videoId == "")
      setTimeout(this.getVideoYoutubeCache.bind(this), 2000);
    }     
    else 
    {
      setTimeout(this.getVideoYoutubeCache.bind(this), 2000);
    }
  }

  renderYoutubePlayer(videoId) {
    if (this.unmounted) {
      return;
    }

    if (this.videoId == videoId) {
      return;
    }

    this.videoId = videoId;

    if (videoId == null || videoId == "") {
      return;
    }

    var heightVideo =45+ 9 * width/16; 

    this.setState({url: api.getYoutubeEmbedUrl(videoId),videoDefault: videoId,heightVideo:heightVideo});
  }

  onFullScreenTextPress() {
    Orientation.lockToLandscape();
    this.setState({fullScreen: true});
  }

  onFullScreenPress() {
    Orientation.unlockAllOrientations();
    Orientation.lockToPortrait();
    this.setState({fullScreen: false});
  }

  render() {
    return(
      <View>
        <View style={[styles.columnCenter, this.state.url != "" ? (this.state.fullScreen ? s.playerFullScreen : {width:width,height:this.state.heightVideo}) : {}]}>
          {
            this.state.url != "" ? (
              <WebView allowsInlineMediaPlayback={true} 
              mediaPlaybackRequiresUserAction={false}
             source={{ uri: "http://chualonghung.vn/videoplayer.html?videoID="+this.state.videoDefault}}
             style={[this.state.fullScreen ? s.playerFullScreen : {width:width,height:this.state.heightVideo}]}/>
            ) : null
          }        

          {
            this.state.url != "" ? (
              <View style={[s.fullScreenTextRow, this.state.fullScreen ? styles.displayNone : {}]}>
                <TouchableOpacity onPress={this.onFullScreenTextPress.bind(this)}>
                <Text style={s.textFullScreen}>Toàn màng hình</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          {
            this.state.fullScreen ? (
              <TouchableOpacity style={s.fullScreenButton} onPress={this.onFullScreenPress.bind(this)}>
                <IconMaterialCommunityIcons style={s.fullScreenIcon} name="fullscreen"/>
              </TouchableOpacity>
            ) : null
          }
        </View>

        <View style={[styles.columnCenter, s.videoView]}>
          <TouchableOpacity  flex center style={s.playlistLeft} onPress={()=>funcs.goTo("YoutubePlayListBaiGiang")}>
            <IconSimpleLineIcons name="playlist" style={styles.playList}/>
            <Label>Nền Tảng Giáo Lý</Label>
          </TouchableOpacity>         

          <TouchableOpacity flex center style={s.playlistRight} onPress={()=>funcs.goTo("YoutubePlayListList")}>
            <IconSimpleLineIcons name="people" style={styles.playList}/>
            <Label>Pháp Sư Hướng Dẫn</Label>
          </TouchableOpacity>           
        </View>
      </View>
    );
  }
}

const s = {
  textFullScreen: {
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
    textDecorationColor: Colors.navbarBackgroundColor,
    color: Colors.navbarBackgroundColor,
    fontStyle: 'italic',
    paddingRight: 5
  },
  fullScreenTextRow: {
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "flex-end", 
    width: "100%"
  },
  fullScreenButton: {
    width: 32,
    height: 32,
    position: "absolute",
    bottom: 20,
    right: 10,
    zIndex: 1000
  },
  fullScreenIcon: {
    fontSize: 32,
    color: Colors.navbarBackgroundColor
  },
  playerNormal: {
    height: styles.playerConatinerHeight, 
    width: width
  },
  playerFullScreen: {
    width: height,
    height: width
  },
  playlistLeft: {
    width:"50%",
    position:"relative",
    justifyContent: 'center',
    alignItems: 'center'
  },  
  playlistRight: {
    width:"50%",
    position:"relative",
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center'        
  },
  videoView: {
    flexDirection:'row'    
  }
};

export default YoutubeSection;