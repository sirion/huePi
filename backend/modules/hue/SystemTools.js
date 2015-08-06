/* global module, process, require */
/* eslint-disable no-console */
(function(module, process) {
"use strict";

var SystemTools = {

	/**
	 * Checks if all programs needed to run the methods of this class are available on the system
	 *
	 * @returns {void}
	 * @private
	 */
	checkRequiredPrograms: function(requiredPrograms, requiredModules) {
		var hasRequiredPrograms = requiredPrograms.reduce(function(previousValue, currentValue) {
			var programExists = this._programExists(currentValue);
			if (!programExists) {
				console.error("Required program " + currentValue + " not found in path.");
			}
			return previousValue && programExists;
		}.bind(this));

		var hasrequiredModules = requiredModules.reduce(function(previousValue, currentValue) {
			var programExists = false;
			try {
				require.resolve(currentValue);
				programExists = true;
			} catch (ex) {
				console.error("Required node module " + currentValue + " not found in path.");
			}

			return previousValue && programExists;
		});

		return hasRequiredPrograms && hasrequiredModules;
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
		if (!this._fs) {
			this._fs = require("fs");
		}

		// TODO: Are paths separated by ":" on every platform?
		var paths = process.env.PATH.split(":");

		for (var i = 0; i < paths.length; ++i) {
			var execPath = paths[i] + "/" + execName;
			if (this._fs.existsSync(execPath)) {
				return true;
			}

			if (this._isWindows) {
				if (
					this._fs.existsSync(execPath + ".exe") ||
					this._fs.existsSync(execPath + ".com") ||
					this._fs.existsSync(execPath + ".bat") ||
					this._fs.existsSync(execPath + ".cmd")
				) {
					return true;
				}
			}
		}

		return false;
	}

};


// Only exporting public interface
module.exports = SystemTools;

})(module, process);
