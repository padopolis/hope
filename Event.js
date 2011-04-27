/*	
	Browser event helpers.
	
*/

Script.require("", function(){

	// The global string STOP can be used to cancel events from propagating (eg: from .bubble)
	window.STOP = "***STOP***";
	window.CONTINUE = "***CONTINUE***";

	// debug events
	Event.debug = hope.debug("Events");
	Event.showEvents = hope.debug("showEvents");


	hope.extend(Event.prototype, {
		//
		//	`event.stop()` does both stopPropagation and preventDefault().
		//
		stop : function stop() {
			this.preventDefault();
			this.stopPropagation();
		},
	
		// return the first changedTouches object (for gesture event handling)
		//	maps correctly for desktops to the element itself
		touch : Getter(function() {
				return (this.changedTouches ? this.changedTouches[0] : this);
			}
		),
		
		// Return the event's x-coordinate in terms of an element's offsetParent.
		elementX : function(target) {
			if (!target) target = event.target;
			return (this.touch.pageX - target.pageLeft);
		},
		
		// Return the event's y-coordinate in terms of an element's offsetParent.
		elementY : function(target) {
			if (!target) target = event.target;
			return (this.touch.pageY - target.pageTop);
		}
	});


	// Static method to prevent event default behavior.
	//	You can pass this to an event handler to turn that event off.
	//		eg:  someWidget.on("mousedown", Event.preventDefault);
	Event.preventDefault = function(event) {
		event.preventDefault();
	}
	
	
Script.loaded("{{hope}}Event.js");
});// end Script.require()
