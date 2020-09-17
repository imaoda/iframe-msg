"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setDefaultSon = setDefaultSon;
exports.setMsgHandler = setMsgHandler;
exports.sendSon = sendSon;
exports.sendDad = sendDad;
exports.default = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var defaultSon = "";
var promArrMapSon = {};
var promArrMapDad = {};

var requestHandler = function requestHandler() {
  console.warn("没有设置iframe的应答函数");
};

var K_ID = "$$_$_id$_$$";
var TIMEOUT = 60000;

function getDomFromName(name) {
  if (name instanceof HTMLIFrameElement) {
    return name;
  }

  if (typeof name === "string") {
    if (name[0] === "#" || name[0] === ".") return document.querySelector(name);else if (window.frames[name]) return name;
  }

  return null;
} // 设置默认子iframe的name


function setDefaultSon(name) {
  defaultSon = getDomFromName(name);
} // 设置应答函数 (不区分来源于父iframe还是子iframe)


function setMsgHandler(fn) {
  requestHandler = fn;
}

function getRadId() {
  return Date.now() + "" + (Math.round(Math.random() * 100000) + 100000);
} // 向子节点发送请求


function sendSon(obj, name) {
  return new Promise(function (resolve, reject) {
    var _JSON$stringify;

    if (defaultSon) {
      // 确认 defaultSon 还是否在页面中
      if (defaultSon instanceof HTMLIFrameElement && !defaultSon.isConnected) defaultSon = null;
      if (typeof defaultSon === "string" && !window.frames[defaultSon]) defaultSon = null;
    }

    if (!name && !defaultSon) {
      reject("\u6CA1\u6709\u8BBE\u7F6E\u53D1\u9001\u5B50frame\u7684name\uFF0C\u4E5F\u53EF\u901A\u8FC7\u9ED8\u8BA4\u503C\u8BBE\u7F6E");
      return;
    }

    var fr = getDomFromName(name);

    if (name && !fr) {
      reject("\u6CA1\u6709\u540D\u4E3A".concat(name, "\u7684\u5B50iframe"));
      return;
    }

    if (!name) {
      fr = typeof defaultSon === "string" ? window.frames[defaultSon] : defaultSon.contentWindow;
    }

    if (!fr) {
      reject("\u6CA1\u6709\u627E\u5230\u5BF9\u5E94\u7684iframe");
      return;
    }

    var msgId = getRadId();
    fr.postMessage(JSON.stringify((_JSON$stringify = {}, _defineProperty(_JSON$stringify, K_ID, msgId), _defineProperty(_JSON$stringify, "data", obj), _JSON$stringify)), "*");
    promArrMapSon[msgId] = {
      resolve: resolve,
      reject: reject
    }; // 超时清理

    setTimeout(function () {
      if (promArrMapSon[msgId]) {
        promArrMapSon[msgId].reject("超时");
        delete promArrMapSon[msgId];
      }
    }, TIMEOUT);
  });
} // 接受子iframe发来的信息


window.addEventListener("message", function (_ref) {
  var data = _ref.data,
      source = _ref.source;
  var json;

  try {
    json = JSON.parse(data);
  } catch (error) {}

  if (!json || !json[K_ID]) return;
  var id = json[K_ID]; // 判断是一次响应还是一次请求
  // 响应自子 iframe

  if (promArrMapSon[id]) {
    promArrMapSon[id].resolve(json.data);
    delete promArrMapSon[id];
  } else if (promArrMapDad[id]) {
    // 响应自父 iframe
    promArrMapDad[id].resolve(json.data);
    delete promArrMapDad[id];
  } else {
    // 请求
    var cb = function cb(response) {
      var _JSON$stringify2;

      if (!source) return;
      source.postMessage(JSON.stringify((_JSON$stringify2 = {}, _defineProperty(_JSON$stringify2, K_ID, id), _defineProperty(_JSON$stringify2, "data", response), _JSON$stringify2)), "*");
    };

    requestHandler(json.data, cb);
  }
}); // 是否寄生在页面中

var isInParent = window.parent !== window; // 向父节点发送

function sendDad(obj) {
  return new Promise(function (resolve, reject) {
    var _JSON$stringify3;

    if (!isInParent) {
      console.warn("本页面并非嵌入页，找不到对应父级");
      reject("本页面并非嵌入页，找不到对应父级");
    }

    var msgId = getRadId();
    window.parent.postMessage(JSON.stringify((_JSON$stringify3 = {}, _defineProperty(_JSON$stringify3, K_ID, msgId), _defineProperty(_JSON$stringify3, "data", obj), _JSON$stringify3)), "*");
    promArrMapDad[msgId] = {
      resolve: resolve,
      reject: reject
    }; // 超时清理

    setTimeout(function () {
      if (promArrMapSon[msgId]) {
        promArrMapSon[msgId].reject("超时");
        delete promArrMapSon[msgId];
      }
    }, TIMEOUT);
  });
}

var _default = {
  setDefaultSon: setDefaultSon,
  setMsgHandler: setMsgHandler,
  sendSon: sendSon,
  sendDad: sendDad
};
exports.default = _default;