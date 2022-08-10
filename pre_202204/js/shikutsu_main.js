var kaisha_name = "";
var kaisha_url = "";
var webappId = "";
var push_feature_url = "";
var layer_id = "0";
//var history_webmap_id = "";
var basemap_id = "";
var basescene_id = "";
var group_id = "";
var creator_field = "";
var create_date_field = "";
var init_latitude = null;
var init_longitude = null;
var init_zoom = null;
var feature_Itemid = "";
var register_url = "";

//　ユーザー設定
var user_setting = null;
var ngCharacters = [];

// 地図移動を行ったか判定するフラグ
var isMovedMap = false;

var token = "";
var user = "";
var email = "";
var portal =null;
var userLicenseType = "";

var latitude = null;
var longitude = null;
var jusho = "";
var historyview = null;
var view = null;
var viewview = null;
var view_graphic_rendar = null;
var viewview_click = null;

var scene = null;
var sceneview = null;

var chunkSize = 3 * 1024 * 1024;
var locateBtn;
var homeButton;
let activeWidget = null;

// cookieのキーを保持しておきます
const cookieKey = "user_setting";

var markerSymbol = {
  type: "simple-marker",
  color: [226, 119, 40],
  outline: {
    color: [255, 255, 255],
    width: 2
  }
};

var photoLatLng = {
  lat: null,
  lng: null
};

// モバイル端末かどうか
let isMobile = false;



var param = location.search.match(/field:KaishaID=(.*?)(&|$)/);
if (param != null) {
  $('#kaishaid').val(decodeURIComponent(param[1]));
} else {
  $('#kaishaid').val(999999);
}

//configの読み込み
var json_url = "./src/json/Setting.json";

$.ajaxSetup({async: false});
$.getJSON(json_url, function(config) {
  set_config(config);

  // 会社情報を会社テーブルから取得
  var kaisha_form = new FormData();
  kaisha_form.set('f','json');
  kaisha_form.set('returnGeometry', false);
  kaisha_form.set('where', "KaishaID='" + $('#kaishaid').val() + "'");
  kaisha_form.set('outFields', '*');
  kaisha_form.set('token', token); // この時点ではトークンを持っていない

  $.ajax({
    url: kaisha_url + '/query',
    type: "POST",
    data: kaisha_form,
    processData: false,
    contentType: false,
    dataType: 'json',
    async: false
  }).done(function(data) {
    if(data.features.length > 0){
      kaisha_name = data.features[0].attributes.KaishaName;
      group_id = data.features[0].attributes.GroupID;
      feature_Itemid = data.features[0].attributes.ViewFeatureItemID;
    }
    else{
      alert('指定したURLでは本システムは利用できません。');
      $('#sign-in').prop("disabled", true);
    }
  }).fail(function(data) {
    console.log(data);
  });
    $('#KaishaName').html(kaisha_name);
});
// set_config({});// これは必要なのか？
$.ajaxSetup({async: true});

// ユーザーエージェントの判定を行い、Exif情報の扱いを決定します。
if (navigator.userAgent.match(/iPhone|Android.+Mobile/)) {
  isMobile = true;
  $(".pconly").hide();
}

/*********************初期化処理*********************/

require([
  "esri/portal/Portal",
  "esri/identity/OAuthInfo",
  "esri/identity/IdentityManager",
  "esri/WebMap",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/Graphic",
  "esri/widgets/Locate",
  "esri/widgets/Search",
  "esri/tasks/Locator",
  "esri/WebScene", 
  "esri/views/SceneView", 
  "esri/layers/Layer",
  "esri/layers/PointCloudLayer",
  "esri/layers/IntegratedMeshLayer",
  "esri/widgets/Home",
  "esri/widgets/Slice",
  "esri/Viewpoint",
  "esri/widgets/DirectLineMeasurement3D",
  "esri/widgets/AreaMeasurement3D"
], function(
        Portal, OAuthInfo, identityManager, 
        WebMap, MapView, FeatureLayer, 
        Graphic, Locate, Search, Locator,
        WebScene, SceneView, Layer, 
        PointCloudLayer, IntegratedMeshLayer, 
        Home, Slice, Viewpoint, DirectLineMeasurement3D, AreaMeasurement3D) {

  var portalUrl =  "https://www.arcgis.com/sharing";

  var info = new OAuthInfo({
    appId: webappId,
    popup: false
  });

  identityManager.registerOAuthInfos([info]);

  $('#sign-in').click(function() {
    identityManager.getCredential(portalUrl);
  });

  // サインアウト
function sign_out(){
  identityManager.destroyCredentials();
  alert("サインアウトしました");
  // サインアウト後最初の画面に戻す
  document.location.reload()
}

$('#sign-out').click(function() {
  sign_out();
});

// サインイン状態かチェック
identityManager.checkSignInStatus(portalUrl).then(function() {
  $('#anonymousPanel').css('display', 'none');
  $('#sign-out').css('display', 'block');
  //$('#personalizedPanel').css('display', 'block');
  displayForm();
  var param = new FormData();
  param.set('f', 'json');
  param.set('token', identityManager.credentials[0].token);

  //　push_feature_urlの取得
  $.ajax({
    url: portalUrl + "/rest/content/items/" + feature_Itemid,
    type: "POST",
    data: param,
    processData: false,
    contentType: false,
    dataType: 'json',
    async: false
  }).done(function(data){
    push_feature_url = data.url;
    register_url = push_feature_url + "/uploads/register";
  }).fail(function(data){
    alert("URLの取得に失敗しました。");
  });
});

  function displayForm() {
    portal = new Portal();

    portal.load().then(function () {

      //グループに所属しているかのチェック
      portal.user.fetchGroups().then(function(fetchItemResult){
        const match = fetchItemResult.find((group) => {
          return (group.id === group_id);
        });

        if (match == undefined) {
          identityManager.destroyCredentials();
          alert("システムを利用できるユーザではありません");
          $('#anonymousPanel').css('display', 'block');
          //$('#personalizedPanel').css('display', 'none');
          return;
        }

        $('#mainDiv').css('display', 'block');
        $('#formDiv').css('display', 'none');
        $('#completeDiv').css('display', 'none');
        $('#footerPanel').css('display', 'block');
        token = identityManager.credentials[0].token;
        user = identityManager.credentials[0].userId;
        email = portal.user.email;
        getUserLicenseType(user, token)
        .then(function (response) {
          if (response.name) {
            userLicenseType = response.name;
          }
          historyTable.init(identityManager.credentials[0].userId, token);
        });

        initForm();
      });
    });
  }

  
  function initForm() {
    const historymap = new WebMap({
      portalItem: {
        id: basemap_id,
      }
    });
    
    historyview = new MapView({
      container: "historyMapViewDiv",
      map: historymap,
      center: [init_longitude, init_latitude],
      zoom: init_zoom
    });
    historyview.popup.collapseEnabled = false;
    historyview.popup.dockOptions = {
      position: "top-right",
      breakpoint: {
        width: 300,
        height: 500
      }
    };
    
    var viewAction = {
      title: "閲覧",
      id: "view-this",
      className: "esri-icon-search"
    };
    var deleteAction = {
      title: "削除",
      id: "delete-this",
      className: "esri-icon-erase"
    };
    
    historyview.popup.actions = [viewAction, deleteAction];
    historyview.popup.maxInlineActions = 5;
    
    historyview.popup.on("trigger-action", function (event) {
      historyview.popup.close();
      if (event.action.id === "view-this") {
        var oid = historyview.popup.selectedFeature.getObjectId();
        historyTable.viewForm(oid);
      }
      if (event.action.id === "delete-this") {
        var oid = historyview.popup.selectedFeature.getObjectId();
        historyTable.deleteRow(oid);
      }
    });
    
    historyview.when(function () {
      var featureLayer = new FeatureLayer({
        url: push_feature_url
      });

      var popupTemplate = {
        title: "{Title}",
        outFields: ["*"],
        content: [
          {
            type: "fields",
            fieldInfos: [{
              fieldName: "Naiyo",
              label: "投稿内容"
            }, {
              fieldName: "Jusho",
              label: "住所"
            }, {
              fieldName: "Bikou",
              label: "備考"
            }]
          },
        ]
      };
      featureLayer.popupTemplate = popupTemplate;

      const labelClass = {
        labelExpressionInfo: {
          expression: "\"投稿日時\\n\" + Text($feature." + create_date_field + ", 'Y/MM/DD HH:mm')"
        },
        labelPlacement: "above-center",
        maxScale: 0,
        minScale: 200000,
        symbol: {
          type: "text",
          color: [75,100,201,255],
          font: {
            family: "Playfair Display",
            size: 9.75,
          },
          haloColor: [255,255,255,255],
          haloSize: 1
        }
      };
      
      featureLayer.labelingInfo = [labelClass];
      
      if (userLicenseType === "Creator") {  //Creatorは他ユーザの投稿も閲覧できる
        featureLayer.definitionExpression = "Status<>9";
      } else {
        featureLayer.definitionExpression = "Status<>9 And " + creator_field + " = '" + user + "'";
      }
      historymap.add(featureLayer);
    });
    
    const map = new WebMap({
      portalItem: {
        id: basemap_id,
      }
    });
    
    view = new MapView({
      container: "mapviewDiv",
      map: map,
      zoom: init_zoom,
      center: [init_longitude, init_latitude]
    });

    var searchWidget = new Search({
      view: view,
      popupEnabled: false
    });

    view.ui.add(searchWidget, {
      position: "top-right"
    });

    locateBtn = new Locate({
      view: view
    });

    view.ui.add(locateBtn, {
      position: "top-left"
    });
    
    //マップクリック
    view.on("click", function(event){
      var point = event.mapPoint;
      graphic_rendar(point.latitude, point.longitude);
    });

    //住所検索
    searchWidget.on("search-complete", function(event){
      try {
        var geo = event.results[0].results[0].feature.geometry;
        graphic_rendar(geo.latitude, geo.longitude);
      } catch(e) {

      }
    });    
    
    viewview = new MapView({
      container: "viewmapviewDiv",
      map: map
    });
    
    view_graphic_rendar = function(lat, long){
      viewview.graphics.removeAll();
      var pointGraphic = new Graphic({
        geometry: {
          type: "point",
          latitude: lat,
          longitude: long
        }, 
        symbol: markerSymbol
      });
      viewview.graphics.add(pointGraphic);

      var params = {
        location: pointGraphic.geometry
      };

      latitude = lat;
      longitude = long;

      var locatorTask = new Locator({
        url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
      });
      
      locatorTask
        .locationToAddress(params)
        .then(function (response) {

        if (response.attributes.CountryCode == "JPN" && response.address != "日本") {
          jusho = response.address;
        } else {
          jusho = "";
        }

        $('#viewjusho').val(jusho);

      })
        .catch(function (error) {
        jusho = "";
        $('#viewjusho').val(jusho);
      });
    }

    //現在地の取得
    view.when(function () {
      if(user_setting.toko == "0"){ // ユーザー設定がGPSの時
        if(navigator.geolocation) {
          locateBtn.locate();
        }
      }
    });

    //現在地検索
    locateBtn.on("locate", function(event){
      var cood = event.position.coords;
      graphic_rendar(cood.latitude, cood.longitude);
    });
    
    scene = new WebScene({
      portalItem: {
        id: basescene_id
      }
    });

    sceneview = new SceneView({
      container: "sceneviewDiv",
      map: scene,
      ui: {
        components: ["attribution"]
      },
      environment: {
        background: {
          type: "color",
          color: [150, 152, 144, 1]
        },
        starsEnabled: false,
        atmosphereEnabled: false
      },
      qualityProfile: "high"
    });
    sceneview.constraints.snapToZoom = false;

    homeButton = new Home({
      view: sceneview
    });
    sceneview.ui.add(homeButton, "top-left");

    sceneview.ui.add("measure_widget", "top-right");
  }

  var graphic_rendar = function(lat, long){
      view.graphics.removeAll();
      var pointGraphic = new Graphic({
        geometry: {
          type: "point",
          latitude: lat,
          longitude: long
        }, 
        symbol: markerSymbol
      });
      view.graphics.add(pointGraphic);

      var params = {
        location: pointGraphic.geometry
      };

      latitude = lat;
      longitude = long;

      var locatorTask = new Locator({
        url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
      });
      locatorTask
        .locationToAddress(params)
        .then(function (response) {

        if (response.attributes.CountryCode == "JPN" && response.address != "日本") {
          jusho = response.address;
        } else {
          jusho = "";
        }

        $('#gridDiv').html('緯度:' + Math.round(latitude * 100000) / 100000 + '　経度:' + Math.round(longitude * 100000) / 100000);
        $('#jusho').val(jusho);

      })
        .catch(function (error) {
        jusho = "";
        $('#gridDiv').html('緯度:' + Math.round(latitude * 1000) / 1000 + '<　経度:' + Math.round(longitude * 1000) / 1000);
        $('#jusho').val(jusho);
      });
    }

  /*********************イベント処理*********************/
  // 新規投稿
  $('#show_form').click(function() {
    form_clear();
    change_display(2);
  });

  // ユーザー設定変更
  $("#change-conf").click(function(){
    setUserConf();
    change_display(6);
  });

  // パスワード変更
  $("#change-password").click(function(){
    clear_pass_form();
    change_display(5);
  });
  
  //投稿履歴の切り替え
  $('input[name="history"]:radio').change(function() {
    var type = $(this).val();
    if(type == "history-list"){
      $('#historyListDiv').css('display', 'block');
      $('#historyMapDiv').css('display', 'none');
    }else{
      $('#historyListDiv').css('display', 'none');
      $('#historyMapDiv').css('display', 'block');
    }
  });

  //マップの表示・非表示切り替え
  $('.locate_conpact').click(function() {
    $('#mapviewDiv').toggle(function(){
      if ($(this).is(':visible')){
        $(".locate_conpact").text("▲ 閉じる");
      } else {
        $(".locate_conpact").text("▼ 開く");
      }
    });
    $('#viewmapviewDiv').toggle(function(){
      if ($(this).is(':visible')){
        $(".locate_conpact").text("▲ 閉じる");
      } else {
        $(".locate_conpact").text("▼ 開く");
      }
    });
  });

  //投稿区分の切り替え
  $('input[name="attachment"]:radio').change(function() {
    var type = $(this).val();
    if(type == "image"){
      $('#upload_images').css('display', 'block');
      $('#upload_movie').css('display', 'none');
    }else{
      $('#upload_images').css('display', 'none');
      $('#upload_movie').css('display', 'block');
    }
  });

  //写真選択
  $('#imagebtn').click(function() {
    $('#images-select').click();
  });

  // 写真選択イベント
  $('#images-select').change(function() {
    if(user_setting.toko == "1" && !isMobile){ // ユーザー設定がExifの時かつPC端末の場合
      getPhotoExif(this);
    }
    handleImageFilesSelect(this.files);
  });

  //動画選択
  $('#moviebtn1').click(function() {
    $('#movie-select1').click();
  });

  $('#moviebtn2').click(function() {
    $('#movie-select2').click();
  });

  $('#moviebtn3').click(function() {
    $('#movie-select3').click();
  });

  $('#movie-select1').change(function() {
    movieFilesSelect(this.files[0], 1);
  });

  $('#movie-select2').change(function() {
    movieFilesSelect(this.files[0], 2);
  });

  $('#movie-select3').change(function() {
    movieFilesSelect(this.files[0], 3);
  });

  //送信ボタンクリック
  $('#sendbtn').click(function() {
    var kaishaid = $('#kaishaid').val();

    if (kaishaid == "") {
      alert("会社IDが指定されていないため送信できません");
      return;
    }

    var title = $('#title').val();

    if (title == "") {
      alert("タイトルは必須です");
      $('#title').focus();
      return;
    }
    
    //入力項目の禁止文字チェック
    var ngCharaFlg = check_ngCharacters(0);
    if (ngCharaFlg) {
      alert("入力項目には禁止文字が入力されています");
      return;
    }

    var attachment = $('input[name="attachment"]:checked').val();

    //アタッチメントの選択チェック
    if (attachment == "image") {
      var objTBL = document.getElementById("imageGallery_tbl");
      var count = objTBL.rows.length-1;
      if (count == 0){
        alert("写真が選択されていません");
        return;
      }
    } else {
      var movie_upload_id_1 = $('#movie_upload_id_1').textContent;
      var movie_upload_id_2 = $('#movie_upload_id_2').textContent;
      var movie_upload_id_3 = $('#movie_upload_id_3').textContent;
      if (movie_upload_id_1 == "" && movie_upload_id_2 == "" && movie_upload_id_3=="") {
        alert("動画が選択されていません");
        return;
      }
    }

    //現在地の指定チェック
    if (latitude == null || longitude == null){
      alert("場所が指定されていません");
      return;
    }
    
    //取得ファイル形式チェック
    var request_file1 = $('#requestFile-PDF').is(':checked');
    var request_file2 = $('#requestFile-LAS').is(':checked');
    // var request_file3 = $('#requestFile-OBJ').is(':checked');
    var request_file3 = $('#requestFile-DWG-heimen').is(':checked');
    var request_file4 = $('#requestFile-DWG-oudan').is(':checked');

    if (request_file1==false && request_file2==false && request_file3==false && request_file4 == false) {
      alert("取得ファイル形式が指定されていません");
      return;
    }
    
    $('#sendbtn').html("送信中");

    add_feature(latitude, longitude, attachment);

  });

  //クリアボタンクリック
  $('#clearbtn').click(function() {
    form_clear();
  });

  //メイン画面に戻るボタンクリック
  $('.returnmenu').click(function() {
    historyTable.refreshRow();
    setActiveWidget(null);
    isMovedMap = false;
    change_display(1);
  });

  // ヒストリーテーブルボタンクリックイベント
  $("#btn_first").click(function(){
    historyTable.firstPage();
  });

  // ヒストリーテーブルボタンクリックイベント
  $("#btn_prev").click(function(){
    historyTable.prevPage();
  });

  // ヒストリーテーブルボタンクリックイベント
  $("#btn_next").click(function(){
    historyTable.nextPage();
  });

  // ヒストリーテーブルボタンクリックイベント
  $("#btn_last").click(function(){
    historyTable.lastPage();
  });

  // 全削除ボタンクリックイベント
  $("#delAllBtn").click(function(){
    isMovedMap = false;
    deleteAllImageRow();
  });

  //フォームに戻る
  $('#input_form').click(function() {
    form_clear();
    change_display(2);
    $('#completeDiv').css('display', 'none');
  });
  
  //登録情報の編集画面を表示
  $('#editform_show').click(function() {
    change_view_enable(true);
  });
  
  //編集のキャンセル
  $('#edit_cancel').click(function() {
    change_view_enable(false);
  });
  
  //登録情報の編集確定
  $('#edit_send').click(function() {
    var title = $('#viewtitle').val();
    if (title == "") {
      alert("タイトルは必須です");
      $('#viewtitle').focus();
      return;
    }
    
    //入力項目の禁止文字チェック
    var ngCharaFlg = check_ngCharacters(1);
    if (ngCharaFlg) {
      alert("入力項目には禁止文字が入力されています");
      return;
    }
    
    //取得ファイル形式チェック
    var request_file1 = $('#viewrequestFile-PDF').is(':checked');
    var request_file2 = $('#viewrequestFile-LAS').is(':checked');
    // var request_file3 = $('#viewrequestFile-OBJ').is(':checked');
    var request_file3 = $('#viewrequestFile-DWG-heimen').is(':checked');
    var request_file4 = $('#viewrequestFile-DWG-oudan').is(':checked');
    
    if (request_file1==false && request_file2==false && request_file3 == false && request_file4 == false) {
      alert("取得ファイル形式が指定されていません");
      return;
    }
    edit_feature(latitude, longitude);
  });
  
  //距離計測ボタン
  $('#distanceButton').click(function(event) {
    setActiveWidget(null);
    const elements = $('.active');
    for (let i = 0; i < elements.length; i++) {
      elements[i].classList.remove("active");
    }
    
    if (!event.target.classList.contains("active")) {
      setActiveWidget("distance");
    } else {
      setActiveButton(null);
    }
  });
  
  //面積計測ボタン
  $('#areaButton').click(function(event) {
    setActiveWidget(null);
    const elements = $('.active');
    for (let i = 0; i < elements.length; i++) {
      elements[i].classList.remove("active");
    }
    
    if (!event.target.classList.contains("active")) {
      setActiveWidget("area");
    } else {
      setActiveButton(null);
    }
  });
  
  //計測クリアボタン
  $('#clearButton').click(function(event) {
    setActiveWidget(null);
    const elements = $('.active');
    for (let i = 0; i < elements.length; i++) {
      elements[i].classList.remove("active");
    }
  });
  
  
  //添付ファイルの追加
  $('#addattachment').click(function() {
    $('#addattachment-select').click();
  });
  
  $('#addattachment-select').change(function() {
    //movieFilesSelect(this.files[0], 1);
    
    addattachent_upload_file($('#viewobjectid').val(), this.files[0])
  });
  
  // ページスクロールボタンイベント
  $('#backbtn-form').click(function () {
    $('body, html').animate({scrollTop: 0}, 300, 'linear');
  });

  // ページスクロールボタンイベント
  $('#backbtn-view').click(function () {
    $('body, html').animate({scrollTop: 0}, 300, 'linear');
  });

  // ページスクロールボタンイベント
  $('#bottombtn-form').click(function () {
    $('body, html').animate({scrollTop: $('#buttonDiv').offset().top}, 300, 'linear');
  });

  // ページスクロールボタンイベント
  $('#bottombtn-view').click(function () {
    $('body, html').animate({scrollTop: $('#viewfooterbuttonDiv').offset().top}, 300, 'linear');
  });

  // ユーザー設定保存
  $('#conf-save').click(function(){
    saveUserConf();
  });

  // パスワード変更
  $('#new-password-regist').click(function () {
    changePasswordAction();
  });

  // スクロールイベント
  $(window).bind('scroll', function(){
    const bodyHeight = document.body.clientHeight // bodyの高さを取得
    const windowHeight = window.innerHeight // windowの高さを取得
    const bottomPoint = bodyHeight - windowHeight // ページ最下部までスクロールしたかを判定するための位置を計算
    const currentPos = window.pageYOffset // スクロール量を取得

    // スクロール量が最下部の位置を過ぎたかどうか
    if (bottomPoint <= currentPos) {
      $('.bottombtn').css('display', 'none');
    }
    else{
      $('.bottombtn').css('display', 'block');
    }

    // スクロール量が最上部にきたかどうか
    if($(this).scrollTop() == 0){
      $('.backbtn').css('display', 'none');
    }
    else{
      $('.backbtn').css('display', 'block');
    }
    
  });

  /*********************ロジック処理*********************/

  //入力項目に禁止文字が含まれるかのチェック
  function check_ngCharacters(mode) {
    var ngCharaFlg = false;

    var title = $('#title');
    var naiyo = $('#naiyo');
    var jusho = $('#jusho');
    var bikou = $('#bikou');

    if (mode === 1) {
      title = $('#viewtitle');
      naiyo = $('#viewnaiyo');
      jusho = $('#viewjusho');
      bikou = $('#viewbikou');
    }
    for (var chara of ngCharacters) {
      if (title.val().indexOf(chara) != -1) {
        ngCharaFlg = true;
        title.focus();
      }
      if (naiyo.val().indexOf(chara) != -1) {
        ngCharaFlg = true;
        naiyo.focus();
      }
      if (jusho.val().indexOf(chara) != -1) {
        ngCharaFlg = true;
        jusho.focus();
      }
      if (bikou.val().indexOf(chara) != -1) {
        ngCharaFlg = true;
        bikou.focus();
      }
    }
    return ngCharaFlg;
  }
  
  // 選択した写真の位置情報を取得して地図を移動させるメソッド
  function getPhotoExif(vm){
    var images = $('#images-select');
    var files = images[0].files;
    
    if(isMovedMap == true){
      if(confirm("選択した画像から位置情報が検出されました。地図を移動させますか？") == false){
        return;
      }
    }
    
    for(var i = 0; i < files.length; i++){
      $.fileExif(files[i],function(exif) {
        if(exif.GPSLatitude && exif.GPSLongitude){
          photoLatLng.lat = exif.GPSLatitude[0]  + (exif.GPSLatitude[1] / 60)  + (exif.GPSLatitude[2] / 3600);
          photoLatLng.lng = exif.GPSLongitude[0] + (exif.GPSLongitude[1] / 60) + (exif.GPSLongitude[2] / 3600);

          //緯度経度が取得できた場合のみ位置を移動
          if (isNaN(photoLatLng.lat) == false && isNaN(photoLatLng.lng) == false) {
            // 地図を画像の位置に移動
            view.goTo({
              center: [photoLatLng.lng,photoLatLng.lat],
              zoom: 17
            });
            graphic_rendar(photoLatLng.lat, photoLatLng.lng);
            isMovedMap = true;
          }
        }
      });
    }
  }

  async function  handleImageFilesSelect(files) {

    //入力不可に設定
    form_disabled(true);

    for (var i = 0, f; f = files[i]; i++) {
      var objTBL = document.getElementById("imageGallery_tbl");
      if (!objTBL)
        return;

      var count = objTBL.rows.length;

      // 最終行に新しい行を追加
      var row = objTBL.insertRow(count);

      await compact_image(f, count, row);

      $('#images_label').html(count + "件の写真が選択されました");
    }

    $('input[type=file]').val('');
    
    
  }

  async function compact_image(f, count, row) {

    var uploading = $('#image_uploading').html();
    
    while (uploading != "0") {
      uploading = $('#image_uploading').html();
      await wait(0.5);
    }
    $('#image_uploading').html("1");

    var c1 = row.insertCell(0);
    var c2 = row.insertCell(1);
    var c3 = row.insertCell(2);
    var c4 = row.insertCell(3);
    var c5 = row.insertCell(4);
    var c6 = row.insertCell(5);

    c1.innerHTML = '<center><span class="seqno">' + count + '</span></center>';
    c3.innerHTML = f.name;
    c5.innerHTML = '<span class="status">読込中</span>';
    c6.innerHTML = '<center><input class="delbtn" type="button" id="delBtn' + count + '" value="削除" onclick="deleteImageRow(this)"></center>';
    
    var file_property_bag = {
      type: f.type
    };

    const reader = new FileReader();
    const imgReader = new Image();
    const imgWidth = 960;
    reader.onloadend = () => {
      imgReader.onload = () => {
        const imgType = imgReader.src.substring(5, imgReader.src.indexOf(';'));
        const imgHeight = imgReader.height * (imgWidth / imgReader.width);
        const canvas = document.createElement('canvas');
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgReader,0,0,imgWidth,imgHeight);

        canvas.toBlob(async function (blob) {
          var url = URL.createObjectURL(blob);

          //c2.innerHTML = '<center><img class="thumb" loading="lazy" height="30px" src="' + url + '" title="' + f.name + '" hidden/></center>';
          //c2.innerHTML = '<span class="upload_url" hidden>' + url + '</span>';
          
          c4.innerHTML =(Math.floor(blob.size/1024/1024*100)/100) + "MB"
          c5.innerHTML = '<span class="upload_url" hidden>' + url + '</span><span class="upload_id" hidden></span><span class="status"></span>';

          $('#image_uploading').html("0");
          await upload_rowimage(row, file_property_bag);
          
        });


      }
      imgReader.src = reader.result;
    }
    reader.readAsDataURL(f);

  }

  async function upload_rowimage(row, file_property_bag) {
    var filename = row.children[2].innerText;
    //var url = row.children[1].firstElementChild.firstElementChild.src;
    var url = row.getElementsByClassName('upload_url')[0].innerText;

    var upload_id_span = row.getElementsByClassName('upload_id')[0];
    var status_span = row.getElementsByClassName('status')[0];

    async function getImageData(url, filename, upload_id_span, status_span) {
      status_span.innerText = "0%";

      const res = await fetch(url);
      const blob = await res.blob();

      url = push_feature_url + "/uploads/upload";

      var upload_file = new File([blob], filename, file_property_bag);

      var form = new FormData();
      form.set('f','json');
      form.set('file', upload_file);
      form.set('token', token);

      await $.ajax({
        url: url,
        type: "POST",
        data: form,
        processData: false,
        contentType: false,
        dataType: 'json',
        context: status_span,
        async: true,
        xhr : function(){
          var XHR = $.ajaxSettings.xhr();
          XHR.upload.addEventListener('progress',function(e){
            var progre = parseInt(e.loaded/e.total * 100);
            status_span.innerText = "" + progre + "%";
          });
          return XHR;
        },
        success: function(data) {
          status_span.innerText = "追加済";
          upload_id_span.innerText = data.item.itemID;
          
          if (check_image_upload() == true) {
            //入力可に設定
            form_disabled(false);
          }
          console.log(status_span + ":" + data.item.itemID);
        },
        error: function(data) {
          console.log(data);
        }
      });
    }
    await getImageData(url, filename, upload_id_span, status_span);
  }
  
  function check_image_upload() {
    var objTBL = document.getElementById("imageGallery_tbl");
    var tableRows = objTBL.getElementsByTagName('tr');

    for (var i = 1; i < tableRows.length; i++) {
      if (tableRows[i].getElementsByClassName('status')[0] == null) {
        continue;
      }
      if (tableRows[i].getElementsByClassName('status')[0].innerText != "追加済") {
        return false;
      }
    }
    return true;
  }

  function  movieFilesSelect(file, index) {
    //入力不可に設定
    form_disabled(true);

    var str_index = String(index);

    $('#movie_filename_' + str_index).html(file.name);
    $('#movie_size_' 
      + str_index).html((Math.floor(file.size/1024/1024*100)/100) + "MB");

    registerBlobData(file, index)
    $('input[type=file]').val('');

  }

  function registerBlobData(f, index) {

    var form = new FormData();
    form.set('f','json');
    form.set('itemName', f.name);
    form.set('token', token);

    $.ajax({
      url: register_url,
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: false
    }).done(function(data) {
      uploadBlobData(data.item.itemID, f, index);
    }).fail(function(data) {
      console.log(data);
    });
  }

  async function uploadBlobData(upload_id, file, index) {

    var str_index = String(index);

    var part_url = push_feature_url + "/uploads/" + upload_id + "/uploadPart";
    var commit_url = push_feature_url + "/uploads/" + upload_id + "/commit";

    var totalBytes = file.size;

    // チャンク分割数
    var chunkCount = Math.ceil(totalBytes / chunkSize);

    var readBytes = 0;
    var tasks = [];
    var end_task = [];

    var reader = new FileReader();
    reader.onloadend = function(evt) {
      if (evt.target.readyState != FileReader.DONE) {
        return;
      }

      var binaryData = evt.target.result;

      var file_property_bag = {
        type: file.type
      };

      var items = [];
      for(let i = 0; i < chunkCount; i++){
        var blob = null;

        if (i == chunkCount-1){
          blob = binaryData.slice(readBytes, totalBytes);
        } else{
          blob = binaryData.slice(readBytes, readBytes + chunkSize);
        }
        readBytes = readBytes + chunkSize;

        var cut_file = new File([blob], file.name, file_property_bag);

        items.push({
          index: i,
          file: cut_file,
          progre: 0,
          status: 0
        });
      }

      upload_parts_func = (datas, callback) => {
        let count = 0;
        let done = 0;

        let upload_part_func = async (count) => {
          let data = datas[count];

          if (count > 1) {
            while (datas[count-1].status == 0){
              await wait(0.5);
            }
          }

          var form = new FormData();
          form.set('f','json');
          form.set('partId', data.index);
          form.set('file', data.file);
          form.set('token', token);

          var promise = $.ajax({
            url: part_url,
            enctype: 'multipart/form-data',
            type: "POST",
            data: form,
            processData: false,
            contentType: false,
            dataType: 'json',
            async: true,
            //context: data.index,
            xhr : function(){
              var XHR = $.ajaxSettings.xhr();
              XHR.upload.addEventListener('progress',function(e){
                var progre = parseInt(e.loaded/e.total * 100);

                datas[count].progre = progre;
                console.log("upload_part_func progre:index" + datas[count].index + ":" + datas[count].progre + "%");

                var stop_status = 100 * datas.length;
                var sum_status = 0;
                for (i=0;i<datas.length;i++) {
                  sum_status = sum_status + datas[i].progre;
                }
                progre = parseInt(sum_status/stop_status * 100);
                $('#movie_status_' + str_index).html("" + progre + "%");
              });
              return XHR;
            },
            success: function(data) {
              console.log("upload_part_func end:index" + datas[count].index);

              datas[count].status = 1;

              var cnt = 0;
              for (i=0;i<datas.length;i++) {
                cnt = cnt + datas[i].status;
              }

              if (cnt == datas.length) {
                callback();
              }
            },
            error: function(data) {
              console.log(data);
            }
          });

          if (count >= datas.length - 1) {
            return;
          }

          upload_part_func(count + 1);
        };

        upload_part_func(count);
      };

      upload_parts_func(items, () => commitBlobData(upload_id, index));
    }

    reader.readAsArrayBuffer(file);
  }

  async function commitBlobData(upload_id, index) {

    console.log("commit start");
    var str_index = String(index);

    //await wait(10);

    var commit_url = push_feature_url + "/uploads/" + upload_id + "/commit";

    var form = new FormData();
    form.set('f','json');
    form.set('token', token);

    $.ajax({
      url: commit_url,
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: true
    }).done(function(data) {
      $('#movie_status_' + str_index).html("追加済");
      $('#movie_upload_id_' + str_index).html(upload_id);

      //入力可に設定
      form_disabled(false);
      console.log(data);

    }).fail(function(data) {
      console.log(data);
    });
  }

  function deleteAllMovieRow() {
    $('#movie_filename_1').html("");
    $('#movie_size_1').html("");
    $('#movie_status_1').html("");
    $('#movie_upload_id_1').html("");
    $('#movie-select1').val("");
    $('#movie_filename_2').html("");
    $('#movie_size_2').html("");
    $('#movie_status_2').html("");
    $('#movie_upload_id_2').html("");
    $('#movie-select2').val("");
    $('#movie_filename_3').html("");
    $('#movie_size_3').html("");
    $('#movie_status_3').html("");
    $('#movie_upload_id_3').html("");
    $('#movie-select3').val("");
  }

  function add_feature(lat, long, flg) {
    form_disabled(true);

    var kbn = 0;
    if (flg == "movie") {
      kbn = 1;
    }
    
    var request_file1 = Number($('#requestFile-PDF').is(':checked'));
    var request_file2 = Number($('#requestFile-LAS').is(':checked'));
    // var request_file3 = Number($('#requestFile-OBJ').is(':checked'));
    var request_file3 = Number($('#requestFile-DWG-heimen').is(':checked'));
    var request_file4 = Number($('#requestFile-DWG-oudan').is(':checked'));
    
    url = push_feature_url + "/" + layer_id + "/addFeatures";

    var feature = {
      "geometry": {
        "x": long,
        "y": lat,
        "spatialReference" : {"wkid" : 4326}
      },
      "attributes": {
        "KaishaID": $('#kaishaid').val(),
        "Kbn": kbn,
        "Title": $('#title').val(),
        "Naiyo": $('#naiyo').val(),
        "Jusho": $('#jusho').val(),
        "Bikou": $('#bikou').val(),
        "Email": email,
        "Status": 0,
        "Request_filetype01": request_file1,
        "Request_filetype02": request_file2,
        "Request_filetype03": request_file3,
        "Request_filetype04": request_file4
      }
    };

    var form = new FormData();
    form.set('f','json');
    form.set('features', JSON.stringify([feature]));
    form.set('token', token);

    $.ajax({
      url: url,
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: false
    }).done(function(data) {
      console.log(data);
      append_attachments(data.addResults[0].objectId, flg);
    }).fail(function(data) {
      console.log(data);
    });
  }

  function append_attachments(oid, flg) {

    var uploads = [];

    //画像ファイル
    if (flg == "image") {
      var objTBL = document.getElementById("imageGallery_tbl");
      var tableRows = objTBL.getElementsByTagName('tr');

      var rowCount = tableRows.length;

      var uploads = [];
      for (var i = 1; i < tableRows.length; i++) {
        uploads.push({
          id: tableRows[i].getElementsByClassName('upload_id')[0].innerText,
          status: 0
        });
      }
      //動画ファイル
    } else {
      var content = $('#movie_upload_id_1');
      if (content.length != 0 && content[0].textContent != "") {
        uploads.push({
          id: content[0].textContent,
          status: 0
        });
      }
      var content = $('#movie_upload_id_2');
      if (content.length != 0 && content[0].textContent != "") {
        uploads.push({
          id: content[0].textContent,
          status: 0
        });
      }
      var content = $('#movie_upload_id_3');
      if (content.length != 0 && content[0].textContent != "") {
        uploads.push({
          id: content[0].textContent,
          status: 0
        });
      }    
    }

    append_attachents(oid, uploads)
  }

  function append_attachents(oid, uploads) {

    var url = push_feature_url + "/" + layer_id + "/" + oid + "/addAttachment";
    var attachment = $('input[name="attachment"]:checked').val();

    append_image_attachents = (uploads, callback) => {
      let count = 0;
      let done = 0;

      let append_image_attachent = async (count) => {
        let upload = uploads[count];

        var form = new FormData();
        form.set('f','json');
        form.set('uploadId', upload.id);
        form.set('keywords', attachment);
        form.set('token', token);

        var promise = $.ajax({
          url: url,
          type: "POST",
          data: form,
          processData: false,
          contentType: false,
          dataType: 'json',
          async: true
        }).done(function(data) {
          console.log(data);

          uploads[count].status = 1;

          var cnt = 0;
          for (i=0;i<uploads.length;i++) {
            cnt = cnt + uploads[i].status;
          }

          if (cnt == uploads.length) {
            callback();
          }
        }).fail(function(data) {
          console.log(data);
        });

        if (count >= uploads.length - 1) {
          return;
        }
        append_image_attachent(count + 1);
      };
      append_image_attachent(count);
    };

    send_finally = () => {
      //投稿後画面切り替え
      form_disabled(false);
      change_display(3);
      $("html,body").animate({scrollTop:0},"300");

    }

    append_image_attachents(uploads, () => send_finally());
  }

  function append_movie_attachent_upload_id(oid, upload_id) {
    url = push_feature_url + "/" + layer_id + "/" + oid + "/addAttachment";

    var form = new FormData();
    form.set('f','json');
    form.set('uploadId', upload_id);
    form.set('token', token);

    $.ajax({
      url: url,
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: false
    }).done(function(data) {
      console.log(data);
    }).fail(function(data) {
      console.log(data);
    });
  }
  
  function addattachent_upload_file(oid, file) {
    
    if (file.size >= 10 * 1024 *1024) {
      alert("10MB以上のファイルは添付できません");
      return;
    }
    
    var att_html = "<br/>" + file.name + "を追加しています";
    $('#attachmentlistDiv').append(att_html);
    
    url = push_feature_url + "/" + layer_id + "/" + oid + "/addAttachment";

    var form = new FormData();
    form.set('f','json');
    form.set('file', file);
    form.set('token', token);

    $.ajax({
      url: url,
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: true
    }).done(function(data) {
      historyTable.viewattachment(oid);
      console.log(data);
    }).fail(function(data) {
      console.log(data);
    });
  }
  
  function form_clear() {
    form_disabled(false);

    if(navigator.geolocation) {
      locateBtn.locate();
    } else {
      latitude = init_latitude;
      longitude = init_longitude;

      jusho = "";
      $('#jusho').val("");
    }

    $('#title').val("");
    $('#naiyo').val("");
    $('#bikou').val("");
    view.graphics.removeAll();

    $('#gridDiv').html("場所を指定してください");

    deleteAllImageRow();
    deleteAllMovieRow();
    
    // ユーザー設定を読み込む
    $('#requestFile-PDF').prop('checked', false);
    $('#requestFile-LAS').prop('checked', false);
    $('#requestFile-DWG-heimen').prop('checked', false);
    $('#requestFile-DWG-oudan').prop('checked', false);
    if(user_setting.pdf == "1"){
      $('#requestFile-PDF').prop('checked', true);
    }
    if(user_setting.las == "1"){
      $('#requestFile-LAS').prop('checked', true);
    }
    if(user_setting.heimenzu == "1"){
      $('#requestFile-DWG-heimen').prop('checked', true);
    }
    if(user_setting.oudanzu == "1"){
      $('#requestFile-DWG-oudan').prop('checked', true);
    }
    // $('#requestFile-OBJ').prop('checked', false);
    
    $('#sendbtn').html("送信");
  }
  
  function edit_feature(lat, long) {
    
    var request_file1 = Number($('#viewrequestFile-PDF').is(':checked'));
    var request_file2 = Number($('#viewrequestFile-LAS').is(':checked'));
    // var request_file3 = Number($('#viewrequestFile-OBJ').is(':checked'));
    var request_file3 = Number($('#viewrequestFile-DWG-heimen').is(':checked'));
    var request_file4 = Number($('#viewrequestFile-DWG-oudan').is(':checked'));
    
    url = push_feature_url + "/" + layer_id + "/updateFeatures";

    var feature = {
      "geometry": {
        "x": long,
        "y": lat,
        "spatialReference" : {"wkid" : 4326}
      },
      "attributes": {
        "OBJECTID": $('#viewobjectid').val(),
        "Title": $('#viewtitle').val(),
        "Naiyo": $('#viewnaiyo').val(),
        "Jusho": $('#viewjusho').val(),
        "Bikou": $('#viewbikou').val(),
        "Request_filetype01": request_file1,
        "Request_filetype02": request_file2,
        "Request_filetype03": request_file3,
        "Request_filetype04": request_file4
      }
    };

    var form = new FormData();
    form.set('f','json');
    form.set('features', JSON.stringify([feature]));
    form.set('token', token);

    $.ajax({
      url: url,
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: false
    }).done(function(data) {
      console.log(data);
      //戻る
      $('.returnmenu').click();
    }).fail(function(data) {
      console.log(data);
    });
  }


  const wait = (sec) => {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, sec*1000);
    });
  };

  function form_disabled(disabled) {
    $('input').prop('disabled', disabled);
    $('button').prop('disabled', disabled);
  }
  
  function setActiveWidget(type) {
    switch (type) {
      case "distance":
        activeWidget = new DirectLineMeasurement3D({
          view: sceneview
        });

        activeWidget.viewModel.start();

        view.ui.add(activeWidget, "top-right");
        setActiveButton($('#distanceButton')[0]);
        break;
      case "area":
        activeWidget = new AreaMeasurement3D({
          view: sceneview
        });

        activeWidget.viewModel.start();

        view.ui.add(activeWidget, "top-right");
        setActiveButton($('#areaButton')[0]);
        break;
      case null:
        if (activeWidget) {
          sceneview.ui.remove(activeWidget);
          activeWidget.destroy();
          activeWidget = null;
        }
        break;
    }
  }

  function setActiveButton(selectedButton) {
    view.focus();
    const elements = $('.active');
    for (let i = 0; i < elements.length; i++) {
      elements[i].classList.remove("active");
    }
    if (selectedButton) {
      selectedButton.classList.add("active");
    }
  }

  // ユーザー設定をセット
  function setUserConf(){
    $("#saved").html("");//保存完了表示を初期化
    if(user_setting.toko == "0"){
      $("#gps").prop("checked", true);
    }
    else{
      $("#exif").prop("checked", true)
    }

    if(user_setting.pdf == "1"){
      $("#pdf").prop("checked", true);
    }
    else{
      $("#pdf").prop("checked", false);
    }
    if(user_setting.las == "1"){
      $("#las").prop("checked", true);
    }
    else{
      $("#las").prop("checked", false);
    }
    if(user_setting.heimenzu == "1"){
      $("#heimenzu").prop("checked", true);
    }
    else{
      $("#heimenzu").prop("checked", false);
    }
    if(user_setting.oudanzu == "1"){
      $("#oudanzu").prop("checked", true);
    }
    else{
      $("#oudanzu").prop("checked", false);
    }
  }

  // ユーザー設定保存メソッド
  function saveUserConf(){
    // モバイル端末の場合強制的に端末のGPSにチェックをつける
    if(isMobile) {
      $("#gps").prop("checked", true);
    }
    var toko = $('input:radio[name="toko_setting"]:checked').val();// チェックがついたほうのvalueを取得
    user_setting.toko = toko;

      if($("#pdf").prop("checked")){
        user_setting.pdf = "1";
      }
      else{
        user_setting.pdf = "0";
      }

      if($("#las").prop("checked")){
        user_setting.las = "1";
      }
      else{
        user_setting.las = "0";
      }
    
      if($("#heimenzu").prop("checked")){
        user_setting.heimenzu = "1";
      }
      else{
        user_setting.heimenzu = "0";
      }
    
      if($("#oudanzu").prop("checked")){
        user_setting.oudanzu = "1";
      }
      else{
        user_setting.oudanzu = "0";
      }

    // jsonに変換
    var cookie_data = JSON.stringify(user_setting);
    // cookieに保存
    $.cookie(cookieKey, cookie_data, { expires: 1826}); //cookieの有効期限を５年に設定
    $("#saved").html("<label>保存が完了しました。</label>");
    //$('.returnmenu').click();
  }

  // パスワード変更前確認メソッド
  function changePasswordAction() {
    const list = [];
    let html = '';
    const currentPwd = $('#present-password').val();
    const newPwd = $('#new-password').val();
    const rePwd = $('#retype-password').val();
    if(currentPwd.length == 0)
    {
      list.push('現在のパスワードが入力されていません。');
    }
    if(newPwd.length == 0){
      list.push('新しいパスワードが入力されていません。');
    }
    if(rePwd.length == 0){
      list.push('新しいパスワード（再入力）が入力されていません。');
    }
    if(currentPwd == newPwd && currentPwd.length != 0 && newPwd.length != 0){
      list.push('現在のパスワードと新しいパスワードが一致しています。');
    }
    if(newPwd != rePwd){
      list.push("新しいパスワードと再入力したパスワードが一致しません。")
    }
    if(list.length == 0){
      var form = new FormData();
      form.set('f','json');
      form.set('username', identityManager.credentials[0].userId);
      form.set('password', currentPwd);
      form.set('referer', 'https://arcgis.com');
      form.set('token', token);

      $.ajax({
        //url: "https://arcgis.com/sharing/rest/generateToken",
        url: portalUrl + "/rest/generateToken",
        type: "POST",
        data: form,
        processData: false,
        contentType: false,
        dataType: 'json',
        async: false
      }).done(function(data) {
        if(data.error){
          $('#warnDiv').html('<ul><li>現在のパスワードが間違っています。</li></ul>');
        }
        else{
          changePassword(newPwd);
        }
      }).fail(function(xhr) {
        console.log(xhr);
        $('#warnDiv').html('<ul><li>現在のパスワードの確認に失敗しました。</li></ul>');
      });
    }
    else{
      html += '<ul>';
      for(let i = 0;i < list.length; i++){
        html += '<li>' + list[i] + '</li>';
      }
      html += '</ul>';
      $('#warnDiv').html(html);
    }
  }

  // パスワード変更メソッド
  function changePassword(pwd){
    var form = new FormData();
    form.set('f','json');
    form.set('token', token);
    form.set('password', pwd);

    $.ajax({
      url: portalUrl + "/rest/community/users/" + identityManager.credentials[0].userId + "/update",
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: false
    }).done(function(data) {
      if(data.success){
        alert(' パスワードを変更しました。再ログインしてください。');
        document.location.reload()
      }
      else{
        console.log(data)
        $('#warnDiv').html('<ul><li>パスワードの変更に失敗しました。</li></ul>');
      }
    }).fail(function(xhr) {
      $('#warnDiv').html('<ul><li>パスワードの変更に失敗しました。</li></ul>');
      console.log(xhr);
    });
  }
});


function formatDate(date, format) {
  format = format.replace(/yyyy/g, date.getFullYear());
  format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/dd/g, ('0' + date.getDate()).slice(-2));
  format = format.replace(/HH/g, ('0' + date.getHours()).slice(-2));
  format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
  format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
  format = format.replace(/SSS/g, ('00' + date.getMilliseconds()).slice(-3));
  return format;
};


var historyTable = {
  current_page: 1,
  records_per_page: 10,
  pages: 1,
  records: 0,
  userId: null,
  token: null,
  init: function (userId, token) {
    this.userId = userId;
    this.token = token;
    this.loadHead();
    this.getRecordCount();

    this.changePage(this.current_page);
  },
  loadHead: function () {
    let strRowHead = document.getElementById("tableHead");
    strRowHead.innerHTML = `<tr class="row-head">
          <th>タイトル</th>
          <th>投稿日時</th>
          <th>投稿内容</th>
          <th>住所　　</th>
          <th>備考　　</th>
          <th>確認　　</th>
        </tr>`;
  },

  changePage:function(page) {
    let btn_next = document.getElementById("btn_next");
    let btn_prev = document.getElementById("btn_prev");
    let btn_first = document.getElementById("btn_first");
    let btn_last = document.getElementById("btn_last");

    let page_span = document.getElementById("page");

    if (page < 1) page = 1;
    if (page > this.pages) page = this.pages;
    let tableBody = $("#tableBody");
    tableBody.empty();
    
    if (page == 1) {
      btn_prev.style.visibility = "hidden";
      btn_first.style.visibility = "hidden";
    } else {
      btn_prev.style.visibility = "visible";
      btn_first.style.visibility = "visible";
    }

    if (page == this.numPages()) {
      btn_next.style.visibility = "hidden";
      btn_last.style.visibility = "hidden";
    } else {
      btn_next.style.visibility = "visible";
      btn_last.style.visibility = "visible";
    }

    var form = new FormData();
    form.set('f','json');
    form.set('returnGeometry', false);
    if (userLicenseType === "Creator") {  //Creatorは他ユーザの投稿も閲覧できる
      form.set('where', "Status<>9");
    } else {
      form.set('where', "Status<>9 And " + creator_field + " = '" + this.userId + "'");
    }
    form.set('outFields', '*');
    form.set('orderByFields', create_date_field + ' DESC');
    form.set('resultOffset', (page -1 ) * this.records_per_page);
    form.set('resultRecordCount', this.records_per_page);
    form.set('token', token);

    $.ajax({
      url: push_feature_url + '/' + layer_id + '/query',
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: false
    }).done(function(data) {
      var features = data.features;
      if(features != undefined) {
        for(var i = 0; i< features.length; i++) {
          var tr_html = "";

          var objectid = features[i].attributes["OBJECTID"];
          var title = features[i].attributes["Title"];
          var createdate = features[i].attributes[create_date_field];
          var str_createdate = formatDate(new Date(createdate), 'yyyy/MM/dd HH:mm');
          var naiyo = features[i].attributes["Naiyo"];
          var jusho = features[i].attributes["Jusho"];
          var bikou = features[i].attributes["Bikou"];

          tr_html += '<tr>';
          tr_html += '<td data-label="タイトル　">' + title + '　</td>';
          tr_html += '<td data-label="投稿日時　">' + str_createdate + '　</td>';
          tr_html += '<td data-label="投稿内容　">' + naiyo + '　</td>';
          tr_html += '<td data-label="住所　　　">' + jusho + '　</td>';
          tr_html += '<td data-label="備考　　　">' + bikou + '　</td>';
          tr_html += '<td data-label="確認　　　">'
          tr_html += '<input id="view" type="button" value="閲覧" onclick="historyTable.viewForm(' + objectid + ')"/>';
          tr_html += '<input id="del" type="button" value="削除" onclick="historyTable.deleteRow(' + objectid + ')"/>';
          tr_html += '</td>';
          tr_html += '</tr>';

          tableBody.append(tr_html);
        }
      }
    }).fail(function(data) {
      console.log(data);
    });

  },
  prevPage:function() {
    if (this.current_page > 1) {
      this.current_page--;
      this.changePage(this.current_page);
      $('body, html').scrollTop(0);
    }
  },
  nextPage:function() {
    if (this.current_page < this.numPages()) {
      this.current_page++;
      this.changePage(this.current_page);
      $('body, html').scrollTop(0);
    }
  },
  firstPage:function() {
    this.current_page = 1;
    this.changePage(this.current_page);
    $('body, html').scrollTop(0);
  },
  lastPage:function(){
    this.current_page = this.numPages();
    this.changePage(this.current_page);
    $('body, html').scrollTop(0);
  },
  numPages:function() {
    return this.pages;
  },
  viewForm:function(objectid) {
    var form = new FormData();
    form.set('f','json');
    form.set('objectIds', objectid);
    form.set('outFields', '*');
    form.set('outSR', 4326);
    form.set('returnGeometry', true);
    form.set('token', token);

    $.ajax({
      url: push_feature_url + '/' + layer_id + '/query',
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: true,
      context: this,
    }).done(function(data) {
      console.log(data);
      var features = data.features;

      viewview.graphics.removeAll();

      if (features[0].geometry != null) {
        var pointGraphic = {
          geometry: {
            type: "point",
            latitude: features[0].geometry.y,
            longitude: features[0].geometry.x,
            spatialReference: {wkid: 4326}
          }, 
          symbol: markerSymbol
        };
        viewview.graphics.add(pointGraphic);

        viewview.goTo({
          center: [features[0].geometry.x, features[0].geometry.y],
          zoom: 15
        });

        latitude = features[0].geometry.y;
        longitude = features[0].geometry.x;
      }
      
      $('#viewtitle').val(features[0].attributes["Title"]);
      $('#viewnaiyo').val(features[0].attributes["Naiyo"]);
      $('#viewjusho').val(features[0].attributes["Jusho"]);
      $('#viewbikou').val(features[0].attributes["Bikou"]);
      $('#viewrequestFile-PDF').prop('checked', features[0].attributes["Request_filetype01"]);
      $('#viewrequestFile-LAS').prop('checked', features[0].attributes["Request_filetype02"]);
      // $('#viewrequestFile-OBJ').prop('checked', features[0].attributes["Request_filetype03"]);
      $('#viewrequestFile-DWG-heimen').prop('checked', features[0].attributes["Request_filetype03"]);
      $('#viewrequestFile-DWG-oudan').prop('checked', features[0].attributes["Request_filetype04"]);
      $('#viewobjectid').val(objectid);
      $('#viewstatus').val(features[0].attributes["Status"]);
      $('#viewscene_itemid').val(features[0].attributes["SceneItemID"]);
      
      /*
      if (features[0].attributes["Status"] == "0") {
        $('#status_text').html("加工待ち");
      } else if (features[0].attributes["Status"] == "2") {
        $('#status_text').html("加工不可");
      } else if (features[0].attributes["Status"] == "9") {
        $('#status_text').html("公開終了");
      }
      */
      
      this.viewattachment(objectid);
      
      change_display(4);
    }).fail(function(data) {
      console.log(data);
    });
  },

  viewattachment:function(objectid) {
    $('#pdf_attachmentDiv').html("");
    $('#las_attachmentDiv').html("");
    $('#dwg_attachmentDiv').html("");
    $('#attachmentlistDiv').html("");
    
    var form = new FormData();
    form.set('f','json');
    form.set('objectIds', objectid);
    //form.set('keywords', 'image,moview');
    form.set('token', token);

    $.ajax({
      url: push_feature_url + '/' + layer_id + '/queryAttachments',
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: true,
      context: this,
    }).done(function(data) {
      console.log(data);
      
      if (data.attachmentGroups.length == 0) {
        return;
      }
      var attachments = data.attachmentGroups[0].attachmentInfos;
      
      var att_html = "";
      
      for(var i = 0; i< attachments.length; i++) {
        var att_name = attachments[i].name;
        var att_id = attachments[i].id;
        var att_url = push_feature_url + '/' + layer_id + '/' + objectid + '/attachments/' + att_id + '?token=' + this.token;
        var contentType = attachments[i].contentType;
        var keywords = attachments[i].keywords;
        
        if (keywords.split('|').indexOf("ManagementSystemUpload") !== -1 && keywords.toUpperCase().indexOf("PDF") != -1) {
          var html = att_name + '<br/><a target="_blank" rel="noopener noreferrer"  href="'+ att_url + '">PDFダウンロード</a><br/>';
          $('#pdf_attachmentDiv').html(html); 
          continue;
        } else if (keywords.split('|').indexOf("ManagementSystemUpload") !== -1 && keywords.toUpperCase().indexOf("LAS") != -1) {
          var html = att_name + '<br/><a target="_blank" rel="noopener noreferrer"  href="'+ att_url + '">LASダウンロード</a><br/>';
          $('#las_attachmentDiv').html(html); 
          continue; 
        } else  if (keywords.split('|').indexOf("ManagementSystemUpload") !== -1 && (keywords.indexOf("平面図") != -1 || keywords.indexOf("断面図") != -1)) {
          var html = att_name + '<br/><a target="_blank" rel="noopener noreferrer"  href="'+ att_url + '">DWGダウンロード</a><br/>';
          $('#dwg_attachmentDiv').html(html); 
          continue;
        } else if (contentType.indexOf('video') !== -1) {
          att_html += att_name + '<br/><video class="view_gallery" src="'+ att_url + '" controls width="100px"></video><br/>';
        } else if (contentType.indexOf('image') !== -1) {
          att_html += att_name + '<br/><img decoding="async" class="view_gallery" src="'+ att_url + '" width="100px"></img><br/>';
        } else if (att_name.indexOf('jpg') !== -1 || att_name.indexOf('png') !== -1 ) {
          att_html += att_name + '<br/><img decoding="async" class="view_gallery" src="'+ att_url + '" width="100px"></img><br/>';
        } else {
          att_html += att_name + '<br/><a target="_blank" rel="noopener noreferrer"  href="'+ att_url + '">ダウンロード</a><br/>';
        } 
        
        att_html += '<input class="delbtn" type="button" id="delBtn' + att_id + '" value="削除" onclick="historyTable.deleteattachent(' + objectid + ', ' + att_id + ')"/>';
        att_html += '<br/><br/>'
      }
      
      $('#attachmentlistDiv').html(att_html);
      
    }).fail(function(data) {
      console.log(data);
    });
  }, 

  deleteattachent:function(oid, attachmentid) {
    url = push_feature_url + "/" + layer_id + "/" + oid + "/deleteAttachments";

    var form = new FormData();
    form.set('f','json');
    form.set('attachmentIds', attachmentid);
    form.set('token', token);

    $.ajax({
      url: url,
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: true
    }).done(function(data) {
      historyTable.viewattachment(oid);
      console.log(data);
    }).fail(function(data) {
      console.log(data);
    });
  },

  deleteRow:function(objectid) {

    if (!window.confirm('削除しますか？')){
      return;
    }

    var form = new FormData();
    form.set('f','json');
    form.set('objectIds', objectid);
    form.set('token', token);

    $.ajax({
      url: push_feature_url + '/' + layer_id + '/deleteFeatures',
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: true,
      context: this,
    }).done(function(data) {
      console.log(data);
      this.refreshRow();
      refresh_mapview(historyview);
    }).fail(function(data) {
      console.log(data);
    });
  },

  refreshRow:function() {
    this.getRecordCount();
    this.changePage(this.current_page);
  },

  async getRecordCount() {
    var form = new FormData();
    form.set('f','json');
    
    if (userLicenseType === "Creator") {  //Creatorは他ユーザの投稿も閲覧できる
      form.set('where', "Status<>9");
    } else {
      form.set('where', "Status<>9 And " + creator_field + " = '" + this.userId + "'");
    }
    form.set('returnGeometry', false);
    form.set('returnCountOnly', true);
    form.set('token', token);

    await $.ajax({
      url: push_feature_url + '/' + layer_id + '/query',
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: false,
      context: this,
    }).done(function(data) {
      this.records = data.count;
      this.pages = Math.ceil(data.count / this.records_per_page);
      
      if (this.pages == 0) this.pages = 1;
    }).fail(function(data) {
      console.log(data);
    });
  }
};

function change_display(page) {
  $('body, html').scrollTop(0);
  
  if (page == 1) {  //main
    $('#mainDiv').css('display', 'block');
    $('#formDiv').css('display', 'none');
    $('#completeDiv').css('display', 'none');
    $('#viewformDiv').css('display', 'none');
    $('#helpDiv').css('display', 'none');
    $('#changeDiv').css('display', 'none');
    $('#user_conf').css('display', 'none');
    refresh_mapview(historyview);
  } else if (page == 2) { //form
    $('#mainDiv').css('display', 'none');
    $('#formDiv').css('display', 'block');
    $('#completeDiv').css('display', 'none');
    $('#viewformDiv').css('display', 'none');
    $('#helpDiv').css('display', 'none');
    $('.backbtn').css('display', 'none');
    $('.bottombtn').css('display', 'block');
  } else if (page == 3) { //complete
    $('#mainDiv').css('display', 'none');
    $('#formDiv').css('display', 'none');
    $('#completeDiv').css('display', 'block');
    $('#viewformDiv').css('display', 'none');
    $('#helpDiv').css('display', 'none');
  } else if (page == 4) { //viewform
    change_view_enable(false);
    $('#mainDiv').css('display', 'none');
    $('#formDiv').css('display', 'none');
    $('#completeDiv').css('display', 'none');
    $('#viewformDiv').css('display', 'block');
    $('#helpDiv').css('display', 'none');
    $('.backbtn').css('display', 'none');
    $('.bottombtn').css('display', 'block');
    
    //if ($('#viewstatus').val() != "1" || $('#viewscene_itemid').val() == "") {
    if ($('#viewscene_itemid').val() == "") {
      $('#making_scene').css('display', 'block');
      $('#viewscene').css('display', 'none');
    } else {  //作成済みのみ
      $('#making_scene').css('display', 'none');
      $('#viewscene').css('display', 'block');
      
      change_viewscene_layer($('#viewscene_itemid').val());
    }
  } else if (page == 9) { //help
    $('#mainDiv').css('display', 'none');
    $('#formDiv').css('display', 'none');
    $('#completeDiv').css('display', 'none');
    $('#viewformDiv').css('display', 'none');
    $('#helpDiv').css('display', 'block');
  } else if (page == 5){ // パスワード変更
    $('#mainDiv').css('display', 'none');
    $('#changeDiv').css('display', 'block');
  }else if(page == 6){ // ユーザー設定
    $('#mainDiv').css('display', 'none');
    $('#user_conf').css('display', 'block');
  }
}


function refresh_mapview(mapview) {
  if (mapview == "") return;
  var layers = historyview.layerViews.items;
  
  for (var i=0; i<layers.length; i++) {
    layers[i].refresh();
  }
  
}

function change_viewscene_layer(item_id) {

  if (item_id == "") return;

  scene.removeAll();

  const Layer = require("esri/layers/Layer");
  const PointCloudLayer = require("esri/layers/PointCloudLayer");
  const IntegratedMeshLayer = require("esri/layers/IntegratedMeshLayer");

  Layer.fromPortalItem({
    portalItem: {
      id: item_id
    }
  }).then(function(layer){
    let sceneLayer = null;
    if (layer.type == "point-cloud") {
      sceneLayer = new PointCloudLayer({
        portalItem: {
          id: item_id
        },
        renderer: {
          type: "point-cloud-rgb",
          field: "RGB",
          pointSizeAlgorithm: {
            type: "fixed-size",
            useRealWorldSymbolSizes: false,
            size: 5
          },
          pointsPerInch: 30
        }
      }); 
    } else if (layer.type == "integrated-mesh") {
      sceneLayer = new IntegratedMeshLayer({
        portalItem: {
          id: item_id
        }
      });
    }
    if (sceneLayer != null) {
      scene.add(sceneLayer);
      
      sceneLayer.when(function(){
        if (sceneLayer.fullExtent) {
          sceneview.clippingEnabled = true;
          sceneview.clippingArea = sceneLayer.fullExtent;
          
          var options = {
            speedFactor: 10,
            easing: "out-quint"
          };
          sceneview.goTo(sceneLayer.fullExtent, options);

          homeButton.viewpoint = {
            targetGeometry: sceneLayer.fullExtent
          };
        }

      });
    }
  });
}


//閲覧ページの編集モード切替
function change_view_enable(flg) {
  if (flg) {
    $('#viewtitle').prop('disabled', false);
    $('#viewnaiyo').prop('disabled', false);
    $('#viewjusho').prop('disabled', false);
    $('#viewbikou').prop('disabled', false);
    $('#viewrequestFile-PDF').prop('disabled', false);
    $('#viewrequestFile-LAS').prop('disabled', false);
    //$('#viewrequestFile-OBJ').prop('disabled', false);
    $('#viewrequestFile-DWG-heimen').prop('disabled', false);
    $('#viewrequestFile-DWG-oudan').prop('disabled', false);
    $('#editform_show').css('display', 'none');
    $('#edit_send').css('display', 'block');
    $('#edit_cancel').css('display', 'block');
    
    viewview_click = viewview.on("click", function(event){
      var point = event.mapPoint;
      view_graphic_rendar(point.latitude, point.longitude);
    });
    
  } else {
    $('#viewtitle').prop('disabled', true);
    $('#viewnaiyo').prop('disabled', true);
    $('#viewjusho').prop('disabled', true);
    $('#viewbikou').prop('disabled', true);
    $('#viewrequestFile-PDF').prop('disabled', true);
    $('#viewrequestFile-LAS').prop('disabled', true);
    // $('#viewrequestFile-OBJ').prop('disabled', true);
    $('#viewrequestFile-DWG-heimen').prop('disabled', true);
    $('#viewrequestFile-DWG-oudan').prop('disabled', true);
    $('#editform_show').css('display', 'block');
    $('#edit_send').css('display', 'none');
    $('#edit_cancel').css('display', 'none');
    
    if (viewview_click != null) {
      viewview_click.remove();
    }
  }
  
}

function deleteAllImageRow() {
  var objTBL = document.getElementById("imageGallery_tbl");
  if (!objTBL)
    return;
  var tableRows = objTBL.getElementsByTagName('tr');
  var rowCount = tableRows.length;

  while (objTBL.rows.length > 1) objTBL.deleteRow(-1);

  $('#images_label').html("");
}

function deleteImageRow(obj) {
  if (!obj)
    return;

  var objTR = obj.parentNode.parentNode.parentNode;
  var objTBL = objTR.parentNode.parentNode;

  if (objTBL)
    objTBL.deleteRow(objTR.sectionRowIndex);

  var tagElements = document.getElementsByTagName("span");
  if (!tagElements)
    return false;

  var seq = 1;
  for (var i = 0; i < tagElements.length; i++)
  {
    if (tagElements[i].className.match("seqno"))
      tagElements[i].innerHTML = seq++;
  }

  var tagElements = document.getElementsByTagName("input");
  if (!tagElements)
    return false;

  seq = 1;
  for (var i = 0; i < tagElements.length; i++)
  {
    if (tagElements[i].className.match("delbtn"))
    {
      tagElements[i].setAttribute("id", "delBtn" + seq);
      ++seq;
    }
  }

  $('#images_label').html(objTBL.rows.length-1 + "件の写真が選択されました");
  // テーブルの行が０になった場合地図移動を許可する
  if(objTBL.rows.length-1 == 0){
    isMovedMap = false;
  }
}

function set_config(config) {
  webappId = config.webappId;
  kaisha_url = config.get_kaisha_url;
  layer_id = config.layer_id;
  basemap_id = config.basemap_id;
  basescene_id = config.basescene_id;
  creator_field = config.creator_field;
  create_date_field = config.create_date_field;
  init_latitude = config.init_latitude;
  init_longitude = config.init_longitude;
  init_zoom = config.init_zoom;

  // ユーザー設定をcookieから取得
  var cookie = $.cookie(cookieKey);
  if(cookie){
    user_setting = JSON.parse(cookie);
  }
  else{
    user_setting = config.user_setting;
  }

  //入力禁止文字
  ngCharacters = config.ngCharacters;
}

function getUserLicenseType(user, token) {
  const userLicenseType_url = `https://www.arcgis.com/sharing/rest/community/users/${user}/userLicenseType`;

  var form = new FormData();
  form.set('f', 'json');
  form.set('token', token);

  return $.ajax({
    url: userLicenseType_url,
    type: "POST",
    data: form,
    processData: false,
    contentType: false,
    dataType: 'json',
    context: this,
  });
}

//ブラウザバックの禁止
history.pushState(null, null, location.href);
window.addEventListener('popstate', (e) => {
  history.go(1);
});

// パスワード変更画面リセットメソッド
function clear_pass_form(){
  $("#present-password").val("");
  $("#new-password").val("");
  $("#retype-password").val("");
  $("#warnDiv").html("");
}
