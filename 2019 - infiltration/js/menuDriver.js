/**
 * Handler to manage a menu with several lines and several columns
 *
 * It manages the selection and event handling, however the display is not featured
 * and should be implemented outside (in the renderer)
 *  - up and down arrows change the selected item (if there is more than one line)
 *  - left and right arrows change the selected item (if there is more than one column)
 *  - space and enter keys validate the selection
 *  - escape key handling is not featured and has to be captured in the container screen.
 *  - mouse clicks (or touchscreen tap for mobiles) are handled for clickable areas with their id in the "areaClicked" attribute
 *
 * The MenuDriver is designed as a component in a view that will manage the display.
 */

 /**
  * MenuDriver constructor.
  * All actions are assigned by default to the leave action
  * @constructor
  * @param columnCount : number of columns in the menu
  * @param lineCount : number of lines in the menu
  * @param controls : a reference to the user controls (keyboard and mouse)
  * @param soundManager : a reference to the sound manager (for on/off toggle)
  * @param escapeCommand : line matching the menu option triggered on pressing ESC (column is assumed to be zero). -1 for no action.
  *
  */
 function MenuDriver(columnCount, lineCount, controls, soundManager, escapeCommand)
 {
	this.controls = controls;
	this.soundManager = soundManager;
	this.columnCount = columnCount;
	this.lineCount = lineCount;
	this.escapeCommand = escapeCommand;
	this.actions = [];
	for (var i=0; i<columnCount; ++i) 
	{
		this.actions.push([]);
		for (var j=0; j<lineCount; ++j) {
			this.actions[i].push(this.leave);
		}
	}
	this.initialize();
 }
 
 
  MenuDriver.prototype = {
  
  
    /**
	 * Menu reset, upond entering the screen
	 */
	initialize : function() {
		this.done=false;
		this.selectedColumn = 0;
		this.selectedLine = 0;
		this.controls.totalClear();
	},
	
	/**
	 * Define the function to be called when the menu item at (column, line)
	 * is activated.
	 * Function signature must be (column, line)
	 * and should return true to leave the menu, false otherwise
	 */
	setAction : function(column, line, action) {
		this.actions[column][line] = action;
	},
	
	/**
	 * Returns the coordinates (column, line) of the selected option
	 */
	getSelectedOption : function() {
		return {x:this.selectedColumn , y:this.selectedLine};
	},
	

	processEvents : function() {
		this.selectedColumn += (this.controls.controlLeft&&this.selectedColumn>0?-1:0)
							+(this.controls.controlRight&&this.selectedColumn<this.columnCount-1?1:0);
		this.selectedLine += (this.controls.controlUp&&this.selectedLine>0?-1:0)
							+(this.controls.controlDown&&this.selectedLine<this.lineCount-1?1:0);
		if (this.controls.areaClicked) {
			var area = this.controls.areaClicked-1;
			this.selectedLine = area%this.lineCount;
			this.selectedColumn = (area-this.selectedLine)/this.lineCount;
		}
		if (this.controls.controlEscape && this.escapeCommand > -1) {	// ESC pressed : trigger predefined action
			this.selectedColumn = Math.min(1, this.columnCount);	// only multi-command menu has exit on column 1, not 0
			this.selectedLine = this.escapeCommand;
			this.done = true; // action matching escape command must return true
		}
		if (this.controls.areaClicked || this.controls.controlFire) {	// selection clicked/validated
			// true to leave the menu
			
			this.done = this.actions[this.selectedColumn][this.selectedLine].call(this, this.selectedColumn, this.selectedLine);
		}
		this.controls.totalClear();
	},
	
	/**
	 * Action definition : leave the menu
	 */
	leave : function(i, j) {
		return true;
	},
	
	/**
	 * Action definition : toggle the music on/off
	 */
	toggleMusic : function(i, j) {
		this.soundManager.toggleMusic();
		return false;
	},
	
	/**
	 * Action definition : toggle the sound effects on/off
	 */
	toggleSfx : function(i, j) {
		this.soundManager.toggleSound();
		return false;
	},
	
	/**
	 * Action definition : set control device
	 */
	setInputDevice : function(i,j) {
		this.controls.setInputDevice(i==0);
		return true; // leave menu after selection
	}
		
	
}
