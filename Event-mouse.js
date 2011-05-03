/*	
	Mouse event helpers.
*/

Script.require("{{hope}}Event.js", function(){

//
//	Mouse-down event normalization:
//		- we capture mousedown and mousemove globally to:
//			- statically remember the current mouse position (Event.pageX, Event.pageY)
//			- statically remember which mouse button is down (Event.mouse)
//			- keep track of the last target element (Event.downTarget)
//			- keep track of the keyboard focus target (Event.focused)
//
//		- this way you can count on these things being set up in your scripts
//			whether you have a pointer to the browser event or not

	window.capture(Browser.EVENT.down, function(event) {
		Event.mouse = (event.which === 1 ? "left" : event.which == 3 ? "right" : "unknown");
		Event.downTarget = event.target;
		Event.pageX = event.touch.pageX;
		Event.pageY = event.touch.pageY;
	});

	window.capture(Browser.EVENT.move, function(event) {
		Event.pageX = event.touch.pageX;
		Event.pageY = event.touch.pageY;
	});

	window.capture(Browser.EVENT.up, function(event) {
		setTimeout(function(){
			Event.mouse = undefined;
			Event.downTarget = undefined;
		}, 0);
	});

	hope.extend(Event, {
		leftButtonIsDown : Getter(function(){ return Event.mouse === "left" }),
		rightButtonIsDown : Getter(function(){ return Event.mouse === "right" }),
		
		// event X coordinate relative to some particular element
		//	pass null to use the Event.mouseTarget
		elementX : function(target) {
			if (!target) target = Event.mouseTarget;
			return Event.pageX - target.pageLeft;
		},

		// event Y coordinate relative to some particular element
		//	pass null to use the Event.mouseTarget
		elementY : function(target) {
			if (!target) target = Event.mouseTarget;
			return Event.pageY - target.pageTop;
		}
	});
	
Script.loaded("{{hope}}Event-mouse.js");
});// end Script.require()
