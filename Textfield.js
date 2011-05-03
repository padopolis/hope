/* Textfield: input control with binding/error/etc semantics.
	Default is to manage an <input type='text'> element, subclasses can have other $input types.
*/

Script.require("{{hope}}Element-attach.js", function(){


//TODO: is this
new Element.Subclass("hope.Textfield", {
	tag : "textfield",
	mixins : "Valued",
	properties : {
		// set things up and do the initial update when ready
		onReady : function() {
			this.initializeInput();
			this.fire("update");
		},
		
		keypressDelay : Attribute({name:"keypressDelay", type:"number", update:true, 
									inherit:true, value:500}),
		
		// template is our message display -- the input is created in initializeInput
		template : "<message part='$message' visible='no'/>",

		// if trim is true, we trim whitespace into and out of the field
		trim : Attribute({name:"trim", update:true,
						type:"flag", trueIf:["",true,"true","yes"]
					}),

		// if multiline is true, our $input is a textarea
		multiline : Attribute({name:"multiline", update:true,
						type:"flag", trueIf:["",true,"true","yes"], 
						// when changed, call initializeInput to switch type
						//	(no-op if we're not ready yet)
						onChange : function(newValue) {
							this.initializeInput();
						}
					}),

		// if true, we translate return characters to/from <br>s
		//	for multiline textfields only
		interpretReturns : Attribute({name:"interpretReturns", update:true,
						type:"flag", trueIf:["",true,"true","yes"]
					}),

		// if true, we escape/unescape special characters using url encoding
		escape : Attribute({name:"escape", update:true,
						type:"flag", trueIf:["",true,"true","yes"]
					}),


		// if true, we only allow identifier-legal fields in the field,
		//	everything other than "_" "$", letters and numbers is converted to "_"
		identifier : Attribute({name:"identifier", update:true,
						type:"flag", trueIf:["",true,"true","yes"]
					}),

		// if true, we translate  "<" to "&lt;" and ">" to "&gt;" automatically
		//	for multiline textfields only
		htmlSafe : Attribute({name:"htmlSafe", update:true,
						type:"flag", trueIf:["",true,"true","yes"]
					}),

		specialChars :	Attribute({name:"specialChars", update:true,
						type:"flag", trueIf:["",true,"true","yes"]
					}),

		// field type
		type : Attribute({name:"type", inherit:true, value:"text"}),


		// hint to show below the field
		hint : Attribute({name:"hint", update:true, 
					onChange:function(newValue) {
						this.updateMessage();
					}
				}),

		// hint to show below the field
		placeholder : Attribute({name:"placeholder", update:true, 
					onChange:function(newValue) {
						if (this.$input) this.$input.placeholder = newValue;
					}
				}),
		
		// (single) error message to display below the field
		// To show an error for the field, set field.error = "blahblah";
		// To clear the error for the field, set field.error = "";
		error : Attribute({name:"error", update:true, 
					onChange:function(newValue) {
						this.updateMessage();
					}
				}),
		
		
		// template for rendering our actual input control
//TODO: what about some non-standard input, like a slider we create ourselves, etc???
		fieldTemplate : "<input type='{{type}}'>",
		textareaTemplate : "<textarea></textarea>",

		// update input + message field on update
		onUpdate : function() {
			if (!this.isReady) return;
//console.info("onUpdate() for ",this, this.value);
			this.updateInputValue();		
			this.updateMessage();
		},

		// actually change the value of our input field to match our bound value
		updateInputValue : function(value) {
			if (arguments.length == 0) value = this.value;
			if (value == null) value = "";
			if (this.trim) value = value.trim();
			if (this.escape) value = unescape(value);
			if (this.multiline && this.htmlSafe) value = value.undoHTMLSafe();
			if (this.multiline && this.interpretReturns) value = value.replace(/<br>/g, "\n");
			this.$input.value = value;
		},
		
		// return the value actually stored in the input right now
		getInputValue : function() {
			var value = this.$input.value;
			if (this.trim) value = value.trim();
			if (this.identifier) value = value.toIdentifier();
			if (this.multiline && this.interpretReturns) value = value.replace(/[\r\n]/g, "<br>");
			if (this.escape) value = escape(value);
			if (this.multiline && this.htmlSafe) value = value.makeHTMLSafe();
			if (this.specialChars) value = value.specialCharsToEntities();
			return value;
		},
		
		// Attach our parts, setting up all events as necessary.
		// Called automatically by .onReady()
		initializeInput : function() {
			if (!this.isReady) return;

			// if there was an input already, nuke it
			if (this.$input) this.$input.remove();
			
			var template = (this.multiline ? this.textareaTemplate : this.fieldTemplate);
			this.$input = template.inflateFirst(this);

			this.$input.enabled = this.enabled;
			if (this.placeholder) this.$input.attr("placeholder", this.placeholder);
			this.prepend(this.$input);
			
			this.$input.on({
				scope : this,
				keypress : "onInputKeyPressEvent",
				change : "onInputChangeEvent",
				focus : "onInputFocusEvent",
				blur : "onInputBlurEvent"
			});
		},
		
		
		// enable/disable our input as our enabled changes
		onEnabled : function() {
			if (this.$input) this.$input.enabled = true;
		},
		
		onDisabled : function() {
			if (this.$input) this.$input.enabled = false;		
		},
		
		
	//
	//	handle events sent from the input -- translates them into our events
	//
		
		onInputKeyPressEvent : function(event) {
			this.soon(this.keypressDelay,"inputChanged");
		},
		
		onInputChangeEvent : function(event) {
			this.soon(0,"inputChanged");
			return true;
		},
		
		onInputFocusEvent : function(event) {
			this.classList.add("focus");
//console.warn(this,"onFocus",event);		
		},
		
		onInputBlurEvent : function(event) {
			this.classList.remove("focus");
//console.warn(this,"onBlur",event);		
		},
		
		
		
		// fired when the input value changes
		onInputChanged : function(event) {
			this._updateValue(this.getInputValue());
		},
		
	
	//
	//	manage focus/etc in the field
	//

		// focus in the field
		//	NOTE: this can sometimes fail, so we try...catch it
		focus : function() {
			try {
				this.$input.focus();
			} catch (e) {}
		},
		
		
		// select the text in the field
		//	NOTE: this can sometimes fail, so we try...catch it
		selectText : function() {
			try {
				this.$input.select();
			} catch (e) {}
		},
		
		
	//
	//	message stuff, including icon management
	//
		
		updateMessage : function() {
			if (!this.$message) return;
			if (this.error) {
				this.classList.add("error");
				this.$message.className = "error";
				this.$message.html = this.error;
				this.$message.visible = true;
			} else if (this.hint) {
				this.classList.remove("error");
				this.$message.className = "hint";
				this.$message.html = this.hint;
				this.$message.visible = true;
			} else {
				this.$message.visible = false;
				this.$message.html = "";
			}
		},

	}
});



Script.loaded("{{hope}}Textfield.js");
});
