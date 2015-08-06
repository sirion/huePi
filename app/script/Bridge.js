/* global module, require */

(function() {
"use strict";

// The Bridge can be used in client side scenarios as well as server side.
// TODO: This is a bad architecture - find a better way to reuse the code.
var XMLHttpRequest;
if (typeof module !== "undefined") {
	XMLHttpRequest = require("./XMLHttpRequest.js");
	module.exports = Bridge;
} else if (typeof window !== "undefined"){
	XMLHttpRequest = window.XMLHttpRequest;
	// Export to global namespace
	window.Bridge = Bridge;
}



function Bridge() {
	if (Bridge._oInstance) {
		return Bridge._oInstance;
	}

	Bridge._oInstance = this;

	this._sBridgeUrl = "/bridge/";

	this._oLightState = {};
	this._eventListeners = {};
	this.update();
}

////////////////////////////////////////// Static Methods /////////////////////////////////////////

Bridge.getInstance = function() {
	if (Bridge._oInstance) {
		return Bridge._oInstance;
	} else {
		return new Bridge();
	}
};

////////////////////////////////////////// Public Methods /////////////////////////////////////////

Bridge.prototype.bridgeUrl = function(url) {
	if (url === undefined) {
		return this._sBridgeUrl;
	} else {
		this._sBridgeUrl = url;
		return this;
	}
};

Bridge.prototype.initialized = function() {
	return this._pInitialized;
};

Bridge.prototype.update = function() {
	if (!this._pUpdate) {
		console.log("Creating new update request...");
		this._pUpdate = this._bridgeRequest({ url: "lights" }).then(function(oData) {
			console.log("Update successfull");
			this._pUpdate = null;
			this._oLightState = oData.data;
			this._fire("update", [ this._oLightState ]);
			return this._oLightState;
		}.bind(this), function() {
			console.log("Update failed");
			this._pUpdate = null;
			throw new Error("Cannot receive bridge status data");
		}.bind(this));
	}
	return this._pUpdate;
};

Bridge.prototype.toggleLight = function(sLightId, bState) {
	bState = bState === undefined ? !this._oLightState[sLightId].state.on : true;
	var transition = this._oLightState[sLightId].manufacturername == "OSRAM" ? 0 : 20;

	var mPayload = {
		url: "lights/" + sLightId + "/state",
		method: "PUT",
		data: JSON.stringify({
			on: bState,
			bri: 254,
			transitiontime: transition
		})
	};

	if (bState != this._oLightState[sLightId].state.on) {
		this._bridgeRequest(mPayload).then(this.update.bind(this));
	} else {
		this._bridgeRequest(mPayload);
	}
};

Bridge.prototype.setBrightness = function(sLightId, iBrightness) {
	var iTransition = this._oLightState[sLightId].manufacturername == "OSRAM" ? 0 : 20;
	var mPayload = {
		url: "lights/" + sLightId + "/state",
		method: "PUT",
		data: JSON.stringify({
			on: true,
			bri: iBrightness,
			transitiontime: iTransition
		})
	};

	this._bridgeRequest(mPayload).then(this.update.bind(this));
};

Bridge.prototype.setLightState = function(sLightId, mStateData) {
	var mCurrentState = this._oLightState[sLightId].state;

	var mStatePayload = {
		on:  mStateData.on             === null ? mCurrentState.on : mStateData.on,
		bri: mStateData.brightness     === null ? mCurrentState.bri : mStateData.brightness,
		hue: mStateData.hue            === null ? mCurrentState.hue : mStateData.hue,
		sat: mStateData.saturation     === null ? mCurrentState.sat : mStateData.saturation,
		transitiontime:
		     mStateData.transitionTime === null ?                20 : mStateData.transitionTime
	};
	if (this._oLightState[sLightId].manufacturername == "OSRAM") {
		mStatePayload.transitiontime = 0;
	}

	var mPayload = {
		url: "lights/" + sLightId + "/state",
		method: "PUT",
		data: JSON.stringify(mStatePayload)
	};

	this._bridgeRequest(mPayload).then(this.update.bind(this));
};

/**
 * Attach to event sEventName with the given fnCallback function
 * Currently available events:
 *  - "update" - Fired when the light status was updated fromt he backend
 *
 * @param {string} sEventName - The name of the event to attach to.
 * @param {function} fnCallback - The callback to be invoked when the event fires.
 * @returns {void}
 * @public
 */
Bridge.prototype.on = function(sEventName, fnCallback) {
	if (!this._eventListeners[sEventName]) {
		this._eventListeners[sEventName] = [];
	}
	this._eventListeners[sEventName].push(fnCallback);
};




////////////////////////////////////////// Private Methods /////////////////////////////////////////

Bridge.prototype._fire = function(sEventName, aArguments) {
	if (this._eventListeners[sEventName]) {
		for (var i = 0; i < this._eventListeners[sEventName].length; ++i) {
			this._eventListeners[sEventName][i].apply(this, aArguments);
		}
	}
};

Bridge.prototype._extend = function() {
	var object = arguments[0];

	for (var i = 1; i < arguments.length; ++i) {
		for (var key in arguments[i]) {
			object[key] = arguments[i][key];
		}
	}

	return object;
};

Bridge.prototype._request = function(mOptions) {
	var mDefaults = {
		method: "GET",
		data: null
	};
	var mRequestOptions = this._extend({}, mDefaults, mOptions);
	// Only asynchronous requests
	mRequestOptions.async = true;

	if (!mRequestOptions.url) {
		throw new Error("url-property is needed in argument for request function");
	}


	return new Promise(function(fnResolve, fnReject) {
		var request = new XMLHttpRequest();
		request.addEventListener("readystatechange", function() {
			if (request.readyState === XMLHttpRequest.DONE) {
				
				if (request.status >= 200 && request.status < 300) {
					// Ok
					var data;
					if (request.getResponseHeader("content-type") == "application/json") {
						data = JSON.parse(request.responseText);
					} else {
						data = request.responseText;
					}


					fnResolve({
						data: data,
						request: request
					});
				} else {
					fnReject({
						data: data,
						request: request
					});
				}

			}
		});

		request.addEventListener("error", function(event) {
			debugger;
			fnReject(error);
		});

		request.addEventListener("timeout", function(event) {
			debugger;
			fnReject(error);
		});

		if (mRequestOptions.headers) {
			Object.keys(mRequestOptions.headers).forEach(function(header) {
				request.setRequestHeader(header, mRequestOptions.headers[header]);
			});
		}
		request.open(mRequestOptions.method, mRequestOptions.url, mRequestOptions.async);
		console.log("sent: " + JSON.stringify(mRequestOptions));
		request.send(mRequestOptions.data);
	});
};

Bridge.prototype._bridgeRequest = function(mOptions) {
	mOptions.url = this._sBridgeUrl + mOptions.url;
	return this._request(mOptions);
};




////////////////////////////////////////// Helper Functions /////////////////////////////////////////


})();
