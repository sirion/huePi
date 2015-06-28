sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
"use strict";

return Controller.extend("sap.ui.iot.huePi.views.Lights", {

	onInit: function() {
		sap.ui.getCore().getEventBus().publish("sap.ui.iot.huePi", "updateLights", {});
	},

	onLightPressed: function(oEvent) {
		this.byId("lightDetail").bindElement("lights>" + oEvent.getSource().getBindingContextPath("lights"));
	},

	onBrightnessChange: function(oEvent) {
		var iValue = oEvent.getParameter("value");
		var sLightId = oEvent.getSource().getBindingContext("lights").getPath().replace(/^\//, "");
		sap.ui.getCore().getEventBus().publish("sap.ui.iot.huePi", "changeLightBrightness", {
			lightId: sLightId, brightness: iValue, transitionTime: 0, final: true
		});
	},

	onBrightnessLiveChange: function(oEvent) {
		var iValue = oEvent.getParameter("value");
		var sLightId = oEvent.getSource().getBindingContext("lights").getPath().replace(/^\//, "");
		sap.ui.getCore().getEventBus().publish("sap.ui.iot.huePi", "changeLightBrightness", {
			lightId: sLightId, brightness: iValue, transitionTime: 0, final: false
		});
	},

	onHueChange: function(oEvent) {
		var iValue = oEvent.getParameter("value");
		var sLightId = oEvent.getSource().getBindingContext("lights").getPath().replace(/^\//, "");
		sap.ui.getCore().getEventBus().publish("sap.ui.iot.huePi", "changeLightBrightness", {
			lightId: sLightId, hue: iValue, transitionTime: 0, final: true
		});
	},

	onHueLiveChange: function(oEvent) {
		var iValue = oEvent.getParameter("value");
		var sLightId = oEvent.getSource().getBindingContext("lights").getPath().replace(/^\//, "");
		sap.ui.getCore().getEventBus().publish("sap.ui.iot.huePi", "changeLightBrightness", {
			lightId: sLightId, hue: iValue, transitionTime: 0, final: false
		});
	},

	onSaturationChange: function(oEvent) {
		var iValue = oEvent.getParameter("value");
		var sLightId = oEvent.getSource().getBindingContext("lights").getPath().replace(/^\//, "");
		sap.ui.getCore().getEventBus().publish("sap.ui.iot.huePi", "changeLightBrightness", {
			lightId: sLightId, saturation: iValue, transitionTime: 0, final: true
		});
	},

	onSaturationLiveChange: function(oEvent) {
		var iValue = oEvent.getParameter("value");
		var sLightId = oEvent.getSource().getBindingContext("lights").getPath().replace(/^\//, "");
		sap.ui.getCore().getEventBus().publish("sap.ui.iot.huePi", "changeLightBrightness", {
			lightId: sLightId, saturation: iValue, transitionTime: 0, final: false
		});
	},

	onLightSwitch: function(oEvent) {
		var bState = oEvent.getParameter("state");
		var sLightId = oEvent.getSource().getBindingContext("lights").getPath().replace(/^\//, "");
		sap.ui.getCore().getEventBus().publish("sap.ui.iot.huePi", "changeLightBrightness", {
			lightId: sLightId, on: bState, transitionTime: 0, final: true
		});
	},

	formatColorEnabled: function(sLightType) {
		if (!sLightType) {
			return false;
		}
		return sLightType.indexOf("color") > -1;
	}

}); });
