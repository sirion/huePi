/* global require */
/* eslint-disable no-console */

require('es6-promise').polyfill();
var NetworkScanner = require("../backend/modules/hue/NetworkScanner.js");
var BridgeScanner = require("../backend/modules/hue/BridgeScanner.js");

var scanner = new NetworkScanner();

scanner.startIp("192.168.1.1");
scanner.numberOfHosts(254);
scanner.ports(80);
scanner.timeout(5000);

var bridgeScanner = new BridgeScanner();
bridgeScanner.startIp("192.168.1.1");
bridgeScanner.numberOfHosts(254);
bridgeScanner.timeout(5000);

scanner.scan().then(function(results) {
	console.log("Hosts with open port 80:");
	console.log(JSON.stringify(results, null, 4));

	bridgeScanner.scan().then(function(results) {
		console.log("Bridges:");
		console.log(JSON.stringify(results, null, 4));

		process.exit(0);
	})

});
