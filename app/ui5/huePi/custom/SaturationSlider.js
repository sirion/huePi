sap.ui.define(["sap/m/Slider"], function (oSlider) {
"use strict";
return oSlider.extend("sap.ui.custom.SaturationSlider", {
	metadata: {
		properties: {
			hue: { type: "int", defaultValue: 0 }
		}
	},

	init: function () {
		if (sap.m.Slider.prototype.init) {
			sap.m.Slider.prototype.init.apply(this);
		}
	},

	setHue: function(iHue) {
		this.setProperty("hue", iHue, true);
		this.changeBackground();
		return this;
	},

	onAfterRendering: function() {
		sap.m.Slider.prototype.onAfterRendering.apply(this);
		this.changeBackground();
	},

	changeBackground: function() {
		var oDom = this.getDomRef();
		if (oDom) {
			if (!this.getEnabled()) {
				oDom.style.background = "";
			} else {
				var iHue = this.getHue();
				var sColor = this.getColorForHue(iHue);
				oDom.style.background = "linear-gradient(90deg, white 0%, " + sColor + "100%)";
			}
		}
	},

	getColorForHue: function(iHue) {
		var aRgbValues = [0, 0, 0];

		var fHue = iHue / 65535;

		for (var i = 0; i < 3; ++i) {
			var fHueComponent = fHue;
			switch (i) {
				case 0:
					fHueComponent += fHueComponent < 2 / 3 ? 1 / 3 : -2 / 3;
					break;

				case 2:
					fHueComponent -= fHueComponent > 1 / 3 ? 1 / 3 : -2 / 3;
					break;

				default:
			}

			var fComponent = 0;

			if (fHueComponent < 1 / 6) {
				fComponent = 6 * fHueComponent;
			} else if (fHueComponent < 0.5) {
				fComponent = 1;
			} else if (fHueComponent < 1 / 3) {
				fComponent = 6 * (2 / 3 - fHueComponent);
			}

			aRgbValues[i] = Math.round(fComponent * 255);
		}

		return "rgb(" + aRgbValues.join(", ") + ")";
	},

	renderer: "sap.m.SliderRenderer"

}); });
