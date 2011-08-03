/* 	Single-select list viewer.  
	Define an .rowTemplate to draw for each item or set .columns to create one automatically.
	
	TODO:
		- header row (can we position:fixed it ???)
		- paging/scrolling/etc
		- smart selection semantics
		- observe the list add/remove/etc ?
		- multiple columns
*/

Script.require("{{hope}}Section.js", function(){



new hope.Section.Subclass("hope.ListViewer", {
	tag : "hope-listviewer",
	mixins : "Noticeable",
	properties : {
		onReady : function() {
			this.$rows = this.getChild("rows");
			this.$rows.onChild("row", "click", "onRowClicked", this);
		},

		template : "<hope-container>\
						<action part='hope-listViewer:$prev' appearance='black' label='Previous set' visible='no' onactivate='this.owner.showPrevSet()'/>\
						<rows/>\
						<action part='hope-listViewer:$next' appearance='black' label='Next set' visible='no' onactivate='this.owner.showNextSet()'/>\
					</hope-container>",
		
		// template to draw for each item
		rowTemplate : "<row></row>",
		
		// message to show when no items in the list
		emptyMessage : "No items to show",		// TODO: attr, translate

		// max number of rows to show -- set to 0 to show all
//TODO: make this a sliding window
		maxRows : Attribute({name:"maxRows", type:"number", update:true, inherit:true, value:0}),
		
		// first row we're currently displaying
		startRow : Attribute({name:"startRow", type:"number", update:true, inherit:true, value:0}),

		// total rows in our current list (generated)
		totalRows : Getter(function() {
			return (this.list ? this.list.length : 0);
		}),
		
		// last row we're displaying (generated)
		endRow : Getter(function() {
			if (this.maxRows == 0) return this.totalRows;
			return Math.min(this.startRow + this.maxRows, this.totalRows);
		}),

		// if true, we're selectable
		selectable : Attribute({name:"selectable", type:"flag", falseIf:[false,"false","no"]}),

		// if true, we automatically deselect when updating the list
		autoDeselect : false,				//TODO attr

		// current sort attribute, takes effect when our list is et
		sortBy : Attribute({name:"sortBy",update:true}),

		// element which shows our # of rows, set a sub-item as a @part='$rowCounter'
		$rowCounter : null,
		
		// message to show in our rowCounter
		rowCountMessage : Attribute({name:"rowCountMessage", inherit:true, value:"{{startRow+1}} to {{endRow}} of {{totalRows}}"}),
		
		// .list is the list of data we're pointing to.  When it's changed:
		//		- redraw the list
		list : new InstanceProperty({
			name:"list", 
			onChange : function(newList, oldList) {
				this.startRow = 0;
				
				// clear the selection
				if (this.autoDeselect) this.selectedIndex = -1;
				if (this.sortBy && newList.sortBy) newList.sortBy(this.sortBy);
				
				this.fire("update");
			}
		}),
		
		// Set .columns to a comma-separated list of column names
		//	to generate an rowTemplate of <cells> for those columns automatically.
		//	The class of each column will be set to the column name.
		columns : Attribute({name:"columns", type:"list", value:"", update:true,
			onChange : function(list) {
				var output = ["<row>"];
				if (list) list.forEach(function(column) {
					output.push("<cell class='"+column+"'>{{"+column+"}}</cell>");
				});
				output.push("</row>");
				this.rowTemplate = output.join("");
			}
		}),

		// return the row for a given index
		getRow : function(index) {
			return this.$rows.getChildren("row")[index];
		},

		// index of the item in our list which is selected
		selectedIndex : Attribute({name:"selectedIndex", type:"number", 
				update:true, value:-1, inherit:true,
				onChange : function(index) {
//console.warn(this.id+".selectedIndex changed to ",index);				
					this.fixSelectionHighlight();					
					var record = (this.list ? this.list[index] : null);
					this.soon(0, "selectionChanged", record, index);
				}
			}),

		// Selected is a pointer to our list item which is selected.
		//	Setting .selection will change the selectedIndex
		selection : Property({
			get : function() {
				return (this.list ? this.list[this.selectedIndex] : undefined);
			},
			set : function(item) {
//console.warn(this.id+".selection changing to index "+(this.list ? this.list.indexOf(item) : -1), item, this.list);
				this.selectedIndex = (this.list ? this.list.indexOf(item) : -1);
			}
		}),
		
		onRowClicked : function(event, row) {
			if (!this.selectable) return;
			var index = row.attr("index");
			this.selectedIndex = index;
		},

		
		// full on redraw of the entire list
		onUpdate : function() {
			if (this.list == null || this.list.length == 0 && this.emptyMessage) {
				this.notice = this.emptyMessage;
				return;
			}
			this.notice = "";
			
//console.info(this.id,"updating, selectedIndex: ",this.selectedIndex, ", length:",this.list.length);

			// clear the old list items
			this.$rows.empty();

//TODO: show next/prev when not at start/end of list
			
			var index = this.startRow-1, 
				listLength = this.list.length,
				last = (this.maxRows == 0 ? listLength : Math.min(this.startRow + this.maxRows, listLength))
			;
			while (++index < last) {
				var item = this.list[index];
				var row = this.getItemRow(item, index);
				this.$rows.append(row);
			}
			
			this.$prev.visible = (this.startRow > 0);
			this.$next.visible = (this.endRow != listLength);
			
			this.updateRowIndices();
			this.fixSelectionHighlight();

			if (this.$rowCounter) {
				var message = this.rowCountMessage.expand(this);
				this.$rowCounter.html = message;
			}
		},

		// return a single, expanded outer HTML element that represents a row for the list item
		getItemRow : function(item, index) {
			return this.rowTemplate.inflateFirst(item);
		},
		
		// update the row indices to correspond to the list
		updateRowIndices : function() {
			var startRow = this.startRow;
			this.$rows.getChildren("row").forEach(function(row, index) {
				row.attr("index", index+startRow);
			});
		},

		fixSelectionHighlight : function() {
			// clear the old hilight
			var row = this.getChild("row[selected]");
			if (row) row.attr("selected",null);
			
			// show the new highlight
			row = this.getChild("row[index='"+this.selectedIndex+"']");
			if (row) {
				row.attr("selected","yes");
				// make sure the selected row is visible
				this.revealChild(row);
			}
		},
		
		showPrevSet : function() {
			if (this.startRow == 0) return;
			
			this.startRow = Math.max(0, this.startRow - this.maxRows);
			this.fire("update");
			
		},
		
		showNextSet : function() {
			if (this.startRow >= this.list.length) return;
			
			this.startRow = Math.min(this.startRow + this.maxRows, this.list.length-1);
			this.soon("update");
		}
		
	}
});



Script.loaded("{{hope}}ListViewer.js");
});
