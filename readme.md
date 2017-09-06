## 简单的 hybrid 实现（只提供三个接口）
- toggleDebug
- getSDKVersion
- getUserId

### 作用
- 用于展示 javascript 与手机客户端通讯的实现

### 原理
- javascript 到客户端方向，通过发起自定义协议的网络请求
- 客户端到 javascript 方向，通过 loadUrl

### 特性
- 使用 fiddler 返回 data 目录下的数据，可脱离客户端接口调试
- 使用 es6 语法
- 支持缓存接口结果，支持接口最低可用版本

### 使用
```
npm install
npm run build_test

// 用 fiddler mock 以下两个接口，相应的数据在 data 目录下：
// http://getsdkversion/?value=%7B%7D&req_sn=cb_0
// http://getUserId/?value=%7B%7D&req_sn=cb_1 

//打开浏览器，访问 http://localhost:8080/test
```
