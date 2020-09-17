## introduction

让 iframe 父子通信更 easy

- 不用被 parent、contentWindow 等概念困扰
- 支持 Promise
- 支持 Typescript

## usage

```js
import { setDefaultSon, setMsgHandler, sendSon, sendDad } from "iframe-msg";
```

### 向子 window 发送信息

向子 iframe 发送信息

```js
// 简单发送
sendSon({ name: "wyf", sex: "male" }, "#id");

// 发送后监听响应
sendSon("hello", "#id").then((resp) => {
  console.log("对端响应信息：", resp);
});
```

### 向父 window 发送信息

```js
// 简单发送
sendDad([1, 2, 3, 4]);

// 发送后监听响应
sendDad(666).then((res) => {
  console.log(res);
});
```

### 监听接受到的信息并回复

```js
setMsgHandler((data, cb) => {
  console.log("父或子iframe发来了信息是：", data);
  cb("收到啦");
});
```

> 该监听不区分是来是 父级 还是 子级 的 frame，业务上可以自行区分

### 更多用法

sendSon 的第二个参数为需要发送的子 iframe，例如可能有多个 iframe，支持 3 中选择器

- `'#id'`
- `'.class'`
- `name`

也可以直接传入 iframe 的 DOM 节点。

另外，可以设置默认子 iframe，这样就不必每次都写了子 iframe 了

```js
setDefaultSon("#id");
sendSon("你好");
sendSon("我很开心");
```
