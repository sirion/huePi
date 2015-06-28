var httpPort = 8888;


/* global require, process */
/* eslint-disable no-console */
(function() {
"use strict";

var http = require("http");
var staticServer = require('node-static');
var fs = require('fs');

var fileServer = new staticServer.Server('../app');

var userDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

process.argv.forEach(function (val, index, array) {
	var pos = val.indexOf("--port=");
	if (pos > -1) {
		httpPort = parseInt(val.substr(pos), 10) || httpPort;
		console.log("Setting server port to " + httpPort);
	}
});


var bridgeIp = "";
var user = "";

console.log("Searching for bridge...");

try {
	require("child_process").execSync("../tools/findBridge", {
		cwd: "../tools",
		encoding: "utf8"
	});
} catch (ex) {
	// Ignored...
}
try {
	bridgeIp = fs.readFileSync(userDir + "/.huePi/bridgeIp", { encoding: "utf8"});
	user = fs.readFileSync(userDir + "/.huePi/bridgeUser", { encoding: "utf8"});
} catch (ex) {
	console.error("Error getting bridge user and ip. Aborting server start");
	process.exit(1);
}


http.createServer(function() {
	// Never stop server because of an error inside onRequest
	try {
		onRequest.apply(this, arguments);
	} catch (ex) {
		console.error("Error in onRequest: " + ex);
	}
}).listen(httpPort);

console.log("Server is listening on port " + httpPort);


function onRequest(request, response) {
	console.log('serving: ' + request.url);

	if (request.url.indexOf("/bridgeConfig.json") == 0) {
		// Return configuration
		var data = {
			user: user,
			host: bridgeIp,
			port: 80 // The hue bridge always listens on port 80
		};
		response.statusCode = 200;
		response.setHeader("Content-Type", "application/json");
		response.write(JSON.stringify(data), "utf8");
		response.end();
	} else {
		fileServer.serve(request, response);
	}
}

})();
