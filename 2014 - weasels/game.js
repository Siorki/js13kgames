/**
 * Main application class
 *
 * The state member variable defines the current screen :
 *   0 : main menu
 *   1 : level intro screen
 *   2 : game in progress
 *   3 : tutorial
 *   4 : end level screen
 *
 * @constructor
 */
function Game(controls, playField, savedData)
{
	this.controls = controls;
	this.fastForward = false;
	this.pause = false;
	
	this.lastButtonClicked = -1;
	
	this.persistentData = {
		soundOn : (savedData.hasOwnProperty('soundOn') ?  savedData.soundOn : true),
		musicOn : (savedData.hasOwnProperty('musicOn') ?  savedData.musicOn : true),
		maxLevel : (savedData.hasOwnProperty('maxLevel') ?  savedData.maxLevel : 0)
	};
	
	this.level=(savedData.hasOwnProperty('maxLevel') ?  savedData.maxLevel : -1);	// offer tutorial on first play
	this.tutorialPage=0;
	this.soundManager = new SoundManager(this.persistentData);
	this.world = new World(controls, playField, this.soundManager);
	this.finalLevel = this.world.loader.levelCount-1; // last level in the game
	this.wonLastLevel = false;
	this.gameAreaLayout = [0, 1600];
	this.state = -1;
}

Game.prototype = {

	/**
	 * Perform the asynchronous sound initialization, then proceed to launch the game
	 */
	init: function()
	{
		if (this.soundManager.initMusic()) {
			this.launch();
		} else
		{
			this.renderer.drawLoader(this.soundManager.initProgress/12);
			setTimeout(function() {game.init();}, 10);
		}
	},

	/**
	 * Launch the game : set the state to main menu and start the timers (main loop and rendering loop)
	 */
	launch : function() {
		this.changeState(0);	// main menu
		this.intervalId = setInterval (function() { game.mainLoop(); }, 40);
		//requestAnimationFrame = requestAnimationFrame || webkitRequestAnimationFrame;
		requestAnimationFrame(function() {game.renderLoop();});
	},
	
	
	/**
	 * Change the current state to the new one
	 * Set the transition timer to the default value (20)
	 * Reinitialize menus (selected item, keypresses)
	 */
	changeState : function(newState) {
		this.controls.totalClear();
		
		if (newState==1 || (newState==2 && this.state==2) || newState==3) 
		{	// (re)start level : load the description
			this.world.loadLevel(this.level);
			this.lastButtonClicked = -1;
			this.fastForward = false;
			this.pause = false;
		}
		if (newState==3)
		{	// entering tutorial : reset to first page
			this.tutorialPage=0;
		}
		// perform the graphic transition after loading (scrolling depends on level contents)
		this.renderer.notifyStateChange(this.state, newState, this.world.won());
		if (newState==2) {
			this.soundManager.startMusic();
		} else {
			this.soundManager.stopMusic();
		}
		this.state = newState;

	},

	
	/**
	 * Main loop, actions only, no rendering
	 * Performs all the model edition + controls effect
	 */
	mainLoop : function() {
		if (this.state == 0) // main menu
		{
			if (this.controls.mouseLeftButton)
 			{
				this.controls.acknowledgeMouseClick();
				if (this.controls.buttonAreaY>0)	// click beyond play area
				{
					switch (this.controls.buttonAreaX)
					{
						case 0 : // SFX on / off
							this.toggleSound();
							break;
						case 1 : // Music on / off
							this.toggleMusic();
							break;
						case 2 : // Change level
							if (this.controls.buttonAreaY==2) {
								this.level = Math.max(-1, this.level-1);
							} else {
								this.level = Math.min(this.persistentData.maxLevel, this.level+1, this.finalLevel);
							}
							break;
						case 3 : // start game
							this.changeState(this.level<0 ? 3 : 1);	// start tutorial or show level intro
							break;
					}
				}
			}
		}
		
		
	
		if (this.state == 1)	// level intro
		{	// start game on a mouse click
			if (this.controls.mouseLeftButton)
 			{
				this.controls.acknowledgeMouseClick();
				this.changeState(2);
			}
		}
		
		if (this.state == 3) // tutorial
		{	// change screen on a mouse click
			
			if (this.controls.mouseLeftButton)
 			{
				this.controls.acknowledgeMouseClick();
				if (++this.tutorialPage == 15)
				{	// once the tutorial is over, return to main screen and select first level
					this.changeState(0);
					this.level = 0;
				}
			}
		}
		
		
		if (this.state>0 && this.state!=3) {	// intro, ingame or level end
			// scroll the game area : mouse on a side, or left/right arrow key pressed
			this.renderer.scrollingInProgress = 0;
			if (this.controls.scrollOnSwipe)
			{
				// touch screen : scroll by swiping / dragging the background
				if (this.controls.mouseLeftButton && this.world.draggedTrap==-3 && this.world.dragging)
				{
					this.renderer.scrollScenery(this.sceneryOffsetXAtRest+this.controls.swipeScrollX, true);
				} else {
					this.sceneryOffsetXAtRest = this.renderer.sceneryOffsetX;
				}
			} 	
			else if (this.controls.mouseY<256)
			{	
				// mouse scroll (disabled for touch screens and during tutorial) if
				//    - cursor is on the left/right side of the play area (FFOS screen layout)
				//    - or cursor is on the left/right side beyond the play area but not over an icon, or the intro screen is showing (no icons)
				var localX = this.controls.mouseX-this.gameAreaLayout[0];
				if ((localX>=0 || this.state!=2 || this.controls.toolBelowMouse==-1) && localX<12)
				{
					this.renderer.scrollScenery(5, false);
				}
				if (localX>=this.gameAreaLayout[1]-12 && (localX<this.gameAreaLayout[1] || this.state!=2 || this.controls.toolBelowMouse==-1))
				{
					this.renderer.scrollScenery(-5, false);
				}
			}
			if (this.controls.controlLeft) 
			{
				this.renderer.scrollScenery(10, false);
			}
			if (this.controls.controlRight) 
			{
				this.renderer.scrollScenery(-10, false);
			}
		}
		
		if (this.state == 2) {
		
			if (this.controls.controlEscape)
			{
				if (this.lastButtonClicked == 3)
				{	
					this.changeState(0);
				} else {
					// force a double keypress for this action
					this.controls.totalClear();
					this.lastButtonClicked = 3;
				}
			}
			if (this.controls.mouseLeftButton)
 			{
				if (this.controls.toolBelowMouse >= 16)
				{	// click on a game control button (pause, fast forward, ...)
					var buttonId = this.controls.toolBelowMouse - 16;
					this.controls.acknowledgeMouseClick();
					switch (buttonId) {
						case 0 :	// pause
							this.fastForward = false;
							this.pause = !this.pause;
							break;
						case 1 :	// fast forward
							this.pause = false;
							this.fastForward = !this.fastForward;
							break;
						case 2 : 	// restart level
							if (this.lastButtonClicked == buttonId)
							{	// force a double click for this action
								this.changeState(2);
								buttonId = -1;
							}
							break;
						case 3 : 	// return to menu
							if (this.lastButtonClicked == buttonId)
							{	// force a double click for this action
								this.changeState(0);
								buttonId = -1;
							}
							break;
					}
					this.lastButtonClicked = buttonId;
				}
				else
				{
					this.lastButtonClicked = -1;
				}
			}
			this.world.processControls();
		}
		
		if (this.state == 3)
		{
			this.world.animateItems();
		}
		
		if (this.state == 2 && !this.pause)
		{
			this.world.animateItems();
			if (this.fastForward) {	// in fast forward, move critters three times as fast
				this.world.animateItems();
				this.world.animateItems();
			}
				
			if (this.world.won() || this.world.lost())
			{
				if (this.world.won()) 
				{
					/*
					// clay.io Achievements - disabled as they are not present in SDK v2
					if (globalUseClay)	// use as an ifdef
					{
						switch (this.level)
						{
							case 0 : // first level completed
								( new Clay.Achievement( { id: 5478 } ) ).award();
								break;
							case 7 : // first level with cannon
								( new Clay.Achievement( { id: 5479 } ) ).award();
								break;
							case 14 : // finished summer levels
								( new Clay.Achievement( { id: 5480 } ) ).award();
								break;
							case 21 : // first level with dynamite
								( new Clay.Achievement( { id: 5481 } ) ).award();
								break;
							case 29 : // finished winter levels
								( new Clay.Achievement( { id: 5482 } ) ).award();
								break;
							default :
						}
						if (this.world.timer < 750) // won in less than 30s
						{
							( new Clay.Achievement( { id: 5483 } ) ).award();
						}
						if (this.world.totalTime - this.world.timer < 250 && this.world.timer < this.world.totalTime) // less than 10s left
						{
							( new Clay.Achievement( { id: 5484 } ) ).award();
						}
						if (this.world.timer >= this.world.totalTime) // time elapsed : level where no weasel shall make it to the exit
						{
							( new Clay.Achievement( { id: 5485 } ) ).award();
						}
					} // end if (globalUseClay)
					*/
					this.soundManager.playLevelWon();
					this.wonLastLevel = (this.level == this.finalLevel);
					if (this.level < this.finalLevel)
					{	// write the new level reached to local storage
						++this.level;
						this.persistentData.maxLevel = Math.max(this.persistentData.maxLevel, this.level);
						this.storeData();
					}
				} else {
					this.soundManager.playLevelLost();
				}
				this.changeState(4); // level ends
			}
		}
		if (this.state == 4) 
		{	// on a mouse click, move to 
			//  - main screen if the player just won the last level
			//  - level intro otherwise. Same level if failed, next one if succeeded
			if (this.controls.mouseLeftButton)
 			{
				this.controls.acknowledgeMouseClick();
				this.changeState(this.wonLastLevel?0:1);
			}
		}
	},	
	 
	/**
	 * Performs all the rendering (view) with no alteration of the model
	 * + controls related to the view only
	 */
	renderLoop : function() {
				
		this.renderer.drawMain();		
		requestAnimationFrame(function() {game.renderLoop();});
	},
		
	/**
	 * Define the renderer in charge (one does both overlay canvas and scenery canvas)
	 */
	setRenderer : function(renderer) {
		this.renderer = renderer;
	},
	
	/**
	 * Private method to synchronize local storage with current data
	 */
	storeData : function() {
		/*
		// Clay user storage disabled in SDK v2
		if (globalUseClay) {
			Clay.Player.saveUserData("WeaselsData", this.persistentData, function( response ) {} );
		} else 
		*/
		{
			localStorage.setItem("WeaselsData", JSON.stringify(this.persistentData));	
		}
	},
	
	
	/**
	 * Toggle Sound effects on and off. Saved to local storage.
	 */
	toggleSound : function() {
		this.persistentData.soundOn = ! this.persistentData.soundOn;
		this.storeData();
		this.soundManager.sfxFlagChanged();
	},
	
	/**
	 * Toggle music on and off. Saved to local storage.
	 */
	toggleMusic : function() {
		this.persistentData.musicOn = !this.persistentData.musicOn;
		this.storeData();
	},
	
	/**
	 * Called when the window is resized and the window layout changes
	 */
	layoutChanged : function(windowLayout) {
		this.gameAreaLayout[0] = windowLayout.playArea[0];
		this.gameAreaLayout[1] = windowLayout.playArea[2];
		this.controls.onLayoutChange(windowLayout);
	}
}
