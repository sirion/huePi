var httpPort = 8888;



/* global require, process */
/* eslint-disable no-console */
(function() {
"use strict";


var http, fs, staticServer, hasModules = true;
try { http = require("http"); } catch (ex) { hasModules = false; console.error("Please install node module \"http\"."); }
try { staticServer = require("node-static"); } catch (ex) { hasModules = false; console.error("Please install node module \"node-static\"."); }
try { fs = require("fs"); } catch (ex) { hasModules = false; console.error("Please install node module \"fs\"."); }

if (!hasModules) {
	process.exit(1);
}


var BridgeTools = require("./modules/hue/BridgeTools.js");

var fileServer = new staticServer.Server('../app');

process.argv.forEach(function (val, index, array) {
	var pos = val.indexOf("--port=");
	if (pos > -1) {
		httpPort = parseInt(val.substr(pos), 10) || httpPort;
		console.log("Setting server port to " + httpPort);
	}
});


console.log("Searching for bridge...");

var bridgeConfig = BridgeTools.getBridgeConfig();


if (!bridgeConfig.host || !bridgeConfig.user) {
	console.error("Error getting bridge user and ip from the configuration file. Aborting server start");
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

	/* if (request.url.indexOf("/bridgeConfig.json") == 0) {
		// Return configuration
		var data = {
			user: bridge.user,
			host: bridge.host,
			port: 80 // The hue bridge always listens on port 80
		};
		response.statusCode = 200;
		response.setHeader("Content-Type", "application/json");
		response.write(JSON.stringify(data), "utf8");
		response.end();
	} else */ if (request.url.indexOf("/bridge/") == 0) {
		// Proxy request
		var options = {
			hostname: bridgeConfig.host,
			port: bridgeConfig.port,
			path: request.url.replace(/^\/bridge\//, "/api/" + bridgeConfig.user + "/"),
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
