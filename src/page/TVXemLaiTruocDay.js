import React, { Component } from 'react';
import { Image, TouchableOpacity, View, StatusBar, Dimensions } from 'react-native';
import { Container, Content, Button, List, ListItem, Picker, Drawer, Segment, Form, Item, Input,
  Icon, Header, Body, Tab, Tabs, ScrollableTab, Card, CardItem, Left, Thumbnail, Right, H1 } from 'native-base';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import Spinner from 'react-native-loading-spinner-overlay';
import IconEntypo from 'react-native-vector-icons/Entypo';
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

class TVXemLaiTruocDay extends Component {
  constructor(props) {
    super(props);

    this.originEditPopupStyle = {
      container: {
        width: width,
        height: height
      },
      inner: {
        width: width - 4,
        height: height - 80,
      },
      landscape: {
        container: {
          width: height,
          height: width
        },
        inner: {
          width: height - 4,
          height: width - 80,
        }
      }
    };

    this.state = {
      spinner: true,
      userMenuVisible: false,
      segmentActive: "ngay",
      ngayContent: null,
      tuanContent: null,

      fromDay: "",
      fromMonth: "",
      fromYear: "",

      toDay: "",
      toMonth: "",
      toYear: "",

      day: "",
      month: "",
      year: "",

      dayAddNew: "",
      monthAddNew: "",
      yearAddNew: "",

      calendarVisible: false,

      fromMonth2: "",
      fromWeek: "",
      toMonth2: "",
      toWeek: "",

      fromMonth2Elements: [],
      toMonth2Elements: [],

      fromWeekElements: [],
      toWeekElements: [],
      orientation: "",
      editPopupVisible: false,

      thoiGianNghePhap: "",
      thoiGianTungKinh: "",
      thoiGianRanh: "",
      soLuongDanhHieu: "",
      congPhuNgayId: 0,
      addNew: false,
      sendRequestEditPopupVisible: false,
      isShowForm: false,
      hadSendRequest: false
    };

    this.currentCalendarFor = "";
    this.weeksInMonths = [];

    this.hasUpdate = false;
  }

  componentWillMount() {
    this.app = store.getState().app;
    
    Orientation.getOrientation(((err, orientation) => {
      this.setState({orientation: orientation});
    }).bind(this));
  }

  async componentDidMount() {
    this._orientationDidChange = this.orientationDidChange.bind(this);
    Orientation.addOrientationListener(this._orientationDidChange);
    await this.getInitDateRanges();
    await this.renderNgayContent();
    this.renderDropboxsMonth();
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

  async getInitDateRanges() {
    var result = await api.getInitDateRanges();
    if (result.code === 200) {
      var data = result.data;

      if (data.success) {
        this.initWeeksRange = {
          toWeek: data.toWeek,
          fromWeek: data.fromWeek
        };

        this.weeksInMonths = data.weeks;

        this.setState({
          fromDay: funcs.getValueFromServerDate(data.start, "day"),
          fromMonth: funcs.getValueFromServerDate(data.start, "month"),
          fromYear: funcs.getValueFromServerDate(data.start, "year"),
          toDay: funcs.getValueFromServerDate(data.end, "day"),
          toMonth: funcs.getValueFromServerDate(data.end, "month"),
          toYear: funcs.getValueFromServerDate(data.end, "year"),
        });
      } else {
        funcs.showMsg(data.message);  
      }
    } else {
      funcs.showMsg(result.message);
    }
  }

  componentWillUnmount(){
    this.unmounted = true;
    Orientation.removeOrientationListener(this._orientationDidChange);
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

  async onSegmentPress() {
    if (this.state.segmentActive == "ngay") {
      this.setState({segmentActive : "tuan"});
      if (this.state.tuanContent == null || this.hasUpdate) {
        this.hasUpdate = false;
        await this.renderTuanContent();
      }
    } else {
      this.setState({segmentActive : "ngay"});
      await this.renderNgayContent();
    }
  }

  onDayChange(e) {
    let value = funcs.getCalendarData(e);
    this.setState({day: value});
  }

  onMonthChange(e) {
      let value = funcs.getCalendarData(e);
      this.setState({
        month: value,
        day: "1"
      });
  }

  onYearChange(e) {
      let value = funcs.getCalendarData(e);
      this.setState({year: value});
  }

  onCalendarOK() {
    if (this.currentCalendarFor == "from") {
      this.setState({
        calendarVisible: false,
        fromYear: this.state.year,
        fromMonth: this.state.month,
        fromDay: this.state.day,
      });
    }
    else if (this.currentCalendarFor == "to") {
      this.setState({
        calendarVisible: false,
        toYear: this.state.year,
        toMonth: this.state.month,
        toDay: this.state.day,
      });
    } else if (this.currentCalendarFor == "add-new") {
      this.setState({
        calendarVisible: false,
        yearAddNew: this.state.year,
        monthAddNew: this.state.month,
        dayAddNew: this.state.day,
      });
    }

    this.currentCalendarFor = "";
  }

  onCalendarCancel() {
    this.setState({
      calendarVisible: false
    });
  }

  async getDataTheoNgay() {
    var result = await api.getCongPhuTheoNgay({
      idThanhVien: this.app.loginInfo.id,
      tuNgay: this.state.fromYear + "-" + this.state.fromMonth + "-" + this.state.fromDay,
      toiNgay: this.state.toYear + "-" + this.state.toMonth + "-" + this.state.toDay
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

  async getDataTheoTuan() {
    var result = await api.getCongPhuTheoTuan({
      idThanhVien: this.app.loginInfo.id,
      FromTuan: this.state.fromWeek,
      FromThang: this.state.fromMonth2,
      ToTuan: this.state.toWeek,
      ToThang: this.state.toMonth2
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
          <Text style={[s.theoNgay.table.headerText]}>Từ ngày{"\n"}{this.state.fromDay} - Thg {this.state.fromMonth}</Text>
        </View>
        <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
          <Text style={[s.theoNgay.table.headerText]}>Thời gian nghe pháp, công phu </Text>
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

  showCalendarFromDate() {
    this.currentCalendarFor = "from";
    this.setState({
        calendarVisible: true,
        day: this.state.fromDay,
        month: this.state.fromMonth,
        year: this.state.fromYear
    });
  }

  showCalendarToDate() {
    this.currentCalendarFor = "to";
    this.setState({
        calendarVisible: true,
        day: this.state.toDay,
        month: this.state.toMonth,
        year: this.state.toYear
    });
  }

  showCalendarDateAddNew() {
    this.currentCalendarFor = "add-new";
    this.setState({
        calendarVisible: true,
        day: this.state.dayAddNew,
        month: this.state.monthAddNew,
        year: this.state.yearAddNew
    });
  }

  //-----

  async renderTuanContent() {
    this.setState({spinner: true});
    var arr = [];

    arr.push(
      <View key="header" style={[s.theoNgay.table.headerContainer]}>
        <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
          <Text style={[s.theoNgay.table.headerText]}>Tuần</Text>
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

    var results = await this.getDataTheoTuan();
    if (results != null && results.rows.length > 0) {
      var listRows = results.rows;
      for(var i = 0; i < listRows.length; ++i) {
        var item = listRows[i];
        arr.push(
          <View key={"item" + i} style={[s.theoNgay.table.itemContainer]}>
            <View style={[s.theoNgay.table.headerWidth, s.theoNgay.table.headerColumn]}>
              <Text style={[s.theoNgay.table.itemText]}>Tuần {item.week} - Tháng {item.month}</Text>
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
      tuanContent: arr
    });
    this.setState({spinner: false});
  }

  onFromMonth2Change (value) {
    this.setState({
      fromMonth2 : value,
      fromWeek: "1"
    });
    this.renderFromWeek(value);
  }

  onFromWeekChange (value) {
    this.setState({
      fromWeek : value
    });
  }

  onToWeekChange (value) {
    this.setState({
      toWeek : value
    });
  }

  onToMonth2Change (value) {
    this.setState({
      toMonth2 : value,
      toWeek: "1"
    });
    this.renderToWeek(value);
  }

  renderDropboxsMonth() {
    this.setState({
      fromMonth2: this.initWeeksRange.fromWeek.month.toString(),
      fromWeek: this.initWeeksRange.fromWeek.week.toString(),
      toMonth2: this.initWeeksRange.toWeek.month.toString(),
      toWeek: this.initWeeksRange.toWeek.week.toString()
    });

    this.renderFromMonth2(this.weeksInMonths);
    this.renderFromWeek(this.initWeeksRange.fromWeek.month);

    this.renderToMonth2(this.weeksInMonths);
    this.renderToWeek(this.initWeeksRange.toWeek.month);
  }

  renderFromWeek(month) {
    var numberOfWeeks = 0;
    for (var j = 0; j < this.weeksInMonths.length; ++ j) {
      if (this.weeksInMonths[j].month == parseInt(month)) {
        numberOfWeeks = this.weeksInMonths[j].week;
        break;
      }
    }

    let fromWeekElements = []
    
    for (var i = 1; i <= numberOfWeeks; ++i) {
      let item = i;

      fromWeekElements.push(
        <Picker.Item key={"week" + i} label={"Tuần " + item.toString()} value={item.toString()} />
      );
    }

    this.setState({
      fromWeekElements: fromWeekElements
    });
  }

  renderFromMonth2(months) {
    let fromMonth2Elements = []
    
    for (var i = 0; i < months.length; ++i) {
      let item = months[i];

      fromMonth2Elements.push(
        <Picker.Item key={"month" + i} label={"Tháng " + item.month.toString()} value={item.month.toString()} />
      );
    }

    this.setState({
      fromMonth2Elements: fromMonth2Elements
    });
  }

  renderToWeek(month) {
    var numberOfWeeks = 0;
    for (var j = 0; j < this.weeksInMonths.length; ++ j) {
      if (this.weeksInMonths[j].month == parseInt(month)) {
        numberOfWeeks = this.weeksInMonths[j].week;
        break;
      }
    }

    let toWeekElements = []
    
    for (var i = 1; i <= numberOfWeeks; ++i) {
      let item = i;

      toWeekElements.push(
        <Picker.Item key={"week" + i} label={"Tuần " + item.toString()} value={item.toString()} />
      );
    }

    this.setState({
      toWeekElements: toWeekElements
    });
  }

  renderToMonth2(months) {
    let toMonth2Elements = []
    
    for (var i = 0; i < months.length; ++i) {
      let item = months[i];

      toMonth2Elements.push(
        <Picker.Item key={"month" + i} label={"Tháng " + item.month.toString()} value={item.month.toString()} />
      );
    }

    this.setState({
      toMonth2Elements: toMonth2Elements
    });
  }

  async onSearchByWeekPress() {
    await this.renderTuanContent();
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
      addNew: false,
      editPopupVisible: true,
      selectedItem: item,
      congPhuNgayId: item.id,
      thoiGianNghePhap: item.tgNghePhap.toString(),
      thoiGianTungKinh: item.tgTungKinh.toString(),
      soLuongDanhHieu: item.soLuongDH.toString(),
      soLuongMatChu: item.soLuongMatChu.toString(),
      thoiGianRanh: item.thoiGianRanh,
      tocDoNiemPhat: item.tocDoNiemPhat.toString(),
      tgNiemMatChu: item.tgNiemMatChu.toString(),
      diemTichLuyHomNay:"",      
    },() => { 
          this.diemTichLuy();      
        });
  }

  hideEditPopup() {
    this.setState({
      editPopupVisible: false
    });
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
      soLuongMatChu: item.soLuongMatChu.toString(),
      thoiGianRanh:item.thoiGianRanh.toString(),  
      tocDoNiemPhat: item.tocDoNiemPhat.toString(),
      tgNiemMatChu: item.tgNiemMatChu.toString(),
      hadSendRequest: item.hadSendRequest
    },() => {
      //    await this.getCities_ThoiGianRanhs_NgheNghieps();
      //    this.renderThoiGianRanhs();      
        });
  }

  hideSendRequestEditPopup() {
    this.setState({
      sendRequestEditPopupVisible: false
    });
  }

  onThemMoiPress() {
    this.setState({
      addNew: true,
      editPopupVisible: true,
      thoiGianNghePhap: "",
      thoiGianTungKinh: "",
      soLuongDanhHieu: "",
      soLuongMatChu:"",
      tocDoNiemPhat: this.app.loginInfo.tocDoNiemPhat.toString(),
      tgNiemMatChu: this.app.loginInfo.tgNiemMatChu == null ? "" : this.app.loginInfo.tgNiemMatChu.toString(),      
      thoiGianRanh:this.state.thoiGianRanhThuongNgay,
      diemTichLuyHomNay:"",
      dayAddNew: this.state.toDay,
      monthAddNew: this.state.toMonth,
      yearAddNew: this.state.toYear
    });
  }

  onThoiGianNghePhapChange(value) {
    this.setState({errorThoiGianNghePhap: null});
    this.setState({thoiGianNghePhap: value},() => {
      this.diemTichLuy();  // 'bar', what we expect it to be.
  });
  }

  onThoiGianTungKinhChange(value) {
    this.setState({errorThoiGianTungKinh: null});
    this.setState({thoiGianTungKinh: value},() => {
      this.diemTichLuy();  // 'bar', what we expect it to be.
  });
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

  onSoLuongDanhHieuChange(value) {
    this.setState({errorSoLuongDanhHieu: null});
    this.setState({soLuongDanhHieu: value},() => {
      this.diemTichLuy();  // 'bar', what we expect it to be.
  });
  }

  onTocDoNiemPhatChange(value) {
    this.setState({errorTocDoNiemPhat: null});
    this.setState({tocDoNiemPhat: value},() => {
      this.diemTichLuy();  // 'bar', what we expect it to be.
  });
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

    if (this.state.thoiGianRanh == "") {
      valid = false;
      this.setState({errorThoiGianRanh: "Hãy nhập thời gian rãnh"});
    }

    if (!valid) {
      return;
    }

    this.setState({spinner: true});
    var result = {};
    if (this.state.addNew) {
      result = await api.congPhuSave({
        IDTHanhVien: this.app.loginInfo.id,
        ngay: this.state.yearAddNew + "-" + this.state.monthAddNew + "-" + this.state.dayAddNew,
        TGNghePhap: this.state.thoiGianNghePhap,
        TGTungKinh: this.state.thoiGianTungKinh,
        SoLuongDH: this.state.soLuongDanhHieu,
        SoLuongMatChu: this.state.soLuongMatChu,
        thoiGianRanh: this.state.thoiGianRanh,
        tocDoNiemPhat: this.state.tocDoNiemPhat,
        TGNiemMatChu: this.state.tgNiemMatChu
      });
    } else {
      result = await api.updateCongPhuById({
        id: this.state.congPhuNgayId,
        TGNghePhap: this.state.thoiGianNghePhap,
        TGTungKinh: this.state.thoiGianTungKinh,
        SoLuongDH: this.state.soLuongDanhHieu,
        SoLuongMatChu: this.state.soLuongMatChu,
        thoiGianRanh: this.state.thoiGianRanh,
        tocDoNiemPhat: this.state.tocDoNiemPhat,
        TGNiemMatChu: this.state.tgNiemMatChu
      });
    }

    if (result.code == 200) {
      var data = result.data;
      if (data.success) {
        await this.renderNgayContent();
        this.hideEditPopup();
        this.hasUpdate = true;
        funcs.showMsg(this.app.settings.luuThanhCong);
      } 
    } else {
      funcs.showMsg(result.message);
    }

    this.setState({spinner: false});
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
        this.setState({
          thoigianranhText:item.name
        })
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
            <Button transparent>
              <Thumbnail small source={require("../assets/images/icon_logo.png")} />
            </Button>
            <Text style={styles.headerText}>Xin chào : {funcs.getXinChaoText(this.app.loginInfo)}!</Text>
            <UserMenu onClick={this.onUserMenuClick.bind(this)}/>
          </View>
          <Segment style={{backgroundColor: Colors.buttonColor, borderWidth: 1, borderColor: Colors.navbarBackgroundColor}}>
            <Button style={[s.segmentButton, this.state.segmentActive == "ngay" ? s.segmentButtonActive : {}]}
              first active={this.state.segmentActive == "ngay"} 
              onPress={this.onSegmentPress.bind(this)}>
              <Text style={[this.state.segmentActive == "ngay" ? s.segmentTextActive : {}]}>Xem theo ngày</Text>
            </Button>
            <Button style={[s.segmentButton, this.state.segmentActive == "tuan" ? s.segmentButtonActive : {}]}
              last active={this.state.segmentActive == "tuan"} 
              onPress={this.onSegmentPress.bind(this)}>
              <Text style={[this.state.segmentActive == "tuan" ? s.segmentTextActive : {}]}>Xem theo tuần</Text>
            </Button>
          </Segment>
          {
            this.state.segmentActive == "ngay" 
            ? 
            (
              this.state.orientation == "PORTRAIT" || this.state.orientation == "PORTRAITUPSIDEDOWN" || this.state.orientation == "UNKNOWN" ? 
              (
                <View style={{flexDirection : "row", justifyContent: "space-between", alignItems: "center", paddingLeft: 2, paddingRight: 2, marginTop: 5}}>
                  <Text>Từ ngày</Text>
                  <TouchableOpacity style={s.dateTextBox} onPress={this.showCalendarFromDate.bind(this)}>
                      <Text>{this.state.fromDay}-{this.state.fromMonth}-{this.state.fromYear}</Text>
                      <Icon name='arrow-dropdown' style={s.dateTextBoxIcon} />
                  </TouchableOpacity>
                  <Text>Đến ngày</Text>
                  <TouchableOpacity style={s.dateTextBox} onPress={this.showCalendarToDate.bind(this)}>
                      <Text>{this.state.toDay}-{this.state.toMonth}-{this.state.toYear}</Text>
                      <Icon name='arrow-dropdown' style={s.dateTextBoxIcon} />
                  </TouchableOpacity>
                </View>
              )
              : 
              (
                <View style={{flexDirection : "row", justifyContent: "space-between", alignItems: "center", paddingLeft: 2, paddingRight: 2, marginTop: 5}}>
                  <Text>Từ ngày</Text>
                  <TouchableOpacity style={s.dateTextBox} onPress={this.showCalendarFromDate.bind(this)}>
                      <Text>{this.state.fromDay}-{this.state.fromMonth}-{this.state.fromYear}</Text>
                      <Icon name='arrow-dropdown' style={s.dateTextBoxIcon} />
                  </TouchableOpacity>
                  <Text>Đến ngày</Text>
                  <TouchableOpacity style={s.dateTextBox} onPress={this.showCalendarToDate.bind(this)}>
                      <Text>{this.state.toDay}-{this.state.toMonth}-{this.state.toYear}</Text>
                      <Icon name='arrow-dropdown' style={s.dateTextBoxIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{padding: 10, backgroundColor: Colors.navbarBackgroundColor, borderRadius:10}} onPress={this.onSearchByDayPress.bind(this)}>
                    <Text style={{color: Colors.buttonColor, textAlign: "center"}}>tXem</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{borderWidth: 1, borderColor: Colors.navbarBackgroundColor, borderRadius:10,padding: 10, backgroundColor: Colors.buttonColor}} onPress={this.onThemMoiPress.bind(this)}>
                    <Text style={{color: Colors.navbarBackgroundColor, textAlign: "center"}}>Thêm Mới</Text>
                  </TouchableOpacity>
                </View>
              )
            )
            : null
          }

          {
            this.state.segmentActive == "ngay" && (this.state.orientation == "PORTRAIT" || this.state.orientation == "PORTRAITUPSIDEDOWN" || this.state.orientation == "UNKNOWN")
            ? 
            (
              <View style={{flexDirection : "row", justifyContent: "space-around", marginTop: 5}}>
                <TouchableOpacity style={{borderRadius:10,paddingTop: 10, paddingBottom: 10, backgroundColor: Colors.navbarBackgroundColor, width: "45%"}} onPress={this.onSearchByDayPress.bind(this)}>
                  <Text style={{color: Colors.buttonColor, width: "100%", textAlign: "center"}}>zXem</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{borderWidth: 1, borderColor: Colors.navbarBackgroundColor, borderRadius:10,paddingTop: 10, paddingBottom: 10, backgroundColor: Colors.buttonColor, width: "45%"}} onPress={this.onThemMoiPress.bind(this)}>
                  <Text style={{color: Colors.navbarBackgroundColor, width: "100%", textAlign: "center"}}>Thêm Mới</Text>
                </TouchableOpacity>
              </View>
            )
            : null
          }

          {
            this.state.segmentActive == "ngay" 
            ? 
            (
              <Content removeClippedSubviews={true}>
                {this.state.ngayContent}
              </Content>
            )
            : null
          }

          {
            this.state.segmentActive == "tuan"
            ?
            (
              this.state.orientation == "PORTRAIT" || this.state.orientation == "PORTRAITUPSIDEDOWN" || this.state.orientation == "UNKNOWN" ? 
              [
                <View key="tfv1" style={[s.theoTuan.filter.container]}>
                  <Text style={[s.theoTuan.filter.label]}>Từ tuần</Text>
                  <View style={[{width: "35%"}, styles.dropbox]}>
                    <Picker
                      headerStyle={s.pickerText}
                      mode="dropdown"
                      iosHeader="Tháng"
                      iosIcon={<Icon name="ios-arrow-down" />}
                      style={s.theoTuan.filter.dropbox}
                      selectedValue={this.state.fromMonth2}
                      onValueChange={this.onFromMonth2Change.bind(this)}
                      >
                        {this.state.fromMonth2Elements}
                    </Picker>
                  </View>
                  <View style={[{width: "33%"}, styles.dropbox]}>
                    <Picker
                      headerStyle={s.pickerText}
                      mode="dropdown"
                      iosHeader="Tuần"
                      iosIcon={<Icon name="ios-arrow-down" />}
                      style={s.theoTuan.filter.dropbox}
                      selectedValue={this.state.fromWeek}
                      onValueChange={this.onFromWeekChange.bind(this)}
                      >
                        {this.state.fromWeekElements}
                    </Picker>
                  </View>
                </View>,
                <View key="tfv2" style={[s.theoTuan.filter.container]}>
                  <Text style={[s.theoTuan.filter.label]}>Đến tuần</Text>
                  <View style={[{width: "35%"}, styles.dropbox]}>
                    <Picker
                      headerStyle={s.pickerText}
                      mode="dropdown"
                      iosHeader="Tháng"
                      iosIcon={<Icon name="ios-arrow-down" />}
                      style={s.theoTuan.filter.dropbox}
                      selectedValue={this.state.toMonth2}
                      onValueChange={this.onToMonth2Change.bind(this)}
                      >
                        {this.state.toMonth2Elements}
                    </Picker>
                  </View>
                  <View style={[{width: "33%"}, styles.dropbox]}>
                    <Picker
                      headerStyle={s.pickerText}
                      mode="dropdown"
                      iosHeader="Tuần"
                      iosIcon={<Icon name="ios-arrow-down" />}
                      style={s.theoTuan.filter.dropbox}
                      selectedValue={this.state.toWeek}
                      onValueChange={this.onToWeekChange.bind(this)}
                      >
                        {this.state.toWeekElements}
                    </Picker>
                  </View>
                </View>
              ]
              :
              [
                <View key="tfv1" style={[s.theoTuan.filter.container]}>
                  <Text style={[s.theoTuan.filter.labelLandscape, {marginLeft: 2}]}>Từ tuần</Text>
                  <View style={[{width: "15%"}, styles.dropbox]}>
                    <Picker
                      headerStyle={s.pickerText}
                      mode="dropdown"
                      iosHeader="Tháng"
                      iosIcon={<Icon name="ios-arrow-down" />}
                      style={s.theoTuan.filter.dropbox}
                      selectedValue={this.state.fromMonth2}
                      onValueChange={this.onFromMonth2Change.bind(this)}
                      >
                        {this.state.fromMonth2Elements}
                    </Picker>
                  </View>
                  <View style={[{width: "15%"}, styles.dropbox]}>
                    <Picker
                      headerStyle={s.pickerText}
                      mode="dropdown"
                      iosHeader="Tuần"
                      iosIcon={<Icon name="ios-arrow-down" />}
                      style={s.theoTuan.filter.dropbox}
                      selectedValue={this.state.fromWeek}
                      onValueChange={this.onFromWeekChange.bind(this)}
                      >
                        {this.state.fromWeekElements}
                    </Picker>
                  </View>
                  <Text style={[s.theoTuan.filter.labelLandscape]}>Đến tuần</Text>
                  <View style={[{width: "15%"}, styles.dropbox]}>
                    <Picker
                      headerStyle={s.pickerText}
                      mode="dropdown"
                      iosHeader="Tháng"
                      iosIcon={<Icon name="ios-arrow-down" />}
                      style={s.theoTuan.filter.dropbox}
                      selectedValue={this.state.toMonth2}
                      onValueChange={this.onToMonth2Change.bind(this)}
                      >
                        {this.state.toMonth2Elements}
                    </Picker>
                  </View>
                  <View style={[{width: "15%"}, styles.dropbox]}>
                    <Picker
                      headerStyle={s.pickerText}
                      mode="dropdown"
                      iosHeader="Tuần"
                      iosIcon={<Icon name="ios-arrow-down" />}
                      style={s.theoTuan.filter.dropbox}
                      selectedValue={this.state.toWeek}
                      onValueChange={this.onToWeekChange.bind(this)}
                      >
                        {this.state.toWeekElements}
                    </Picker>
                  </View>
                  <TouchableOpacity style={{borderRadius: 10,padding: 10, backgroundColor: Colors.navbarBackgroundColor, marginRight: 2}} onPress={this.onSearchByWeekPress.bind(this)}>
                    <Text style={{color: Colors.buttonColor,textAlign: "center", paddingLeft: 10, paddingRight: 10}}>Xem</Text>
                  </TouchableOpacity>
                </View>
              ]
            )
            : null
          }

          {
            this.state.segmentActive == "tuan" && (this.state.orientation == "PORTRAIT" || this.state.orientation == "PORTRAITUPSIDEDOWN" || this.state.orientation == "UNKNOWN")
            ?
            (
              <View style={{flexDirection : "row", justifyContent: "center", marginTop: 5}}>
                <TouchableOpacity style={{borderRadius: 10, padding: 10, backgroundColor: Colors.navbarBackgroundColor, width: "60%"}} onPress={this.onSearchByWeekPress.bind(this)}>
                  <Text style={{color: Colors.buttonColor, width: "100%", textAlign: "center"}}>Xem</Text>
                </TouchableOpacity>
              </View>
            )
            : null
          }

          {
            this.state.segmentActive == "tuan"
            ?
            (
              <Content removeClippedSubviews={true}>
                {this.state.tuanContent}
              </Content>
            )
            : null
          }
          {this.state.userMenuVisible ? this.renderUserMenuDropdown() : null}  
          
          {this.state.editPopupVisible 
          ? 
          (
            <PopupContainer onKeyboard={this.onKeyboard.bind(this)} style={[s.editPopup.container, this.state.orientation == "LANDSCAPE" ? this.originEditPopupStyle.landscape.container : this.originEditPopupStyle.container, {zIndex: 30}]}>
              <View style={[s.editPopup.inner, this.state.orientation == "LANDSCAPE" ? this.originEditPopupStyle.landscape.inner : this.originEditPopupStyle.inner, this.state.isHeightHalf ? styles.heightHalf : {}]}>
                <View style={{flexDirection : "row", justifyContent: "space-between", alignItems: "center", height: 50, backgroundColor: Colors.navbarBackgroundColor}}>
                  <Text style={{paddingLeft: 10, color: Colors.buttonColor, fontWeight: "bold"}}>{this.state.addNew ? "Thêm mới công phu" : "Chỉnh sửa công phu"}</Text>
                  <TouchableOpacity onPress={this.hideEditPopup.bind(this)} style={{paddingRight: 10}}>
                    <IconFontAwesome name="close" style={{color: Colors.buttonColor, fontSize: 20}}/>
                  </TouchableOpacity>
                </View>
                <Content>
                  <Form>
                    {
                      !this.state.addNew ?
                      (
                        <Item style={s.editPopup.item}>
                          <View style={[{padding:5, backgroundColor: Colors.navbarBackgroundColor, width: "100%", marginTop: 10}]}>
                            <Text style={{color: "#ffffff"}}>{this.state.selectedItem.point}, Ngày {funcs.getValueFromServerDate(this.state.selectedItem.ngay, "day")}/{funcs.getValueFromServerDate(this.state.selectedItem.ngay, "month")}/{funcs.getValueFromServerDate(this.state.selectedItem.ngay, "year")}</Text>
                          </View>
                        </Item>
                      )
                      : null
                    }
                    {
                      this.state.addNew ?
                      (
                        <View style={[{flexDirection: "row", alignItems: "center", justifyContent: "flex-start"}, s.editPopup.marginLeft, s.editPopup.marginTop]}>
                          <Label>Ngày</Label>
                          <TouchableOpacity style={[s.editPopup.marginLeft, s.dateTextBox]} onPress={this.showCalendarDateAddNew.bind(this)}>
                              <Text>{this.state.dayAddNew}-{this.state.monthAddNew}-{this.state.yearAddNew}</Text>
                              <Icon name='arrow-dropdown' style={s.dateTextBoxIcon} />
                            </TouchableOpacity>
                        </View>
                      )
                      : null
                    }
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

                    {
                      this.state.addNew ?
                        (<Card style={{backgroundColor:"#caf2fe",alignItems:"center"}}>
                        <Item stackedLabel style={s.editPopup.item}>
                          <View style={{flexDirection : "column",justifyContent: "space-between", alignItems: "center", width: "100%"}}>
                            <Label style ={{flex:1}}>Công việc thường ngày của bạn là :</Label>
                            <Label style ={{flex:1}}>{this.state.thoigianranhText}</Label>                
                          </View>
                        </Item>
                      
                          <CardItem bordered style={{width:"95%",marginBottom:10}}>                   
                            <Item stackedLabel style={[s.editPopup.itemDropbox]}>
                                <View style={{alignSelf: 'stretch',flexDirection:'row', alignContent:'space-between'}}>
                                  <Label style={{marginTop: 0, paddingRight:0,flex:0.9}}>Nếu ngày này khác với thường ngày xin chọn lại </Label>                                          
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
                        </Card>)
                      :
                      (<Card style={{backgroundColor:"#caf2fe",alignItems:"center"}}>
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
                      </Card>)  
                    }                    

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
                      )
                      : null
                    }
                    {
                      this.state.hadSendRequest ? null :
                      (
                        <Button style={[s.editPopup.button]} full rounded onPress={this.sendRequestEdit.bind(this)}>
                          <Text style={s.editPopup.buttonText}>Gửi yêu cầu được sửa lại</Text>
                        </Button>   
                      )
                    }

                    {
                      this.state.hadSendRequest ? null :
                      (
                        <Item style={s.editPopup.item}>
                          <Label style={styles.note}>{this.app.settings.thanhVienYeuCauChinhSua}</Label>
                        </Item>
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

          <View style={[styles.borderTop]}>
            <Text style={{padding: 5}}>{this.app.settings.thanhVienXemLaiNote}</Text>
          </View>
          <FooterTabThanhVien screen={this.props.navigation.getParam('screen', null)}></FooterTabThanhVien>
          {
            this.state.calendarVisible ? (
              <DaySelect onDayChange={this.onDayChange.bind(this)} 
                style={{zIndex: 40}}
                day={this.state.day} 
                month={this.state.month}
                year={this.state.year}
                onMonthChange={this.onMonthChange.bind(this)}
                onYearChange={this.onYearChange.bind(this)}
                onCancel={this.onCalendarCancel.bind(this)}
                onOK={this.onCalendarOK.bind(this)}></DaySelect>
            ) : null
          }
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
        width: "100%"
      },
      label: {
        marginLeft: 10,
        marginRight: 10,
        width: 60
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
      flexDirection : "column"
    },
    item: {
      flex:1,
      alignItems: 'flex-start' ,
      alignContent: 'flex-start'     
    },
    fieldSet:{
      margin: 10,
      paddingHorizontal: 10,
      paddingLeft:0,
      paddingBottom: 10,
      borderRadius: 5,
      borderWidth: 1,
      alignItems: 'flex-start',
      borderColor: '#000'
    },
    legend:{
        position: 'absolute',
        top: -10,
        left: 10,
        fontWeight: 'bold',
        backgroundColor: '#FFFFFF'
    },    
    itemText: {
      textAlign: "left",
      width: "100%",
      paddingTop: 10,
      fontWeight: "bold"
    },
    itemValue: {
      fontWeight: "bold"
    },
    marginLeft: {
      marginLeft: 15
    },
    marginTop: {
      marginTop: 10
    },
    borderBottom: {
      borderBottomWidth: 1,
      borderBottomColor: Colors.borderGray
    },
    itemDropbox: {
      width: "100%"
    },  
    pickerText: {
      
    },
    dropbox: {
      width: "100%"
    },
  },
  dateTextBox: {
    backgroundColor: "#F1F1F1",
    padding: 8,
    flexDirection : "row",
    alignItems: "center"
  },
  dateTextBoxIcon: {
    marginLeft: 5
  }
};

export default TVXemLaiTruocDay;