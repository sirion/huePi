/* global module */
/* eslint-disable no-console */
(function(module) {
"use strict";


function XMLHttpRequest() {
	this._listeners = {
		readystatechange: [],
		error: [],
		timeout: []
	};
	this._responseHeaders = {};
	this._requestHeaders = {
		"Accept": "*/*"
	};
}

XMLHttpRequest.LOADING = 0;
XMLHttpRequest.DONE = 1;

XMLHttpRequest.prototype.addEventListener = function(type, callback) {
	if (!this._listeners[type]) {
		throw new Error(
			"XMLHttpRequest Node.js polyfill only supports events \"" + Object.keys.join("\", \"") + "\""
		);
	}

	this._listeners[type].push(callback);
};

XMLHttpRequest.prototype.open = function(method, url, async) {
	this._method = method;
	this._url = url;
	this._async = async;
};


XMLHttpRequest.prototype.setRequestHeader = function(headerName, headerValue) {
	this._requestHeaders[headerName] = headerValue;
};

XMLHttpRequest.prototype.getResponseHeader = function(headerName) {
	return this._responseHeaders[headerName];
};

XMLHttpRequest.prototype.send = function(data) {

	var matches = /(http[s]{0,1}:\/\/){0,1}([^:\/]*):{0,1}([0-9]*)(\/.*)/.exec(this._url);
	var host = matches[2];
	var port = matches[3];
	var path = matches[4];

	var requestModule, defaultPort;
	if (this._url.indexOf("https://") === 0) {
		requestModule = require("https");
		defaultPort = 443;
	} else {
		requestModule = require("http");
		defaultPort = 80;
	}

	this.readyState = XMLHttpRequest.LOADING;


	var options = {
		hostname: host || "localhost",
		method: this._method,
		port: port || defaultPort,
		path: path,
		headers: this._requestHeaders
	};

	var req = requestModule.request(options, function(response) {
		response.setEncoding('utf8');
		this._responseHeaders = response.headers || {};

		var dataString = "";
		response.on('data', function (chunk) {
			dataString += chunk;
		});

		response.on("end", function() {
			this.readyState = XMLHttpRequest.DONE;
			this.responseText = dataString;

			this._listeners.readystatechange.forEach(function(listener) {
				listener.apply(this, response);
			}.bind(this));
		}.bind(this));

	}.bind(this));
	if (data) {
		req.write(data);
	}
	req.end();

	req.on('error', function(e) {
		this._listeners.error.forEach(function(listener) {
			listener.apply(this, e);
		}.bind(this));
	}.bind(this));

	req.on('timeout', function(e) {
		this._listeners.timeout.forEach(function(listener) {
			listener.apply(this, e);
		}.bind(this));
	}.bind(this));
};

module.exports = XMLHttpRequest;


})(module);
