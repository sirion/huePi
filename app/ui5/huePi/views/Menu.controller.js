sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
"use strict";

return Controller.extend("sap.ui.iot.huePi.views.Menu", {

	onInit: function() {},

	onItemPress: function(oEvent) {
		sap.ui.getCore().getEventBus().publish("sap.ui.iot.huePi", "changeContentView", {
			viewName: "sap.ui.iot.huePi.views." + oEvent.getSource().getTitle()
		});

	}
});

});