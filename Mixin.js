/* 	Mixin constructor.  

	You don't have to use this, your mixin just needs to define a "mixinTo" method.
	This is mainly here for clearer semantics to create mixins.

	eg:
		new Mixin("Valued", {
			// OPTIONAL: method to mix into source thing, a good default will be provided.
			//				Override to do something exotic.
			mixinTo : function(it) { ... },
			
			// OPTIONAL: properties to use to extend the instance prototype
			properties : {...},
			
			// OPTIONAL: properties to use to extend the constructor
			"static" : {...}
		});
	
*/

Script.require("{{hope}}Class.js", function() {
	
	function Mixin(id, theMixin) {
		if (!theMixin) theMixin = {};
		
		// define a mixinTo property
		if (!theMixin.mixinTo) {
			theMixin.mixinTo = function mixinTo(it, asClass) {
				var statics = theMixin['static'],
					properties = theMixin.properties
				;
				// if we're mixing into a class, 
				//		mix the static stuff into the class an properties into the prototype
				if (asClass || it.isAClass) {
					if (statics)  	hope.extendIf(it, statics);
					if (properties) hope.extendIf(it.prototype, properties);
				} 
				// otherwise mix both static and properties into the object itself
				else {
					if (statics)  	hope.extendIf(it, statics);
					if (properties) hope.extendIf(it, properties);
				}
				return it;
			}
		}
		
		theMixin.isAMixin = true;
		theMixin.id = id;
		
		// define the mixin globally
		hope.setGlobal(id, theMixin);
		
		return theMixin;
	}
	
	// TODO: hope.Mixin ?
	hope.setGlobal("Mixin", Mixin);

	Script.loaded("{{hope}}Mixin.js");
});
