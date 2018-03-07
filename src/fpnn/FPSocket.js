'use strict'

const Emitter = require('events').EventEmitter;
const net = require('net');
const conf = require('./FPConfig');

class FPSocket{
    constructor(options){
        this._host = options ? options.host : null;
        this._port = options ? options.port : 0;
        this._connectionTimeout = options ? options.connectionTimeout : 30 * 1000;

        this._client = null;
        this._isConnect = false;
    }

    get host(){ 
        return this._host; 
    }

    get port(){ 
        return this._port; 
    }

    write(buf){
        if (buf) this._client.write(buf);
    }

    close(err){
        if (err){
            this.emit('error', err);
        }

        if (this._client){
            this._client.destroy();
            this._client = null;
        }
    }

    open(){
        if (this.isConnecting || this.isOpen || this._client || net.isIP(this._host) <= 0 || this._port < 0){
            this.emit('error', { code:conf.ERROR_CODE.FPNN_EC_CORE_INVALID_CONNECTION, ex:'FPNN_EC_CORE_INVALID_CONNECTION' });
            return;
        }

        this._client = new net.Socket();

        this._client.on('connect', () => {
            onConnect.call(this);
        });

        this._client.on('close', (had_error) => {
            onClose.call(this, had_error);
        });

        this._client.on('error', (err) => {
            onError.call(this, err);
        });

        this._client.on('data', (chunk) => {
            onData.call(this, chunk);
        });

        this._client.on('timeout', () => {
            onTimeout.call(this);  
        });

        this._client.setTimeout(this._connectionTimeout);
        // this.client.setKeepAlive(true, 60 * 1000);

        this._client.connect(this._port, this._host);
    }

    get isOpen(){
        return this._isConnect;
    }

    get isConnecting(){
        if (this._client){
            return this._client.connecting;
        }

        return false;
    }
}

function onData(chunk){
    this.emit('data', chunk);
}

function onConnect(){
    this._isConnect = true;
    this.emit('connect');
}

function onClose(had_error){
    if (this._client){
        this._client.destroy();
        this._client = null;
    }

    if (had_error){
        this.emit('error', { code:conf.ERROR_CODE.FPNN_EC_CORE_INVALID_PACKAGE, ex:'FPNN_EC_CORE_INVALID_PACKAGE' });
    }

    this._isConnect = false;
    this.emit('close');
}

function onError(err){
    this.emit('error', err);
}

function onTimeout(){
    this.close({ code:conf.ERROR_CODE.FPNN_EC_CORE_TIMEOUT, ex:'FPNN_EC_CORE_TIMEOUT' });
}

Object.setPrototypeOf(FPSocket.prototype, Emitter.prototype);
module.exports = FPSocket;