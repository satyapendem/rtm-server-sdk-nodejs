'use strict'

const FPConfig = require('./FPConfig');

class FPCallback {

    constructor() {

        this._cbMap = {};
        this._exMap = {};

        checkExpire.call(this);
    }

    addCb(key, cb, timeout) {

        if (!this._cbMap.hasOwnProperty(key)) {

            this._cbMap[key] = cb;
        } 

        if (!timeout) {

            timeout = FPConfig.SEND_TIMEOUT;
        }

        this._exMap[key] = timeout + Date.now();
    }

    removeCb(key) {

        if (key) {

            delayRemove.call(this, key);
            return;
        }

        for (let key in this._cbMap) {

            delayExec.call(this, key, new Error('timeout with closed!'));
        }
    }

    execCb(key, data) {

        delayExec.call(this, key, data);
    }
}

function checkExpire() {

    let self = this;

    setInterval(function() {

        for (let key in self._exMap) {

            if (self._exMap[key] > Date.now()) {

                continue;
            } 

            delayExec.call(self, key, new Error('timeout with expire'));
        }
    }, FPConfig.CHECK_CBS_INTERVAL);
}

function delayExec(key, data) {

    let self = this;

    setTimeout(function() {

        cbExec.call(self, key, data);
    }, 0);
}

function cbExec(key, data) {

    if (this._cbMap.hasOwnProperty(key)) {

        let cb = this._cbMap[key];
        cbRemove.call(this, key);

        cb && cb(data);
    }
}

function delayRemove(key) {

    let self = this;

    setTimeout(function() {

        cbRemove.call(self, key);
    }, 0);
}

function cbRemove(key) {

    if (this._cbMap.hasOwnProperty(key)) {

        delete this._cbMap[key];
    }

    if (this._exMap.hasOwnProperty(key)) {

        delete this._exMap[key];
    } 
}

module.exports = FPCallback