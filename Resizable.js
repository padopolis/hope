/*** Make an element or class of elements drag-resizable by its edges by mixing this into it.
	Call:
		this.initResize();
	to start resize tracking, e.g. in an onReady handler for your object.

***/

//TODO:  make sure the element is absolutely positioned when we start resizing!

Script.require("{{hope}}Element.js", function() {

new Mixin("Resizable", {
	resizableEventMap : {
		"mousedown" : "onResizeStart",
		"mousemove" : "onResizeMove",
		"mouseout" : "onResizeOut"
	},

	bodyEventMap : {
		"mousemove" : "onResizingMove",
		"mouseup" : "onResizingEnd"
	},

	properties : {
		// # of pixels for our 'edge'
		edgeSize : new Attribute({name:"edgeSize", type:"number", value:10, inherit:true}),
		
		// edges that are resizable for us
		resizeEdges : new Attribute({name:"resizeEdges", value:"NSEWC", inherit:true}),
	
		// minimum # of pixels on resize
		resizeMin : new Attribute({name:"resizeMin", type:"number", value:10, inherit:true}),
		
		// Should we constrain to the dimensions of our container?
		// Default is yes
		constrain : new Attribute({name:"constrain", type:"boolean", value:true, inherit:true}),
		
	
		// Should we clone the element when dragging starts with the alt/option key held down?
		// Default is no
		cloneable : new Attribute({name:"cloneable", type:"boolean", value:false, inherit:true}),
	
	
		initResize : function() {
			this.hookup(Resizable.resizableEventMap);
		},
		
		clearResize : function() {
			this.unhook(Resizable.resizableEventMap);
		},
		
		// override with a Getter in your class if you're not always resizable
		isResizable : true,
		
		// Called when the cursor is moving over us, to show the appropriate resize cursor
		onResizeMove : function(event) {
			if (this._resizeInfo || !this.isResizable) return;
			var edge = this.getEventEdge(event),
				info = this._resizeMoveInfo || (this._resizeMoveInfo = {})
			;
			if (edge) {
				if (edge != info.edge) {
					if (info.cursor == null) info.cursor = this.style.cursor;
					info.edge = edge;
					this.style.cursor = this.getEdgeCursor(edge);
				}
			} else {
				if (info.cursor != null) this.style.cursor = info.cursor;
			}
		},
		onResizeOut : function(event) {
			if (this._resizeInfo) return;
			var info = this._resizeMoveInfo;
			if (info && info.cursor != null) this.style.cursor = info.cursor;
			delete this._resizeMoveInfo;
		},
	
		
//		onCloneStart : function() {
//			this.onResizeStart(null, true);
//		},
		
		// Called when the mouse goes down in us.
		onResizeStart : function(event, clone) {
			//console.warn("onResizeStart");
			
			// if not currently resizable, fire "clickWhenNotResizable" so we can otherwise process.
			//	??? this is kinda hinky, but useful
			if (!this.isResizable) {
				this.fire("clickWhenNotResizable");
				return;
			}
			
			// skip right-click
			if (Event.rightButtonIsDown) return;
			
			// stop default event processing or we'll start a drag
			if (event) event.preventDefault();
	
			var element = this,
				bounds = element.pageBounds,
				edge = element.getEventEdge(event, bounds),
				clone
			;
			if (!edge) return;
	
			// if moving from the center, we're cloneable and the alt/option key is down
			//	create a clone and move it instead.
			if (element.cloneable && edge === "C" && (Event.alt || clone)) {
				element = clone = element.clone(true, true);
			}
	
			// if moving from the center, we're cloneable and the alt/option key is down
			//	create a clone and move it instead.
			if (element.cloneable && edge === "C" && Event.command) {
				var name;
				element = clone = element.clone(true, true);
				if (element.prompt) {
					name = element.prompt();
				}
			}
	
			
			var info = element._getResizeInfo(element, edge, !!clone);
	
	
			// call updateSize to set all properties initially
			element.updateSize(null, info);
	
			// set info.N true if we should resize the north side, etc
			for (var i = 0; i < edge.length; i++) {
				info[edge[i]] = true;
			}
	
			if (info.C) {
				if (event) {
					info.offsetX = element.pageLeft - Event.pageX;
					info.offsetY = element.pageTop - Event.pageY;
				} else {
					info.offsetX = -1 * Math.round(element.width / 2);
					info.offsetY = -1 * Math.round(element.height / 2);
				}
	
				if (element.cloneable && Event.alt) {
					
				}
			} else {
				// minimum we're allowed to resize
				info.min = element.resizeMin;
			}
			
	//console.dir(info);
			// show the appropriate cursor
			element.style.cursor =  document.body.style.cursor = element.getEdgeCursor(edge);
			
			// have the body notify us of events so we can manipulate our size
			document.body.hookup(Resizable.bodyEventMap, element);
	
			// have the element fire resizeStarted so it can, eg, select itself
			element.fire("resizeStarted");
		},
		
		//PRIVATE
		_getResizeInfo : function(element, edge, cloned) {
			var info = element._resizeInfo = {
				// name of the resize edge
				edge 		: edge,
				
				// parent coordinates
				parent 		: element.offsetParent.pageBounds,
	
				// current cursor
				cursor 		: (this._resizeMoveInfo ? this._resizeMoveInfo.cursor 
													: element.style.cursor),
													
				size		: element.bounds
			}
			if (cloned) info.cloned = true;
			return info;
		},
		
		
		// called when we're actually resizing
		onResizingMove : function(event) {
			var info = this._resizeInfo;
			info.resized = true;
	
			if (info.C) {
				// constrain if the shift key is held down
				info.constrain = Event.shift;
				if (info.constrain) {
					// figure out the direction to constrain after movement of 5 px or more
					if (info.direction == null) {
						if (info.startX == null) {
							info.startX = Event.pageX;
							info.startY = Event.pageY;
						} else {
							var deltaX = Math.abs(Event.pageX - info.startX),
								deltaY = Math.abs(Event.pageY - info.startY)
							;
							if (deltaX > 5 || deltaY > 5) {
								if (deltaX > deltaY) {
									info.direction = "H";
									this.style.cursor = "col-resize";
								} else {
									info.direction = "V";
									this.style.cursor = "row-resize";
								}
							}
						}
					}
				} else {
					this.style.cursor = "move";
					delete info.direction;
					delete info.startX;
					delete info.startY;
				}
				this.onResizeCenter(info, Event.pageX, Event.pageY);
			} else {
				if (info.N) 		this.onResizeTop(info, Event.pageX, Event.pageY);
				else if (info.S)	this.onResizeBottom(info, Event.pageX, Event.pageY);
				if (info.W) 		this.onResizeLeft(info, Event.pageX, Event.pageY);
				else if (info.E)  	this.onResizeRight(info, Event.pageX, Event.pageY);
			}
	
			// fire the "resizing" event		
			this.fire("resizing");
		},
	
		// Called when the mouse goes up after we've resized.
		//	Fires event "onResized".
		onResizingEnd : function(event) {
			var info = this._resizeInfo;
			if (!info) return;
			
			// clear the body events
			document.body.unhook(Resizable.bodyEventMap, this);
			
			// reset the cursor
			this.style.cursor = info.cursor;
			document.body.style.cursor = "";
	
			// clear the resize data
			delete this._resizeInfo;
			
			if (info.resized) this.fire("resized");
		},
			
		
		onResizeCenter : function(info, eventX, eventY) {
			// adjust for the initial mouse offset for the TL of the element
			var newLeft = eventX - info.parent.left + info.offsetX,
				newTop = eventY - info.parent.top + info.offsetY
			;
	//console.warn(info.constrain , info.direction);
			if (info.constrain && info.direction) {
				if (info.direction === "H") 	newTop = this.top;
				else							newLeft = this.left;
			}
			if (this.constrain) {
				if (newLeft < 0) {
					newLeft = 0;
				} else if (newLeft + this.width > info.parent.width) {
					newLeft = info.parent.width - this.width;
				}
				if (newTop < 0) {
					newTop = 0;
				} else if (newTop + this.height > info.parent.height) {
					newTop = info.parent.height - this.height;
				}
			}
			this.updateSize({left:newLeft, top:newTop}, info);
		},
	
		onResizeLeft : function(info, eventX, eventY) {
			var newLeft = eventX - info.parent.left;
			if (this.constrain && newLeft < 0) newLeft = 0;
			var delta = newLeft - this.left,
				newWidth = this.width - delta
			;
			if (newWidth < info.min) {
				newWidth = info.min;
				var right = this.left + this.width;
				newLeft = right - newWidth;
			}
			this.updateSize({left:newLeft, width:newWidth}, info);
		},
	
		onResizeTop : function(info, eventX, eventY) {
			var newTop = eventY - info.parent.top;
			if (this.constrain && newTop < 0) newTop = 0;
			
			var	delta = newTop - this.top,
				newHeight = this.height - delta
			;
	
			if (newHeight < info.min) {
				newHeight = info.min;
				var bottom = this.top + this.height;
				newTop = bottom - newHeight;		
			}
			this.updateSize({top:newTop, height:newHeight}, info);
		},
	
		onResizeRight : function(info, eventX, eventY) {
			var newWidth = eventX - this.pageLeft;
			if (this.constrain && this.pageLeft + newWidth > info.parent.right) {
				newWidth = info.parent.width - this.left;
			}
			if (newWidth < info.min) newWidth = info.min;
			this.updateSize({width:newWidth}, info);
		},
	
		onResizeBottom : function(info, eventX, eventY) {
			var newHeight = eventY - this.pageTop;
			if (this.constrain && this.pageTop + newHeight > info.parent.bottom) {
				newHeight = info.parent.height - this.top;
			}
			if (newHeight < info.min) newHeight = info.min;
			this.updateSize({height:newHeight}, info);
		},
	
		
		// Set left/top/width/height according to size passed in.
		//	If you don't specify a size or dimensions, sets to current size,
		//		so all coordinates are actually set.
		//	If you pass resizeMoveInfo structure, uses/updates that for/to the current size.
		updateSize : function(size, info) {
			if (!size) size = {};
			var current = (info ? info.size : this.bounds);
			this.left 	= current.left	 = (size.left != null ? size.left : current.left);
			this.top 	= current.top 	 = (size.top != null ? size.top : current.top);
			this.width 	= current.width  = (size.width != null ? size.width : current.width);
			this.height	= current.height = (size.height != null ? size.height : current.height);
	
	//console.warn(this.attr("style"));
		},
		
			//
		// "edge" detection  (TODO: move this somewhere else?)
		//
	
		// Return the "edge" that a global x/y coordinate is in relative to us.
		//	pass page x/y coordinates or an event
		//	returns null if outside of us
		//	returns some combination of "N", "S", "E", "W" if in an edge
		//	returns "C" if inside but not in an edge
		getEdge : function(pageX, pageY, bounds) {
			if (!bounds) bounds = this.pageBounds;
			var x = pageX - bounds.left,
				y = pageY - bounds.top
			;
			if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) return null;
			var edgeSize = this.edgeSize,
				edges = this.resizeEdges,
				edge = ""
				nonActiveEdge = ""
			;
			if (y < edgeSize) {
				if (edges.indexOf("N") === -1) 	nonActiveEdge += "N";
				else							edge += "N"
			} else if (y > bounds.height - edgeSize) {
				if (edges.indexOf("S") === -1) 	nonActiveEdge += "S";
				else							edge += "S"
			}
	
			if (x < edgeSize) {
				if (edges.indexOf("W") === -1) 	nonActiveEdge += "W";
				else							edge += "W"
			} else if (x > bounds.width - edgeSize) {
				if (edges.indexOf("E") === -1) 	nonActiveEdge += "E";
				else							edge += "E"
			}
			
			if (edge) return edge;
			if (nonActiveEdge || edges.indexOf("C") == -1) return null;
			return "C";
		},
		
		// syntactic sugar for getting an edge which corresponds to a mouse event
		getEventEdge : function(event, bounds) {
			return this.getEdge(Event.pageX, Event.pageY, bounds);
		},
		
		// return the resize cursor to show according to an 'edge'
		getEdgeCursor : function(edge) {
			return (edge === "C" ? "move" : edge+"-resize");
		}
	}
});

Script.loaded("{{hope}}Resizable.js");
});
