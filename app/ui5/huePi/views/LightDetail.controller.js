sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
"use strict";

return Controller.extend("sap.ui.iot.huePi.views.LightDetail", {

	onInit: function() {

	},

	formatStringify: function(oObject) {
		return JSON.stringify(oObject, null, 4);
	}

});

});
