sap.ui.define(["sap/ui/core/Control"], function (Control) {
"use strict";
return Control.extend("sap.ui.custom.Code", {
	metadata: {
		properties: {
			text: { type: "string", defaultValue: "" }
		}
	},

	init: function () {
	},

	renderer: {
		render: function (oRm, oControl) {
			oRm.write("<pre");
			oRm.writeControlData(oControl);
			oRm.addClass("sapUiCstCode");
			oRm.writeClasses();
			oRm.write(">");

			oRm.write(this.highlightJSON(oControl.getText()));

			oRm.write("</pre>");
		},

		highlightJSON: function(sCode) {
			var aRegex = [{
				search: /"([^"]*)":/g,
				replacement: "<span style='color: grey;'>\"$1\"</span>:"
			}, {
				search: /: "([^"]*)"/g,
				replacement: ": <span style='color: blue;'>\"$1\"</span>"
			}, {
				search: /: false/g,
				replacement: ": <span style='color: red;'>false</span>"
			}, {
				search: /: true/g,
				replacement: ": <span style='color: green;'>true</span>"
			}, {
				search: /: ([0-9]+)/g,
				replacement: ": <span style='color: rgb(150, 150, 0);'>$1</span>"
			}, {
				search: /: ([0-9]+\.[0-9]+)/g,
				replacement: ": <span style='color: rgb(200, 150, 0);'>$1</span>"
			}];

			for (var i = 0; i < aRegex.length; ++i) {
				sCode = sCode.replace(aRegex[i].search, aRegex[i].replacement);
			}

			return sCode;
		}
	}

}); });
