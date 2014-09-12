/**
 * @constructor
 */
function Controls()
{
	this.mouseX = 0;
	this.mouseY = 0;
	this.toolBelowMouse = -1;
	this.zoomRatio = 1;	// to account for the different resolution between canvas and screen
	this.offsetX = 0;
	this.mouseLeftButton=false;
}

Controls.prototype = {

	
	/**
	 * Handler for mouse up events
	 */
	onMouseUp : function(event) {
		this.mouseLeftButton=false;
		return true;
	},

	/**
	 * Handler for mouse down events
	 */
	onMouseDown : function(event) {
		this.mouseLeftButton=true;
		return true;
	},
	
	/**
	 * Consume a mouse click, so that the icon will not
	 * be activated again the next frame, until the user clicks again
	 */
	acknowledgeMouseClick : function() {
		this.mouseLeftButton=false;
	},
	
	/**
	 * Handler for mouse move events
	 */
	onMouseMove : function(event) {
		this.mouseX=Math.floor(this.zoomRatio*event.clientX); // in overlay canvas coordinates (for tools)
		this.mouseY=Math.floor(this.zoomRatio*event.clientY);
		this.worldX=this.mouseX-this.offsetX; // in scenery canvas / game world coordinates (for trap positioning)
		this.buttonAreaX = Math.floor(4*event.clientX/window.innerWidth);	// 0 to 3 - button on main screen
		this.buttonAreaY = (this.mouseY>256 ? (1+((this.mouseY-256)>>5)) : 0); // 0 = play area, 1 = first half of button area (level up on main screen), 2 = second half (level down on main screen)
		
		if (this.mouseY>=288 && this.mouseY<=320) {
			var toolOnRightBar = 4+Math.floor(this.zoomRatio*(event.clientX-window.innerWidth)/48);
			this.toolBelowMouse = toolOnRightBar>=0 ? 5+toolOnRightBar : (this.mouseX > 240 ? -1 : Math.floor(this.mouseX/48));
		} else {
			this.toolBelowMouse = -1;
		}

		return true;
	},
	
	/**
	 * Handler for horizontal scrolling event (internal to application)
	 * @param offsetX new absolute scrolling coordinate
	 */
	onHScroll : function(offsetX) {
		this.offsetX = offsetX;
		this.worldX=this.mouseX-this.offsetX; // mouse did not move, but the cursor position in world coordinates changed
	}

	
}
