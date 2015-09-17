/**
 * @constructor
 */
function Controls()
{
	this.mouseX = this.mouseY = 0; // screen coordinates
	this.roomX = this.roomY = 0; // room coordinates (accounting for isometric projection)
	this.windowLayout = [0, 0, 240]; // default initialization, will be set to actual value by onLayoutChange()
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
	 * Handler for touch start / touch enter events
	 * Call onMouseMove (pointer motion handler) first to record position as the event chain begins with onTouchStart
	 * and there is no permanent tracking of the cursor position (unlike mouse event)
	 */
	 /*
	onTouchStart : function(event)
	{
		this.onMouseMove(event);
		return this.onMouseDown(event);
	},*/
	
	/**
	 * Handler for touch end / touch leave events
	 *//*
	onTouchEnd : function(event)
	{
		event.preventDefault();
		return this.onMouseUp(event);
	},*/
	
	/**
	 * Handler for touch move events
	 */
	 /*
	onTouchMove : function(event)
	{
		event.preventDefault();
		return this.onMouseMove(event);
	},*/
	
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
/*		if ('changedTouches' in event && event.changedTouches.length > 0)
		{	//touchmove event
			clientX = event.changedTouches[0].clientX;
			clientY = event.changedTouches[0].clientY;
		}*/
		if ('clientX' in event && 'clientY' in event)
		{	// mousemove event
			clientX = event.clientX;
			clientY = event.clientY;
		}
		this.mouseX = clientX-this.windowLayout[0];
		this.mouseY = clientY-this.windowLayout[2];
		this.roomX = (this.mouseX-2*this.mouseY)/64;
		this.roomY = (this.mouseX+2*this.mouseY)/64;
		return true;
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
