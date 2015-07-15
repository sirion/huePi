/* global module, process, require */
/* eslint-disable no-console */
(function(module, process, require) {
"use strict";

function NetworkScanner() {
	this._properties = {
		timeout: 30000
	};

	this._net = require('net');
}

/**
 * Sets or gets an internal property based on whether the value-argument is set
 *
 * @param {string} name - The name of the property to be set/gotten
 * @param {any|undefined} value - THe value of the property or undefined if used as getter
 * @returns {any|NetworkScanner} The current value or this-reference for method-chaining if used as setter
 * @private
 */
NetworkScanner.prototype._getSet = function(name, value) {
	if (value === undefined) {
		return this._properties[name];
	} else {
		this._properties[name] = value;
		return this;
	}
};

/**
 * Sets the IP at which to start the scan, or gets the value if so argument is given.
 *
 * @param {string|int} [ip4] - The IP as string or integer
 * @returns {int|NetworkScanner} The current value or this-reference for method-chaining if used as setter
 * @public
 */
NetworkScanner.prototype.startIp = function(ip4) {
	if (typeof ip4 === "string") {
		ip4 = this._ip4ToInt(ip4);
	}
	return this._getSet("startIp", ip4);
};

/**
 * Sets the number of hosts that are scanned starting from the startIp, or gets the value if so argument is given.
 *
 * @param {int} [number] - The amout of hosts to be scanned
 * @returns {int|NetworkScanner} The current value or this-reference for method-chaining if used as setter
 * @public
 */
NetworkScanner.prototype.numberOfHosts = function(number) {
	if (number !== undefined) {
		number = parseInt(number, 10);
	}
	return this._getSet("numberOfHosts", number);
};

/**
 * Sets the ports to be scanned on every host, or gets the value if so argument is given.
 *
 * @param {int[]|int} [ports] - The ports to be scanned
 * @returns {int[]|NetworkScanner} The current value or this-reference for method-chaining if used as setter
 * @public
 */
NetworkScanner.prototype.ports = function(ports) {
	if (ports !== undefined && !Array.isArray(ports)) {
		ports = [ ports ];
	}
	return this._getSet("ports", ports);
};

/**
 * Sets the connection timeout in ms, or gets the value if so argument is given.
 *
 * @param {int} [ms] - The timout in milliseconds
 * @returns {int|NetworkScanner} The current value or this-reference for method-chaining if used as setter
 * @public
 */
NetworkScanner.prototype.timeout = function(ms) {
	return this._getSet("timeout", ms);
};

/**
 * Returns a promise that resolves with a map of reachable hosts and their ports as property values.
 * Example: {
 *     "10.0.0.1": [ 80, 1337 ],
 *     "10.0.0.2": [ 80 ],
 *     "10.0.0.3": [ 22 ]
 * }
 *
 * @returns {Promise} The promise that resolves when all hosts have been scanned
 * @public
 */
NetworkScanner.prototype.scan = function() {
	var reachable = {};
	var scanPromises = [];

	var startIp = this.startIp();
	var endIp = startIp + this.numberOfHosts();
	var ports = this.ports();

	var onScanResult = function(hostInfo) {
		if (hostInfo.reachable) {
			if (reachable[hostInfo.host]) {
				reachable[hostInfo.host].push(hostInfo.port);
			} else {
				reachable[hostInfo.host] = [ hostInfo.port ];
			}
		}
	};

	for (var ip = startIp; ip < endIp; ++ip) {
		for (var i = 0; i < ports.length; ++i) {
			var promise = this.scanned(this._intToIp4(ip), ports[i]);
			scanPromises.push(promise);
			promise.then(onScanResult);
		}
	}

	return Promise.all(scanPromises).then(function() {
		return reachable;
	});
};

/**
 * Returns a promise that resolves as soon as the scanned host either answers, an error
 * occurrs or the timeout is reached. This promise never rejects, instead it resolves with an
 * object that contains the property "reachable" set to true or false. This behavior can be
 * used in combination with Promise.all() to react on the completion of all scans
 *
 * @param {string} host - The hostname or IP to be scanned
 * @param {int} port - The port to connect to
 * @returns {Promise} The promise that resolves when the connection has been established, times out or on error
 * @public
 */
NetworkScanner.prototype.scanned = function(host, port) {
	return new Promise(function(resolve, reject) {
		var client = new this._net.Socket();

		var onSuccess = function() {
			// Connection succesful
			resolve({
				host: host,
				port: port,
				reachable: true
			});
		};

		var onError = function() {
			// Connection error or timeout
			resolve({
				host: host,
				port: port,
				reachable: false
			});
		};

		client.on("connect", onSuccess);
		client.on("timeout", onError);
		client.on("error", onError);
		client.setTimeout(this.timeout());
		client.connect(port, host);
	}.bind(this));
};

NetworkScanner.prototype._ip4ToInt = function(ipString) {
	var intIp = 0;
	var parts = ipString.split(".");

	intIp += parseInt(parts[0], 10) << 24;
	intIp += parseInt(parts[1], 10) << 16;
	intIp += parseInt(parts[2], 10) <<  8;
	intIp += parseInt(parts[3], 10);

	return intIp;
};

NetworkScanner.prototype._intToIp4 = function(intIp) {
	var parts = [];

	parts[0] = ((intIp >>> 24) & 255);
	parts[1] = ((intIp >>> 16) & 255);
	parts[2] = ((intIp >>>  8) & 255);
	parts[3] = intIp & 255;

    return parts.join(".");
};



module.exports = NetworkScanner;

})(module, process, require);
