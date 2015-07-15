/* global module, process, require */
/* eslint-disable no-console */
(function(module, process, require) {
"use strict";

var NetworkScanner = require("./NetworkScanner.js");

function BridgeScanner() {
	this._properties = {
		ports: [ 80 ],
		timeout: 10000
	};

	this._http = require('http');
}

BridgeScanner.prototype = new NetworkScanner();

/**
 * Scans the network for possible bridges and returns a promise that resolves with the first
 * host information that turns out to be a bridge
 *
 * @returns {Promise} The promise that resolves as soon as a bridge is found
 * @public
 */
BridgeScanner.prototype.scan = function() {
	return new Promise(function(resolve, reject) {
		NetworkScanner.prototype.scan.apply(this).then(function(reachableHosts) {
			var done = [];

			var onBridge = function(hostInfo) {
				// Bridge found - resolve scan promise directly
				resolve(hostInfo);
			};

			var onNoBridge = function(hostInfo) {
				var doneIndex = done.indexOf(hostInfo.host + ":" + hostInfo.port);
				if (doneIndex > -1) {
					done.splice(doneIndex, 1);
				} else {
					console.error("Scanned host/port not found in done-list: " + hostInfo.host + ":" + hostInfo.port);
				}

				if (done.length === 0) {
					// All host have been scanned and no bridge was found
					reject();
				}
			};

			for (var host in reachableHosts) {
				var ports = reachableHosts[host];
				for (var i = 0; i < ports.length; ++i) {
					done.push(host + ":" + ports[i]);
					this._verifyBridge(host, ports[i]).then(onBridge, onNoBridge);
				}
			}

		}.bind(this));
	}.bind(this));
};


/**
 * Returns a promise that resolves when the given host on the given port is a bridge and rejects if not
 * or if an error occurrs
 *
 * @param {string} host - The host to be connecting to
 * @param {int} port - the port to be connecting to
 * @returns {Promise} The promise that resolves if a bridge was found and reject otherwise
 * @private
 */
BridgeScanner.prototype._verifyBridge = function(host, port) {
	return new Promise(function(resolve, reject) {
		var hostInfo = {
			host: host,
			port: port
		};

		this._http.get({
			hostname: host,
			port: port,
			path: "/description.xml"
		}, function(response) {
			var dataString = "";
			response.on("data", function(data) {
				dataString += data;
			});
			response.on("end", function() {
				// TODO: Chech the actual xml not just for one string...
				if (dataString.indexOf("Philips hue bridge") > -1) {
					resolve(hostInfo);
				} else {
					reject(hostInfo);
				}
			});
		}).on("error", function(ex) {
			reject(hostInfo);
		}).setTimeout(this.timeout());
	}.bind(this));
};



module.exports = BridgeScanner;

})(module, process, require);
