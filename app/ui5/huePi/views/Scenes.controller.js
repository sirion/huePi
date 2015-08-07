sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
"use strict";

return Controller.extend("sap.ui.iot.huePi.views.Scenes", {

	onInit: function() {
		sap.ui.getCore().getEventBus().publish("sap.ui.iot.huePi", "updateScenes", {});
	}

});

});