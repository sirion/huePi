(function(window, undefined) {
"use strict";

function Bridge() {
	if (Bridge._oInstance) {
		return Bridge._oInstance;
	}

	Bridge._oInstance = this;

	this._oLightState = {};
	this._sBridgeUser = null;
	this._sBridgeHost = null;
	this._sBridgePort = null;

	this._eventListeners = {};

	this._pInitialized = new Promise(function(fnResolve, fnReject) {
		this._request({
			url: "/bridgeConfig.json"
		}).then(function(oRequestInfo) {
			this._sBridgeUser = oRequestInfo.data.user;
			this._sBridgeHost = oRequestInfo.data.host;
			this._sBridgePort = oRequestInfo.data.port;

			if (this._sBridgeUser) {
				if (this._sBridgeHost) {
					this._sBridgeUrl = "http://" + this._sBridgeHost;

					if (this._sBridgePort) {
						this._sBridgeUrl += ":" + this._sBridgePort;
					}
				} else {
					this._sBridgeUrl = "/bridge";
				}

				this._sBridgeUrl += "/api/" + this._sBridgeUser + "/";
				fnResolve();
				this.update();
			} else {
				fnReject(new Error("Could not read configuration from backend. Aborting."));
			}
		}.bind(this));
	}.bind(this));
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

Bridge.prototype.initialized = function() {
	return this._pInitialized;
};

Bridge.prototype.update = function() {
	if (!this._pUpdate) {
		this._pUpdate = this._pInitialized.then(function() {
			return this._bridgeRequest({ url: "lights" }).then(function(oData) {
				this._pUpdate = null;
				this._oLightState = oData.data;
				this._fire("update", [ this._oLightState ]);
				return this._oLightState;
			}.bind(this)).catch(function() {
				this._pUpdate = null;
				throw new Error("Cannot receive bridge status data");
			}.bind(this));
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
			}
		});

		request.open(mRequestOptions.method, mRequestOptions.url, mRequestOptions.async);
		request.send(mRequestOptions.data);
	});
};

Bridge.prototype._bridgeRequest = function(mOptions) {
	mOptions.url = this._sBridgeUrl + mOptions.url;
	return this._request(mOptions);
};














////////////////////////////////////////// Helper Functions /////////////////////////////////////////





// Export to global namespace
window.Bridge = Bridge;

})(window);
