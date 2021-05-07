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
    else if (window.frames[name]) return name;
  }
  return null;
}

function getWindowFromName(name) {
  if (typeof name === "string") {
    if (name[0] === "#" || name[0] === ".") name = document.querySelector(name);
    else if (window.frames[name]) return window.frames[name];
  }

  if (name instanceof HTMLIFrameElement) {
    return name.contentWindow;
  }

  return null;
}

// 设置默认子iframe的name
export function setDefaultSon(name) {
  defaultSon = getDomFromName(name);
}
// 设置应答函数 (不区分来源于父iframe还是子iframe)
export function setMsgHandler(fn) {
  requestHandler = fn;
}

function getRadId() {
  return Date.now() + "" + (Math.round(Math.random() * 100000) + 100000);
}

// 向子节点发送请求
export function sendSon(obj, name) {
  return new Promise((resolve, reject) => {
    if (defaultSon) {
      // 确认 defaultSon 还是否在页面中
      if (defaultSon instanceof HTMLIFrameElement && !defaultSon.isConnected)
        defaultSon = null;
      if (typeof defaultSon === "string" && !window.frames[defaultSon])
        defaultSon = null;
    }

    if (!name && !defaultSon) {
      reject(`没有设置发送子frame的name，也可通过默认值设置`);
      return;
    }
    var fr = getWindowFromName(name);
    if (name && !fr) {
      reject(`没有名为${name}的子iframe`);
      return;
    }
    if (!name) {
      fr =
        typeof defaultSon === "string"
          ? window.frames[defaultSon]
          : defaultSon.contentWindow;
    }
    if (!fr) {
      reject(`没有找到对应的iframe`);
      return;
    }
    var msgId = getRadId();
    fr.postMessage(JSON.stringify({ [K_ID]: msgId, data: obj }), "*");
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
  var json;
  try {
    json = JSON.parse(data);
  } catch (error) {}
  if (!json || !json[K_ID]) return;
  var id = json[K_ID];
  // 判断是一次响应还是一次请求
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
    var cb = response => {
      if (!source) return;
      source.postMessage(
        JSON.stringify({
          [K_ID]: id,
          data: response
        }),
        "*"
      );
    };
    requestHandler(json.data, cb);
  }
});

// 是否寄生在页面中
var isInParent = window.parent !== window;
// 向父节点发送
export function sendDad(obj) {
  return new Promise((resolve, reject) => {
    if (!isInParent) {
      console.warn("本页面并非嵌入页，找不到对应父级");
      reject("本页面并非嵌入页，找不到对应父级");
    }

    var msgId = getRadId();
    window.parent.postMessage(
      JSON.stringify({
        [K_ID]: msgId,
        data: obj
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
