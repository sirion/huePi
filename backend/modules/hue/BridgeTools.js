/* global module, process, require */
/* eslint-disable no-console */
(function(module, process) {
"use strict";

var fs = require("fs");
var os = require("os");

var isWindows = process.platform.indexOf("win") === 0;
var userDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var appDir = userDir + "/.huePi";
var configPath = appDir + "/config.json";


var defaultConfig = {
	bridgeUser: "",
	bridgeHost: ""
};

var BridgeTools = {

	init: function() {
		this.config = this._readConfig();
		this._defaults(this.config, defaultConfig);
		
		console.log("read config: " + JSON.stringify(this.config, null, 4));
	},

	/**
	 * Checks if all programs needed to run the methods of this class are available on the system
	 *
	 * @returns {void}
	 * @private
	 */
	_checkRequiredPrograms: function() {
		// removed: ip grep awk tail sed
		var requiredPrograms = [ "nmap", "awk", "sed", "curl", "grep", "wc", "sort", "uniq", "cat", "ip", "tail" ];
		return requiredPrograms.reduce(function(previousValue, currentValue) {
			var programExists = this._programExists(currentValue);
			if (!programExists) {
				console.error("Required program " + currentValue + " not found in path.");
			}
			return previousValue && programExists;
		}.bind(this));
	},

	/**
	 * Checks for the existence of the given file in all paths. On windows also checks for the given
	 * name + ".exe", ".com", ".bat", ".cmd
	 *
	 * @param {string} execName - The name of the executable to search for
	 * @returns {boolean} Whether the executable exists in the path
	 * @private
	 */
	_programExists: function(execName) {
		// TODO: Are paths separated by ":" on every platform?
		var paths = process.env.PATH.plit(":");

		for (var i = 0; i < paths.length; ++i) {
			var execPath = paths[i] + "/" + execName;
			if (fs.existsSync(execPath)) {
				return true;
			}

			if (isWindows) {
				if (
					fs.existsSync(execPath + ".exe") ||
					fs.existsSync(execPath + ".com") ||
					fs.existsSync(execPath + ".bat") ||
					fs.existsSync(execPath + ".cmd")
				) {
					return true;
				}
			}
		}

		return false;
	},

	/**
	 * Returns a list of all IPv4 addresses bound to the network interfaces on this machine, exluding 127.0.0.1
	 *
	 * @returns {string[]} A list of IPv4 addresses
	 * @private
	 */
	_findNetworkAddresses4: function() {
		var addresses = [];

		var networkInterfaces = os.networkInterfaces();
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
		try {
			var configData = fs.readFileSync(configPath, { encoding: "utf-8" });
			// Remove comments which are invalid in real JSON
			configData = configData
				.replace(/\/\/.*/g, "")
				.replace(/\/\*.*\*\//gm, "");
			config = JSON.parse(configData);
		} catch (ex) {
			console.error("Config file could not be parsed: " + configPath);
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
		if (!doNotMerge) {
			var oldConfig = this._readConfig();
			this._defaults(config, oldConfig);
		}

		// TODO: Preserve comments
		try {
			fs.writeFileSync(configPath, JSON.stringify(config), { encoding: "utf-8" });
		} catch (ex) {
			console.error("Could not write config file " + configPath + " - " + ex.message);
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
			port: this.config.bridgePort || 80  // Bridge always listens on standard HTTP port
		};
	},

	createUser: function() {

	},

	findBridge: function() {

	}

};


BridgeTools.init();















// Only exporting public interface
module.exports = {
	createUser:  BridgeTools.createUser.bind(BridgeTools),
	findBridge:  BridgeTools.findBridge.bind(BridgeTools),
	getBridgeConfig:  BridgeTools.getBridgeConfig.bind(BridgeTools)
};

})(module, process);
