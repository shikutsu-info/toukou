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

// ファイル共有機能
var attachment_view_feature_item_id = ""; // 
var url_push_attachment = "";
var url_attachment_register = "";

//　ユーザー設定
var user_setting = null;
var ngCharacters = [];

// 地図移動を行ったか判定するフラグ
var isMovedMap = false;

var token = "";
var user = "";
var email = "";
var portal = null;
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

var blob_chunk_size = null;

var locateBtn;
var homeButton;
let activeWidget = null;
let allow_users = [];

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

// 文言置き換え用設定
var set_lang = {};

// アップロードファイルサイズ単体上限
var upload_limit_file_size = 0;
// アップロードファイルサイズ合計上限
var upload_limit_total_file_size = 0;

// 入力情報のデフォルト値
var default_value_formDiv = {};

// 要否チェックボックスの表示非表示
var request_filetype_setting = [];
// 要否チェックボックス表示非表示エレメントID
var request_filetype_elemid_list = [
  ["user_conf_request_filetype_01", "form_request_filetype_01", "view_request_filetype_01"],
  ["user_conf_request_filetype_02", "form_request_filetype_02", "view_request_filetype_02"],
  ["user_conf_request_filetype_03", "form_request_filetype_03", "view_request_filetype_03"],
  ["user_conf_request_filetype_04", "form_request_filetype_04", "view_request_filetype_04"],
  ["user_conf_request_filetype_05", "form_request_filetype_05", "view_request_filetype_05"]
];

// アップロードファイル許可拡張子
var upload_extension_white_list = [];
// アップロードファイル禁止拡張子
var upload_extension_black_list = [];
// アップロードファイル許可タイプ
var upload_file_type_white_list = [];

// 一覧並べ替え項目
var list_order_select_item = [];


// セレクトタグの選択項目
var select_option_list = {}

// 特定会社ID時の内容変更
var switch_naiyo_kaisha_id_list = [];

var param = location.search.match(/field:KaishaID=(.*?)(&|$)/);
if (param != null) {
  $('#kaishaid').val(decodeURIComponent(param[1]));
} else {
  $('#kaishaid').val(999999);
}

// langパラメータ値取得  
var lang = (() => {
  var param = location.search.match(/lang=(.*?)(&|$)/);
  if (param != undefined && param.length > 1) {
    return param[1];
  }
  else {
    return "ja";
  }
})();


//configの読み込み
var json_url = "./src/json/Setting.json";

$.ajaxSetup({ async: false });
$.getJSON(json_url, function (config) {
  set_config(config);
  //言語設定　
  func_change_lang(set_lang);

  // 会社情報を会社テーブルから取得
  var kaisha_form = new FormData();
  kaisha_form.set('f', 'json');
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
  }).done(function (data) {
    if (data.features.length > 0) {
      kaisha_name = data.features[0].attributes.KaishaName;
      group_id = data.features[0].attributes.GroupID;
      feature_Itemid = data.features[0].attributes.ViewFeatureItemID;
      attachment_view_feature_item_id = data.features[0].attributes["AttachmentViewFeatureItemID"];
    }
    else {
      alert(func_undefined_to_blank(set_lang["alert-invalidurl"]));
      $('#sign-in').prop("disabled", true);
    }
  }).fail(function (data) {
    // console.log(data);
  });
  $('#KaishaName').html(kaisha_name);
});
// set_config({});// これは必要なのか？
$.ajaxSetup({ async: true });

// ユーザーエージェントの判定を行い、Exif情報の扱いを決定します。
if (navigator.userAgent.match(/iPhone|Android.+Mobile/)) {
  isMobile = true;
  $(".pconly").hide();
}

let wakeLock = null;
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
  "esri/widgets/AreaMeasurement3D",
  "esri/intl"
], function (
  Portal, OAuthInfo, identityManager,
  WebMap, MapView, FeatureLayer,
  Graphic, Locate, Search, Locator,
  WebScene, SceneView, Layer,
  PointCloudLayer, IntegratedMeshLayer,
  Home, Slice, Viewpoint, DirectLineMeasurement3D, AreaMeasurement3D, intl) {

  //ArcGISAPIの言語設定
  intl.setLocale(lang);


  var portalUrl = "https://www.arcgis.com/sharing";
  var geocodeUrl = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

  var info = new OAuthInfo({
    appId: webappId,
    popup: false
  });

  identityManager.registerOAuthInfos([info]);

  $('#sign-in').click(function () {
    identityManager.getCredential(portalUrl);
  });

  // サインアウト
  function sign_out() {
    identityManager.destroyCredentials();
    alert(func_undefined_to_blank(set_lang["alert-signout"]));
    // サインアウト後最初の画面に戻す
    document.location.reload()
  }

  $('#sign-out').click(function () {
    sign_out();
  });

  // サインイン状態かチェック
  identityManager.checkSignInStatus(portalUrl).then(function () {
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
    }).done(function (data) {
      push_feature_url = data.url;
      register_url = push_feature_url + "/uploads/register";

      // ファイル共有機能用URLの取得
      $.ajax({
        url: portalUrl + "/rest/content/items/" + attachment_view_feature_item_id,
        type: "POST",
        data: param,
        processData: false,
        contentType: false,
        dataType: 'json',
        async: false
      }).done((data) => {
        url_push_attachment = data.url;
        url_attachment_register = url_push_attachment + "/uploads/register";
      }).fail(() => {
        alert(func_undefined_to_blank(set_lang["alert-failureurl"]));
      });
    }).fail(function (data) {
      alert(func_undefined_to_blank(set_lang["alert-failureurl"]));
    });
  });

  function displayForm() {
    portal = new Portal();

    portal.load().then(function () {

      //グループに所属しているかのチェック
      portal.user.fetchGroups().then(function (fetchItemResult) {
        const match = fetchItemResult.find((group) => {
          return (group.id === group_id);
        });

        if (match == undefined) {
          identityManager.destroyCredentials();
          alert(func_undefined_to_blank(set_lang["alert-user"]));
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
            //
            display_attachment();
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
      title: func_undefined_to_blank(set_lang["maindiv-map-btn-view"]),
      id: "view-this",
      className: "esri-icon-search"
    };
    var deleteAction = {
      title: func_undefined_to_blank(set_lang["maindiv-map-btn-del"]),
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
              label: func_undefined_to_blank(set_lang["maindiv-map-label-name"])
            }, {
              fieldName: "Jusho",
              label: func_undefined_to_blank(set_lang["maindiv-map-label-adress"])
            }, {
              fieldName: "Bikou",
              label: func_undefined_to_blank(set_lang["maindiv-map-label-remark"])
            }]
          },
        ]
      };
      featureLayer.popupTemplate = popupTemplate;

      const labelClass = {
        labelExpressionInfo: {
          expression: "\"" + func_undefined_to_blank(set_lang["maindiv-map-label-date"]) + "\\n\" + Text($feature." + create_date_field + ", 'Y/MM/DD HH:mm')"
        },
        labelPlacement: "above-center",
        maxScale: 0,
        minScale: 200000,
        symbol: {
          type: "text",
          color: [75, 100, 201, 255],
          font: {
            family: "Playfair Display",
            size: 9.75,
          },
          haloColor: [255, 255, 255, 255],
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
    view.on("click", function (event) {
      var point = event.mapPoint;
      graphic_rendar(point.latitude, point.longitude);
    });

    //住所検索
    searchWidget.on("search-complete", function (event) {
      try {
        var geo = event.results[0].results[0].feature.geometry;
        graphic_rendar(geo.latitude, geo.longitude);
      } catch (e) {

      }
    });

    viewview = new MapView({
      container: "viewmapviewDiv",
      map: map
    });

    view_graphic_rendar = function (lat, long) {
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

          //if (response.attributes.CountryCode == "JPN" && response.address != "日本") { 
          jusho = response.address;
          // } else {
          //  jusho = "";
          //}

          $('#viewjusho').val(jusho);

        })
        .catch(function (error) {
          jusho = "";
          $('#viewjusho').val(jusho);
        });
    }

    //現在地の取得
    view.when(function () {
      if (user_setting.toko == "0") { // ユーザー設定がGPSの時
        if (navigator.geolocation) {
          locateBtn.locate();
        }
      }
    });

    //現在地検索
    locateBtn.on("locate", function (event) {
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

  var graphic_rendar = function (lat, long) {
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

        //if (response.attributes.CountryCode == "JPN" && response.address != "日本") {
        jusho = response.address;
        //} else {
        //jusho = "";
        //}
        $("#gridDiv2_1").text(Math.round(latitude * 100000) / 100000);
        $("#gridDiv2_2").text(Math.round(longitude * 100000) / 100000);
        $("#gridDiv").hide();
        $("#gridDiv2").show();
        $('#jusho').val(jusho);
      }
      )
      .catch(function (error) {
        jusho = "";
        $("#gridDiv2_1").text(Math.round(latitude * 100000) / 100000);
        $("#gridDiv2_2").text(Math.round(longitude * 100000) / 100000);
        $("#gridDiv").hide();
        $("#gridDiv2").show();
        $('#jusho').val(jusho);
      });
  }

  /*********************イベント処理*********************/
  // 新規投稿
  $('#show_form').click(function () {
    form_clear();
    // 初期値設定
    func_default_value_setting(default_value_formDiv, $("#formDiv"));
    each_switch_kaisha_id_setting(switch_naiyo_kaisha_id_list, function (setting) {
      func_default_value_setting(func_undefined_to_blank(setting.default_value[lang]), $("#formDiv"));
    });
    change_display(2);
  });

  //ヘルプ画面
  $('#show_help').click(function () {
    change_display(9);
  });

  // ユーザー設定変更
  $("#change-conf").click(function () {
    setUserConf();
    change_display(6);
  });

  // パスワード変更
  $("#change-password").click(function () {
    clear_pass_form();
    change_display(5);
  });

  //投稿履歴の切り替え
  $('input[name="history"]:radio').change(function () {
    var type = $(this).val();
    if (type == "history-list") {
      $('#historyListDiv').css('display', 'block');
      $('#historyMapDiv').css('display', 'none');
    } else {
      $('#historyListDiv').css('display', 'none');
      $('#historyMapDiv').css('display', 'block');
    }
  });

  //マップの表示・非表示切り替え　
  $('#formDiv .locate_conpact').click(function () {
    $('#mapviewDiv').toggle(function () {
      if ($(this).is(':visible')) {
        $("#formDiv .locate_conpact").text(func_undefined_to_blank(set_lang["formdiv-btn-close"]));
      } else {
        $("#formDiv .locate_conpact").text(func_undefined_to_blank(set_lang["formdiv-btn-open"]));
      }
    });
  });
  $('#viewformDiv .locate_conpact').click(function () {
    $('#viewmapviewDiv').toggle(function () {
      if ($(this).is(':visible')) {
        $("#viewformDiv .locate_conpact").text(func_undefined_to_blank(set_lang["formdiv-btn-close"]));
      } else {
        $("#viewformDiv .locate_conpact").text(func_undefined_to_blank(set_lang["formdiv-btn-open"]));
      }
    });
  });

  //送信ボタンクリック
  $('#sendbtn').click(function () {
    var kaishaid = $('#kaishaid').val();

    if (kaishaid == "") {
      alert(func_undefined_to_blank(set_lang["alert-companyid"]));
      return;
    }

    var title = $('#title').val();

    if (title == "") {
      alert(func_undefined_to_blank(set_lang["alert-title"]));
      $('#title').focus();
      return;
    }

    //入力項目の禁止文字チェック
    var ngCharaFlg = check_ngCharacters(0);
    if (ngCharaFlg) {
      alert(func_undefined_to_blank(set_lang["alert-ngchara"]));
      return;
    }

    var attachment = $('input[name="attachment"]:checked').val();

    var size = 0; // 合計サイズ
    // その他ファイルサイズチェック
    $("#file_table").find(".row").each(function (idx, tr) {
      var $elem = $(tr).find("input.id");
      if ($elem.length > 0 && $elem.val().length > 0) {
        size += parseInt($(tr).find("input.size").val());
      }
    });

    // サイズチェック
    if (size > upload_limit_total_file_size) {
      alert(func_undefined_to_blank(set_lang["alert-size1"]) + func_file_size(upload_limit_total_file_size) + func_undefined_to_blank(set_lang["alert-size2"]));
      return;
    }

    //現在地の指定チェック
    if (latitude == null || longitude == null) {
      alert(func_undefined_to_blank(set_lang["alert-location"]));
      return;
    }

    //取得ファイル形式チェック
    var checked = false;
    $("#formDiv .request-filetype input[type='checkbox']").each(function (idx, elem) {
      if (elem.checked) {
        checked = true;
        return false; // eachを抜ける
      }
    });
    if (!checked) {
      alert(func_undefined_to_blank(set_lang["alert-deliverables"]));
      return;
    }

    $('#sendbtn').html(func_undefined_to_blank(set_lang["formdiv-btn-sending"]));

    add_feature(latitude, longitude, attachment);

  });

  //クリアボタンクリック
  $('#clearbtn').click(function () {
    form_clear();
    func_default_value_setting(default_value_formDiv, $("#formDiv"));
  });

  //メイン画面に戻るボタンクリック
  $('.returnmenu').click(function () {
    historyTable.refreshRow();
    setActiveWidget(null);
    isMovedMap = false;
    change_display(1);
  });

  // ヒストリーテーブルボタンクリックイベント
  $("#btn_first").click(function () {
    historyTable.firstPage();
  });

  // ヒストリーテーブルボタンクリックイベント
  $("#btn_prev").click(function () {
    historyTable.prevPage();
  });

  // ヒストリーテーブルボタンクリックイベント
  $("#btn_next").click(function () {
    historyTable.nextPage();
  });

  // ヒストリーテーブルボタンクリックイベント
  $("#btn_last").click(function () {
    historyTable.lastPage();
  });

  //フォームに戻る
  $('#input_form').click(function () {
    form_clear();
    change_display(2);
    $('#completeDiv').css('display', 'none');
  });

  //登録情報の編集画面を表示
  $('#editform_show').click(function () {
    change_view_enable(true);
  });

  //編集のキャンセル
  $('#edit_cancel').click(function () {
    change_view_enable(false);
  });

  //登録情報の編集確定
  $('#edit_send').click(function () {
    var title = $('#viewtitle').val();
    if (title == "") {
      alert(func_undefined_to_blank(set_lang["alert-title"]));
      $('#viewtitle').focus();
      return;
    }

    //入力項目の禁止文字チェック
    var ngCharaFlg = check_ngCharacters(1);
    if (ngCharaFlg) {
      alert(func_undefined_to_blank(set_lang["alert-ngchara"]));
      return;
    }

    //取得ファイル形式チェック
    var checked = false;
    $("#viewformDiv .request-filetype input[type='checkbox']").each(function (idx, elem) {
      if (elem.checked) {
        checked = true;
        return false; // eachを抜ける
      }
    });
    if (!checked) {
      alert(func_undefined_to_blank(set_lang["alert-deliverables"]));
      return;
    }

    edit_feature(latitude, longitude);
  });

  //距離計測ボタン
  $('#distanceButton').click(function (event) {
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
  $('#areaButton').click(function (event) {
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
  $('#clearButton').click(function (event) {
    setActiveWidget(null);
    const elements = $('.active');
    for (let i = 0; i < elements.length; i++) {
      elements[i].classList.remove("active");
    }
  });


  //添付ファイルの追加
  $('#addattachment').click(function () {
    requestWakeLock();
    $('#addattachment-select').click();
  });

  // 添付ファイルの追加
  $('#addattachment-select').change(function () {
    append_attachment_file($('#viewobjectid').val(), this.files);
  });

  // ページスクロールボタンイベント
  $('#backbtn-form').click(function () {
    $('body, html').animate({ scrollTop: 0 }, 300, 'linear');
  });

  // ページスクロールボタンイベント
  $('#backbtn-view').click(function () {
    $('body, html').animate({ scrollTop: 0 }, 300, 'linear');
  });

  // ページスクロールボタンイベント
  $('#bottombtn-form').click(function () {
    $('body, html').animate({ scrollTop: $('#buttonDiv').offset().top }, 300, 'linear');
  });

  // ページスクロールボタンイベント
  $('#bottombtn-view').click(function () {
    $('body, html').animate({ scrollTop: $('#viewfooterbuttonDiv').offset().top }, 300, 'linear');
  });

  // ユーザー設定保存
  $('#conf-save').click(function () {
    saveUserConf();
  });

  // パスワード変更
  $('#new-password-regist').click(function () {
    changePasswordAction();
  });

  // スクロールイベント
  $(window).bind('scroll', function () {
    const bodyHeight = document.body.clientHeight // bodyの高さを取得
    const windowHeight = window.innerHeight // windowの高さを取得
    const bottomPoint = bodyHeight - windowHeight // ページ最下部までスクロールしたかを判定するための位置を計算
    const currentPos = window.pageYOffset // スクロール量を取得

    // スクロール量が最下部の位置を過ぎたかどうか
    if (bottomPoint <= currentPos) {
      $('.bottombtn').css('display', 'none');
    }
    else {
      $('.bottombtn').css('display', 'block');
    }

    // スクロール量が最上部にきたかどうか
    if ($(this).scrollTop() == 0) {
      $('.backbtn').css('display', 'none');
    }
    else {
      $('.backbtn').css('display', 'block');
    }

  });

  /*********************ロジック処理*********************/

  //入力項目に禁止文字が含まれるかのチェック
  function check_ngCharacters(mode) {
    var ngCharaFlg = false;

    var title = $('#title');
    //var naiyo = $('#naiyo');
    //var jusho = $('#jusho');
    //var kaninfo = $('#kaninfo');
    //var bikou = $('#bikou');
    //var zahyojoho = $("#zahyojoho");

    if (mode === 1) {
      title = $('#viewtitle');
      //naiyo = $('#viewnaiyo');
      //jusho = $('#viewjusho');
      //kaninfo = $('#viewkaninfo');
      //bikou = $('#viewbikou');
      //zahyojoho = $("#viewzahyojoho");
    }
    for (var chara of ngCharacters) {
      if (title.val().indexOf(chara) != -1) {
        ngCharaFlg = true;
        title.focus();
      }
      /*
      if (naiyo.val().indexOf(chara) != -1) {
        ngCharaFlg = true;
        naiyo.focus();
      }
      if (jusho.val().indexOf(chara) != -1) {
        ngCharaFlg = true;
        jusho.focus();
      }
      if (kaninfo.val().indexOf(chara) != -1) {
        ngCharaFlg = true;
        kaninfo.focus();
      }
      if (bikou.val().indexOf(chara) != -1) {
        ngCharaFlg = true;
        bikou.focus();
      }
      if (zahyojoho.val().indexOf(chara) != -1) {
        ngCharaFlg = true;
        zahyojoho.focus();
      }
      */
    }
    return ngCharaFlg;
  }

  // その他選択
  $("#filebtn").click(function () {
    requestWakeLock();
    $("#file_select").click();
  });
  // その他選択イベント
  $("#file_select").change(function () {
    // ファイル選択
    upload_files(this.files, "#file_table", "#file_select", "#file_label", func_undefined_to_blank(set_lang["formdiv-func-argument"]), {
      // Exif情報処理
      hasExif: function (exifs) {
        if (user_setting.toko == "1" && !isMobile && exifs.length > 0) { // ユーザー設定がExifの時かつPC端末の場合
          if (confirm(func_undefined_to_blank(set_lang["formdiv-confmsg-location"])) != false) {
            // 地図を画像の位置に移動
            view.goTo({
              center: [exifs[0].lng, exifs[0].lat],
              zoom: 17
            });
            graphic_rendar(exifs[0].lat, exifs[0].lng);
            isMovedMap = true;
          }
        }
      }
    });
  });
  // その他全削除ボタン
  $("#file_del_all_btn").click(function () {
    delete_all_file_row();
  });

  /**
   * ファイル全削除
   */
  function delete_all_file_row() {
    $("#file_table").children("div").each(function (idx, elem) {
      if (idx != 0) $(elem).remove();
    });
    $("#file_label").html("");
  }
  /**
   * ワイルドカード文字列による文字列のチェック
   * @param {String} string 
   * @param {String|String[]} wildcard 
   * @returns {Boolean} (一致:true, 不一致:false)
   */
  function func_check_wildcard(string, wildcard) {
    function _func_check_wildcard(_string, _wildcard) {
      var wc = "";
      for (var i = 0; i < _wildcard.length; i++) {
        var w = _wildcard.substring(i, i + 1);
        if (w == "?") {
          w = ".";
        }
        else if (w == "*") {
          w = ".*";
        }
        else {
          w = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& は一致した部分文字列全体を意味します
        }
        wc += w;
      }
      // 完全一致で指定
      wc = "^" + wc + "$";
      return new RegExp(wc, "i").test(_string);
    }
    var target = wildcard;
    // 配列でなければ配列にする
    if (!$.isArray(target)) target = [target];
    // 配列を回して一致すればリターン
    for (var i = 0; i < target.length; i++) {
      if (_func_check_wildcard(string, target[i])) return true;
    }
    return false;
  }
  /**
   * 非同期処理待ちタイマー
   * @param {float} second 
   * @returns 
   */
  function sleep(second) {
    return new $.Deferred(function (defer) {
      setTimeout(function () {
        defer.resolve();
      }, second * 1000)
    });
  }

  /**
   * ファイルサイズ計算(単位算出)
   * @param {int} a 数値(バイト)
   * @param {bool} b true:1000,false:1024
   * @param {int} c 少数点以下桁数
   * @returns {string} 単位付きファイルサイズ
   */
  function func_file_size(a, b, c) {
    let thisSize, fileUnit, thisUnit;

    //数値に変換
    thisSize = Number(a);
    //数値に変換できなかった場合
    if (isNaN(thisSize)) return 'Error : Not a Number.';
    //小数点を含めている場合
    if (String(thisSize).split('.').length > 1) return 'Error : Unaccetable Number.';

    //基準のバイト数と単位の配列を設定
    if (b) {
      b = 1000;
      fileUnit = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    } else {
      b = 1024;
      //fileUnit = ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
      fileUnit = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    }

    //有効小数点 デフォルト小数第2位まで(小数第3位で四捨五入)
    if (c !== 0) { c = c ? c : 2; }

    if (thisSize >= b) {
      for (let i = 0, j = 0, sizeTemp = (thisSize / b); sizeTemp >= 1 && j < fileUnit.length; i++, j++, sizeTemp /= b) {
        thisUnit = i;
        thisSize = sizeTemp;
      }
      thisSize = (Math.round(thisSize * (10 ** c)) / (10 ** c)) + ' ' + fileUnit[thisUnit];//+' ('+a+' bytes)';
    } else {
      if (a === 1) thisUnit = 'byte';
      else thisUnit = 'bytes';
      thisSize = a + ' ' + thisUnit;
    }

    //変換した表記の文字列を返す
    return thisSize;
  }
  /**
   * ファイルアップロード処理
   * @param {FileObject[]} files 
   * @param {String} selector_table
   * @param {String} selector_select
   * @param {String} selector_label
   * @param {String} caption
   * @param {Object} callbacks
   */
  async function upload_files(files, selector_table, selector_select, selector_label, caption, callbacks) {
    callbacks = callbacks || {};
    // 非同期待ちフラグ
    var waiting = { status: false };
    // カウント表示クリア
    if (selector_label.length > 0) $(selector_label).text("");
    if (callbacks.begin != undefined) {
      callbacks.begin();
    }
    else {
      // ボタン等選択不可に
      form_disabled(true);
    }

    // Exif情報の取得
    var exifs = new Array();
    for (var idx = 0; idx < files.length; idx++) {
      waiting.status = true;
      (function (files, i) {
        return new $.Deferred(function (defer) {
          // console.log("files[" + i + "]");
          // キャンセルフラグ
          var cancel = false;
          var file = files[i];
          // 1行追加 各項目作成
          var $elem = $(selector_table);
          var rowNo = $elem.children("div.row").length;
          var $tr = null;
          if (callbacks.upload_file_check_start != undefined) {
            callbacks.upload_file_check_start(i, file);
          }
          else {
            if (callbacks.create_row != undefined) {
              $tr = callbacks.create_row($elem[0]);
            }
            else {
              $tr = $("<div class='row flex-box'></div>").appendTo($elem);
              $tr.html("<div class='no'></div>" +
                "<div class='flex-box attrib'>" +
                "<div class='name'></div>" +
                "<div class='size'></div>" +
                "<div class='status'></div>" +
                "</div>" +
                "<div class='delete'><input type='button' value='" + func_undefined_to_blank(set_lang["formdiv-btn-del"]) + "' class='btn-del' /><input type='hidden' class='id' /><input type='hidden' class='size' /><input type='hidden' class='name' /></div>");
            }
            $tr.find("div.no").text(rowNo);
            $tr.find("div.name").text(file.name);
            $tr.find("div.size").text(func_file_size(file.size));
            $tr.find("div.status").text(func_undefined_to_blank(set_lang["formdiv-tbl-stat-load"]));
            // 削除ボタンクリック
            $tr.find(".btn-del").click(function () {
              // console.log("files[" + i + "].btn-del.click()");
              $tr.remove();
              var select_count = 0;
              $elem.children("div").each(function (idx, tr) {
                if (idx != 0) $(tr).find("div.no").text((idx).toString());
                if ($(tr).find("input.id").length > 0 && $(tr).find("input.id").val().length > 0) select_count++;
              });
              // カウント表示の更新
              if (select_count > 0) {
                if (selector_label.length > 0) $(selector_label).text(select_count + func_undefined_to_blank(set_lang["formdiv-tbl-msg-filenum2"]));
              }
              else {
                if (selector_label.length > 0) $(selector_label).text("");
              }
              if (callbacks.delete_button_click != undefined) {
                callbacks.delete_button_click();
              }
              cancel = true;
            });
          }
          // ファイルチェック
          if (upload_file_type_white_list.length > 0 && !func_check_wildcard(file.type, upload_file_type_white_list) &&
            (upload_extension_white_list.length == 0 || (upload_extension_white_list.length > 0 && !func_check_wildcard(file.name, upload_extension_white_list)))) {

            if (callbacks.upload_file_check_ng != undefined) {
              callbacks.upload_file_check_ng(i, file, func_undefined_to_blank(set_lang["formdiv-tbl-stat-type"]));
            }
            else {
              $tr.find(".status").html("<span style='color:red;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-type"]) + "</span>");
            }
            cancel = true;
          }
          if (upload_extension_white_list.length > 0 && !func_check_wildcard(file.name, upload_extension_white_list) &&
            (upload_file_type_white_list.length == 0 || (upload_file_type_white_list.length > 0 && !func_check_wildcard(file.type, upload_file_type_white_list)))) {

            if (callbacks.upload_file_check_ng != undefined) {
              callbacks.upload_file_check_ng(i, file, func_undefined_to_blank(set_lang["formdiv-tbl-stat-extension"]));
            }
            else {
              $tr.find(".status").html("<span style='color:red;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-extension"] + "</span>"));
            }
            cancel = true;
          }
          if (!cancel && upload_extension_black_list.length > 0 && func_check_wildcard(file.name, upload_extension_black_list)) {
            if (callbacks.upload_file_check_ng != undefined) {
              callbacks.upload_file_check_ng(i, file, func_undefined_to_blank(set_lang["formdiv-tbl-stat-extension"]));
            }
            else {
              $tr.find(".status").html("<span style='color:red;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-extension"]) + "</span>");
            }
            cancel = true;
          }
          // ファイルサイズチェック
          if (file.size == 0) {
            if (callbacks.upload_file_check_ng != undefined) {
              callbacks.upload_file_check_ng(i, file, func_undefined_to_blank(set_lang["formdiv-tbl-stat-empty"]));
            }
            else {
              $tr.find(".status").html("<span style='color:red;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-empty"]) + "</span>");
            }
            cancel = true;
          }
          if (file.size > upload_limit_file_size) {
            if (callbacks.upload_file_check_ng != undefined) {
              callbacks.upload_file_check_ng(i, file, func_undefined_to_blank(set_lang["formdiv-tbl-stat-oversize"]));
            }
            else {
              $tr.find(".status").html("<span style='color:red;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-oversize"]) + "</span>");
            }
            cancel = true;
          }
          if (!cancel) {
            if (callbacks.upload_ready != undefined) {
              callbacks.upload_ready(i, file);
            }
            else {
              $tr.find(".status").html("<span style='color:black;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-prepar"]) + "</span>");
            }
            // ファイル読み込み開始
            read_file(file).then(function (args) {
              // ファイル読み込み完了
              // console.log("files[" + i + "](read_file.then())");
              // 読み込みBlobデータ保持
              var blob = args.event.target.result;
              if (callbacks.upload_file_readed != undefined) {
                callbacks.upload_file_readed(i, file);
              }
              else {
                $tr.find(".status").html("<span style='color:blue;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-regist"]) + "</span>");
              }
              // アップロードファイル登録用Ajaxパラメータ作成
              var url = register_url;
              if (callbacks.get_url_register != undefined) {
                url = callbacks.get_url_register();
              }
              let fileName = file.name;
              let pos = fileName.lastIndexOf(".");
              // 拡張子前の「.」を「_」へ置換
              if (pos > -1) {
                fileName = fileName.substring(0, pos - 1).split(".").join("_") + fileName.substring(pos);
              }
              var form = new FormData();
              form.set("f", "json");
              form.set("itemName", fileName);
              form.set("token", token);
              var param = {
                "url": url,
                "type": "POST",
                "processData": false,
                "contentType": false,
                "dataType": "json",
                "data": form,
                "async": true
              }
              // アップロードファイル登録AjaxRequest実行
              request_ajax(param).then(function (args) {
                var registed_data = args;
                // レスポンス処理
                if (!cancel && registed_data != undefined && (registed_data.success || false)) {
                  // console.log("files[" + i + "](regist_upload_file.then())");
                  if (callbacks.upload_file_registed != undefined) {
                    callbacks.upload_file_registed(i, file);
                  }
                  else {
                    $tr.find(".status").html("<span style='color:blue;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-registcomp"]) + "</span>");
                    $tr.find(".status").html("<span style='color:green;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-upload"]) + "(0%)" + "</span><meter min='0' max='100' value='0'></meter>");
                  }
                  // Blobデータを指定サイズで分割
                  // 分割アップロード開始
                  upload_split_blob(blob, blob_chunk_size, {
                    // 分割要素ごとのAjaxパラメータの作成
                    get_request_param: function (args) {
                      var part_url = push_feature_url;
                      if (callbacks.get_url_push != undefined) {
                        part_url = callbacks.get_url_push();
                      }
                      part_url += "/uploads/" + registed_data.item.itemID + "/uploadPart";
                      var url = part_url;
                      var form = new FormData();
                      form.set("f", "json");
                      form.set("partId", args.index);
                      form.set("file", new File([args.blob], fileName, { type: file.type }));
                      form.set("token", token);
                      var param = {
                        "url": url,
                        "enctype": "multipart/formdata",
                        "type": "POST",
                        "processData": false,
                        "contentType": false,
                        "data": form,
                        "async": true
                      };
                      return param;
                    },
                    // アップロード状況の通知
                    uploading: function (args) {
                      // 処理中に削除ボタンが押されていたら処理をキャンセルする
                      args.cancel = cancel;
                      if (!args.cancel && args.data != undefined && (args.data.success || false)) {
                        // アップロード状況を更新
                        if (callbacks.uploading != undefined) {
                          callbacks.uploading(i, file, Math.ceil(((args.index + 1) / args.division_count) * 100));
                        }
                        else {
                          $tr.find(".status").html("<span style='color:green;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-upload"]) + "(" + Math.ceil(((args.index + 1) / args.division_count) * 100) + "%)</span><meter min='0' max='100' value='" + Math.ceil(((args.index + 1) / args.division_count) * 100) + "'></meter>");
                        }
                      }
                      else {
                        args.cancel = true;
                      }
                    }
                  }).then(function (args) {
                    // 分割アップロード完了
                    if (callbacks.upload_commit_start != undefined) {
                      callbacks.upload_commit_start(i, file);
                    }
                    else {
                      $tr.find(".status").html("<span style='color:blue;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-apply"]) + "</span>");
                    }
                    var url = push_feature_url;
                    if (callbacks.get_url_push != undefined) {
                      url = callbacks.get_url_push();
                    }
                    url += "/uploads/" + registed_data.item.itemID + "/commit";
                    var form = new FormData();
                    form.set("f", "json");
                    form.set("token", token);
                    var param = {
                      "url": url,
                      "type": "POST",
                      "processData": false,
                      "contentType": false,
                      "dataType": "json",
                      "data": form,
                      "async": true
                    }
                    // アップロードファイル適用AjaxRequest実行
                    request_ajax(param).then(function (args) {
                      // レスポンス処理
                      if (!cancel && args != undefined && (args.success || false)) {

                        // console.log("files[" + i + "](commit_upload_file.then())");
                        if (callbacks.upload_commit_applied) {
                          callbacks.upload_commit_applied(i, file, registed_data);
                        }
                        else {
                          $tr.find(".status").html("<span style='font-weight:bold;color:blue;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-add"]) + "</span>");
                          $tr.find("input.id").val(registed_data.item.itemID);
                          $tr.find("input.name").val(file.name);
                          $tr.find("input.size").val(file.size);
                        }
                        if (callbacks.hasExif != undefined) {
                          $.fileExif(file, function (exif) {
                            if (!cancel) {
                              if (typeof (exif) != "undefined" && exif != false) {
                                var obj = {
                                  lat: exif.GPSLatitude[0] + (exif.GPSLatitude[1] / 60) + (exif.GPSLatitude[2] / 3600),
                                  lng: exif.GPSLongitude[0] + (exif.GPSLongitude[1] / 60) + (exif.GPSLongitude[2] / 3600)
                                }
                                if (isNaN(obj.lat) == false && isNaN(obj.lng) == false) {
                                  exifs.push(obj);
                                }
                              }
                              defer.resolve();
                            }
                            else {
                              defer.reject();
                            }
                          });
                        }
                        else {
                          // 正常
                          defer.resolve();
                        }
                      }
                      else {
                        // キャンセル/エラー時
                        if (callbacks.upload_commit_failed != undefined) {
                          callbacks.upload_commit_failed(i, file, func_undefined_to_blank(set_lang["formdiv-tbl-stat-applyfail"]));
                        }
                        else {
                          $tr.find(".status").html("<span style='color:red;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-applyfail"]) + "</span>");
                        }
                        defer.reject();
                      }
                    }).fail(function () {
                      // アップロードファイル適用AjaxRequestエラー時
                      if (callbacks.upload_commit_failed != undefined) {
                        callbacks.upload_commit_failed(i, file, func_undefined_to_blank(set_lang["formdiv-tbl-stat-applyfail"]));
                      }
                      else {
                        $tr.find(".status").html("<span style='color:red;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-applyfail"]) + "</span>");
                      }
                      defer.reject();
                    });
                  }).fail(function () {
                    // 分割アップロードAjaxRequestエラー時
                    if (callbacks.upload_failed != undefined) {
                      callbacks.upload_failed(i, file, func_undefined_to_blank(set_lang["formdiv-tbl-stat-uploadfail"]));
                    }
                    else {
                      $tr.find(".status").html("<span style='color:red;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-uploadfail"]) + "</span>");
                    }
                    defer.reject();
                  });
                }
                else {
                  // キャンセル/失敗時
                  if (callbacks.upload_file_regist_failed != undefined) {
                    callbacks.upload_file_regist_failed(i, file, func_undefined_to_blank(set_lang["formdiv-tbl-stat-registfail"]));
                  }
                  else {
                    $tr.find(".status").html("<span style='color:red;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-registfail"]) + "</span>");
                  }
                  defer.reject();
                }
              }).fail(function () {
                // アップロードファイル登録AjaxRequestエラー時
                if (callbacks.upload_file_regist_failed != undefined) {
                  callbacks.upload_file_regist_failed(i, file, func_undefined_to_blank(set_lang["formdiv-tbl-stat-registfail"]));
                }
                else {
                  $tr.find(".status").html("<span style='color:red;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-registfail"]) + "</span>");
                }
                defer.reject();
              });
            }).fail(function () {
              // ファイル読み込みエラー時
              if (callbacks.upload_file_read_error) {
                callbacks.upload_file_read_error(i, file, func_undefined_to_blank(set_lang["formdiv-tbl-stat-loadfail"]));
              }
              else {
                $tr.find(".status").html("<span style='color:red;'>" + func_undefined_to_blank(set_lang["formdiv-tbl-stat-loadfail"]) + "</span>");
              }
              defer.reject();
            });
          }
          else {
            // ファイルチェックNG時
            defer.reject();
          }
        });
      })(files, idx).then(function () {
        // 処理正常終了
        waiting.status = false;
        // console.log("files[" + idx + "](.then())");
      }).fail(function () {
        // 処理失敗終了
        waiting.status = false;
        // console.log("files[" + idx + "](.fail())");
      });
      // 非同期処理待ち
      while (waiting.status) await sleep(0.5);
    }
    var select_count = 0;
    $(selector_table).children("div").each(function (idx, elem) {
      if ($(elem).find("input.id").length > 0 && $(elem).find("input.id").val().length > 0) select_count++;
    });

    if (select_count > 0) {
      if (selector_label.length > 0) {
        //$(selector_label).text(eval(func_undefined_to_blank(set_lang["formdiv-tbl-msg-filenum1"])))
        $(selector_label).text($.format(func_undefined_to_blank(set_lang["formdiv-tbl-msg-filenum1"]), select_count, caption));
      }

    }
    else {
      if (selector_label.length > 0) $(selector_label).text("");
    }
    if (callbacks.complete != undefined) {
      callbacks.complete();
    }
    else {
      // ボタン等選択可に
      form_disabled(false);
    }
    // input[type='file']の値をクリア
    $(selector_select).val("");

    // Exif情報が存在した場合
    if (callbacks.hasExif != undefined && exifs.length > 0) {
      callbacks.hasExif(exifs);
    }

    //Screen Wake Lock APIの無効化
    releaseWakeLock();
  }
  /**
   * ファイルの読み込み
   * @param {FileObject} file 
   * @returns {Promise} 
   */
  function read_file(file) {
    return new $.Deferred(function (defer) {
      // FileReader作成
      var reader = new FileReader();
      // 読み込み完了イベント
      reader.onloadend = function (e) {
        // 読み込み状態確認
        if (e.target.readyState == 2) {
          // 完了時
          defer.resolve({ file: file, event: e });
        }
        else {
          // 未完了時
          defer.reject({ file: file, event: e });
        }
      }
      // 読み込み失敗イベント
      reader.onerror = function (e) {
        defer.reject({ file: file, event: e });
      }
      // ファイル読み込み
      reader.readAsArrayBuffer(file);
    });
  }
  /**
   * Blobデータの分割アップロード
   * @param {Blob} blob 
   * @param {int} chunk_size 
   * @returns {Promise}
   */
  function upload_split_blob(blob, chunk_size, callbacks) {
    return new $.Deferred(function (defer) {
      // Blob分割数算出
      var division_count = Math.ceil(blob.byteLength / chunk_size);
      callbacks = callbacks || {};
      // 内部呼び出しファンクション
      function upload_blob(index, offset) {
        let _blob = blob.slice(offset, offset + chunk_size);
        offset += chunk_size;
        // リクエストパラメータ生成コールバックをたたく
        var param = (callbacks.get_request_param || function () { })({ blob: _blob, index: index, division_count: division_count });
        param = param || {};
        // AjaxRequest
        $.ajax(param).done(function (data) {
          // レスポンス処理
          var args = { cancel: false, blob: _blob, index: index, division_count: division_count, data: data };
          // ローディング中コールバックをたたく
          (callbacks.uploading || function () { })(args);
          // キャンセル判定
          if (!args.cancel) {
            if (index < (division_count - 1)) {
              // 配列途中の場合
              upload_blob(index + 1, offset);
            }
            else {
              // 配列最終の場合
              defer.resolve(args);
            }
          }
          else {
            // キャンセル時
            defer.reject({ status: "cancel", blob: _blob, index: index, division_count: division_count, data: data });
          }
        }).fail(function (e) {
          // リクエストエラー時
          defer.reject({ status: "error", event: e });
        });
      }
      // 配列先頭から
      upload_blob(0, 0);
    });
  }
  /**
   * AjaxRequest
   * @param {Object} param
   * @returns {Promise}
   */
  function request_ajax(param) {
    var defer = new $.Deferred();
    // AjaxRequest
    $.ajax(param).done(function (data) {
      // レスポンス処理
      defer.resolve(data);
    }).fail(function (data) {
      // エラー時
      defer.reject(data);
    });
    return defer.promise();
  }

  /**
   * 登録処理
   * @param {Double} lat 
   * @param {Double} long 
   * @param {Int} flg 
   */
  function add_feature(lat, long, flg) {
    form_disabled(true);

    var kbn = 0;
    if (flg == "movie") {
      kbn = 1;
    }

    url = push_feature_url + "/" + layer_id + "/addFeatures";

    var attributes = {
      "KaishaID": $('#kaishaid').val(),
      "Kbn": kbn,
      "Title": $('#title').val(),
      "Naiyo": $('#naiyo').val(),
      "Jusho": $('#jusho').val(),
      "kaninfo": $('#kaninfo').val(),
      "Bikou": $('#bikou').val(),
      // "GenbaKubun": $("#genbakubun").val(),
      "GenbaKubun": $("#genbakubun input[type='radio']:checked").val(),
      "ZahyoJoho": $("#zahyojoho").val(),
      "ZahyoFuyo": $("#zahyofuyo input[type='radio']:checked").val(),
      "Email": email,
      "Status": 0,
      "Update_status": 0,  // 0:新規投稿
      "Update_status_Update": Date.now() // 更新ステータス変更日時
    };
    // 要否ファイルチェックボックスのチェック状態からパラメータ作成
    var index = -1;
    $.each(request_filetype_setting, function (idx, item) {
      if (item.visible) {
        index++;
        attributes[item.field_name] = Number($("#formDiv .request-filetype input[type='checkbox']").eq(index).prop("checked"));
      }
    });

    var feature = {
      "geometry": {
        "x": long,
        "y": lat,
        "spatialReference": { "wkid": 4326 }
      },
      "attributes": attributes
    };

    var form = new FormData();
    form.set('f', 'json');
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
    }).done(function (data) {
      // console.log(data);
      append_attachments(data.addResults[0].objectId, flg);
    }).fail(function (data) {
      // console.log(data);
    });
  }

  /**
   * アタッチメントの登録
   * @param {int} oid 
   * @param {String} flg image|movie
   */
  function append_attachments(oid, flg) {

    var uploads = [];

    // その他ファイル
    $("#file_table").children(".row").each(function (idx, row) {
      var $row = $(row);
      if ($row.find("input.id").length > 0 && $row.find("input.id").val().length > 0) {
        uploads.push({
          id: $row.find("input.id").val(),
          status: 0
        });
      }
    });

    if (uploads.length > 0) {
      // 投稿ファイル登録
      append_attachents(oid, uploads)
    }
    else {
      //投稿後画面切り替え
      form_disabled(false);
      change_display(3);
      $("html,body").animate({ scrollTop: 0 }, "300");
    }
  }

  /**
   * アタッチメントの登録
   * @param {int} oid 
   * @param {Object[]} uploads 
   */
  function append_attachents(oid, uploads) {

    var url = push_feature_url + "/" + layer_id + "/" + oid + "/addAttachment";
    var attachment = $('input[name="attachment"]:checked').val();

    append_image_attachents = (uploads, callback) => {
      let count = 0;
      let done = 0;

      let append_image_attachent = async (count) => {
        let upload = uploads[count];

        var form = new FormData();
        form.set('f', 'json');
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
        }).done(function (data) {
          // console.log(data);

          uploads[count].status = 1;

          var cnt = 0;
          for (i = 0; i < uploads.length; i++) {
            cnt = cnt + uploads[i].status;
          }

          if (cnt == uploads.length) {
            callback();
          }
        }).fail(function (data) {
          // console.log(data);
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
      $("html,body").animate({ scrollTop: 0 }, "300");

    }

    append_image_attachents(uploads, () => send_finally());
  }

  /**
   * ファイルアップロード
   * @param {int} oid 
   * @param {FileObject[]} files
   * @returns 
   */
  function append_attachment_file(oid, files) {
    var $elem = $("#attachmentlistDiv");
    $elem.find(".row").each(function (idx, row) {
      $(row).remove();
    });
    upload_files(files, "#attachmentlistDiv", "#addattachment-select", "", func_undefined_to_blank(set_lang["viewformdiv-func-argument"]), {
      begin: function () {

      },
      create_row: function (elem) {
        var $tr = $("<div class='row flex-box'></div>").html("<div class='name'></div><div class='status'></div><input type='hidden' class='id' />").appendTo($(elem));
        return $tr;
      },
      complete: function () {
        var ids = new Array();
        $("#attachmentlistDiv").find(".row").each(function (idx, row) {
          var $row = $(row);
          if ($row.find("input.id").length > 0 && $row.find("input.id").val().length > 0) {
            ids.push($row.find("input.id").val());
          }
        });
        if (ids.length > 0) {
          var url = push_feature_url + "/" + layer_id + "/" + oid + "/addAttachment";
          var form = new FormData();
          form.set("f", "json");
          form.set("uploadId", ids[0]);
          form.set("keywords", "");
          form.set("token", token);
          var param = {
            "url": url,
            "type": "POST",
            "data": form,
            "processData": false,
            "contentType": false,
            "dataType": "json",
            "async": true
          }
          request_ajax(param).then(function (data) {
            if (data != undefined && data.addAttachmentResult != undefined && data.addAttachmentResult.success || false) {
              // 更新ステータス更新
              var formData = new FormData();
              formData.set('f', 'json');
              formData.set('features', JSON.stringify(
                [
                  {
                    "attributes": {
                      "OBJECTID": oid, 
                      "Update_status": 2,  // 2:添付追加
                      "Update_status_Update": Date.now() // 更新ステータス変更日時
                    }
                  }
                ]
              ));
              formData.set('token', token);
              request_ajax({
                "url": push_feature_url + "/" + layer_id + "/updateFeatures",
                "type": "POST",
                "data": formData,
                "processData": false,
                "contentType": false,
                "dataType": "json",
                "async": true
              }).then(function() {
                historyTable.viewattachment(oid);
              });
            }
            else {

            }
          }).fail(function (data) {

          });
        }
      }
    });
  }

  /**
   * 投稿フォームクリア
   */
  function form_clear() {
    form_disabled(false);

    if (navigator.geolocation) {
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
    $('#kaninfo').val("");
    // $("#genbakubun").val("");
    $("#genbakubun input[type='radio']:eq(0)").prop("checked", true);
    $("#zahyojoho").val("");
    $("#zahyofuyo input[type='radio']:eq('0')").prop("checked", true);

    view.graphics.removeAll();

    $('#gridDiv').show();
    $('#gridDiv2').hide();

    delete_all_file_row();

    // ユーザー設定を読み込む
    var index = -1;
    $.each(request_filetype_setting, function (idx, item) {
      if (item.visible) {
        index++;
        $("#formDiv .request-filetype input[type='checkbox']").eq(index).prop("checked", (user_setting[item.field_name] == "1" ? true : false));
      }
    });

    $("#zahyofuyo input").each(function () {
      if (this.value == user_setting.zahyofuyo) {
        this.checked = true;
        return false;
      }
    });

    $('#sendbtn').html(func_undefined_to_blank(set_lang["formdiv-btn-send"]));
  }

  /**
   * 投稿情報の編集更新処理
   * @param {} lat 
   * @param {} long 
   */
  function edit_feature(lat, long) {

    url = push_feature_url + "/" + layer_id + "/updateFeatures";

    var attributes = {
      "OBJECTID": $('#viewobjectid').val(),
      "Title": $('#viewtitle').val(),
      "Naiyo": $('#viewnaiyo').val(),
      "Jusho": $('#viewjusho').val(),
      "Bikou": $('#viewbikou').val(),
      "kaninfo": $('#viewkaninfo').val(),
      "zahyojoho": $("#viewzahyojoho").val(),
      // "genbakubun": $("#viewgenbakubun").val()
      "genbakubun": $("#viewgenbakubun input[type='radio']:checked").val(),
      "zahyofuyo": $("#viewzahyofuyo input[type='radio']:checked").val(),
      "Update_status": 1,  // 1:投稿更新
      "Update_status_Update": Date.now() // 更新ステータス変更日時
    };

    // 要否ファイルチェックボックスのチェック状態からパラメータ作成
    var index = -1;
    $.each(request_filetype_setting, function (idx, item) {
      if (item.visible) {
        index++;
        /// 2:作成済み 考慮
        var $ipt = $("#viewformDiv .request-filetype input[type='checkbox']").eq(index);
        var value = $ipt.prop("checked")?$ipt.val(): 0;
        attributes[item.field_name] = Number(value);
      }
    });

    var feature = {
      "geometry": {
        "x": long,
        "y": lat,
        "spatialReference": { "wkid": 4326 }
      },
      "attributes": attributes
    };

    var form = new FormData();
    form.set('f', 'json');
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
    }).done(function (data) {
      // console.log(data);
      //戻る
      $('.returnmenu').click();
    }).fail(function (data) {
      // console.log(data);
    });
  }

  /**
   * 部品(ツール)の有効化
   * @param {String} type 
   */
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

  /**
   * 
   * @param {Element} selectedButton 
   */
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

  /**
   * ユーザー設定をセット
   */
  function setUserConf() {
    $("#saved").html("");//保存完了表示を初期化
    if (user_setting.toko == "0") {
      $("#gps").prop("checked", true);
    }
    else {
      $("#exif").prop("checked", true)
    }
    // クッキー情報から各チェックボックスのチェック状態を復元
    var index = -1;
    $.each(request_filetype_setting, function (idx, item) {
      if (item.visible) {
        index++;
        $("#user_conf .request-filetype input[type='checkbox']").eq(index).prop("checked", (user_setting[item.field_name] == "1" ? true : false));
      }
    });

    $("#settingzahyofuyo input").each(function () {
      if (this.value == user_setting.zahyofuyo) {
        this.checked = true;
        return false;
      }
    });
  }

  /**
   * ユーザー設定保存メソッド
   */
  function saveUserConf() {
    // モバイル端末の場合強制的に端末のGPSにチェックをつける
    if (isMobile) {
      $("#gps").prop("checked", true);
    }
    var toko = $('input:radio[name="toko_setting"]:checked').val();// チェックがついたほうのvalueを取得
    user_setting.toko = toko;
    // クッキー情報へ各チェックボックスのチェック状態を保存
    var index = -1;
    $.each(request_filetype_setting, function (idx, item) {
      if (item.visible) {
        index++;
        user_setting[item.field_name] = $("#user_conf .request-filetype input[type='checkbox']").eq(index).prop("checked") ? "1" : "0";
      }
    });
    var zahyofuyo = $('input:radio[name="settingzahyofuyo"]:checked').val();// チェックがついたほうのvalueを取得
    user_setting.zahyofuyo = zahyofuyo;
    // jsonに変換
    var cookie_data = JSON.stringify(user_setting);
    // cookieに保存
    $.cookie(cookieKey, cookie_data, { expires: 1826 }); //cookieの有効期限を５年に設定
    $("#saved").html("<label>" + func_undefined_to_blank(set_lang["userconf-msg-saving"]) + "</label>");
    //$('.returnmenu').click();
  }

  /**
   * パスワード変更前確認メソッド
   */
  function changePasswordAction() {
    const list = [];
    let html = '';
    const currentPwd = $('#present-password').val();
    const newPwd = $('#new-password').val();
    const rePwd = $('#retype-password').val();
    if (currentPwd.length == 0) {
      list.push(func_undefined_to_blank(set_lang["changediv-msg-nopwd"]));
    }
    if (newPwd.length == 0) {
      list.push(func_undefined_to_blank(set_lang["changediv-msg-nonewpwd"]));
    }
    if (rePwd.length == 0) {
      list.push(func_undefined_to_blank(set_lang["changediv-msg-norepwd"]));
    }
    if (currentPwd == newPwd && currentPwd.length != 0 && newPwd.length != 0) {
      list.push(func_undefined_to_blank(set_lang["changediv-msg-samepwd"]));
    }
    if (newPwd != rePwd) {
      list.push(func_undefined_to_blank(set_lang["changediv-msg-nomatch"]))
    }
    if (list.length == 0) {
      var form = new FormData();
      form.set('f', 'json');
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
      }).done(function (data) {
        if (data.error) {
          $('#warnDiv').html('<ul><li>' + func_undefined_to_blank(set_lang["changediv-msg-wrongpwd"]) + '</li></ul>');
        }
        else {
          changePassword(newPwd);
        }
      }).fail(function (xhr) {
        // console.log(xhr);
        $('#warnDiv').html('<ul><li>' + func_undefined_to_blank(set_lang["changediv-msg-failconf"]) + '</li></ul>');
      });
    }
    else {
      html += '<ul>';
      for (let i = 0; i < list.length; i++) {
        html += '<li>' + list[i] + '</li>';
      }
      html += '</ul>';
      $('#warnDiv').html(html);
    }
  }

  /**
   * パスワード変更メソッド
   * @param {String} pwd 
   */
  function changePassword(pwd) {
    var form = new FormData();
    form.set('f', 'json');
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
    }).done(function (data) {
      if (data.success) {
        alert(func_undefined_to_blank(set_lang["alert-changepass"]));
        document.location.reload()
      }
      else {
        // console.log(data)
        $('#warnDiv').html('<ul><li>' + func_undefined_to_blank(set_lang["warndiv-msg-fail"]) + '</li></ul>');
      }
    }).fail(function (xhr) {
      $('#warnDiv').html('<ul><li>' + func_undefined_to_blank(set_lang["warndiv-msg-fail"]) + '</li></ul>');
      // console.log(xhr);
    });
  }
  // アップロードボタンクリック
  $("#upload_attachment").on("click", function () {
    requestWakeLock();
    $("#attachment_file").click();
  });

  // ファイル選択後
  $("#attachment_file").on("change", function () {
    let commitIds = new Array();
    let $list_user = $("#attachment_list_user .file-list");
    // ファイル選択
    upload_files(this.files, "#attachment_list_user .file-list", "#attachment_file", "", null, {
      begin: function () {
        form_disabled(true);
      },
      // ファイルチェック開始 
      upload_file_check_start: function (idx, file) {
        let $row = $("<div id='uploading_row" + idx + "'></div>").addClass("row flex-box").appendTo($list_user);
        let $col = $("<div></div>").addClass("file-name flex-box").appendTo($row);
        $("<div></div>").addClass("title").text(func_undefined_to_blank(set_lang["file-name"])).appendTo($col);
        $("<div></div>").addClass("value").text(file.name).appendTo($col);
        $col = $("<div></div>").addClass("upload-status flex-box").appendTo($row);
        $("<div></div>").addClass("title").text(func_undefined_to_blank(set_lang["upload-stat"])).appendTo($col);
        $("<div></div>").addClass("value").text(func_undefined_to_blank(set_lang["regist-start"])).appendTo($col);
      },
      // ファイルチェックNG
      upload_file_check_ng: function (idx, file, status) {
        let $div = $("#uploading_row" + idx).find(".upload-status .value");
        $div.empty();
        $("<span style='color:red'></span>").text(status).appendTo($div);
      },
      // アップロード準備
      upload_ready: function (idx) {
        let $div = $("#uploading_row" + idx).find(".upload-status .value");
        $div.empty();
        $("<span style='color:blue;'></span>").text(func_undefined_to_blank(set_lang["upload-info-prep"])).appendTo($div);
      },
      // アップロード開始
      upload_file_readed: function (idx, file) {
        let $div = $("#uploading_row" + idx).find(".upload-status .value");
        $div.empty();
        $("<span style='color:blue;'></span>").text(func_undefined_to_blank(set_lang["upload-info-Regist"])).appendTo($div);
      },
      // ファイル読み込みエラー
      upload_file_read_error: function (idx, file, status) {
        let $div = $("#uploading_row" + idx).find(".upload-status .value");
        $div.empty();
        $("<span style='color:red;'></span>").text(status).appendTo($div);
      },
      // 登録URL取得
      get_url_register: function () {
        return url_attachment_register;
      },
      // アップロードファイル登録完了
      upload_file_registed: function (idx, file) {
        let $div = $("#uploading_row" + idx).find(".upload-status .value");
        $div.empty();
        $("<span style='color:green;'>" + func_undefined_to_blank(set_lang["upload-info-uploding"]) + "(0%)</span><meter min='0' max='100' value='0'></meter>").appendTo($div);
      },
      // アップロードファイル登録失敗
      upload_file_regist_failed: function (idx, file, status) {
        let $div = $("#uploading_row" + idx).find(".upload-status .value");
        $div.empty();
        $("<span style='color:red;'></span>").text(status).appendTo($div);
      },
      // 登録URL取得
      get_url_push: function () {
        return url_push_attachment;
      },
      // アップロード中
      uploading: function (idx, file, prog) {
        let $div = $("#uploading_row" + idx).find(".upload-status .value");
        $div.find("span").text(func_undefined_to_blank(set_lang["upload-info-uploding"]) + "(" + prog + "%)");
        $div.find("meter").val(prog);
      },
      // アップロードファイル適用開始
      upload_commit_start: function (idx, file) {
        let $div = $("#uploading_row" + idx).find(".upload-status .value");
        $div.empty();
        $("<span style='color:blue;'></span>").text(func_undefined_to_blank(set_lang["upload-info-apply"])).appendTo($div);
      },
      // アップロードファイル適用完了
      upload_commit_applied: async function (idx, file, e) {
        commitIds.push(e.item.itemID);
        await (function () {
          return new $.Deferred(async function (defer) {
            let form = new FormData();
            let feature = {
              "attributes": {
                "KaishaID": $("#kaishaid").val(),
                "RiyoshaID": user,
                "KanriUpload": ""
              }
            }
            form.set('f', 'json');
            form.set('features', JSON.stringify([feature]));
            form.set('token', token);
            await request_ajax({
              url: url_push_attachment + '/' + layer_id + '/addFeatures',
              type: "POST",
              data: form,
              processData: false,
              contentType: false,
              dataType: 'json',
              async: false
            }).then(async function (data) {
              if (data != undefined && data.addResults != undefined && data.addResults.length > 0 && data.addResults[0].success) {
                let form = new FormData();
                form.set('f', 'json');
                form.set('uploadId', e.item.itemID);
                //form.set('keywords', attachment);
                form.set('token', token);
                await request_ajax({
                  url: url_push_attachment + '/' + layer_id + "/" + data.addResults[0].objectId + '/addAttachment',
                  type: "POST",
                  data: form,
                  processData: false,
                  contentType: false,
                  dataType: 'json',
                  async: false
                }).then(function (data) {
                  let $div = $("#uploading_row" + idx).find(".upload-status .value");
                  $div.empty();
                  $("<span style='font-weight:bold;color:blue;'></span>").text(func_undefined_to_blank(set_lang["upload-info-added"])).appendTo($div);
                  defer.resolve();
                }).fail(function (data) {
                  let $div = $("#uploading_row" + idx).find(".upload-status .value");
                  $div.empty();
                  $("<span style='font-weight:bold;color:red;'></span>").text(func_undefined_to_blank(set_lang["upload-info-fail"])).appendTo($div);
                  defer.reject();
                });
              }
              else {
                let $div = $("#uploading_row" + idx).find(".upload-status .value");
                $div.empty();
                $("<span style='font-weight:bold;color:red;'></span>").text(func_undefined_to_blank(set_lang["upload-info-fail"])).appendTo($div);
                defer.reject();
              }
            }).fail(function (data) {
              let $div = $("#uploading_row" + idx).find(".upload-status .value");
              $div.empty();
              $("<span style='font-weight:bold;color:red;'></span>").text(func_undefined_to_blank(set_lang["upload-info-fail"])).appendTo($div);
              defer.reject();
            });
          });
        })();
      },
      // アップロードファイル適用失敗
      upload_commit_failed: function (idx, file, status) {
        let $div = $("#uploading_row" + idx).find(".upload-status .value");
        $div.empty();
        $("<span style='color:red;'></span>").text(status).appendTo($div);
      },
      // アップロード失敗
      upload_failed: function (idx, file, status) {
        let $div = $("#uploading_row" + idx).find(".upload-status .value");
        $div.empty();
        $("<span style='color:red;'></span>").text(status).appendTo($div);
      },
      // 全完了のタイミング
      complete: function () {
        display_attachment();
        form_disabled(false);
      }
    });
  });
});
// requireここまで

/**
   * ページ上のinput,buttonタグのdisabledを設定
   * @param {Boolean} disabled 
   */
function form_disabled(disabled) {
  $('input').prop('disabled', disabled);
  $('button').prop('disabled', disabled);
  $("calcite-tab-title").prop("disabled", disabled);
}
/**
 * 
 * @param {*} date 
 * @param {*} format 
 * @returns 
 */
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
          <th class="sys-change-content">${func_undefined_to_blank(set_lang["maindiv-th-title"])}</th>
          <th class="sys-change-content">${func_undefined_to_blank(set_lang["maindiv-th-date"])}</th>
          <th class="sys-change-content">${func_undefined_to_blank(set_lang["maindiv-th-user"])}</th>
          <th class="sys-change-content">${func_undefined_to_blank(set_lang["maindiv-th-name"])}</th>
          <th class="sys-change-content">${func_undefined_to_blank(set_lang["maindiv-th-adress"])}</th>
          <th class="sys-change-content">${func_undefined_to_blank(set_lang["maindiv-th-remark"])}</th>
          <th class="sys-change-content">${func_undefined_to_blank(set_lang["maindiv-th-conf"])}</th>
        </tr>`;

    // 特定会社ID時設定置き換え
    each_switch_kaisha_id_setting(switch_naiyo_kaisha_id_list, function (setting) {
      func_change_content_replace(func_undefined_to_blank(setting["change_content"][lang]), $("#tableHead"));
    });
  },

  changePage: function (page) {
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
    form.set('f', 'json');
    form.set('returnGeometry', false);
    if (userLicenseType === "Creator") {  //Creatorは他ユーザの投稿も閲覧できる
      form.set('where', "Status<>9");
    } else {
      form.set('where', "Status<>9 And " + creator_field + " = '" + this.userId + "'");
    }
    form.set('outFields', '*');
    // 選択中の並べ替え項目
    var order = $("#select_order").val();
    if (order != undefined && order.length > 0) {
      form.set("orderByFields", order);
    }
    else {
      form.set('orderByFields', create_date_field + ' DESC');
    }
    form.set('resultOffset', (page - 1) * this.records_per_page);
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
    }).done(function (data) {
      var features = data.features;
      if (features != undefined) {
        for (var i = 0; i < features.length; i++) {
          var tr_html = "";

          var objectid = features[i].attributes["OBJECTID"];
          var title = features[i].attributes["Title"];
          var created_user = features[i].attributes["created_user"];
          var createdate = features[i].attributes[create_date_field];
          var str_createdate = formatDate(new Date(createdate), 'yyyy/MM/dd HH:mm');
          var naiyo = features[i].attributes["Naiyo"];
          var jusho = features[i].attributes["Jusho"];
          var bikou = features[i].attributes["Bikou"];

          tr_html += '<tr>';
          tr_html += '<td data-label=' + func_undefined_to_blank(set_lang["maindiv-th-title"]) + '>' + title + '　</td>';
          tr_html += '<td data-label=' + func_undefined_to_blank(set_lang["maindiv-th-date"]) + '>' + str_createdate + '　</td>';
          tr_html += '<td data-label=' + func_undefined_to_blank(set_lang["maindiv-th-user"]) + '>' + created_user + '　</td>';
          tr_html += '<td data-label=' + func_undefined_to_blank(set_lang["maindiv-th-name"]) + '>' + naiyo + '　</td>';
          tr_html += '<td data-label=' + func_undefined_to_blank(set_lang["maindiv-th-adress"]) + '>' + jusho + '　</td>';
          tr_html += '<td data-label=' + func_undefined_to_blank(set_lang["maindiv-th-remark"]) + '>' + bikou + '　</td>';
          tr_html += '<td data-label=' + func_undefined_to_blank(set_lang["maindiv-th-conf"]) + '>'
          tr_html += '<input id="view" type="button" value="' + func_undefined_to_blank(set_lang["maindiv-tbl-btn-view"]) + '" onclick="historyTable.viewForm(' + objectid + ')"/>';
          tr_html += '<input id="del" type="button" value="' + func_undefined_to_blank(set_lang["maindiv-tbl-btn-del"]) + '" onclick="historyTable.deleteRow(' + objectid + ')"/>';
          tr_html += '</td>';
          tr_html += '</tr>';

          tableBody.append(tr_html);

          // 特定会社ID時設定置き換え
          each_switch_kaisha_id_setting(switch_naiyo_kaisha_id_list, function (setting) {
            func_change_attr_replace(func_undefined_to_blank(setting["change_content"][lang]), tableBody.find("tr:last").find("td"), "data-label");
            console.log();
          });
        }
      }
    }).fail(function (data) {
      // console.log(data);
    });

  },
  prevPage: function () {
    if (this.current_page > 1) {
      this.current_page--;
      this.changePage(this.current_page);
      $('body, html').scrollTop(0);
    }
  },
  nextPage: function () {
    if (this.current_page < this.numPages()) {
      this.current_page++;
      this.changePage(this.current_page);
      $('body, html').scrollTop(0);
    }
  },
  firstPage: function () {
    this.current_page = 1;
    this.changePage(this.current_page);
    $('body, html').scrollTop(0);
  },
  lastPage: function () {
    this.current_page = this.numPages();
    this.changePage(this.current_page);
    $('body, html').scrollTop(0);
  },
  numPages: function () {
    return this.pages;
  },
  viewForm: function (objectid) {
    // アタッチメントリンク部分のクリア
    $("#div_request_filetype_attachment").empty();

    var form = new FormData();
    form.set('f', 'json');
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
    }).done(function (data) {
      // console.log(data);
      var features = data.features;

      // 存在・削除確認
      if (features.length == 0) {
        alert(func_undefined_to_blank(set_lang["alert-nodata"]));
        this.refreshRow();
        return;
      }

      viewview.graphics.removeAll();

      if (features[0].geometry != null) {
        var pointGraphic = {
          geometry: {
            type: "point",
            latitude: features[0].geometry.y,
            longitude: features[0].geometry.x,
            spatialReference: { wkid: 4326 }
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
      $('#viewkaninfo').val(features[0].attributes["kaninfo"]);
      $("#viewzahyojoho").val(features[0].attributes["ZahyoJoho"]);
      // $("#viewgenbakubun").val(features[0].attributes["GenbaKubun"]);
      $("#viewgenbakubun input").each(function () {
        if (this.value == features[0].attributes["GenbaKubun"]) {
          this.checked = true;
          return false;
        }
      });
      // 要否ファイルチェックボックスチェック状態の設定
      var index = -1;
      $.each(request_filetype_setting, function (idx, item) {
        if (item.visible) {
          index++;
          /// 作成済み:2を考慮
          var $ipt = $("#viewformDiv .request-filetype input[type='checkbox']").eq(index);
          var value = features[0].attributes[item.field_name] || 0;
          /// 「0」の場合は「1」とする 1960行目でチェック時にvalueを代入するため
          $ipt.val(value || 1);
          $ipt.prop("checked", (value != 0 ? true : false));
        }
      });
      $("#viewzahyofuyo input").each(function () {
        this.checked = false;
        if (this.value == features[0].attributes["ZahyoFuyo"]) {
          this.checked = true;
          return false;
        }
      });

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
    }).fail(function (data) {
      // console.log(data);
    });
  },

  viewattachment: function (objectid) {
    $('#div_request_filetype01_attachment').html("");
    $('#div_request_filetype02_attachment').html("");
    $('#div_request_filetype03_attachment').html("");
    $('#div_request_filetype04_attachment').html("");
    $("#div_request_filetype05_attachment").html("");
    $('#attachmentlistDiv').html("");

    var form = new FormData();
    form.set('f', 'json');
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
    }).done(function (data) {
      // console.log(data);

      if (data.attachmentGroups.length == 0) {
        return;
      }
      var attachments = data.attachmentGroups[0].attachmentInfos;

      var att_html = "";

      // 要否ファイルリンク表示用要素を用意
      var $elem = $("#div_request_filetype_attachment").empty();
      for (var i = 0; i < request_filetype_setting.length; i++) {
        if (request_filetype_setting[i].visible || false) {
          $("<div id='div_request_filetype_attachment_" + i.toString() + "'></div>").appendTo($elem);
        }
      }
      for (var i = 0; i < attachments.length; i++) {
        var att_name = attachments[i].name;
        var att_id = attachments[i].id;
        var att_url = push_feature_url + '/' + layer_id + '/' + objectid + '/attachments/' + att_id + '?token=' + this.token;
        var contentType = attachments[i].contentType;
        var keywords = attachments[i].keywords;

        if (keywords.split("|").indexOf("ManagementSystemUpload") != -1) {
          // 要否ファイルの判定をし、合致した場合はリンクを作成
          for (var j = 0; j < request_filetype_setting.length; j++) {
            if (func_request_filetype_setting_exists_keyword(request_filetype_setting, keywords, j)) {
              var html = "<span>" + att_name + '</span><div><a target="_blank" rel="noopener noreferrer"  href="' + att_url + '">' + func_undefined_to_blank(request_filetype_setting[j].link_text[lang]) + '</a></div>';
              // 複数存在する場合は前回要素を削除
              var $div = $("#div_request_filetype_attachment_" + j.toString()).empty();
              $div.html(html);
              replace_download_link_button($div, { layer_id: layer_id, objectid: objectid }, attachments[i], request_filetype_setting[j].downloaded_key);
              break;
            }
          }

          //プレビュー画像の表示
          if (keywords.split("|").indexOf("PREVIEW") != -1) {
            if (contentType.indexOf('image') !== -1) {
              att_html += att_name + '<br/><img decoding="async" class="view_gallery" src="' + att_url + '" width="100px"></img><br/>';
            }
          }
          continue;
        }
        else if (contentType.indexOf('video') !== -1) {
          att_html += att_name + '<br/><video class="view_gallery" src="' + att_url + '" controls width="100px"></video><br/>';
        }
        else if (contentType.indexOf('image') !== -1) {
          att_html += att_name + '<br/><img decoding="async" class="view_gallery" src="' + att_url + '" width="100px"></img><br/>';
        }
        else if (att_name.indexOf('jpg') !== -1 || att_name.indexOf('png') !== -1) {
          att_html += att_name + '<br/><img decoding="async" class="view_gallery" src="' + att_url + '" width="100px"></img><br/>';
        }
        else {
          att_html += att_name + '<br/><a target="_blank" rel="noopener noreferrer"  href="' + att_url + '">' + func_undefined_to_blank(set_lang["viewformdiv-link-download"]) + '</a><br/>';
        }

        att_html += '<input class="delbtn " type="button" id="delBtn' + att_id + '" value="' + func_undefined_to_blank(set_lang["viewformdiv-btn-del"]) + '" onclick="historyTable.deleteattachent(' + objectid + ', ' + att_id + ')"/>';
        att_html += '<br/><br/>'
      }

      $('#attachmentlistDiv').html(att_html);

    }).fail(function (data) {
      // console.log(data);
    });
  },

  deleteattachent: function (oid, attachmentid) {
    url = push_feature_url + "/" + layer_id + "/" + oid + "/deleteAttachments";

    var form = new FormData();
    form.set('f', 'json');
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
    }).done(function (data) {
      // 更新ステータス更新
      var formData = new FormData();
      formData.set('f', 'json');
      formData.set('features', JSON.stringify(
        [
          {
            "attributes": {
              "OBJECTID": oid, 
              "Update_status": 3,  // 3:添付削除
              "Update_status_Update": Date.now() // 更新ステータス変更日時
            }
          }
        ]
      ));
      formData.set('token', token);
      $.ajax({
        "url": push_feature_url + "/" + layer_id + "/updateFeatures",
        "type": "POST",
        "data": formData,
        "processData": false,
        "contentType": false,
        "dataType": "json",
        "async": true
      }).done(function() {
        historyTable.viewattachment(oid);
      });
      // console.log(data);
    }).fail(function (data) {
      // console.log(data);
    });
  },

  deleteRow: function (objectid) {

    if (!window.confirm(func_undefined_to_blank(set_lang["maindiv-confmsg-del"]))) {
      return;
    }

    var form = new FormData();
    form.set('f', 'json');
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
    }).done(function (data) {
      // console.log(data);
      this.refreshRow();
      refresh_mapview(historyview);
    }).fail(function (data) {
      // console.log(data);
    });
  },

  refreshRow: function () {
    this.getRecordCount();
    this.changePage(this.current_page);
  },

  async getRecordCount() {
    var form = new FormData();
    form.set('f', 'json');

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
    }).done(function (data) {
      this.records = data.count;
      this.pages = Math.ceil(data.count / this.records_per_page);

      if (this.pages == 0) this.pages = 1;
    }).fail(function (data) {
      // console.log(data);
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
  } else if (page == 5) { // パスワード変更
    $('#mainDiv').css('display', 'none');
    $('#changeDiv').css('display', 'block');
  } else if (page == 6) { // ユーザー設定
    $('#mainDiv').css('display', 'none');
    $('#user_conf').css('display', 'block');
  }
}


function refresh_mapview(mapview) {
  if (mapview == "") return;
  var layers = historyview.layerViews.items;

  for (var i = 0; i < layers.length; i++) {
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
  }).then(function (layer) {
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

      sceneLayer.when(function () {
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
    $('#viewkaninfo').prop('disabled', false);
    $('#viewbikou').prop('disabled', false);
    $('#viewzahyojoho').prop('disabled', false);
    // $("#viewgenbakubun").prop("disabled", false);
    $("#viewgenbakubun").find("input").each(function () {
      this.disabled = false;
    });

    // 要否ファイルチェックボックスを有効状態に設定
    $("#viewformDiv .request-filetype input[type='checkbox']").each(function (idx, elem) {
      elem.disabled = false;
    });

    $("#viewzahyofuyo").find("input").each(function () {
      this.disabled = false;
    });

    $('#editform_show').css('display', 'none');
    $('#edit_send').css('display', 'block');
    $('#edit_cancel').css('display', 'block');

    viewview_click = viewview.on("click", function (event) {
      var point = event.mapPoint;
      view_graphic_rendar(point.latitude, point.longitude);
    });

  } else {
    $('#viewtitle').prop('disabled', true);
    $('#viewnaiyo').prop('disabled', true);
    $('#viewjusho').prop('disabled', true);
    $('#viewkaninfo').prop('disabled', true);
    $('#viewbikou').prop('disabled', true);
    $('#viewzahyojoho').prop('disabled', true);
    // $("#viewgenbakubun").prop("disabled", true);
    $("#viewgenbakubun").find("input").each(function () {
      this.disabled = true;
    });

    // 要否ファイルチェックボックスを無効状態に設定
    $("#viewformDiv .request-filetype input[type='checkbox']").each(function (idx, elem) {
      elem.disabled = true;
    });

    $("#viewzahyofuyo").find("input").each(function () {
      this.disabled = true;
    });

    $('#editform_show').css('display', 'block');
    $('#edit_send').css('display', 'none');
    $('#edit_cancel').css('display', 'none');

    if (viewview_click != null) {
      viewview_click.remove();
    }
  }

}
/**
 * 設定情報の設定
 * @param {Object} config 
 */
function set_config(config) {
  webappId = config.webappId;
  kaisha_url = config.get_kaisha_url;
  layer_id = config.layer_id;
  basemap_id = config.basemap_id;
  basescene_id = config.basescene_id;
  creator_field = config.creator_field;
  create_date_field = config.create_date_field;

  // 許可ユーザーの設定
  allow_users = config.allow_users || [];
  for (let i = 0; i < allow_users.length; i++) {
    allow_users[i] = allow_users[i].toLowerCase();
  }

  // 取得言語が無ければlangに「ja」を設定
  if (config.languages[lang] == undefined) {
    lang = "ja";
  }
  //サインイン画面から言語設定を選択、言語切り替え
  list_lang_select_item = config.list_lang_select_item;
  create_list_order_select(list_lang_select_item, $("#select_lang"));
  $("#select_lang").val(lang)
  $("#select_lang").change(function () {
    var select_lang = $(this).val();
    var redirect_url = location.origin + location.pathname + "?field:KaishaID=" + decodeURIComponent(param[1]) + "&lang=" + select_lang + "#";
    window.location.href = redirect_url;
  });
  create_list_order_select(list_lang_select_item, $("#setting_select_lang"));
  $("#setting_select_lang").val(lang)
  $("#setting_select_lang").change(function () {
    var setting_select_lang = $(this).val();
    var redirect_url = location.origin + location.pathname + "?field:KaishaID=" + decodeURIComponent(param[1]) + "&lang=" + setting_select_lang + "#";
    window.location.href = redirect_url;
  });
  //言語設定に応じてmapの初期位置設定
  init_latitude = config.languages[lang].init_latitude;
  init_longitude = config.languages[lang].init_longitude;
  init_zoom = config.languages[lang].init_zoom;

  // ユーザー設定をcookieから取得
  var cookie = $.cookie(cookieKey);
  if (cookie) {
    user_setting = JSON.parse(cookie);
  }
  else {
    user_setting = config.user_setting;
  }

  //入力禁止文字
  ngCharacters = config.ngCharacters;
  // 文言置き換え用
  set_lang = config.languages[lang];
  // アップロードファイルサイズ単一上限
  upload_limit_file_size = config.upload_limit_file_size || 0;
  // アップロードファイルサイズ合計上限
  upload_limit_total_file_size = config.upload_limit_total_file_size || 0;
  // 入力情報のデフォルト値 
  default_value_formDiv = config.languages[lang].default_value_formDiv;
  // 要否チェックボックスの表示非表示 
  request_filetype_setting = config.request_filetype_setting;
  func_requet_filetype_setting_visible(request_filetype_setting, request_filetype_elemid_list);
  // アップロードファイル許可拡張子
  upload_extension_white_list = config.upload_extension_white_list;
  // アップロードファイル禁止拡張子
  upload_extension_black_list = config.upload_extension_black_list;
  // アップロードファイル許可タイプ
  upload_file_type_white_list = config.upload_file_type_white_list;
  // チャンクサイズ
  blob_chunk_size = config.blob_chunk_size;
  // 一覧並べ替え項目 
  list_order_select_item = config.languages[lang].list_order_select_item;
  // セレクトタグの選択項目 
  select_option_list = config.languages[lang].select_option_list;
  // 特定会社ID時の内容変更
  switch_naiyo_kaisha_id_list = config.switch_naiyo_kaisha_id_list;
  // 特定会社ID時の考慮
  each_switch_kaisha_id_setting(switch_naiyo_kaisha_id_list, function (setting) {
    list_order_select_item = func_undefined_to_blank(setting.list_order_select_item[lang]);
  });

  // セレクトタグ項目生成
  create_list_order_select(list_order_select_item, $("#select_order"));
  $("#select_order").change(function () {
    historyTable.changePage(0);
  });


  // 要否ファイルチェックボックス作成 ユーザー設定部
  create_request_filetype_check(request_filetype_setting, $("#user_conf .request-filetype"), "setting-request-filetype", "setting_", "requestFile sys-change-content");
  // 要否ファイルチェックボックス作成 新規投稿部
  create_request_filetype_check(request_filetype_setting, $("#formDiv .request-filetype"), "form-request-filetype", "form_", "requestFile sys-change-content");
  // 要否ファイルチェックボックス作成 情報編集部
  create_request_filetype_check(request_filetype_setting, $("#viewformDiv .request-filetype"), "view-request-filetype", "view_", "requestFile sys-change-content");
  // 許可されているファイルポップアップ内容作成
  create_file_extension_list(upload_extension_white_list, $("#file_extension_list"));

  // 投稿フォームのセレクトタグの設定
  // create_select_option(select_option_list.GenbaKubun, $("#genbakubun"));
  create_radio_list(select_option_list.GenbaKubun, $("#genbakubun"), "radiomenu");
  // 閲覧情報のセレクトタグの設定
  // create_select_option(select_option_list.GenbaKubun, $("#viewgenbakubun"));
  create_radio_list(select_option_list.GenbaKubun, $("#viewgenbakubun"), "radiomenu");

  // 座標付与セレクトの設定
  create_radio_list(select_option_list.ZahyoFuyo, $("#zahyofuyo"), "radiomenu");
  create_radio_list(select_option_list.ZahyoFuyo, $("#viewzahyofuyo"), "radiomenu");
  create_radio_list(select_option_list.ZahyoFuyo, $("#settingzahyofuyo"), "radiomenu");

  // 特定会社ID時の内容変更
  replace_switch_kaisha_id(switch_naiyo_kaisha_id_list);
}

/**
 * セレクトタグの項目作成
 * @param {Object[]} list 
 * @param {jQueryElement} $select 
 */
function create_select_option(list, $select) {
  for (var i = 0; i < list.length; i++) {
    $("<option value='" + list[i].value + "'></option>").text(list[i].text).appendTo($select);
  }
}
/**
 * ラジオ選択リストの作成
 * @param {Object[]} list 
 * @param {jQueryElement} $elem 
 * @param {String} label_class 
 */
function create_radio_list(list, $elem, label_class) {
  for (var i = 0; i < list.length; i++) {
    var id = ($elem.get(0).id + "_" + i);
    $("<input type='radio' name='" + $elem.get(0).id + "' id='" + id + "' />").val(list[i].value).appendTo($elem);
    $("<label for='" + id + "'></label>").addClass(label_class).text(list[i].text).appendTo($elem);
  }
}
/**
 * 許可されているファイルポップアップ内容作成
 * @param {String[]} settings 
 * @param {jQueryElement} $div 
 */
function create_file_extension_list(settings, $div) {
  for (var i = 0; i < settings.length; i++) {
    $("<div></div>").text(settings[i].replace("*.", "") + (i == (settings.length - 1) ? "" : "、")).appendTo($div);
  }
}
/**
 * 要否ファイルチェックボックス作成
 * @param {Object[]} settings 
 * @param {jQueryElement} $parent 
 * @param {String} name 
 * @param {String} id_initial 
 * @param {String} className 
 */
function create_request_filetype_check(settings, $parent, name, id_initial, className) {
  for (var i = 0; i < settings.length; i++) {
    if (settings[i].visible) {
      var $div = $("<div class='flex-box'></div>").appendTo($parent);
      var $input = $("<input type='checkbox' name='" + name + "' id='" + id_initial + settings[i].field_name + "' />").appendTo($div);
      var $label = $("<label for='" + id_initial + settings[i].field_name + "'></label>").text(func_undefined_to_blank(settings[i].checkbox_label[lang])).appendTo($div);
      $label.addClass(className);
    }
  }
}
/**
 * 並べ替えセレクトタグ項目の作成
 * @param {Object[]} settings 
 * @param {jQueryElement} $select 
 */
function create_list_order_select(settings, $select) {
  for (var i = 0; i < settings.length; i++) {
    $("<option></option>").html(settings[i].html).val(settings[i].value).appendTo($select);
  }
}
/**
 * 指定辞書と親エレメントから文言の置き換えを行う
 * @param {object} settings 
 * @param {jQueryElement} $div 
 */
function func_change_content_replace(settings, $div) {
  var $elems = $div.find(".sys-change-content");
  $elems.each(function (idx, elem) {
    var $elem = $(elem);
    var content = settings[$elem.html()];
    if (content != undefined) {
      $elem.html(content);
    }
  });
}
/**
 * 言語設定に応じて言語を切り替える
 * @param {Object[]} settings 
 */
function func_change_lang(settings) {
  for (let obj in settings) {
    let $elem = $("." + obj);
    var content = settings[obj];
    if ($elem.length > 0) {
      $elem.html(content);
    }
  }
  //ヘッダー画像
  $(".header_img").attr("src", func_undefined_to_blank(settings["header-img"]));
  $(".header_small_img").attr("src", func_undefined_to_blank(settings["header-small-img"]));
  //投稿画面全削除ボタン
  $("#file_del_all_btn").attr("value", func_undefined_to_blank(settings["formdiv-tbl-button"]));
  //ユーザーガイド画面iframeのタイトル
  $("#helpMovieTitle1").attr("title", func_undefined_to_blank(settings["helpdiv-headline2"]));
  $("#helpMovieTitle2").attr("title", func_undefined_to_blank(settings["helpdiv-headline3"]));
  $("#helpMovieTitle3").attr("title", func_undefined_to_blank(settings["helpdiv-headline4"]));
  $("#helpMovieTitle4").attr("title", func_undefined_to_blank(settings["helpdiv-headline5"]));
  $("#helpMovieTitle5").attr("title", func_undefined_to_blank(settings["helpdiv-headline6"]));
  //計測ツール
  $("#measureToolTilte").text(func_undefined_to_blank(settings["viewformdiv-measuretool-title"]));
  $("#distanceButton").attr("title", func_undefined_to_blank(settings["viewformdiv-measuretool-distance"]));
  $("#areaButton").attr("title", func_undefined_to_blank(settings["viewformdiv-measuretool-area"]));
  $("#clearButton").attr("title", func_undefined_to_blank(settings["viewformdiv-measuretool-clear"]));
}

/**
 * 言語設定がなければブランクを返す
 * @param {object} key 
 * @return {string}
 */
function func_undefined_to_blank(key) {
  return key || ""
}

/**
 * 指定エレメントの属性値を書き換える
 * @param {Object} settings 
 * @param {jQueryElement} $div 
 * @param {String} attr 
 */
function func_change_attr_replace(settings, $div, attr) {
  $div.each(function (idx, elem) {
    var value = $(elem).attr(attr);
    if (value != undefined) {
      var content = settings[value];
      if (content != undefined) {
        $(elem).attr(attr, content);
      }
    }
  });
}
/**
 * 指定辞書と親エレメントから該当IDに初期値を設定する
 * @param {object} settings 
 * @param {jQueryElement} $div 
 */
function func_default_value_setting(settings, $div) {
  for (var i in settings) {
    var elem = $div.find("#" + i);
    if (elem != undefined) {
      $(elem).val(settings[i]);
    }
  }
}
/**
 * 要否チェックボックスの表示非表示の切り替えを行う
 * @param {object[]} settings 
 * @param {string[][]} elemid_list 
 */
function func_requet_filetype_setting_visible(settings, elemid_list) {
  for (var i = 0; i < settings.length; i++) {
    var setting = settings[i];
    var list = elemid_list[i];
    if (list != undefined) {
      for (var j = 0; j < list.length; j++) {
        var elem = document.getElementById(list[j]);
        if (elem != undefined) {
          // 非表示の場合
          if (setting != undefined && !(setting.visible || false)) {
            $(elem).hide();
          }
        }
      }
    }
  }
}
/**
 * アタッチメントのキーワード中に設定キーワードが存在しているか
 * 2番目のkeywordで検索
 * @param {object[]} settings 
 * @param {string | string[]} keywords 
 * @param {integer} index 
 * @returns 
 */
function func_request_filetype_setting_exists_keyword(settings, keywords, index) {
  var setting = settings[index];
  if (setting != undefined) {
    var setting_keywords = setting.keyword || "";
    if (!$.isArray(setting_keywords)) setting_keywords = [setting_keywords];
    if (setting.visible || false) {
      var aryKeyword = keywords.toLowerCase().split("|");
      for (var i = 0; i < setting_keywords.length; i++) {
        // for (var j = 0; j < aryKeyword.length; j++) {
        //   if (aryKeyword[j].indexOf(setting_keywords[i].toLowerCase()) != -1) {
        //     return true;
        //   }
        // }
        //2番目のkeywordで検索
        if (aryKeyword.length > 1) {
          if (aryKeyword[1].indexOf(setting_keywords[i].toLowerCase()) != -1) {
            return true;
          }
        }
      }
      return false;
    }
    else {
      return false;
    }
  }
  else {
    return false;
  }
}
/**
 * クリックでアタッチメントを更新するダウンロード用ボタンを作成する
 * @param {jQueryElement} $html アペンドする親エレメント
 * @param {object} parentInfo 親オブジェクト情報
 * @param {object} attachment アタッチメント情報
 * @param {string | string[]} downloaded_key 初回クリック時にkeywordsに付与するフラグ文字列
 */
function replace_download_link_button($html, parentInfo, attachment, downloaded_key) {
  // {downloaded_key}となっていない場合
  if (attachment.keywords.split("|").indexOf(downloaded_key) == -1) {
    var a = $html.find("a");
    var href = $(a).prop("href");
    $(a).on("click", function () {
      var form = new FormData();
      form.set('f', 'json');
      form.set('attachmentId', attachment.id);
      form.set('keywords', attachment.keywords.replace("|" + downloaded_key, "") + "|" + downloaded_key);
      form.set("token", token);
      // アタッチメント更新API呼び出し
      $.ajax({
        url: push_feature_url + "/" + parentInfo.layer_id + "/" + parentInfo.objectid + "/updateAttachment",
        type: "POST",
        processData: false,
        contentType: false,
        dataType: "json",
        async: true,
        context: this,
        data: form
      }).done(function (data) {
        // 通常リンクに切り替え 2回目はhrefを直接開く
        $(a).off("click");
      }).fail(function () {

      });
      // 別タブで表示 ajaxの戻りで実行するとポップアップブロックに引っかかるため
      window.open(href, "_blank");
      return false;
    });
  }
}

/**
 * 特定会社ID時の内容変更
 * @param {object[]} settings 
 */
function replace_switch_kaisha_id(settings) {
  for (var i = 0; i < settings.length; i++) {
    var setting = settings[i];
    if ($.inArray($("#kaishaid").val(), setting["ids"]) != -1) {
      for (var j = 0; j < (setting["textarea_ids"] || []).length; j++) {
        var $textarea = $("#" + setting["textarea_ids"][j]);
        if ($textarea.length > 0) {
          var $parent = $textarea.parent();
          $textarea.remove();
          $("<textarea id='" + setting["textarea_ids"][j] + "'></textarea>").appendTo($parent);
        }
      }
      // 文言の置換
      func_change_content_replace(func_undefined_to_blank(setting["change_content"][lang]), $("#mainDiv"));
      func_change_content_replace(func_undefined_to_blank(setting["change_content"][lang]), $("#user_conf"));
      func_change_content_replace(func_undefined_to_blank(setting["change_content"][lang]), $("#changeDiv"));
      func_change_content_replace(func_undefined_to_blank(setting["change_content"][lang]), $("#formDiv"));
      func_change_content_replace(func_undefined_to_blank(setting["change_content"][lang]), $("#viewformDiv"));
    }
  }
}
/**
 * 該当の会社IDを持つ設定が存在した場合にその設定を引き数に渡された関数を実行する
 * @param {object[]} settings 
 * @param {function} func 
 */
function each_switch_kaisha_id_setting(settings, func) {
  func = func || function () { }
  for (var i = 0; i < settings.length; i++) {
    var setting = settings[i];
    if ($.inArray($("#kaishaid").val(), setting["ids"]) != -1) {
      func(setting);
    }
  }
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
function clear_pass_form() {
  $("#present-password").val("");
  $("#new-password").val("");
  $("#retype-password").val("");
  $("#warnDiv").html("");
}

/**
 * ファイル共有一覧の表示
 */
function display_attachment() {
  var form = new FormData();
  form.set('f', 'json');
  form.set('returnGeometry', false);
  form.set('where', "1=1");
  //form.set("orderByFields", "CreationDate DESC");
  // if (userLicenseType === "Creator") {  //Creatorは他ユーザの投稿も閲覧できる
  //   form.set('where', "1=1");
  // } else {
  //   form.set('where', creator_field + " = '" + user + "'");
  // }
  form.set('outFields', '*');
  // form.set('resultOffset', (page - 1) * this.records_per_page);
  // form.set('resultRecordCount', this.records_per_page);
  form.set('token', token);
  let $list_user = $("#attachment_list_user .file-list");
  $list_user.find(".row:not(:eq(0))").remove();
  let $header = $list_user.find(".row:eq(0)");
  let $list_admin = $("#attachment_list_admin .file-list");
  $list_admin.find(".row:not(:eq(0))").remove();
  $.ajax({
    url: url_push_attachment + '/' + layer_id + '/query',
    type: "POST",
    data: form,
    processData: false,
    contentType: false,
    dataType: 'json',
    async: false
  }).done(function (data) {
    console.log(data);
    let objectIds = new Array();
    let features = data.features || [];
    let dic_attrib = new Object();
    for (let feature of features) {
      let attrib = feature.attributes || {};
      let objectId = attrib["OBJECTID"];
      objectIds.push(objectId);
      dic_attrib[objectId.toString()] = attrib;
    }

    let form = new FormData();
    form.set('f', 'json');
    form.set('objectIds', objectIds.join(","));
    form.set('token', token);

    $.ajax({
      url: url_push_attachment + '/' + layer_id + '/queryAttachments',
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
      async: true,
      context: this
    }).done(function (data) {
      console.log(data);
      let attachmentGroups = data.attachmentGroups || [];
      attachmentGroups = attachmentGroups.reverse();
      for (let attachmentGroup of attachmentGroups) {
        let attachmentInfos = attachmentGroup["attachmentInfos"] || [];
        if (attachmentInfos.length > 0) {
          let attachmentInfo = attachmentInfos[0];
          let attrib = dic_attrib[attachmentGroup["parentObjectId"]] || {};
          // 作成者取得
          let creator = attrib["Creator"];
          if (creator == undefined) {
            creator = attrib["created_user"];
          }
          creator = (creator || "").toLowerCase();
          let riyoshaId = (attrib["RiyoshaID"] || "").toLowerCase();
          let _user = user.toLowerCase();

          let $list = null;
          let admin_user = false;
          // 管理アップロード+ユーザー対象アップロード
          if (attrib["KanriUpload"] != undefined && attrib["KanriUpload"] == "1"
            && ((riyoshaId == _user && riyoshaId != creator) || (userLicenseType !== "Editor" && riyoshaId != creator))) {
            $list = $list_admin;
          }
          // 管理アップロード+管理者アップロード
          // else if (attrib["KanriUpload"] != undefined && attrib["KanriUpload"] == "1" && attrib["RiyoshaID"] == creator){
          else if (attrib["KanriUpload"] != undefined && attrib["KanriUpload"] == "1" && riyoshaId == creator) {
            $list = $list_admin;
            admin_user = ($.inArray(user, allow_users) > -1);
          }
          // ユーザーアップロード+Creator閲覧
          else if (userLicenseType !== "Editor") {
            $list = $list_user;
          }
          // ユーザーアップロード+Editor閲覧
          else if (userLicenseType === "Editor" && user === attrib["RiyoshaID"]) {
            $list = $list_user;
          }
          if ($list != null) {
            let $row = $("<div></div>").addClass("row flex-box").appendTo($list);
            let $col = $("<div></div>").addClass("file-name flex-box").appendTo($row);
            $header.children(":eq(0)").clone().addClass("title").appendTo($col);
            $("<div></div>").addClass("value").text(attachmentInfo["name"]).appendTo($col);
            $col = $("<div></div>").addClass("upload-date flex-box").appendTo($row);
            $header.children(":eq(1)").clone().addClass("title").appendTo($col);
            // created_dateが存在しない場合はCreationDateを参照する
            let creationDate = attrib["created_date"];
            if (creationDate == undefined) {
              creationDate = attrib["CreationDate"];
            }
            $("<div></div>").addClass("value").text(formatDate(new Date(creationDate), 'yyyy/MM/dd HH:mm')).appendTo($col);
            $col = $("<div></div>").addClass("userid flex-box").appendTo($row);
            $header.children(":eq(2)").clone().addClass("title").appendTo($col);
            if (attrib["KanriUpload"] != "1") {
              $("<div></div>").addClass("value").text(attrib["RiyoshaID"]).appendTo($col);
            }
            else {
              $("<div></div>").addClass("value").text(attrib["RiyoshaID"]).appendTo($col);
            }
            $col = $("<div></div>").addClass("confirm flex-box").appendTo($row);
            $header.children(":eq(3)").clone().addClass("title").appendTo($col);
            $col = $("<div></div>").addClass("value").appendTo($col);
            let $button = $("<input type='button' value='" + func_undefined_to_blank(set_lang["uploadattach-tbl-btn-dl"]) + "' />").appendTo($col);
            $button.on("click", () => {
              // ダウンロード
              let href = url_push_attachment + "/" + layer_id + "/" + attrib["OBJECTID"] + "/attachments/" + attachmentInfo["id"] + "?token=" + token;
              download(href, attachmentInfo["name"], attachmentInfo["contentType"]);
              return false;
            });
            let $button_delete = null;
            if (attrib["KanriUpload"] != undefined && attrib["KanriUpload"] == "1") {
              if (userLicenseType === "Creator") {
                $button_delete = $("<input type='button' value='" + func_undefined_to_blank(set_lang["uploadattach-tbl-btn-del"]) + "' />").appendTo($col);
              }
              else if (admin_user) {
                $button_delete = $("<input type='button' value='" + func_undefined_to_blank(set_lang["uploadattach-tbl-btn-del"]) + "' />").appendTo($col);
              }
            }
            else {
              $button_delete = $("<input type='button' value='" + func_undefined_to_blank(set_lang["uploadattach-tbl-btn-del"]) + "' />").appendTo($col);
            }
            if ($button_delete != null) {
              $button_delete.on("click", () => {
                if (!window.confirm(func_undefined_to_blank(set_lang["uploadattach-confmsg-del"]))) {
                  return;
                }
                form_disabled(true);
                let form = new FormData();
                form.set('f', 'json');
                form.set('objectIds', attrib["OBJECTID"]);
                form.set('token', token);
                $.ajax({
                  url: url_push_attachment + '/' + layer_id + '/deleteFeatures',
                  type: "POST",
                  data: form,
                  processData: false,
                  contentType: false,
                  dataType: 'json',
                  async: true,
                  context: this,
                }).done(function (data) {
                  display_attachment();
                }).fail(function (data) {
                  // console.log(data);
                }).always(() => {
                  form_disabled(false);
                });
              });
            }
          }
        }
      }
    }).fail(function (data) {

    })
  }).fail(() => {

  });
}

//端末のスリープ回避　Screen Wake Lock APIの有効化（イベント処理直下から呼び出す）
const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (err) {
    console.log(`${err.name}, ${err.message}`);
  }
}

//Screen Wake Lock APIの無効化
const releaseWakeLock = () => {
  if (wakeLock) {
    wakeLock.release()
      .then(() => {
        wakeLock = null;
      })
  }
}
/**
 * URLをファイルとしてダウンロード
 * @param {String} url         ダウンロードURL
 * @param {String} fileName    ダウンロードするファイル名
 * @param {String} contentType コンテンツタイプ
 * @param {String} caption     アンカーテキスト
 */
function download(url, fileName, contentType, caption) {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "blob";
  xhr.onload = function (e) {
    if (this.status == 200) {
      let urlUtil = window.URL || window.webkitURL;
      let blob = new Blob([this.response], { "type": contentType });
      let itemUrl = urlUtil.createObjectURL(blob);
      let link = document.createElement("a");
      link.href = itemUrl;
      link.download = fileName;
      link.innerHTML = caption;
      document.body.appendChild(link);
      link.click();
      link.remove();
      urlUtil.revokeObjectURL(itemUrl);
    }
  }
  xhr.send();
}

/**
 * format関数実装
 * @param {Array} arguments 引き数配列
 * @returns 変換後文字列
 */
$.format = function () {
  let target = "";
  if (arguments.length > 0) {
    target = arguments[0];
    for (let i = 1; i < arguments.length; i++) {
      let value = "";
      if (arguments[i] != undefined) {
        value = arguments[i].toString();
      }
      target = target.replace("{" + (i - 1).toString() + "}", value);
    }
  }
  return target;
}