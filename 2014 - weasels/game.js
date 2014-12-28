/**
 * Main application class
 *
 * The state member variable defines the current screen :
 *   0 : main menu
 *   1 : level intro screen
 *   2 : game in progress
 *   3 : 
 *   4 : end level screen
 *
 * @constructor
 */
function Game(controls, playField)
{
	this.controls = controls;
	this.fastForward = false;
	this.pause = false;
	
	this.lastButtonClicked = -1;
	
	// Object storage implementation from http://stackoverflow.com/questions/2010892/storing-objects-in-html5-localstorage/3146971
	// Not put in its own class this year, should be so in a clean design
	this.persistentData = {
		soundOn : true,
		musicOn : true,
		maxLevel : 0
	};
	var recordedData = localStorage.getItem("WeaselsData");
	if (recordedData) {
		this.persistentData = JSON.parse(recordedData);
	}
	this.level=this.persistentData.maxLevel;
	this.soundManager = new SoundManager(this.persistentData);
	this.world = new World(controls, playField, this.soundManager);
	this.finalLevel = this.world.loader.levels.length-1; // last level in the game
	this.wonLastLevel = false;
}

Game.prototype = {

	launch : function() {
		this.soundManager.initMusic();
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
		this.renderer.notifyStateChange(this.state, newState, this.world.won());
		
		if (newState==1 || (newState==2 && this.state==2)) 
		{	// (re)start level : load the description
			this.world.loadLevel(this.level);
			this.lastButtonClicked = -1;
			this.fastForward = false;
			this.pause = false;
		}
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
							zone = Math.floor(2 * this.renderer.pixelRatio * (this.controls.mouseY-256) / (window.innerHeight/this.renderer.pixelRatio - 256));
							if (this.controls.buttonAreaY==2) {
								this.level = Math.max(0, this.level-1);
							} else {
								this.level = Math.min(this.persistentData.maxLevel, this.level+1, this.finalLevel);
							}
							break;
						case 3 : // start game
							this.changeState(1);	// start level, show intro
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
		
		if (this.state>0) {	// intro, ingame or level end
			// scroll the game area : mouse on a side, or left/right arrow key pressed
			if (this.controls.mouseY<256)
			{	
				if (this.controls.mouseX < 5)
				{
					this.renderer.scrollScenery(5, false);
				}
				if (window.innerWidth/this.renderer.pixelRatio - this.controls.mouseX < 5)
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
		localStorage.setItem("WeaselsData", JSON.stringify(this.persistentData));
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
	}
}
