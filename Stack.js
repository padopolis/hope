/* Stack:  section which only shows one child at a times */

Script.require("{{hope}}Element-attach.js", function(){

// a Stack is a section whose children:
//	- are shown one at a time (via stack.selection), and
//	- take up the full space of the stack
//	- 
new hope.Section.Subclass("hope.Stack", {
	tag : "hope-stack",
	properties : {
		// set to a css selector for our child element to be used as a selector
		//	to show different item in the stack
		itemSelector : null,
		
		// constructor for our item selectors
		selectorConstructor : hope.Action,

		// switch the visible section when selected
		listeners : "selectedItem,deselectedItem",

		// figure out if we have an itemSelector before processing children
		initialize : function() {
			var selector = this.attr("itemSelector") || this.itemSelector;
			if (typeof selector === "string") {
				this.itemSelector = this.getChild(selector) || select(selector);
			}
			this.as(hope.Section);
			
			// set up the selected item on a timer...
//TODO: this should be a soon() ... ?
			var stack = this;
			setTimeout(function(){stack.fire("selectedItem", stack.selection)},0);
		},

		//TODO: this is a trait, or at least abstract it somehow...
		preference : new Attribute({name:"preference", type:"preference"}),
		selection : new Attribute({
			name : "selection",
			get : function() {
				if (this.preference) return hope.preference(this.preference);
				return this.DATA.selection;
			},
			
			set : function(newValue) {
				if (newValue instanceof Element) newValue = newValue.id;
				var oldValue, pref = this.preference;
				if (pref) 	oldValue = hope.preference(pref);
				else		oldValue = this.DATA.selection;
				if (oldValue !== newValue) {
//if (newValue === "productEditor") debugger;
					if (oldValue) this.fire("deselectedItem", oldValue);
	
					if (pref) 	hope.preference(pref, newValue);
					else		this.DATA.selection = newValue;
					this.attr("selection", newValue);
					if (newValue) this.fire("selectedItem", newValue, oldValue);
				}
			}
		}),
		
		// pointer to our selected section
		$selection : Property({
			get : function() {
				return this.getItem(this.selection);
			},
			set : function(it) {
				if (!it) return;
				var id = it.id;
				if (!id) return console.error("set stack.$selection: $selection must have @id. ",it);
				this.selection = id;
			}
		}),

		// called when one of our items is selected
		onSelectedItem : function(event, selectedSection) {
			var element;
			if (selectedSection) {
//console.warn(this.id+".onSelectedItem: ",selectedSection);
//if (selectedSection === "productEditor") debugger;
				// update the selector button
				if (element = this.getSelectorFor(selectedSection)) {
					element.selected = true;
				}
				// show the element and tell it to update
				if (element = this.getItem(selectedSection)) {
					element.visible = true;
					element.soon("update");
				}
			}
		},

		// called when one of our items is deselected
		onDeselectedItem : function(event, oldSection) {
			var element;
			if (oldSection) {
//console.info(":::",oldSection);
//if (oldSection === "helpPanel") debugger;
				if (element = this.getSelectorFor(oldSection)) 	{
					element.selected = false;
				}
				if (element = this.getItem(oldSection)) {
					element.visible = false;
				}
			}
		},

		getItem : function(it) {
			if (typeof it == "string") return this.$container.getChild("#"+it);
			return it;
		},

		// process children to:
		//	- hide them initially, and
		//	- make a selector for them if they specify a 'title'
		processChild : function(section) {
			if (section.id) {
				section.visible = false;
				this.makeSelectorFor(section);
				section.on("activate", function() {
					this.selection = section;
				}.bind(this));
			}
			return section;
		},
		
		
		// selector item for each section
		getSelectorFor : function(id) {
			if (this.itemSelector instanceof Element)
				return this.itemSelector.getChild("*[for='"+id+"']");
		},
		
		makeSelectorFor : function(section) {
			if (! (this.itemSelector instanceof Element)) return;
			var title = section.label || section.attr("label"),
				id = section.id
			;
			if (!title || !id) return;
			
			var stack = this,
				attrs = { "for" : id }
			;
			if (section.shortcut) attrs.shortcut = section.shortcut;
			
			var	selector = new this.selectorConstructor({
					html 	: title,
					attrs 	: attrs,
					onActivate : function() {
						stack.selection = id;
					}
				})
			;
			this.itemSelector.appendChild(selector);
		}
	}
});


Script.loaded("{{hope}}Stack.js");
});
