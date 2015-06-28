sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
"use strict";

return Controller.extend("sap.ui.iot.huePi.views.Main", {

	_maxNextUpdateDelay: 15000,
	_nextUpdateDelay: 5000,

	onInit: function() {
		this.oEventBus = sap.ui.getCore().getEventBus();
		this.oStatusModel = new sap.ui.model.json.JSONModel();
		this.oStatusModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
		this.getView().setModel(this.oStatusModel, "lights");

		this.oBridge = new Bridge();
		this.oBridge.on("update", function(oData) {
			// In case data has changed, it is quite probable that the bridge has other changes
			// queued that are not yet reflected in the data, so the next update should happen
			// sooner. As soon as no changes are detected any more, we can lower the update
			// frequency again.
			var oOldData = this.oStatusModel.getData();
			if (JSON.stringify(oOldData) != JSON.stringify(oData)) {
				// Do next update faster if something changed
				this._nextUpdateDelay = 250;
			} else if (this._nextUpdateDelay < this._maxNextUpdateDelay) {
				this._nextUpdateDelay += 250;
			}

			this.oStatusModel.setData(oData);
			// Automatically update light state at least every X ms
			this._updateTimeout = setTimeout(this.oBridge.update.bind(this.oBridge), this._nextUpdateDelay);
		}.bind(this));

		// TODO: Use custom data (or something) to distinguish items
		this.oEventBus.subscribe("sap.ui.iot.huePi", "changeContentView", function(sChannelId, sEventId, oData) {
			var oContent = this.byId("content");

			var oNewView = sap.ui.xmlview(oData);
			oContent.removeAllContent();
			oContent.addContent(oNewView);
			oContent.setShowSecondaryContent(false);
		}, this);

		this.oEventBus.subscribe("sap.ui.iot.huePi", "updateLights", this.updateLightsState.bind(this));

		this.oEventBus.subscribe("sap.ui.iot.huePi", "changeLightBrightness", function(sChannelId, sEventId, oData) {
			if (oData.final) {
				this.oBridge.setLightState(oData.lightId, oData);
			} else {
				// TODO: Live value change with maximum requests per interval
			}
		}, this);

	},

	updateLightsState: function() {
		if (this._updateTimeout) {
			clearTimeout(this._updateTimeout);
		}
		this.oBridge.update();
	},

	onPressMenu: function(oEvent) {
		var oContent = this.byId("content");
		oContent.setShowSecondaryContent(!oContent.getShowSecondaryContent());
	}

});

});
