var httpPort = 8888;
var bridgePort = 8887;

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
	var pos;

	pos = val.indexOf("--port=");
	if (pos === 0) {
		httpPort = parseInt(val.substr(7), 10) || httpPort;
		console.log("Setting server port to " + httpPort);
	}

	pos = val.indexOf("--bridgePort=");
	if (pos === 0) {
		bridgePort = parseInt(val.substr(13), 10) || bridgePort;
		console.log("Setting bridge port to " + bridgePort);
	}
});


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
			user: user
			// Not providing bridge port as we will proxy the request
		};
		response.statusCode = 200;
		response.setHeader("Content-Type", "application/json");
		response.write(JSON.stringify(data), "utf8");
		response.end();
	} else if (request.url.indexOf("/bridge/") == 0) {
		// var proxy = http.createClient(80, bridgeIp);
		// var proxy_request = proxy.request(request.method, request.url, request.headers);

		// Proxy request
		var options = {
			hostname: "localhost",
			port: bridgePort,
			path: request.url.replace(/^\/bridge\//, "/api/" + user + "/"),
			method: request.method
		};

		console.log("Forwarding to " + options.method + ": " + options.hostname + options.path);

		// Bridge to client
		var proxy = http.request(options, function (bridgeResponse) {
			response.writeHead(bridgeResponse.statusCode, bridgeResponse.headers);

			bridgeResponse.on("data", function(data) {
				response.write(data, "binary");
			});
			bridgeResponse.on("end", function() {
				response.end();
			});
		});

		// Client to bridge
		request.on("data", function(data) {
			proxy.write(data, "binary");
		});
		request.on("end", function() {
			proxy.end();
		});

	} else {
		fileServer.serve(request, response);
	}
}

})();
