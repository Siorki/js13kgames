/**
 * Main application class
 *
 * The state member variable defines the current screen :
 *  -3 : game intro
 *  -2 : controls setup from pause menu (ingame)
 *  -1 : controls setup from main menu
 *   0 : main menu
 *   1 : difficulty menu
 *   2 : game in progress
 *   3 : game ended, endgame menu
 *   4 : game paused
 *   5 : game won, endgame animation
 *
 * @constructor
 */
function Game(controls)
{
	this.transitionTimer=0;
	this.difficulty=0;
	this.controls = controls;
	this.soundManager = new SoundManager(this.persistentData = controls.persistentData);
	this.mainMenu = new MenuDriver(1, 5, controls, this.soundManager, -1);
	this.mainMenu.setAction(0, 2, this.mainMenu.toggleMusic);
	this.mainMenu.setAction(0, 3, this.mainMenu.toggleSfx);
	this.controlsMenu = new MenuDriver(3, 1, controls, this.soundManager, 0);
	this.controlsMenu.setAction(0, 0, this.controlsMenu.setInputDevice);
	this.controlsMenu.setAction(2, 0, this.controlsMenu.setInputDevice);
	this.endRaceMenu = new MenuDriver(1, 2, controls, this.soundManager, 1);	
	this.difficultyMenu = new MenuDriver(1, 4, controls, this.soundManager, 3); 
	
	this.timer = 0;	// 50 FPS, used for rendering
	this.world = new World(this.controls);	
	this.messages = [
		"All systems ready and fully functional.",				// intro
		"Navigation route plotted.",							// intro
		"Starting engines.",									// intro
		"Autopilot engaged.",									// intro
		"Green corridors are safe and harbor no hazard.",		// t0
		"Sorry Luke, I'm giving up.",							// no reactor left
		"Try to keep the last one until the end.",				// 1 reactor left
		"It will be a bumpy ride, but I can handle this.",		// 2 reactors left
		"No problem, the fourth one was a spare.",				// 3 reactors left
		"Ouch. I'm getting dizzy. Please don't do that again",	// flyback
		"Wow. What happened ?",									// flyback
		"Aaaa! Kernel panic. Emergency routine activated.",		// flyback
		"Whoops. Time discontinuity recorded. Realigning.",		// flyback
		"Right on commander !"									// victory
	];
}

Game.prototype = {


	launch : function() {
		this.changeState(-3);	// game intro
		this.intervalId = setInterval (function() { game.mainLoop(); }, 20);
		requestAnimationFrame(function() {game.renderLoop();});
	},
	
	/**
	 * Say (if voice on) and display a message for the player
	 * @param messageId Index of the message in the message list
	 * @param panic Voice tone in [0..1] : 0 serene, 1 in panic
	 * @param print true to display on the overlay, false to speak only
	 */ 
	broadcastMessage : function(messageId, panic, print) {
		if (print) {
			this.overlayRenderer.setMessage(this.messages[messageId]);
		}
		this.soundManager.speak(.5, panic, this.messages[messageId]);
	},
	
	/**
	 * Change the current state to the new one
	 * Set the transition timer to the default value (20)
	 * Reinitialize menus (selected item, keypresses)
	 */
	changeState : function(newState) {
		this.oldState = this.state;
		this.state = newState;
		this.transitionTimer = 20;
		this.mainMenu.initialize();
		this.controlsMenu.initialize();
		this.difficultyMenu.initialize();
		this.endRaceMenu.initialize();
		
		if (newState==-3 || newState==5) {
			this.timer=0; // restart animation from the beginning
		}
		
		if (newState==1) {  // entering difficulty menu
			this.difficultyMenu.selectedLine = this.difficulty;
		}
		if (newState==2 && this.oldState!=4) {	// game begins
			this.difficulty = this.difficultyMenu.selectedLine ;
			this.world.initialize(this.difficulty);
			this.renderer.reset();	// remove all explosions, particles, ...
			this.broadcastMessage(4, 0, true);
		}
		if (newState==-1 || newState==-2) {
			this.controlsMenu.selectedColumn = 1;
		}
	},
	
	/**
	 * Main loop, actions only, no rendering
	 */
	mainLoop : function() {
		this.actionLoop();
		this.soundLoop();
	},
	
	/**
	 * Performs all the model edition + controls effect
	 *  - car motion, collision detection
	 */
	actionLoop : function() {
		if (this.state == -3) {
			if (this.timer==650) {
				this.broadcastMessage(0, 0, false);
			}
			if (this.timer==1600) {
				this.broadcastMessage(1, 0, false);
			}
			if (this.timer==2950) {
				this.broadcastMessage(2, 0, false);
			}
			if (this.timer==3450) {
				this.broadcastMessage(3, 0, false);
			}
			if (this.controls.controlFire) {
				this.changeState(0);
			}
		}
		if (this.state == 0) // main menu
		{
			this.mainMenu.processEvents();
			if (this.mainMenu.done) {
				var newState = [1, -1][this.mainMenu.selectedLine]; // difficulty, or controls menu
				this.changeState(newState); 
			}
		}
		if (this.state == -1) // controls menu
		{
			this.controlsMenu.processEvents();
			if (this.controlsMenu.done) {
				this.changeState(0); // back to main menu
			}
		}
		if (this.state == -2) // controls menu ingame
		{
			this.controlsMenu.processEvents();
			if (this.controlsMenu.done) {
				this.changeState(4); // back to pause menu
			}
		}
		if (this.state == 1) // tracks menu
		{
			this.difficultyMenu.processEvents();
			if (this.difficultyMenu.done) {
				var newState = (this.difficultyMenu.selectedLine == this.difficultyMenu.lineCount-1 ? 0 : 2);
				this.changeState(newState); // start game (2), or back to main (0)
			}
		}
		if (this.state == 3) // end game menu
		{
			this.endRaceMenu.processEvents();
			if (this.endRaceMenu.done) {
				var newState = [2, 0][this.endRaceMenu.selectedLine]; // race again, or main menu
				this.changeState(newState); 
			}
		}
		if (this.state == 4) // pause menu
		{
			this.mainMenu.processEvents();
			if (this.mainMenu.done) {
				var newState = [2, -2, 0, 0, 0][this.mainMenu.selectedLine];
				this.changeState(newState);
			}
		}

		// move the ship
		if (this.state == 2) {
			this.world.animateItems();
			this.world.processCollisions();
			if (this.controls.controlEscape) {
				this.changeState(4);
			}
			if (this.world.flybackCountdown == 199) {	// flyback in motion
				// AI does not appreciate flyback
				this.soundManager.playFlyback();
				this.broadcastMessage(9+Math.floor(4*Math.random()), .8, false);
			}
			
			if (this.world.events.length) {
				this.soundManager.playCollision();
			}
			for (var i of this.world.events) {
				var reactorBlown = false;
				if (!i) { // event 0 : hull destroyed
					this.changeState(3);  // endgame menu
				} else {
					reactorBlown = reactorBlown || (i<8);
				}
				if (reactorBlown) {
					var reactorsLeft = this.world.ship.componentPresent.slice(1).reduce((a,b)=>a+b , 0);
					this.broadcastMessage(5+reactorsLeft, (3-reactorsLeft)/3, true);
				}
			}
			if (this.world.won()) {
				this.changeState(5);  // game won : animation
				this.broadcastMessage(13, 0, true);
			}
		}
		++this.timer;
	},	
	 
	/**
	 * Performs all the rendering (view) with no alteration of the model
	 * + controls related to the view only
	 */
	renderLoop : function() {
		this.overlayRenderer.clear();

		if (this.state==-2 || this.state==2 || this.state==4) {
			if (this.world.flybackCountdown) {
				this.overlayRenderer.renderFlybackEffect(this.world.flybackCountdown);
			}
			this.overlayRenderer.showMessage();
			this.overlayRenderer.renderStatusBar(this.world.ship, this.world.timeGiven, this.world.countDown, this.world.flybackCharge);			
		}
		if (this.state==5) { // game won
			this.overlayRenderer.renderEndSequence(this.timer);
		}

		// show menus on top
		if (this.transitionTimer>0) {
			this.overlayRenderer.offsetDisplay(1-this.transitionTimer/20);
			switch (this.oldState) {
				case 0 : // main menu
					this.overlayRenderer.renderMainMenu(this.mainMenu, false, this.timer);
					break;
				case 4 : // pause menu
					this.overlayRenderer.renderMainMenu(this.mainMenu, true, this.timer);
					break;
				case -1 : // control setup (from main)
				case -2 : // control setup (from pause)
					this.overlayRenderer.renderControlsMenu(this.controlsMenu, this.controls, this.timer);
					break;
				case 1 : // difficulty menu
					this.overlayRenderer.renderDifficultyMenu(this.difficultyMenu, this.timer);
					break;
				case 3 : // end game
					this.overlayRenderer.renderEndGameMenu(this.endRaceMenu, this.timer);
					break;
				case -3 : // intro
					this.overlayRenderer.renderIntroText(this.timer);
					break;
				default:
			}			
			this.overlayRenderer.endOffset();
		}
		this.overlayRenderer.offsetDisplay(-this.transitionTimer/20);
		switch (this.state) {
			case 0 : // main menu
				this.overlayRenderer.renderMainMenu(this.mainMenu, false, this.timer);
				break;
			case 4 : // pause menu
				this.overlayRenderer.renderMainMenu(this.mainMenu, true, this.timer);
				break;
			case -1 : // control setup (from main)
			case -2 : // control setup (from pause)
				this.overlayRenderer.renderControlsMenu(this.controlsMenu, this.controls, this.timer);
				break;
			case 1 : // difficulty menu
				this.overlayRenderer.renderDifficultyMenu(this.difficultyMenu, this.timer);
				break;
			case 3 : // end game
				this.overlayRenderer.renderEndGameMenu(this.endRaceMenu, this.timer);
				break;
			case -3 : // intro
				this.overlayRenderer.renderIntroText(this.timer);
				break;
			default:
		}				
		this.overlayRenderer.endOffset();
		this.renderer.drawMain([2, 0, 2, 2, 2, 0, 0, 0, 1][this.state+3], this.timer);

		this.world.clearEvents(); // after all events are drawn		
		if (this.state == 3) {	// game lost : add explosions
			this.world.events.push(0);
		}
		if (this.transitionTimer) {
			--this.transitionTimer;
		}
		

		requestAnimationFrame(function() {game.renderLoop();});
	},
	
	soundLoop : function() {
		var engineSound = (this.state == 2);
		//this.soundManager.adjustEngineSound(0, engineSound, this.world.cars[0].rpm, this.world.cars[0].accelerating, this.world.cars[0].inTunnel);
		/*
		if (this.world.cars[0].collisionStrength>0) {
			this.soundManager.playCollisionSound(0, Math.min(1.0, this.world.cars[0].collisionStrength), this.world.cars[0].collisionSpeed/30.0);
		}
		if (this.world.time>=-150 && this.world.time<=0 && (this.world.time%50) == 0) {
			this.soundManager.playStartSound(!this.world.time);
		}*/
	},
	
	/**
	 * Define the renderers (main view and overlay) in charge
	 */
	setRenderer : function(renderer, overlayRenderer) {
		this.renderer = renderer;
		this.overlayRenderer = overlayRenderer;
	},
	
	/**
	 * Handler for window resize event
	 */
	resizeWindow : function() {
		this.renderer.resizeWindow(); 
		this.overlayRenderer.resizeWindow();
	}
}
