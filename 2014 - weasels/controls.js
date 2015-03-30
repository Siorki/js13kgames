/**
 * @constructor
 */
function Controls()
{
	this.mouseX = 0;
	this.mouseY = 0;
	this.swipeScrollX = 0;	// scroll of the game area induced by swipe motion
	this.toolBelowMouse = -1;
	this.windowLayout = false; // default initialization, will be set to actual value by onLayoutChange()
	this.mouseInPlayArea = false;
	this.offsetX = 0;
	this.mouseLeftButton=false;
	this.totalClear();
	this.scrollOnSwipe = false; // true for touch screens only
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
		this.swipeStart = { x:this.mouseX, y:this.mouseY };
		this.swipeScrollX = 0;
		return this.onMouseDown(event);
	},
	
	/**
	 * Handler for touch end / touch leave events
	 */
	onTouchEnd : function(event)
	{
		event.preventDefault();
		this.toolBelowMouse = -1;	// avoid keeping an icon highlighted after the player clicks (and releases) it
		this.buttonAreaX = this.buttonAreaY = -1; // same for main menu buttons
		return this.onMouseUp(event);
	},
	
	/**
	 * Handler for touch move events
	 */
	onTouchMove : function(event)
	{
		event.preventDefault();
		var result = this.onMouseMove(event);
		this.swipeScrollX = this.mouseX - this.swipeStart.x;
		return result;
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
		if (this.windowLayout) // has been set 
		{
			this.mouseX=Math.floor(clientX/this.windowLayout.pixelRatio); // in overlay canvas coordinates (for tools)
			this.mouseY=Math.floor(clientY/this.windowLayout.pixelRatio);
			this.worldX=this.mouseX-this.offsetX; // in scenery canvas / game world coordinates (for trap positioning)
			this.worldY=this.mouseY+256-this.windowLayout.playArea[3]; // game world Y, may have scrolled if the screen uses an exotic layout
			this.buttonAreaX = Math.floor(4*this.mouseX/this.windowLayout.titleScreen[0]);	// 0 to 3 - button on main screen
			this.buttonAreaY = (this.mouseY>this.windowLayout.titleScreen[1] ? (1+((this.mouseY-this.windowLayout.titleScreen[1])>>5)) : 0); // 0 = play area, 1 = first half of button area (level up on main screen), 2 = second half (level down on main screen)
			
			this.toolBelowMouse = -1;
			
			// Check if mouse is in play area
			var localX = this.mouseX-this.windowLayout.playArea[0]; // local to toolbar
			var localY = this.mouseY-this.windowLayout.playArea[1]; // local to toolbar
			this.mouseInPlayArea = (localX>=0 && localX<this.windowLayout.playArea[2]
									&& localY>=0 && localY<this.windowLayout.playArea[3]);
									
			// Check if mouse is over toolbar
			localX = this.mouseX-this.windowLayout.toolBar[0]; // local to toolbar
			localY = this.mouseY-this.windowLayout.toolBar[1]; // local to toolbar
			if (localX>=0 && localX<this.windowLayout.toolBar[2] &&
				localY>=0 && localY<this.windowLayout.toolBar[3])
			{
				// Mouse over toolbar. Icons can be stacked horizontally or vertically,
				// the offsets are given by the 5th and 6th elements of this.windowLayout.toolBar
				this.toolBelowMouse = Math.floor(this.windowLayout.toolBar[4] ? localX/this.windowLayout.toolBar[4] : localY/this.windowLayout.toolBar[5]);
			}
			
			// Mouse over control bar : same mechanism
			localX = this.mouseX-this.windowLayout.controlBar[0]; // local to control bar
			localY = this.mouseY-this.windowLayout.controlBar[1]; // local to control bar
			if (localX>=0 && localX<this.windowLayout.controlBar[2] &&
				localY>=0 && localY<this.windowLayout.controlBar[3])
			{
				// Mouse over control bar. Same as tool bar for orientation. Numbering starts at 16
				this.toolBelowMouse = 16+Math.floor(this.windowLayout.controlBar[4] ? localX/this.windowLayout.controlBar[4] : localY/this.windowLayout.controlBar[5]);
			}
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
	 * Second-level handler for window resize / layout change. Called by Game.
	 * Keeps track of the new layout with the click areas
	 * @param windowLayout Object containing the layout of the different panels and toolbars
	 */
	onLayoutChange : function(windowLayout) {
		this.windowLayout = windowLayout;
	}
	
}
