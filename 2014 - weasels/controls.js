/**
 * @constructor
 */
function Controls()
{
	this.mouseX = 0;
	this.mouseY = 0;
	this.toolBelowMouse = -1;
	this.zoomRatio = 1;	// to account for the different resolution between canvas and screen
	this.splitIconLine = false; // icons can be stacked on one or two lines
	this.offsetX = 0;
	this.mouseLeftButton=false;
	this.totalClear();
}

Controls.prototype = {

	totalClear : function() {
		this.controlLeft=false;
		this.controlRight=false;
		this.controlEscape=false;
		this.lastKeyDown=0;
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
	 * Records key presses and releases, for both standard keys (arrows, enter, escape)
	 * and configurable controls (through the controls menu)
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
		
		if (value) {
			this.lastKeyDown = key;
		}
		// test against static, non-redefinable keys (arrows for menu navigation, escape)
		switch (key) {
			case 37 : // left arrow
				this.controlLeft = value;
				break;
			case 39 : // right arrow
				this.controlRight = value;
				break;
			case 27 : // escape
				this.controlEscape = value;
				break;
				
			default :
				handled = false;
		}
		
		return handled;
	},
	
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
	 * Handler for touch start / touch enter events
	 * Call onMouseMove (pointer motion handler) first to record position as the event chain begins with onTouchStart
	 * and there is no permanent tracking of the cursor position (unlike mouse event)
	 */
	onTouchStart : function(event)
	{
		this.onMouseMove(event);
		return this.onMouseDown(event);
	},
	
	/**
	 * Handler for touch end / touch leave events
	 */
	onTouchEnd : function(event)
	{
		event.preventDefault();
		return this.onMouseUp(event);
	},
	
	/**
	 * Handler for touch move events
	 */
	onTouchMove : function(event)
	{
		event.preventDefault();
		return this.onMouseMove(event);
	},
	
	/**
	 * Consume a mouse click, so that the icon will not
	 * be activated again the next frame, until the user clicks again
	 * (used for double-click requirement on reset / menu icons)
	 */
	acknowledgeMouseClick : function() {
		this.mouseLeftButton=false;
	},

	/**
	 * Handler for mouse/touch move events
	 */
	onMouseMove : function(event) {
		var clientX = 0, clientY = 0;
		if ('changedTouches' in event && event.changedTouches.length > 0)
		{	//touchmove event
			clientX = event.changedTouches[0].clientX;
			clientY = event.changedTouches[0].clientY;
		}
		if ('clientX' in event && 'clientY' in event)
		{	// mousemove event
			clientX = event.clientX;
			clientY = event.clientY;
		}
		this.mouseX=Math.floor(this.zoomRatio*clientX); // in overlay canvas coordinates (for tools)
		this.mouseY=Math.floor(this.zoomRatio*clientY);
		this.worldX=this.mouseX-this.offsetX; // in scenery canvas / game world coordinates (for trap positioning)
		this.buttonAreaX = Math.floor(4*clientX/window.innerWidth);	// 0 to 3 - button on main screen
		this.buttonAreaY = (this.mouseY>256 ? (1+((this.mouseY-256)>>5)) : 0); // 0 = play area, 1 = first half of button area (level up on main screen), 2 = second half (level down on main screen)
		
		var iconWidth = 48, iconHeight = 40;
		var toolOnRightBar = 4+Math.floor(this.zoomRatio*(clientX-window.innerWidth)/iconWidth);
		this.toolBelowMouse = -1;
		var firstLineY = this.splitIconLine ? 296 : 280;
		var secondLineY = this.splitIconLine ? 336 : 280;
		
		if (this.mouseY>=firstLineY && this.mouseY<firstLineY+iconHeight) {
			this.toolBelowMouse = this.mouseX > iconWidth*6 ? -1 : Math.floor(this.mouseX/iconWidth);
		}
		if (this.mouseY>=secondLineY && this.mouseY<secondLineY+iconHeight && toolOnRightBar>=0)
		{
			this.toolBelowMouse = 16+toolOnRightBar;
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
	},

	
	/**
	 * Handler for zoom level change (upon window resizing)
	 * @param ratio the new pixel ratio
	 * @secondLine true if the icons are stacked on two lines
	 */
	onZoomChange : function(ratio, secondLine) {
		this.zoomRatio = 1/ratio;
		this.splitIconLine = secondLine;
	}
	
}
