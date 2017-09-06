'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Hybrid = function () {
    function Hybrid() {
        _classCallCheck(this, Hybrid);

        var self = this;
        self._win = window;
        self.requestCounter = 0;
        self.resCallback = {};
        self.cacheResult = {};
        self.isInRealEnv = null;
        self._win.Hybrid = {
            invokeWeb: function invokeWeb(res) {
                var result = JSON.parse(res);
                if (result.sn && self.resCallback[result.sn]) {
                    self.resCallback[result.sn](result.value ? result.value : '');
                    delete self.resCallback[result.sn];
                }
            }
        };
    }

    _createClass(Hybrid, [{
        key: 'hybridRequest',
        value: function hybridRequest(url, callback) {
            var self = this;
            if (callback !== undefined) {
                var callbackSn = 'cb_' + self.requestCounter++;
                url = url + '&req_sn=' + callbackSn;
                self.resCallback[callbackSn] = callback;
            }
            var domElement = document.createElement('script');
            domElement.setAttribute('src', url);
            setTimeout(function (_) {
                domElement.parentNode.removeChild(domElement);
            }, 100);
            document.body.appendChild(domElement);
        }
    }, {
        key: 'invokeApi',
        value: function invokeApi(api, args) {
            var _this = this;

            this.checkSupportSdk().then(function (isSupportSkd) {
                console.log('api: ', api);
                var protocol = isSupportSkd ? 'customprotocol' : 'http';
                var fullUrl = protocol + '://' + api + '?';
                var callback = undefined;
                var options = {};
                if (args === undefined) {} else if (typeof args === 'function') {
                    callback = args;
                } else {
                    callback = args.callback;
                    for (var key in args) {
                        if (args.hasOwnProperty(key) && typeof args[key] !== 'function') {
                            options[key] = args[key];
                        }
                    }
                }

                fullUrl = fullUrl + 'value=' + encodeURIComponent(JSON.stringify(options));
                _this.hybridRequest(fullUrl, callback);
            });
        }
    }, {
        key: 'requestApi',
        value: function requestApi(_ref) {
            var api = _ref.api,
                _ref$isCache = _ref.isCache,
                isCache = _ref$isCache === undefined ? false : _ref$isCache,
                _ref$versionLimit = _ref.versionLimit,
                versionLimit = _ref$versionLimit === undefined ? '' : _ref$versionLimit,
                _ref$args = _ref.args,
                args = _ref$args === undefined ? {} : _ref$args;

            var self = this;
            return self.isSupportVersion(versionLimit).then(function (isSupported) {
                if (isSupported) {
                    return new Promise(function (resolve) {
                        if (isCache && self.cacheResult[api] !== undefined) {
                            resolve(self.cacheResult[api]);
                            return;
                        }
                        var options = {
                            callback: function callback(result) {
                                isCache && (self.cacheResult[api] = result);
                                resolve(result);
                            }
                        };
                        for (var key in args) {
                            if (args.hasOwnProperty(key)) {
                                options[key] = args[key];
                            }
                        }
                        self.invokeApi(api, options);
                    });
                } else {
                    console.error('此 API 不支持当前SDK版本： ', self.cacheResult['getSDKVersion']);
                    throw new Error('API请求失败，' + api + ' 需' + versionLimit + '+版本SDK');
                }
            });
        }
    }, {
        key: 'isHigherVersion',
        value: function isHigherVersion(thisVersion, otherVersion) {
            if (!otherVersion) {
                return true;
            }
            var result = false;
            try {
                result = Number(thisVersion.replace('.', '')) > Number(otherVersion.replace('.', ''));
            } catch (e) {
                console.error('isHigherVersion error: ', e);
            }
            return result;
        }
    }, {
        key: 'isSupportVersion',
        value: function isSupportVersion(version) {
            var self = this;
            if (!version) {
                return new Promise(function (resolve) {
                    resolve(true);
                });
            }
            return self.getSDKVersion().then(function (thisVersion) {
                return new Promise(function (resolve) {
                    resolve(self.isHigherVersion(thisVersion, version));
                });
            });
        }
    }, {
        key: 'getSDKVersion',
        value: function getSDKVersion() {
            return this.requestApi({
                api: 'getSDKVersion',
                isCache: true
            });
        }
    }, {
        key: 'checkSupportSdk',
        value: function checkSupportSdk() {
            var self = this;
            return new Promise(function (resolve, reject) {
                if (self.isInRealEnv !== null) {
                    resolve(self.isInRealEnv);
                    return;
                }
                var element = document.createElement('script');
                element.onload = function () {
                    self.isInRealEnv = true;
                    resolve(true);
                };
                element.style.display = 'none';
                element.setAttribute('src', 'customprotocol://');
                setTimeout(function (_) {
                    element.parentNode.removeChild(element);
                    self.isInRealEnv = false;
                    resolve(false);
                }, 100);
                document.body.appendChild(element);
            });
        }
    }, {
        key: 'toggleDebug',
        value: function toggleDebug(isEnable) {
            isEnable = !!isEnable;
            this.invokeApi('toggle_debug', { debug: isEnable, callback: function callback(_) {
                    console.log('toggleDebug success');
                } });
        }
    }, {
        key: 'getUserId',
        value: function getUserId() {
            return this.requestApi({
                api: 'get_user_id',
                versionLimit: '1.2.3'
            }).then(function (result) {
                console.log('>>> ', result);
            });
        }
    }]);

    return Hybrid;
}();

exports.default = Hybrid;