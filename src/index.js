import { type } from "os";

var defaultSon = "";
var promArrMapSon = {};
var promArrMapDad = {};
var requestHandler = () => {
  console.warn("没有设置iframe的应答函数");
};
var K_ID = "$$_$_id$_$$";
var TIMEOUT = 60000;

function getDomFromName(name) {
  if (name instanceof HTMLIFrameElement) {
    return name;
  }
  if (typeof name === "string") {
    if (name[0] === "#" || name[0] === ".") return document.querySelector(name);
    else return window.frames[name];
  }
  return null;
}

// 设置默认子iframe的name
function setDefaultSon(name) {
  defaultSon = getDomFromName(name);
}
// 设置应答函数 (不区分来源于父iframe还是子iframe)
function setMsgHandler(fn) {
  requestHandler = fn;
}

function getRadId() {
  return Date.now() + "" + (Math.round(Math.random() * 100000) + 100000);
}

// 向子节点发送请求
function sendSon(obj, name) {
  return new Promise((resolve, reject) => {
    if (defaultSon && !defaultSon.isConnected) defaultSon = null;
    if (!name && !defaultSon) {
      reject(`没有设置发送子frame的name，也可通过默认值设置`);
      return;
    }
    var fr = getDomFromName(name) || defaultSon;
    if (!fr) {
      reject(`没有name为${name}的子iframe`);
      console.warn(`没有name为${name}的子iframe`);
      return;
    }
    var msgId = getRadId();
    fr.contentWindow.postMessage(
      JSON.stringify({ [K_ID]: msgId, data: obj }),
      "*"
    );
    promArrMapSon[msgId] = { resolve, reject };

    // 超时清理
    setTimeout(() => {
      if (promArrMapSon[msgId]) {
        promArrMapSon[msgId].reject("超时");
        delete promArrMapSon[msgId];
      }
    }, TIMEOUT);
  });
}

// 接受子iframe发来的信息
window.addEventListener("message", ({ data, source }) => {
  let json;
  try {
    json = JSON.stringify(data);
  } catch (error) {}
  if (!json || !json[K_ID]) return;
  var id = json[K_ID];
  // 判断是一次响应还是一次请求
  // 响应自子 iframe
  if (promArrMapSon[id]) {
    promArrMapSon[id].resolve(data);
    delete promArrMapSon[id];
  } else if (promArrMapDad[id]) {
    // 响应自父 iframe
    promArrMapDad[id].resolve(data);
    delete promArrMapDad[id];
  } else {
    // 请求
    var cb = (response) => {
      if (!source) return;
      source.postMessage(
        JSON.stringify({
          [K_ID]: id,
          data: response,
        }),
        "*"
      );
    };
    requestHandler(data, cb);
  }
});

// 是否寄生在页面中
var isInParent = window.parent !== window;
// 向父节点发送
function sendDad(obj) {
  return new Promise((resolve, reject) => {
    if (!isInParent) {
      console.warn("本页面并非嵌入页，找不到对应父级");
      reject("本页面并非嵌入页，找不到对应父级");
    }

    var msgId = getRadId();
    window.parent.postMessage(
      JSON.stringify({
        [K_ID]: msgId,
        data: obj,
      }),
      "*"
    );
    promArrMapDad[msgId] = { resolve, reject };
    // 超时清理
    setTimeout(() => {
      if (promArrMapSon[msgId]) {
        promArrMapSon[msgId].reject("超时");
        delete promArrMapSon[msgId];
      }
    }, TIMEOUT);
  });
}

export default { setDefaultSon, setMsgHandler, sendSon, sendDad };
