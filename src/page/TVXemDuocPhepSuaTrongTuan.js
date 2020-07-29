import React, { Component } from 'react';
import { Image, TouchableOpacity, View, StatusBar, Dimensions } from 'react-native';
import { Container, Content, Button, List, ListItem, Picker, Drawer, Segment, Form, Item, Input,
  Icon, Header, Body, Tab, Tabs, ScrollableTab, Card, CardItem, Left, Thumbnail, Right, H1 } from 'native-base';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import Spinner from 'react-native-loading-spinner-overlay';
import IconEntypo from 'react-native-vector-icons/Entypo';
import moment from "moment";
import Orientation from 'react-native-orientation';

// Our custom files and classes import
import Text from '../component/Text';
import Label from '../component/Label';
import Colors from "../Colors";
import store from "../store/index";
import api from '../utils/api';
import * as funcs from "../utils/funcs";
import * as appActions from "../actions/appActions";
import FooterTabThanhVien from "../component/FooterTabThanhVien";
import UserMenuDropdown from "../component/UserMenuDropdown";
import UserMenu from "../component/UserMenu";
import * as styles from "../Styles";
import DaySelect from "../component/DaySelect";
import ErrorMsg from '../component/ErrorMsg';
import PopupContainer from '../component/PopupContainer';

const { width, height } = Dimensions.get('window');

class TVXemDuocPhepSuaTrongTuan extends Component {
  constructor(props) {
    super(props);

    this.originEditPopupStyle = {
      container: {
        width: width,
        height: height
      },
      inner: {
        width: width - 4,
        height: height - 120,
      },
      landscape: {
        container: {
          width: height,
          height: width
        },
        inner: {
          width: height - 4,
          height: width - 120,
        }
      }
    };

    this.state = {
      spinner: true,
      userMenuVisible: false,
      ngayContent: null,
     
      orientation: "",
      editPopupVisible: false,

      thoiGianNghePhap: "",
      thoiGianTungKinh: "",
      thoiGianRanh: "",
      soLuongDanhHieu: "",
      tocDoNiemPhat: "",
      congPhuNgayId: 0,

      sendRequestEditPopupVisible: false,
      isShowForm: false,
      hadSendRequest: false
    };

    this.weeksInMonths = [];
  }

  componentWillMount() {
    this.app = store.getState().app;
    
    Orientation.getOrientation(((err, orientation) => {
      this.setState({orientation: orientation});
    }).bind(this));

    this.fromDate = this.props.navigation.getParam('fromDate', '');
    this.toDate = this.props.navigation.getParam('toDate', '');
  }

  async componentDidMount() {
    this._orientationDidChange = this.orientationDidChange.bind(this);
    Orientation.addOrientationListener(this._orientationDidChange);
    await this.renderNgayContent();
    await this.getCities_ThoiGianRanhs_NgheNghieps();
    this.setState({
      thoiGianRanhThuongNgay: this.app.loginInfo.thoiGianRanh == null ? "" : this.app.loginInfo.thoiGianRanh.toString(),
      thoiGianRanh: this.app.loginInfo.thoiGianRanh == null ? "" : this.app.loginInfo.thoiGianRanh.toString()},()=>{
      this.renderThoiGianRanhs();       
    });

    this.setState({spinner: false});
  }

  orientationDidChange(orientation) {
    this.setState({
      orientation: orientation
    });
  }

  componentWillUnmount(){
    this.unmounted = true;
    Orientation.removeOrientationListener(this._orientationDidChange)
  }

  onUserMenuClick() {
    this.setState({
      userMenuVisible: !this.state.userMenuVisible
    });
  }

  renderUserMenuDropdown() {
    return (
      <UserMenuDropdown onPressOut={this.onUserMenuClick.bind(this)}/>
    );
  }

  onKeyboard(show) {
    if (show) {
      this.setState({isHeightHalf: false});
      if (this.state.orientation == "LANDSCAPE") {
        return;
      }
      this.setState({isHeightHalf: true});
    } else {
      this.setState({isHeightHalf: false});
    }
  }

  async getDataTheoNgay() {
    var result = await api.getCongPhuTheoNgay({
      idThanhVien: this.app.loginInfo.id,
      tuNgay: this.fromDate,
      toiNgay: this.toDate
    });
    if (result.code === 200) {
      var data = result.data;
      if (data.success) {
        return data.results;
      } else {
        funcs.showMsg(data.message);  
        return null;
      }
    } else {
      funcs.showMsg(result.message);
      return null;
    }
  }

  async renderNgayContent() {
    var arr = [];

    arr.push(
      <View key="header" style={[s.theoNgay.table.headerContainer]}>
        <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
          <Text style={[s.theoNgay.table.headerText]}>Từ ngày{"\n"}{funcs.getValueFromServerDate(this.fromDate, "day")} - Thg {funcs.getValueFromServerDate(this.fromDate, "month")}</Text>
        </View>
        <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
          <Text style={[s.theoNgay.table.headerText]}>Thời gian nghe pháp, công phu</Text>
        </View>
        <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
          <Text style={[s.theoNgay.table.headerText]}>Số lượng danh hiệu</Text>
        </View>
        <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
          <Text style={[s.theoNgay.table.headerText]}>Số lượng nhiếp niệm</Text>
        </View>        
        <View style={[s.theoNgay.table.headerWidth]}>
          <Text style={[s.theoNgay.table.headerText]}>Trưởng Nhóm Xác Nhận</Text>
        </View>
      </View>
    );

    var results = await this.getDataTheoNgay();
    if (results != null && results.listRows.length > 0) {
      this.listDataTheoNgay = results.listRows;
      var listRows = results.listRows;
      for(var i = 0; i < listRows.length; ++i) {
        var item = listRows[i];
        arr.push(this.getJSXNgayRow(i, item));
      }

      arr.push(
        <View key={"tongket"} style={[s.theoNgay.table.itemContainer]}>
          <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
            <Text style={[s.theoNgay.table.itemText]}>Tổng kết</Text>
          </View>
          <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
            <Text style={[s.theoNgay.table.itemText]}>{results.totalTGNghePhap} - {results.totalTGTungKinh}</Text>
          </View>
          <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
            <Text style={[s.theoNgay.table.itemText]}>{results.totalSoLuongDH}</Text>
          </View>
          <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
            <Text style={[s.theoNgay.table.itemText]}>{results.totalSoLuongMatChu}</Text>
          </View>
          <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
            <Text style={[s.theoNgay.table.itemText]}></Text>
          </View>          
          <View style={[s.theoNgay.table.headerWidth]}>
          </View>
        </View>
      );
    } else {
      arr.push(
        <View key="nodata" style={[s.theoNgay.table.noDataCotainer]}>
          <View style={[{width: "100%"}]}>
            <Text style={[s.theoNgay.table.itemText]}>Không tìm thấy dữ liệu</Text>
          </View>
        </View>
      );
    }

    this.setState({
      ngayContent: arr
    });
  }

  getJSXNgayRow(i, item) {
    var onPress = (function() {
      if (item.isShowForm) {
        this.showSendRequestEditPopup(item.id);
      } else {
        this.showEditPopup(item.id);
      }
    }).bind(this);

    return (
      <View key={"item" + i} style={[s.theoNgay.table.itemContainer]}>
        <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
          <TouchableOpacity onPress={onPress}>
            <Text style={[s.theoNgay.table.itemText, item.hadSendRequest ? styles.actionTextBlue : styles.actionText]}>{item.point}</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
          <Text style={[s.theoNgay.table.itemText]}>{item.tgNghePhap} - {item.tgTungKinh}</Text>
        </View>
        <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
          <Text style={[s.theoNgay.table.itemText]}>{item.soLuongDH}</Text>
        </View>
        <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
          <Text style={[s.theoNgay.table.itemText]}>{item.soLuongMatChu}</Text>
        </View>
        <View style={[s.theoNgay.table.headerWidth]}>
          <Text style={[s.theoNgay.table.itemText]}>{item.trNhXacNhan}</Text>
        </View>
      </View>
    );
  }

  async onSearchByDayPress() {
    this.setState({spinner: true});
    await this.renderNgayContent();
    this.setState({spinner: false});
  }

  getRowDataTheoNgay(id) {
    for(var i = 0; i < this.listDataTheoNgay.length; ++i) {
      if (this.listDataTheoNgay[i].id == id) {
        return this.listDataTheoNgay[i];
      }
    }
    return null;
  }

  showEditPopup(id) {
    var item = this.getRowDataTheoNgay(id);

    if (item == null) {
      funcs.showMsg("Không tìm thấy dữ liệu");
      return;
    }

    this.setState({
      editPopupVisible: true,
      selectedItem: item,
      congPhuNgayId: item.id,
      thoiGianNghePhap: item.tgNghePhap.toString(),
      thoiGianTungKinh: item.tgTungKinh.toString(),
      soLuongDanhHieu: item.soLuongDH.toString(),
      thoiGianRanh: item.thoiGianRanh,
      tocDoNiemPhat: item.tocDoNiemPhat.toString(),
      soLuongMatChu:item.soLuongMatChu.toString(),
      tgNiemMatChu:item.tgNiemMatChu.toString()
    },() => { 
      this.diemTichLuy();      
    });
  }

  hideEditPopup() {
    this.setState({
      editPopupVisible: false
    });
  }

  onThoiGianNghePhapChange(value) {
    this.setState({errorThoiGianNghePhap: null});
    this.setState({thoiGianNghePhap: value}, () => {
      this.diemTichLuy(); 
  });
        
  }

  onThoiGianTungKinhChange(value) {
    this.setState({errorThoiGianTungKinh: null});
    this.setState({thoiGianTungKinh: value}, () => {
      this.diemTichLuy(); // 'bar', what we expect it to be.
  });
         
  }

  onSoLuongDanhHieuChange(value) {
    this.setState({errorSoLuongDanhHieu: null});
    this.setState({soLuongDanhHieu: value}, () => {
      this.diemTichLuy(); // 'bar', what we expect it to be.
  });
          
  }

  onTocDoNiemPhatChange(value) {
    this.setState({tocDoNiemPhat: value}, () => {
      this.diemTichLuy(); // 'bar', what we expect it to be.
  });
    this.setState({errorTocDoNiemPhat: null});
        
  }

  onSoLuongMatChuChange(value) {
    this.setState({soLuongMatChu: value}, () => {
      this.diemTichLuy();  // 'bar', what we expect it to be.
  });
    this.setState({errorSoLuongMatChu: null});
        
  }  

  onTGNiemMatChuChange(value) {
    this.setState({tgNiemMatChu: value}, () => {
      this.diemTichLuy();  // 'bar', what we expect it to be.
    });
    this.setState({errorTGNiemMatChu: null});       
  }   

  onThoiGianRanhChange(value) {
    if(value == "")
    {
      if( typeof(this.state.thoiGianRanh) != 'string' )
      {
      this.setState({
        thoiGianRanh: parseInt(this.state.thoiGianRanhThuongNgay),
        errorThoiGianRanh: null
      }, () => {
        this.diemTichLuy(); // 'bar', what we expect it to be.
    });
            
    }
    }
    else
    {
      this.setState({
        thoiGianRanh: value,
        errorThoiGianRanh: null
      }, () => {
        this.diemTichLuy(); // 'bar', what we expect it to be.
    });

            
    }
  
  }
  
  async getCities_ThoiGianRanhs_NgheNghieps() {
    this.listCities = [];
    this.listNgheNghieps = [];
    this.listThoiGianRanhs = [];

    let result = await api.getCities_ThoiGianRanhs_NgheNghieps();
    
    if (result.code === 200) {
      var data = result.data;
      this.listCities = data.tinhThanhs;
      this.listNgheNghieps = data.ngheNghieps;
      this.listThoiGianRanhs = data.thoiGianRanhs;
    } else {
      funcs.showMsg(result.message);
    }
  }    
  
  async saveCongPhu() {
    var valid = true;
    if (this.state.thoiGianNghePhap.trim() == "") {
      valid = false;
      this.setState({errorThoiGianNghePhap: "Hãy nhập thời gian nghe pháp"});
    }

    if (this.state.thoiGianTungKinh.trim() == "") {
      valid = false;
      this.setState({errorThoiGianTungKinh: "Hãy nhập thời gian tụng kinh"});
    }

    if (this.state.soLuongDanhHieu.trim() == "") {
      valid = false;
      this.setState({errorSoLuongDanhHieu: "Hãy nhập số lượng danh hiệu"});
    }

    if (this.state.tocDoNiemPhat.trim() == "") {
      valid = false;
      this.setState({errorTocDoNiemPhat: "Hãy nhập tốc độ niệm phật"});
    }

    if (this.state.thoiGianRanh == "") {
      valid = false;
      this.setState({errorThoiGianRanh: "Hãy nhập thời gian rãnh"});
    }

    if (!valid) {
      return;
    }

    this.setState({spinner: true});
    var result = await api.updateCongPhuById({
      id: this.state.congPhuNgayId,
      TGNghePhap: this.state.thoiGianNghePhap,
      TGTungKinh: this.state.thoiGianTungKinh,
      SoLuongDH: this.state.soLuongDanhHieu,
      SoLuongMatChu: this.state.soLuongMatChu,
      thoiGianRanh: this.state.thoiGianRanh,
      tocDoNiemPhat: this.state.tocDoNiemPhat,
      TGNiemMatChu: this.state.tgNiemMatChu
    });

    if (result.code == 200) {
      var data = result.data;
      if (data.success) {
        await this.renderNgayContent();
        this.hideEditPopup();
        this.hasUpdate = true;
      } 
    } else {
      funcs.showMsg(result.message);
    }

    this.setState({spinner: false});
  }

  showSendRequestEditPopup(id) {
    var item = this.getRowDataTheoNgay(id);

    if (item == null) {
      funcs.showMsg("Không tìm thấy dữ liệu");
      return;
    }

    this.setState({
      sendRequestEditPopupVisible: true,
      selectedItem: item,
      congPhuNgayId: item.id,
      thoiGianNghePhap: item.tgNghePhap.toString(),
      thoiGianTungKinh: item.tgTungKinh.toString(),
      soLuongDanhHieu: item.soLuongDH.toString(),
      thoiGianRanh: item.thoiGianRanh.toString(),
      tocDoNiemPhat: item.tocDoNiemPhat.toString(),
      hadSendRequest: item.hadSendRequest,
      soLuongMatChu:item.soLuongMatChu.toString(),
      tgNiemMatChu:item.tgNiemMatChu.toString()
    });
  }

  hideSendRequestEditPopup() {
    this.setState({
      sendRequestEditPopupVisible: false
    });
  }

  async sendRequestEdit() {
    this.setState({spinner: true});

    var result = await api.yeuCauDuocSuaGui({
      IDCongPhu: this.state.selectedItem.id,
      IDTHanhVien: this.app.loginInfo.id
    });

    if (result.code === 200) {
      var data = result.data;
      if (data.success) {
        funcs.showMsg("Gửi yêu cầu thành công");
        await this.renderNgayContent();
        this.hideSendRequestEditPopup();
      } else {
        funcs.showMsg(data.message);
      }
    } else {
      funcs.showMsg(result.message);
    }

    this.setState({spinner: false});
  }

  showHuongTamNiemInfo(){
    this.setState({
      huongTamNiemInfoPopupVisible: !this.state.huongTamNiemInfoPopupVisible
    });    
  }

  showNhiepTamNiemInfo(){
    this.setState({
      nhiepTamNiemInfoPopupVisible: !this.state.nhiepTamNiemInfoPopupVisible
    });    
  }  

  showTocDoNiemPhatInfo() {
    this.setState({
      tocDoNiemPhatInfoPopupVisible: !this.state.tocDoNiemPhatInfoPopupVisible
    });
  }

  renderThoiGianRanhs() {
    let thoiGianRanhElements = []
    let arr = this.listThoiGianRanhs;

    thoiGianRanhElements.push(
      <Picker.Item key={"tgr00"} label="Nhấn tại đây để chọn lại" value={""} />
    );
    for (var i = 0; i < arr.length; ++i) {
      let item = arr[i];

      if(item.value == this.state.thoiGianRanhThuongNgay)
      {
        thoiGianRanhElements.push(
        
          <Picker.Item key={"tgr" + i} label={item.name + " | Ngày Thường"} value={item.value} color="red" />
        );
      }
      else
      {
        thoiGianRanhElements.push(
        
          <Picker.Item key={"tgr" + i} label={item.name} value={item.value} />
        );
      }


      if(item.value == this.state.thoiGianRanhThuongNgay)
      {
        this.state.thoigianranhText = item.name;
      }
    }

    this.setState({
      thoiGianRanhElements: thoiGianRanhElements
    });

    
  }

  diemTichLuy(){
    var diemTichLuy = parseInt( parseInt(this.state.thoiGianNghePhap) + parseInt(this.state.thoiGianTungKinh) + parseInt(this.state.soLuongDanhHieu)/parseInt(this.state.tocDoNiemPhat) + parseInt(this.state.soLuongMatChu)*parseInt(this.state.tgNiemMatChu)/60);
    if(!isNaN(diemTichLuy))
    {
    var diemTichLuyHomNay = "( " + parseInt(diemTichLuy/60) + " tiếng " + diemTichLuy % 60 + " phút ) / "+this.state.thoiGianRanh+" tiếng";    
    this.setState({
      diemTichLuyHomNay:diemTichLuyHomNay
    });      
    }
  }  

  render() {
    return(
        <Container>
            <StatusBar hidden={funcs.ios()} backgroundColor={Colors.statusBarColor} barStyle="light-content"></StatusBar>
            <View style={[s.header.container, (this.state.orientation == "PORTRAIT" || this.state.orientation == "PORTRAITUPSIDEDOWN" || this.state.orientation == "UNKNOWN") ? {} : styles.displayNone]}>
                <Button transparent onPress={()=>funcs.back()}>
                  <IconFontAwesome name="arrow-left" style={styles.iconHeaderLeft}/>
                </Button>
                <Text style={styles.headerText}>Được Phép Chỉnh Sửa</Text>
                <UserMenu onClick={this.onUserMenuClick.bind(this)}/>
            </View>
          
            <Content removeClippedSubviews={true}>
                {this.state.ngayContent}
            </Content>
          
            {this.state.userMenuVisible ? this.renderUserMenuDropdown() : null}  
          
            {this.state.editPopupVisible 
            ? 
            (
              <PopupContainer onKeyboard={this.onKeyboard.bind(this)} style={[s.editPopup.container, this.state.orientation == "LANDSCAPE" ? this.originEditPopupStyle.landscape.container : this.originEditPopupStyle.container]}>
                <View style={[s.editPopup.inner, this.state.orientation == "LANDSCAPE" ? this.originEditPopupStyle.landscape.inner : this.originEditPopupStyle.inner, this.state.isHeightHalf ? styles.heightHalf : {}]}>
                    <View style={{flexDirection : "row", justifyContent: "space-between", alignItems: "center", height: 50, backgroundColor: Colors.navbarBackgroundColor}}>
                        <Text style={{paddingLeft: 10, color: Colors.buttonColor, fontWeight: "bold"}}>Chỉnh sửa công phu</Text>
                        <TouchableOpacity onPress={this.hideEditPopup.bind(this)} style={{paddingRight: 10}}>
                            <IconFontAwesome name="close" style={{color: Colors.buttonColor, fontSize: 20}}/>
                        </TouchableOpacity>
                    </View>
                    <Content>
                      <Form>
                        <Item style={s.editPopup.item}>
                            <View style={[{padding:5, backgroundColor: Colors.navbarBackgroundColor, width: "100%", marginTop: 10}]}>
                                <Text style={{color: "#ffffff"}}>
                                  {this.state.selectedItem.point},
                                  Ngày {funcs.getValueFromServerDate(this.state.selectedItem.ngay, "day")}/
                                  {funcs.getValueFromServerDate(this.state.selectedItem.ngay, "month")}/
                                  {funcs.getValueFromServerDate(this.state.selectedItem.ngay, "year")}
                                </Text>
                            </View>
                        </Item>
                        <View style={s.editPopup.fieldSet}>
                    <Text style={s.editPopup.legend}>Hướng tâm niệm</Text>  
                      <Item stackedLabel style={s.editPopup.item}>
                        <View style={{ alignSelf: 'stretch', flexDirection:'row', alignContent:'space-between'}}>
                          <Label style={{flex:0.9}}>Số lượng bấm   <Text style={styles.required}>{" *   "}</Text></Label>                          
                        </View>
                        <Input style={{flex:1}} placeholderTextColor="gray" keyboardType="numeric" maxLength={6} placeholder="0" value={this.state.soLuongDanhHieu} onChangeText={this.onSoLuongDanhHieuChange.bind(this)}/>
                      </Item> 
                      <ErrorMsg style={[this.state.errorSoLuongDanhHieu ? {} : styles.displayNone, s.errorMsg]}>
                        {this.state.errorSoLuongDanhHieu}
                      </ErrorMsg>
                      
                      <Item stackedLabel style={s.editPopup.item}>
                        <View style={{flexDirection : "row", justifyContent: "space-between", alignSelf: 'stretch'}}>
                          <Label style={{flex:0.9}}>Tốc độ niệm phật (số danh hiệu/ phút)<Text style={styles.required}>{" *"}</Text></Label>                       
                        </View>
                        <Input placeholderTextColor="gray" keyboardType="numeric" maxLength={6} placeholder="0" value={this.state.tocDoNiemPhat} onChangeText={this.onTocDoNiemPhatChange.bind(this)}/>
                      </Item>   
                      <ErrorMsg style={[this.state.errorTocDoNiemPhat ? {} : styles.displayNone, s.errorMsg]}>
                      {this.state.errorTocDoNiemPhat}
                      </ErrorMsg>               
                    </View>
                    
                    <View style={s.editPopup.fieldSet}>
                      <Text style={s.editPopup.legend}>Nhiếp tâm niệm</Text>
                      <Item stackedLabel style={s.editPopup.item}>
                        <View style={{ alignSelf: 'stretch',flexDirection:'row', alignContent:'space-between'}}>
                          <Label style={{flex:0.9}}>Số lượng bấm <Text style={styles.required}>{" *"}</Text></Label>                  
                        </View>
                        <Input placeholderTextColor="gray" keyboardType="numeric" maxLength={6} placeholder="0" value={this.state.soLuongMatChu} onChangeText={this.onSoLuongMatChuChange.bind(this)}/>
                      </Item>
                      <ErrorMsg style={[this.state.errorSoLuongMatChu ? {} : styles.displayNone, s.errorMsg]}>
                        {this.state.errorSoLuongMatChu}
                      </ErrorMsg>
                      <Item stackedLabel style={s.editPopup.item}>                
                        <Label>Thời gian giữa 2 lần bấm (giây)<Text style={styles.required}>{" *"}</Text></Label>                
                        <Input placeholderTextColor="gray" keyboardType="numeric" maxLength={6} placeholder="0" value={this.state.tgNiemMatChu} onChangeText={this.onTGNiemMatChuChange.bind(this)}/>
                      </Item>  
                      <ErrorMsg style={[this.state.errorTGNiemMatChu ? {} : styles.displayNone, s.errorMsg]}>
                        {this.state.errorTGNiemMatChu}
                      </ErrorMsg>                               
                    </View>
                  

                    <Item stackedLabel style={s.editPopup.item}>
                      <Label>Thời gian nghe pháp<Text style={styles.required}>{" *"}</Text></Label>
                      <Input placeholderTextColor="gray" keyboardType="numeric" maxLength={3} placeholder="(phút)" value={this.state.thoiGianNghePhap} onChangeText={this.onThoiGianNghePhapChange.bind(this)}/>
                    </Item>
                    <ErrorMsg style={[this.state.errorThoiGianNghePhap ? {} : styles.displayNone, s.errorMsg]}>
                      {this.state.errorThoiGianNghePhap}
                    </ErrorMsg>
                    <Item stackedLabel style={s.editPopup.item}>
                      <Label>Thời gian công phu<Text style={styles.required}>{" *"}</Text></Label>
                      <Input placeholderTextColor="gray" keyboardType="numeric" maxLength={3} placeholder="(phút)" value={this.state.thoiGianTungKinh} onChangeText={this.onThoiGianTungKinhChange.bind(this)}/>
                    </Item>
                    <ErrorMsg style={[this.state.errorThoiGianTungKinh ? {} : styles.displayNone, s.errorMsg]}>
                      {this.state.errorThoiGianTungKinh}
                    </ErrorMsg>

                    <View  style={{ flexDirection:'row', alignContent:'space-between',alignItems: "center",backgroundColor:"#77aae5"}}>
                      <Label>Điểm nổ lực hôm nay:</Label> 
                      <ErrorMsg style={[this.state.diemTichLuyHomNay ? {} : styles.displayNone, s.diemTichLuyMsg]}>
                      {this.state.diemTichLuyHomNay}
                      </ErrorMsg>                  
                    </View> 
                    <Card style={{backgroundColor:"#caf2fe",alignItems:"center"}}>
                          <CardItem bordered style={{width:"95%",marginBottom:10,marginTop:10}}>                   
                            <Item stackedLabel style={[s.editPopup.itemDropbox]}>
                                <View style={{alignSelf: 'stretch',flexDirection:'row', alignContent:'space-between'}}>
                                  <Label style={{marginTop: 0, paddingRight:0}}>Công việc hôm nay của bạn là:</Label>                                                        
                                </View>
                                <Picker
                                headerStyle={s.editPopup.pickerText}
                                textStyle={s.editPopup.pickerText}
                                mode="dropdown"
                                iosHeader="Nhấn tại đây để chọn lại"
                                iosIcon={<Icon name="ios-arrow-down" />}
                                style={s.editPopup.dropbox}
                                selectedValue={this.state.thoiGianRanh}
                                onValueChange={this.onThoiGianRanhChange.bind(this)}
                                >
                                  {this.state.thoiGianRanhElements}
                                </Picker>
                            </Item>            
                            <ErrorMsg style={[this.state.errorThoiGianRanh ? {} : styles.displayNone, s.errorMsg]}>
                              {this.state.errorThoiGianRanh}
                            </ErrorMsg>
                          </CardItem>    
                      </Card>                    
                        <Button style={[s.editPopup.button]} full rounded onPress={this.saveCongPhu.bind(this)}>
                            <Text style={s.editPopup.buttonText}>Cập nhật</Text>
                        </Button>
                      </Form>
                    </Content>
                  </View>
                </PopupContainer>
            ) : null}  

            {this.state.sendRequestEditPopupVisible 
              ? 
              (
                <PopupContainer onKeyboard={this.onKeyboard.bind(this)} style={[s.editPopup.container, this.state.orientation == "LANDSCAPE" ? this.originEditPopupStyle.landscape.container : this.originEditPopupStyle.container, {zIndex: 30}]}>
                  <View style={[s.editPopup.inner, this.state.orientation == "LANDSCAPE" ? this.originEditPopupStyle.landscape.inner : this.originEditPopupStyle.inner, this.state.isHeightHalf ? styles.heightHalf : {}]}>
                    <View style={{flexDirection : "row", justifyContent: "space-between", alignItems: "center", height: 50, backgroundColor: Colors.navbarBackgroundColor}}>
                      <Text style={{paddingLeft: 10, color: Colors.buttonColor, fontWeight: "bold"}}>Thông tin công phu</Text>
                      <TouchableOpacity onPress={this.hideSendRequestEditPopup.bind(this)} style={{paddingRight: 10}}>
                        <IconFontAwesome name="close" style={{color: Colors.buttonColor, fontSize: 20}}/>
                      </TouchableOpacity>
                    </View>
                    <Content>
                      <Form>
                        {
                          this.state.hadSendRequest ?
                          (
                            <Item style={s.editPopup.item}>
                              <Label style={styles.note}>{this.app.settings.hadSentRequestEditNote}</Label>
                            </Item>
                          ) : 
                          (
                            <View>
                              <Button style={[s.editPopup.button]} full rounded onPress={this.sendRequestEdit.bind(this)}>
                                <Text style={s.editPopup.buttonText}>Gửi yêu cầu được sửa lại</Text>
                              </Button>   
                          
                              <Item style={s.editPopup.item}>
                                <Label style={styles.note}>{this.app.settings.thanhVienYeuCauChinhSua}</Label>
                              </Item>
                            </View>
                          )
                        }                        
                        <Item style={s.editPopup.item}>
                          <View style={[{padding:5, backgroundColor: Colors.navbarBackgroundColor, width: "100%", marginTop: 10}]}>
                            <Text style={{color: "#ffffff"}}>{this.state.selectedItem.point}, Ngày {funcs.getValueFromServerDate(this.state.selectedItem.ngay, "day")}/{funcs.getValueFromServerDate(this.state.selectedItem.ngay, "month")}/{funcs.getValueFromServerDate(this.state.selectedItem.ngay, "year")}</Text>
                          </View>
                        </Item>
                        <View style={s.editPopup.fieldSet}>
                        <Text style={s.editPopup.legend}>Hướng tâm niệm</Text>  
                        <Item stackedLabel style={s.editPopup.item}>                        
                          <Label style={{}}>Số lượng bấm   <Text style={styles.required}>{" *   "}</Text></Label> 
                          <Text style={{flex:1,marginTop:15}}>{this.state.soLuongDanhHieu}</Text>                        
                        </Item> 
                        <ErrorMsg style={[this.state.errorSoLuongDanhHieu ? {} : styles.displayNone, s.errorMsg]}>
                          {this.state.errorSoLuongDanhHieu}
                        </ErrorMsg>
                        
                        <Item stackedLabel style={s.editPopup.item}>
                          <View style={{flexDirection : "row", justifyContent: "space-between", alignSelf: 'stretch'}}>
                            <Label>Tốc độ niệm phật (số danh hiệu/ phút)<Text style={styles.required}>{" *"}</Text></Label>                       
                          </View>
                          <Text style={{flex:1,marginTop:15}}>{this.state.tocDoNiemPhat}</Text> 
                          
                        </Item>   
                        <ErrorMsg style={[this.state.errorTocDoNiemPhat ? {} : styles.displayNone, s.errorMsg]}>
                        {this.state.errorTocDoNiemPhat}
                        </ErrorMsg>               
                        </View>
                      
                        <View style={s.editPopup.fieldSet}>
                          <Text style={s.editPopup.legend}>Nhiếp tâm niệm</Text>
                          <Item stackedLabel style={s.editPopup.item}>
                            <View style={{ alignSelf: 'stretch',flexDirection:'row', alignContent:'space-between'}}>
                              <Label>Số lượng bấm <Text style={styles.required}>{" *"}</Text></Label>                  
                            </View>
                            <Text style={{flex:1,marginTop:15}}>{this.state.soLuongMatChu}</Text>                         
                          </Item>
                          <ErrorMsg style={[this.state.errorSoLuongMatChu ? {} : styles.displayNone, s.errorMsg]}>
                            {this.state.errorSoLuongMatChu}
                          </ErrorMsg>
                          <Item stackedLabel style={s.editPopup.item}>                
                            <Label>Thời gian giữa 2 lần bấm (giây)<Text style={styles.required}>{" *"}</Text></Label>                
                            <Text style={{flex:1,marginTop:15}}>{this.state.tgNiemMatChu}</Text>                        
                          </Item>  
                          <ErrorMsg style={[this.state.errorTGNiemMatChu ? {} : styles.displayNone, s.errorMsg]}>
                            {this.state.errorTGNiemMatChu}
                          </ErrorMsg>                               
                        </View>                 

                      <Item stackedLabel style={s.editPopup.item}>
                        <Label>Thời gian nghe pháp<Text style={styles.required}>{" *"}</Text></Label>
                        <Text style={{flex:1,marginTop:15}}>{this.state.thoiGianNghePhap}</Text>                      
                      </Item>
                      <ErrorMsg style={[this.state.errorThoiGianNghePhap ? {} : styles.displayNone, s.errorMsg]}>
                        {this.state.errorThoiGianNghePhap}
                      </ErrorMsg>
                      <Item stackedLabel style={s.editPopup.item}>
                        <Label>Thời gian công phu<Text style={styles.required}>{" *"}</Text></Label>
                        <Text style={{flex:1,marginTop:15}}>{this.state.thoiGianTungKinh}</Text>                      
                      </Item>
                      <ErrorMsg style={[this.state.errorThoiGianTungKinh ? {} : styles.displayNone, s.errorMsg]}>
                        {this.state.errorThoiGianTungKinh}
                      </ErrorMsg>

                      <View  style={{ flexDirection:'row', alignContent:'space-between',alignItems: "center",backgroundColor:"#77aae5"}}>
                        <Label>Điểm nổ lực hôm nay:</Label> 
                        <ErrorMsg style={[this.state.diemTichLuyHomNay ? {} : styles.displayNone, s.diemTichLuyMsg]}>
                        {this.state.diemTichLuyHomNay}
                        </ErrorMsg>                  
                      </View>  
                      <Card style={{backgroundColor:"#caf2fe",alignItems:"center"}}>
                          <Item stackedLabel style={s.editPopup.item}>
                            <View style={{flexDirection : "column",justifyContent: "space-between", alignItems: "center", width: "100%"}}>
                              <Label style ={{flex:1}}>Thời gian rảnh của bạn vào ngày này là :</Label>
                              <Label style ={{flex:1}}>{this.state.thoiGianRanh} tiếng</Label>                
                            </View>
                          </Item>                      
                      </Card>

                      </Form>
                    </Content>
                  </View>
                </PopupContainer>
              ) : null}  

            <Spinner visible={this.state.spinner} color={Colors.navbarBackgroundColor} />
        </Container>
    );
  }
}

const s = {
  header: {
    container: {
      flexDirection : "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: Colors.navbarBackgroundColor,
      paddingLeft: 4,
      paddingRight: 4
    }
  },
  segmentButton: {
    borderColor: Colors.navbarBackgroundColor,
    paddingLeft: 10,
    paddingRight: 10
  },
  segmentButtonActive: {
    backgroundColor: Colors.navbarBackgroundColor
  },
  segmentTextActive: {
    color: Colors.buttonColor
  },
  theoNgay: {
    table: {
      headerContainer: {
        flexDirection : "row",
        justifyContent: "space-between",
        alignItems: "stretch",
        borderWidth: 1,
        borderColor: Colors.navbarBackgroundColor,
        backgroundColor: Colors.buttonColor,
        marginTop: 5
      },
      noDataCotainer: {
        flexDirection : "row",
        justifyContent: "space-between",
        alignItems: "stretch",
        borderWidth: 1,
        borderColor: Colors.navbarBackgroundColor,
        backgroundColor: Colors.buttonColor,
      },
      headerWidth: {
        width: "20%",
        alignItems: "center",
        justifyContent: "center"
      },
      headerText: {
        color: Colors.navbarBackgroundColor,
        width: "100%",
        textAlign: "center",
        paddingTop: 5,
        paddingBottom: 5
      },
      headerColumn: {
        borderRightWidth: 1,
        borderRightColor: Colors.navbarBackgroundColor
      },
      itemText: {
        width: "100%",
        textAlign: "center",
        paddingTop: 5,
        paddingBottom: 5
      },
      itemContainer: {
        flexDirection : "row",
        justifyContent: "space-between",
        alignItems: "stretch",
        borderBottomWidth: 1,
        borderBottomColor: Colors.navbarBackgroundColor,
        borderLeftWidth: 1,
        borderLeftColor: Colors.navbarBackgroundColor,
        borderRightWidth: 1,
        borderRightColor: Colors.navbarBackgroundColor,
      }
    }
  },
  theoTuan: {
    filter: {
      container: {
        flexDirection : "row",
        justifyContent: "space-around",
        alignItems: "center",
      },
      dropbox: {
        
      },
      label: {
        marginLeft: 10,
        marginRight: 10,
        width: 100
      },
      labelLandscape: {
      }
    }
  },
  pickerText: {
    
  },
  editPopup: {
    buttonText: {
      color: Colors.buttonColor
    },
    button: {
      backgroundColor: Colors.navbarBackgroundColor,
      marginTop: 30,
      marginBottom: 10,
      marginLeft: 20,
      marginRight: 20
    },
    itemText: {
      textAlign: "left",
      width: "100%",
      paddingTop: 10,
      fontWeight: "bold"
    },
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      flexDirection : "column",
      backgroundColor: "#ffffff"
    },
    inner: {
      position: "absolute",
      top: 20,
      right: 2,
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: Colors.navbarBackgroundColor,
      flexDirection : "column",
      alignItems: 'stretch',
      justifyContent:'space-between'
    },
    itemHeight: {
      height: 50,
    },
    item: {    
      flex:1,  
      justifyContent:'space-between',
      alignItems: 'stretch'  
    },
    itemDropbox: {
      width: "100%"
    },  
    pickerText: {
      
    },
    dropbox: {
      width: "100%"
    },  
    itemValue: {
      fontWeight: "bold"
    },
    fieldSet:{
      margin: 10,
      paddingHorizontal: 10,
      paddingLeft:0,
      paddingBottom: 10,
      borderRadius: 5,
      borderWidth: 1,
      alignItems: 'flex-start',
      borderColor: '#000',
    },
    legend:{
        position: 'absolute',
        top: -10,
        left: 10,
        fontWeight: 'bold',
        backgroundColor: '#FFFFFF'
    }       
  },
  dateTextBox: {
    backgroundColor: "#F1F1F1",
    padding: 8,
    flexDirection : "row",
    alignItems: "center"
  },
  dateTextBoxIcon: {
    marginLeft: 5
  },
 
};

export default TVXemDuocPhepSuaTrongTuan;