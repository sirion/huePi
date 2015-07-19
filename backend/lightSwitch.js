/* global require, process */

var BridgeTools = require("./modules/hue/BridgeTools.js");
var Bridge = require("../app/script/Bridge.js");
var Gpio = require('onoff').Gpio;


var bridgeConfig = BridgeTools.getBridgeConfig();
if (!bridgeConfig.host || !bridgeConfig.user) {
	console.error("Error getting bridge user and ip from the configuration file. Aborting server start");
	process.exit(1);
}

console.log("Staring LightSwitch...");

var bridge = new Bridge();
bridge.bridgeUrl("http://" + bridgeConfig.host + "/api/" + bridgeConfig.user + "/");

var button = new Gpio(2, 'in', 'rising');

button.watch(function(error, value) {
	if (value == 1) {
		bridge.update().then(function(lightState) {
			var promises = [];
			var allOn = true;
			for (var lightId in lightState) {
				if (!lightState[lightId].state.on) {
					allOn = false;
					break;
				}
			}

			for (var lightId in lightState) {
				var data = {
					bri: 254,
					hue: 14487,
					sat: 165
				};
				if (lightState[lightId].state.on == allOn) {
					data.on = !allOn;
				}

				// console.log("set State: " + JSON.stringify(data, null, 4));

				promises.push(bridge._bridgeRequest({
					method: "PUT",
					url: "lights/" + lightId + "/state",
					data: JSON.stringify(data),
					headers: {
						"Content-Type": "aplication/json"
					}
				}));
			}

			Promise.all(promises).then(bridge.update.bind(bridge));
		});
	}
});

process.on('SIGINT', process.exit.bind(process, 0));
