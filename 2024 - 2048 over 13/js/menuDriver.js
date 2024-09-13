/**
 * Adaptation of the menu handler initially developped for Staccato (2013 entry)
 * Simplified to handle a single column and no custom keys
 *
 * Initial documentation follows :
 *
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

 class MenuDriver
 {
	/**
	 * MenuDriver constructor.
	 * All actions are assigned by default to the leave action
	 * @constructor
	 * @param lineCount : number of lines in the menu
	 * @param controls : a reference to the user controls (keyboard and mouse)
	 *
	 */
	 constructor(lineCount, controls) {
		this.controls = controls;
		this.columnCount = 1;
		this.lineCount = lineCount;
		this.enabledLines = new Array(lineCount);
		this.enabledLines.fill(true);
		this.initialize();
	}
 
 
  
    /**
	 * Menu reset, upond entering the screen
	 */
	initialize() {
		this.done=false;
		this.selectedLine = this.enabledLines.findIndex(i => i); // select the first enabled line
		this.controls.totalClear();
	}
	

	/**
	 * Enable or disable a line in the menu (finer control than the old "minLine")
	 * @param line index of the line which stat will be set
	 * @param value true to enable, false to disable
	 */
	setEnabled(line, value) {
		this.enabledLines[line] = value;
	}
	
	/**
	 * Returns the line of the selected option
	 */
	getSelectedOption() {
		return this.selectedLine;
	}
	

	/**
	 * Acts according to user input :
	 * - keys up and down move the selected option
	 * - key Enter validates the selected option
	 * - mouse click / touch on an active option validates it
	 *
	 * Called from Game main loop if the menu is showing
	 */
	processEvents() {
		this.done = false;
		let nextLine = this.selectedLine;
		if (this.controls.controlUp) {
			while (--nextLine>-1 && !this.enabledLines[nextLine]) {

			}
		}
		if (this.controls.controlDown) {
			while (++nextLine<this.lineCount && !this.enabledLines[nextLine]) {
			}
		}
		if (nextLine>-1&&nextLine<this.lineCount) {
			this.selectedLine = nextLine;
		}

		if (this.controls.menuLine>-1 && this.controls.menuLine < this.lineCount) {
			if (this.enabledLines[this.controls.menuLine]) {
				this.selectedLine = this.controls.menuLine;
			}
		}
		
		if (this.controls.mouseLeftButton || this.controls.controlFire) {	// selection clicked/validated
			// true to leave the menu
			this.done = true;
		}
		this.controls.totalClear();
	}
	
	
	
}
