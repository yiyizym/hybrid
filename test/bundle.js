/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
class Hybrid{
    constructor({customProtocol='customprotocol'}){
        let self = this;
        self._win = window;
        self.requestCounter = 0;
        self.resCallback = {};
        self.cacheResult = {};
        self.customProtocol = customProtocol;
        self.isInRealEnv = null;
        self._win.Hybrid = {
            invokeWeb: (res) => {
                let result = JSON.parse(res);
                if(result.sn && self.resCallback[result.sn]){
                    self.resCallback[result.sn](result.value ? result.value : '');
                    delete self.resCallback[result.sn];
                }
            }
        }

    }
    hybridRequest(url, callback){
        let self = this;
        if(callback !== undefined){
            let callbackSn = `cb_${self.requestCounter++}`;
            url = `${url}&req_sn=${callbackSn}`;
            self.resCallback[callbackSn] = callback;
        }
        let domElement = document.createElement('script');
        domElement.setAttribute('src', url);
        setTimeout(_=>{
            domElement.parentNode.removeChild(domElement);
        }, 100);
        document.body.appendChild(domElement);
    }

    invokeApi(api, args){
        let self = this;
        this.checkSupportSdk().then((isSupportSkd) => {
            console.log('api: ', api);
            let protocol = isSupportSkd ? self.customProtocol : 'http';
            let fullUrl = `${protocol}://${api}?`;
            let callback = undefined;
            let options = {};
            if(args === undefined){
    
            } else if(typeof args === 'function'){
                callback = args;
            } else {
                callback = args.callback;
                for(let key in args){
                    if(args.hasOwnProperty(key) && typeof args[key] !== 'function'){
                        options[key] = args[key];
                    }
                }
            }
    
            fullUrl = `${fullUrl}value=${encodeURIComponent(JSON.stringify(options))}`;
            this.hybridRequest(fullUrl, callback);
        })

    }

    requestApi({api, isCache=false, versionLimit='', args={}}){
        let self = this;
        return self.isSupportVersion(versionLimit).then((isSupported) => {
                if(isSupported){
                    return new Promise((resolve) => {
                        if(isCache && self.cacheResult[api] !== undefined){
                            resolve(self.cacheResult[api]);
                            return;
                        }
                        let options = {
                            callback: (result) => {
                                isCache && (self.cacheResult[api] = result);
                                resolve(result);
                            }
                        }
                        for(let key in args){
                            if(args.hasOwnProperty(key)){
                                options[key] = args[key];
                            }
                        }
                        self.invokeApi(api, options);
                    });
                }
                else {
                    console.error('此 API 不支持当前SDK版本： ', self.cacheResult['getSDKVersion']);
                    throw new Error('API请求失败，' + api + ' 需' + versionLimit + '+版本SDK');
                }
            })
    }

    isHigherVersion(thisVersion, otherVersion){
        if(!otherVersion){
            return true;
        }
        let result = false;
        try {
            result = Number(thisVersion.replace('.', '')) > Number(otherVersion.replace('.', ''));
        }
        catch(e) {
            console.error('isHigherVersion error: ', e);
        }
        return result;
    }

    isSupportVersion(version){
        let self = this;
        if(!version){
            return new Promise((resolve) => {
                resolve(true);
            });
        }
        return self.getSDKVersion().then((thisVersion) => {
            return new Promise((resolve)=>{
                resolve(self.isHigherVersion(thisVersion, version));
            });
        });
    }

    getSDKVersion(){
        return this.requestApi({
            api: 'getSDKVersion',
            isCache: true
        });
    }

    checkSupportSdk(){
        let self = this;
        return new Promise((resolve,reject)=>{
            if(self.isInRealEnv !== null){
                resolve(self.isInRealEnv);
                return;
            }
            let element = document.createElement('script');
            element.onload = function(){
                self.isInRealEnv = true;
                resolve(true);
            }
            element.style.display = 'none';
            element.setAttribute('src', 'customprotocol://');
            setTimeout(_ => {
                element.parentNode.removeChild(element);
                self.isInRealEnv = false;
                resolve(false);
            }, 100);
            document.body.appendChild(element);
        })
    }

    toggleDebug(isEnable){
        isEnable = !!isEnable;
        this.invokeApi('toggle_debug', {debug: isEnable, callback: _ => {
            console.log('toggleDebug success');
        }});
    }

    getUserId(){
        return this.requestApi({
            api: 'get_user_id',
            versionLimit: '1.2.3'
        });
    }

}
/* harmony default export */ __webpack_exports__["default"] = (Hybrid);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _index = __webpack_require__(0);

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hybrid = new _index2.default({});

hybrid.getUserId().then(function (result) {
    console.log('>>> ', result);
});

/***/ })
/******/ ]);