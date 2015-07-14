/* global require */
/* eslint-disable no-console */

var NetworkScanner = require("../backend/modules/hue/NetworkScanner.js");


var i, ip;
var scanner = new NetworkScanner();

var ipStrings = [ "0.0.0.0", "255.255.255.255", "127.0.0.1", "10.0.0.10", "192.168.0.1", "127.255.0.127" ];
for (i = 0; i < 50; ++i) {
	ipStrings.push(Math.floor(Math.random() * 256) +  "." + Math.floor(Math.random() * 256) + "." + Math.floor(Math.random() * 256) + "." + Math.floor(Math.random() * 256));
}

for (i = 0; i < ipStrings.length; ++i) {
	ip = ipStrings[i];
	equals(scanner._intToIp4(scanner._ip4ToInt(ip)), ip, "Ip was correctly converted to int and back: " + ip);
}




function equals(value, expected, message) {
	"use strict";
	if (value === expected) {
		console.log("[OK] " + message);
	} else {
		console.error("[ERROR] " + message + " - Expected: " + expected + ", Value: " + value);
	}
}
