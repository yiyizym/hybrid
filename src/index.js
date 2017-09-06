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
    _hybridRequest(url, callback){
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

    _invokeApi(api, args){
        let self = this;
        this._checkSupportSdk().then((isSupportSkd) => {
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
            this._hybridRequest(fullUrl, callback);
        })

    }

    _requestApi({api, isCache=false, versionLimit='', args={}}){
        let self = this;
        return self._isSupportVersion(versionLimit).then((isSupported) => {
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
                        self._invokeApi(api, options);
                    });
                }
                else {
                    console.error('此 API 不支持当前SDK版本： ', self.cacheResult['getSDKVersion']);
                    throw new Error('API请求失败，' + api + ' 需' + versionLimit + '+版本SDK');
                }
            })
    }

    _isHigherVersion(thisVersion, otherVersion){
        if(!otherVersion){
            return true;
        }
        let result = false;
        try {
            result = Number(thisVersion.replace('.', '')) > Number(otherVersion.replace('.', ''));
        }
        catch(e) {
            console.error('_isHigherVersion error: ', e);
        }
        return result;
    }

    _isSupportVersion(version){
        let self = this;
        if(!version){
            return new Promise((resolve) => {
                resolve(true);
            });
        }
        return self.getSDKVersion().then((thisVersion) => {
            return new Promise((resolve)=>{
                resolve(self._isHigherVersion(thisVersion, version));
            });
        });
    }

    _checkSupportSdk(){
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
        this._invokeApi('toggleDebug', {debug: isEnable, callback: _ => {
            console.log('toggleDebug success');
        }});
    }
    
    getSDKVersion(){
        return this._requestApi({
            api: 'getSDKVersion',
            isCache: true
        });
    }

    getUserId(){
        return this._requestApi({
            api: 'getUserId',
            versionLimit: '1.2.3'
        });
    }

}
export default Hybrid