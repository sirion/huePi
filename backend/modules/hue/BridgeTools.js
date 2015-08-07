/* global module, process, require */
/* eslint-disable no-console */
(function(module, process) {
"use strict";

var SystemTools = require("./SystemTools.js");

var BridgeTools = {

	_defaultConfig: {
		bridgeUser: "",
		bridgeHost: "",
		bridgePort: 80 // Bridge always listens on standard HTTP port
	},

	_requiredPrograms: [
		// removed: ip grep awk tail sed
		// "nmap", "awk", "sed", "curl", "grep", "wc", "sort", "uniq", "cat", "ip", "tail" // Not needed any more, since we do not call bash scripts
	],

	_requiredModules: [
		"fs", "os", "node-ssdp", "https"
	],

	// External resolve/reject methods for the ready Promise
	_resolveReady: null,
	_rejectReady: null,

	_ready: new Promise(function(resolve, reject) {
		this._resolveReady = resolve;
		this._rejectReady = reject;
	}.bind(this)),

	init: function() {
		this._isWindows = process.platform.indexOf("win") === 0;
		this._userDir = process.env[this._isWindows ? 'USERPROFILE' : 'HOME'];
		this._appDir = this._userDir + "/.huePi";
		this._configPath = this._appDir + "/config.json";

		this.config = this._readConfig();
		this._defaults(this.config, this._defaultConfig);
		// console.log("read config: " + JSON.stringify(this.config, null, 4));

		
		if ((!this.config.bridgeUser || !this.config.bridgeHost) && !SystemTools.checkRequiredPrograms(this._requiredPrograms, this._requiredModules)) {
			console.error("Please install required programs in the system");
			throw new Error("Not all required programs are available on the system");
		}

		return this._whenBridgeDiscovered().then(function() {
			return this._whenUserCreated();
		}.bind(this), function() {
			this._rejectReady(new Error("Bridge could not be discovered"));
		}.bind(this)).then(function() {
			this._resolveReady(this.config);
		}.bind(this), function() {
			this._rejectReady(new Error("User could not be created"));
		}.bind(this));
	},

	/**
	 * Returns a promise that resolves when contact to the bridge has been established,
	 * meaning that the IP has been discovered, a user has been created and the connection
	 * was successfull
	 *
	 * @returns {Promise} The promise that resolves when commincation is established or else rejects with an error
	 * @public
	 */
	ready: function() {
		return this._ready;
	},

	/**
	 * Returns a promise that resolves when the bridge host/ip has been discovered on the network
	 * or one has already been stored in the configuration before
	 *
	 * @returns {Promise} The promise that resolves when the bridge host/ip is known
	 * @private
	 */
	_whenBridgeDiscovered: function() {
		if (this.config.bridgeHost) {
			// TODO: Check if bridge is available, else search for bridge again (might have gotten a different IP from DHCP)
			return Promise.resolve();
		} else {
			// No stored bridge host, try to discover the bridge...

			// Discover via SSDP
			return this._bridgeDiscoveredViaSsdp().then(function(bridgeData) {
				// SSDP Scan successful
				this.config.bridgeHost = bridgeData.bridgeHost;
				this._writeConfig();
				return this.config;
			}.bind(this), function() {
				// SSDP Scan not successful
				// Discover via web service
				return this._bridgeDiscoveredViaWeb().then(function(bridgeData) {
					this.config.bridgeHost = bridgeData.bridgeHost;
					this._writeConfig();
					return this.config;
				}.bind(this), function() {
					var BridgeScanner = require("./modules/hue/BridgeScanner.js");
					var bridgeScanner = new BridgeScanner();
					bridgeScanner.startIp("192.168.1.1");
					bridgeScanner.numberOfHosts(254);
					bridgeScanner.timeout(5000);
					return bridgeScanner.scan().then(function(hostInfo) {
						this.config.bridgeHost = hostInfo.host;
						this._writeConfig();
						return this.config;
					}.bind(this));
				});
			});


		}
	},

	_bridgeDiscoveredViaSsdp: function() {
		return Promise.reject();

		return new Promise(function(resolve, reject) {
			if (!this._ssdp) {
				this._ssdp = require("node-ssdp");
			}

			// TODO: Discover via SSDP
			throw new Error("Scan via SSDP not yet implemented");
		});
	},

	/**
	 * Returns a promise that resolves when the official webservice returns an internal bridge IP for the current
	 * network and rejects otherwise.
	 *
	 * @returns {Promise} The Promise that resolves when the bridge IP has been returned from the webservice
	 * @private
	 */
	_bridgeDiscoveredViaWeb: function() {
		return new Promise(function(resolve, reject) {
			if (!this._https) {
				this._https = require("https");
			}

			var options = {
				host: 'www.meethue.com',
				path: '/api/nupnp'
			};

			var onDataReceived = function(data) {
				try {
					var bridgeData = JSON.parse(data);
					if (bridgeData.internalipaddress) {
						resolve({
							bridgeHost: bridgeData.internalipaddress
						});
					} else {
						throw new Error("Response from web service did not contain Bridge IP");
					}
				} catch (ex) {
					reject(ex);
				}
			};

			var request = this._https.request(options, function (response) {
				var dataString = '';
				response.oStringn('data', function (data) {
					dataString += data;
				});
				response.on('end', function () {
					onDataReceived(dataString);
				});
			});
			request.on('error', function (ex) {
				reject(ex);
			});
			request.end();
		}.bind(this));
	},

	/**
	 * Returns a promise that resolves when the bridge user has been created or one has already
	 * been stored in the configuration before
	 *
	 * @returns {Promise} The promise that resolves when a user is available
	 * @private
	 */
	_whenUserCreated: function() {
		if (this.config.bridgeUser) {
			return Promise.resolve();
		} else {
			throw "BridgeTools._whenUserCreated: Not yet implemented";
			// TODO: IMplement user creation. Afterwards: this._writeConfig();

		}
	},

	/**
	 * Returns a list of all IPv4 addresses bound to the network interfaces on this machine, exluding 127.0.0.1
	 *
	 * @returns {string[]} A list of IPv4 addresses
	 * @private
	 */
	_findNetworkAddresses4: function() {
		var addresses = [];

		if (!this._os) {
			this._os = require("os");
		}

		var networkInterfaces = this._os.networkInterfaces();
		for (var name in networkInterfaces) {
			var interfaceInfos = networkInterfaces[name];
			for (var i = 0; i < interfaceInfos.length; ++i) {
				var interfaceInfo = interfaceInfos[i];
				if (interfaceInfo.family !== "IPv4" || interfaceInfo.address === "127.0.0.1") {
					continue;
				}
				addresses.push(interfaceInfo.address);
			}
		}

		return addresses;
	},

	/**
	 * Reads the saved config from ~/.huePi/config.json
	 *
	 * @returns {map} The configuration map
	 * @public
	 */
	_readConfig: function() {
		var config = {};

		if (!this._fs) {
			this._fs = require("fs");
		}

		if (!this._fs.existsSync(this._configPath)) {
			console.log("Config file does not exist, will be created: " + this._configPath);
		} else {
			try {
				var configData = this._fs.readFileSync(this._configPath, { encoding: "utf-8" });
				// Remove comments which are invalid in real JSON
				configData = configData
					.replace(/\/\/.*/g, "")
					.replace(/\/\*.*\*\//gm, "");
				config = JSON.parse(configData);
			} catch (ex) {
				console.error("Config file could not be parsed: " + this._configPath);
			}
		}

		return config;
	},

	/**
	 * Writes the given map to the configuration file ~/.huePi/config.json
	 *
	 * @param {map} config - The configuration map
	 * @param {boolean} doNotMerge - If set to true, do not read current config to merge it with
	 * @returns {void}
	 * @public
	 */
	_writeConfig: function(config, doNotMerge) {
		if (config === undefined) {
			config = {};
		}
		if (!this._fs) {
			this._fs = require("fs");
		}

		if (!doNotMerge) {
			var oldConfig = this._readConfig();
			this._defaults(config, oldConfig);
		}

		// TODO: Preserve comments
		try {
			this._fs.writeFileSync(this._configPath, JSON.stringify(config), { encoding: "utf-8" });
		} catch (ex) {
			console.error("Could not write config file " + this._configPath + " - " + ex.message);
		}
	},

	/**
	 * Writes all properties that are not set in the first argument from the following arguments into the first one.
	 *
	 * @param {map} target - The object to be enriched
	 * @param {...map} source - The source of the values written into the first argument
	 * @returns {void}
	 * @private
	 */
	_defaults: function(target, source) {
		if (typeof target !== "object" || target === null) {
			console.error("BridgeTools._defaults: Wrong invocation, first argument must be an object");
		}

		var argumentList = Array.prototype.slice.apply(arguments, [ 1 ]);
		for (var i = 0; i < argumentList.length; ++i) {
			var sourceMap = argumentList[i];
			if (typeof sourceMap !== "object" || sourceMap === null) {
				console.error("BridgeTools._defaults: Wrong invocation, argument #" + (i + 2) + " must be an object");
				continue;
			}
			for (var key in sourceMap) {
				if (!target.hasOwnProperty(key)) {
					target[key] = sourceMap[key];
				}
			}
		}
	},

	getBridgeConfig: function() {
		return {
			host: this.config.bridgeHost,
			user: this.config.bridgeUser,
			port: this.config.bridgePort
		};
	}

};

BridgeTools.init();



// Only exporting public interface
module.exports = {
	getBridgeConfig: BridgeTools.getBridgeConfig.bind(BridgeTools),
	ready: BridgeTools.ready.bind(BridgeTools)
};

})(module, process);
