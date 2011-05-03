/* UI -- this is generally the outside element of the main part of your UI. 
		It's a section so it can have a header, footer, etc.
*/

Script.require("{{hope}}Stack.js", function(){


new hope.Stack.Subclass("hope.UI", {
	tag : "ui",
	properties : {}
});


Script.loaded("{{hope}}UI.js");
});
