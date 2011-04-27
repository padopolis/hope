/* Webkit-style search input.  Tested only in Safari/Chome. 

	Observe "searchChanged" to be notified when the search value has changed.
	
*/


Script.require("{{hope}}Element-attach.js", function(){


//TODO: is this
new Element.Subclass("hope.SearchInput", {
	tag : "input",
	selector : "input[type=search]",
	properties : {
		// monitor events so we can call inputChanged
		onReady : function() {
			this.on({
				scope : this,
				keydown : "onDelaySearchChanged",
				search : "onImmediateSearchChanged",
				change : "onImmediateSearchChanged"
			});
		},

		keypressDelay : Attribute({name:"keypressDelay", type:"number", update:true, 
									inherit:true, value:500}),


	//
	//	event handling
	//

		onDelaySearchChanged : function() {
			this.soon(this.keypressDelay, "searchChangedEvent");
		},
		
		onImmediateSearchChanged : function() {
			this.soon(0, "searchChangedEvent");
		},
		
		onSearchChangedEvent : function() {
			if (this.value === this._lastSearchTerm) return;
			this._lastSearchTerm = this.value;
console.warn("onSearchChangedEvent");
			this.fire("searchChanged", this.value);
		}
	}
});


Script.loaded("{{hope}}SearchInput.js");
});
