class Controls
{
	/**
	 * @constructor
	 */
	constructor() {
		this.mouseX = 0;
		this.mouseY = 0;
		this.worldDX=0;
		this.worldDY=0;
		this.windowLayout = false; // default initialization, will be set to actual value by onLayoutChange()
		this.areaUnderMouse=-1;
		this.totalClear();
	}

	/**
	 * Clears all inputs, keyboard and mouse buttons
	 */
	totalClear() {
		this.menuLine=-1;
		this.controlUp=false;
		this.controlDown=false;
		this.controlLeft=false;
		this.controlRight=false;
		this.controlEscape=false;
		this.controlFire=false;
		this.mouseLeftButton=false;
	}
	
	/**
	 * Handler for key up events
	 */
	onKeyUp(event) {
		return !this.keyControl(event, false);
	}

	/**
	 * Handler for key down events
	 */
	onKeyDown(event) {
		return !this.keyControl(event, true);
	}

	/**
	 * Delegated handler for keyboard events
	 * Records key presses and releases, for both standard keys (arrows, enter, escape)
	 * and configurable controls (through the controls menu)
	 * Returns true if the event is handled, false otherwise.
	 */
	keyControl(event, value) {
		var handled = true;
		var key = 0;
		if (window.event) { // IE
			key = window.event.keyCode;
		} else { // FF, Opera,...
			key = event.which;
		}
		
		// test against static, non-redefinable keys (arrows for menu navigation, escape)
		switch (key) {
			case 37 : // left arrow
				this.controlLeft = value;
				break;
			case 38 : // top arrow
				this.controlUp = value;
				break;
			case 39 : // right arrow
				this.controlRight = value;
				break;
			case 40 : // down arrow
				this.controlDown = value;
				break;
			case 32 : // space bar
			case 13 : // enter
				this.controlFire = value;
				break;
			case 27 : // escape
				this.controlEscape = value;
				break;
				
			default :
				handled = false;
		}
		
		return handled;
	}
	
	/**
	 * Handler for mouse up events
	 */
	onMouseUp(event) {

		this.mouseLeftButton=false;
		return true;
	}

	/**
	 * Handler for mouse down events
	 */
	onMouseDown(event) {
		this.mouseLeftButton=true;
		return true;
	}
	
	/**
	 * Handler for touch start / touch enter events
	 * Call onMouseMove (pointer motion handler) first to record position as the event chain begins with onTouchStart
	 * and there is no permanent tracking of the cursor position (unlike mouse event)
	 */
	onTouchStart(event)
	{
		this.onMouseMove(event);
		return this.onMouseDown(event);
	}
	
	/**
	 * Handler for touch end / touch leave events
	 */
	onTouchEnd(event)
	{
		event.preventDefault();
		return this.onMouseUp(event);
	}
	
	/**
	 * Handler for touch move events
	 */
	onTouchMove(event)
	{
		event.preventDefault();
		var result = this.onMouseMove(event);
		return result;
	}
	
	/**
	 * Consume a mouse click, so that the icon will not
	 * be activated again the next frame, until the user clicks again
	 * (used for double-click requirement on reset / menu icons)
	 */
	acknowledgeMouseClick() {
		this.mouseLeftButton=false;
		this.areaUnderMouse = -1;
		this.menuLine = -1;
	}

	/**
	 * Handler for mouse/touch move events
	 */
	onMouseMove(event) {
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
			this.worldDX=(clientX-(innerWidth>>1))*16/this.windowLayout.width;
			this.worldDY=(clientY-(innerHeight>>1))*16/this.windowLayout.width;
			this.areaUnderMouse = -1;
			if (this.worldDX*this.worldDX+this.worldDY*this.worldDY>7.35*7.35 // below central circle
				&& this.worldDY>2.5 // not higher than the side buttons
				&& Math.abs(this.worldDX)<=8) { // not beyond the game panel
				if (this.worldDX < -4) { // left
					this.areaUnderMouse = 3;
				}
				else if (this.worldDX > 4) { // right
					this.areaUnderMouse = 1;
				}
				else if (this.worldDY < 9.65) { // half turn
					this.areaUnderMouse = 2;
				} 
				else {
					this.areaUnderMouse = 0; // straight down
				}
			}
			this.menuLine = Math.floor((this.worldDY-5.4)/1.2);

		}
		return true;
	}
	

	
	/**
	 * Second-level handler for window resize / layout change. Called by Game.
	 * Keeps track of the new layout with the click areas
	 * @param windowLayout Object containing the layout of the different panels and toolbars
	 */
	onLayoutChange(windowLayout) {
		this.windowLayout = windowLayout;
	}
	
}
