/**
 * Main application class
 *
 * The state member variable defines the current screen :
 *   0 : 
 *   1 : join game menu
 *   2 : game in progress
 *   3 : game ended, score screen
 *   4 : 
 *
 * @constructor
 */
function Game(controls)
{
	this.controls = controls;
	this.world = new World();
	this.worldLink = new WorldLink (controls, this.world);
}

Game.prototype = {

	

	/**
	 * Launch the game : set the state to main menu and start the timers (main loop and rendering loop)
	 */
	launch : function() {
		//this.localServer.initializeGame();
		this.changeState(1);	// main menu
		this.world.initialize();
		this.worldLink.connectToServer();
		this.intervalId = setInterval (function() { game.mainLoop(); }, 40);
		//requestAnimationFrame = requestAnimationFrame || webkitRequestAnimationFrame;
		requestAnimationFrame(function() {game.renderLoop();});
	},
	
	
	/**
	 * Change the current state to the new one
	 * Reinitialize menus (selected item, keypresses)
	 */
	changeState : function(newState) {		
		this.state = newState;
	},

	
	/**
	 * Main loop, actions only, no rendering
	 * Performs all the model edition + controls effect
	 */
	mainLoop : function() {		
		
		if (this.state >1) {		
			this.worldLink.processControls();
			this.world.animateItems();
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
	 * Define the renderer in charge
	 * Adds it as listener to the error messages
	 */
	setRenderer : function(renderer) {
		this.renderer = renderer;
		//this.worldLink.errorMessageListeners.push(renderer);
	},

		
	/**
	 * Called when the window is resized and the window layout changes
	 */
	layoutChanged : function(windowLayout) {
		this.controls.onLayoutChange(windowLayout);
	}
}
