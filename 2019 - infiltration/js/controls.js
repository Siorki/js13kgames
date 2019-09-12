/**
 * @constructor
 */
function Controls(data)
{
	this.persistentData = data;
	this.totalClear();
	this.mouseX = window.innerWidth>>1;
	this.mouseY = window.innerHeight>>1;
}

Controls.prototype = {

	clearLateralKeys : function() {
		this.controlLeft=false;
		this.controlRight=false;
		this.controlUp=false;
		this.controlDown=false;
	},

	partialClear : function() {
		this.controlFire=false;
		this.controlSecondButton=false;
		//console.log("fire cleared");
		this.controlEscape=false;
	},
	
	totalClear : function() {
		this.clearLateralKeys();
		this.partialClear();
	},

	/**
	 * Record the choice of input device : keyboard or mouse
	 */
	setInputDevice : function(useMouse) {
		this.persistentData.setInputDevice(useMouse);
	},
	
	/**
	 * Return the current input device : true for mouse, false for keyboard
	 */
	usingMouseInputDevice : function() {
		return this.persistentData.data.mouseControl;
	},
	
	/**
	 * Handler for key up events
	 */
	onKeyUp : function(event) {
		return !this.keyControl(event, false);
	},

	/**
	 * Handler for key down events
	 */
	onKeyDown : function(event) {
		return !this.keyControl(event, true);
	},

	/**
	 * Delegated handler for keyboard events
	 * Records key presses and releases, for all standard keys (arrows, enter, escape)
	 * No configurable controls in this game.
	 * Returns true if the event is handled, false otherwise.
	 */
	keyControl : function(event, value) {
		var handled = true;
		var key = 0;
		if (window.event) { // IE
			key = window.event.keyCode;
		} else { // FF, Opera,...
			key = event.which;
		}
		
		// test against left / right Shift, Ctrl, Alt, Meta (Apple) keys
		if ("Shift" == event.key || "Alt" == event.key || "Control" == event.key || "Meta" == event.key) {
			if (event.location == 1) {
				this.controlFire = value;
			}
			if (event.location == 2) {
				this.controlSecondButton = value;
			}
		}
		
		// test against other static, non-redefinable keys 
		switch (key) {
			case 37 : // left arrow
			case 65 : // A
			case 74 : // J
			case 81 : // Q
				this.controlLeft = value;
				break;
			case 38 : // top arrow
			case 73 : // I
			case 87 : // W
			case 90 : // Z
				this.controlUp = value;
				break;
			case 39 : // right arrow
			case 68 : // D
			case 76 : // L
				this.controlRight = value;
				break;
			case 40 : // down arrow
			case 75 : // K
			case 83 : // S
				this.controlDown = value;
				break;
			case 32 : // space bar
			case 13 : // enter
				//if (value && !this.controlFire) {
				//	console.log("fire pressed");
				//}
				this.controlFire = value;
				break;
			case 45 : // 0 (keypad)
			case 96 : // Insert (keypad)
				this.controlSecondButton = value;
				break;
			case 27 : // escape
			case 80 : // P
				this.controlEscape = value;
				break;
				
			default :
				//console.log("unknown key "+key);
				handled = false;
		}
		
		return handled;
	},
	
	/**
	 * Handler for mouse up events
	 */
	onMouseUp : function(event) {
		if (event.button == 2) {
			this.controlSecondButton = false;
		} else {
			this.controlFire = false;
		}
		return true;
	},

	/**
	 * Handler for mouse down events
	 */
	onMouseDown : function(event) {
		//event.preventDefault(); // no menu on right click
		if (event.button == 2) {
			this.controlSecondButton = true;
		} else {
			this.controlFire = true;
		}
		return true;
	},
	
	/**
	 * Handler for mouse/touch move events
	 */
	onMouseMove : function(event) {
		this.mouseX = event.clientX;
		this.mouseY = event.clientY;
		return true;
	},
	

}
