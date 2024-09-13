/**
 * Main application class
 *
 * The state member variable defines the current screen :
 *  -1 : initializing, before launch()
 *   0 : main menu
 *   1 : tutorial (not used)
 *   2 : game in progress
 *
 * 
 */
class Game
{
	/**
	 * Create the instance, create the World engine, restores the saved game
	 * @constructor
	 * @param controls Instance of Controls class, to record keyboard / touch / mouse input
	 * @param savedData Contents of localStorage for game, may contain game save
	 **/
	constructor(controls, savedData) {
		this.controls = controls;	
		this.mainMenu = new MenuDriver(5, controls);
		
		this.persistentData = {	musicOn : true };
		this.savedGame = false;
		if (savedData.hasOwnProperty('gameProgress')) {
			this.savedGame = savedData.gameProgress;
		}
		if (savedData.hasOwnProperty('musicOn')) {
			this.persistentData.musicOn = savedData.musicOn;
		}
		
		this.world = new World(controls);
		this.mainMenu.setEnabled(0, false); // disable "Resume" : no game in progress
		this.mainMenu.setEnabled(1, this.savedGame ? true : false); // enable "Load Game" if game saved
		this.mainMenu.setEnabled(3, false); // disable "Save game" while no game in progress
		
		this.world.addSaveGameListener(this);
		this.state = -1;
		
		
		let musicPlayer = new CPlayer();
		musicPlayer.init(song);
		let progress = 0;
		while (progress < 1) {
			progress = musicPlayer.generate();
		}
		
		this.audioMusic = new Audio(URL.createObjectURL(new Blob([musicPlayer.createWave()], {type: "audio/wav"})));
		this.audioMusic.loop = true;
		if (this.persistentData.musicOn) {
			this.audioMusic.play();
		} 
		
	}


	/**
	 * Launch the game : set the state to main menu and start the timers (main loop and rendering loop)
	 */
	launch() {
		this.changeState(0);	// initialize and show main menu
		this.intervalId = setInterval (function() { game.mainLoop(); }, 40);
		//requestAnimationFrame = requestAnimationFrame || webkitRequestAnimationFrame;
		requestAnimationFrame(function() {game.renderLoop();});
	}
	
	
	/**
	 * Change the current state to the new one
	 * Reinitialize menus (selected item, keypresses)
	 * @param newState new value of the state (0 .. 2)
	 */
	changeState(newState) {
		this.controls.totalClear(); // do not forward mouse or keyboard actions to the new state
		
		if (newState == 0) {	// entering menu
			this.mainMenu.setEnabled(0, this.world.gameInProgress);
			this.mainMenu.initialize();

		}
		/*
		if (newState == 1) {	// entering tutorial
			this.world.startTutorial();
		}*/
		this.state = newState;

	}

	
	/**
	 * Main loop, actions only, no rendering
	 * Performs all the model edition + controls effect
	 */
	mainLoop() {
		if (this.state == 0) // main menu
		{
			if (this.world.gameInProgress) {
				this.world.animateItems(); // keep falling / merging in the background 
			}
			
			this.mainMenu.processEvents();
			if (this.mainMenu.done) {
				switch(this.mainMenu.selectedLine) {
					case 2 :// new game
						this.world.startNewGame();
						// no break : we start the game by changing state
					case 0 : // resume game
						this.changeState(2); 
						break;
						
					case 1 : // load and start game
						this.world.loadGame(this.savedGame);
						this.changeState(2); 
						break;
						
					case 3 : // save
						this.world.saveGame();
						this.mainMenu.setEnabled(1, true); // enable "Load Game" option now
						this.renderer.setSaved(true); // change menu text
						break;
					
					case 4 : // music on/off
						this.toggleMusic();
						break;
				}
			}
		}
		
		
		if (this.state == 1 || this.state == 2) {
			this.renderer.setGameOver(false); // change menu text
			this.renderer.setSaved(false); // change menu text
			this.mainMenu.setEnabled(3, true);
		
			if (this.controls.controlEscape) {
				// escape pressed : invoke main menu
				this.changeState(0);
			}

			this.world.processControls(); // consumes all key presses
			this.world.animateItems();
			
			if (!this.world.gameInProgress) {
				// game over : return to main menu
				this.renderer.setGameOver(true); // display "GAME OVER" in menu
				this.changeState(0);
			}
				
		}
		
	}
	 
	/**
	 * Performs all the rendering (view) with no alteration of the model
	 * + controls related to the view only
	 */
	renderLoop() {
				
		this.renderer.drawMain(this.state==0, this.mainMenu);
		if (this.state == 0) {
			this.renderer.drawMainMenu(this.mainMenu);
		}
		requestAnimationFrame(function() {game.renderLoop();});
	}
		
	/**
	 * Define the renderer in charge (one does both overlay canvas and scenery canvas)
	 *
	 * @param renderer new renderer
	 */
	setRenderer(renderer) {
		this.renderer = renderer;
	}
	
	/**
	 * Toggle Background music on and off.
	 * Music playback is stopped immediately when turned off
	 */
	toggleMusic() {
		this.persistentData.musicOn = !this.persistentData.musicOn;
		if (this.persistentData.musicOn) {
			this.audioMusic.play();
		} else {
			this.audioMusic.pause();
		}
		this.writeToStorage(); // save the setting
	}
	
	
	/**
	 * Save the current game and settings to local storage
	 * 
	 * Called when a manual or auto save of the game in progress is requested
	 * Uses a notification system as this is a call up the chain (World -> Game)
	 * All parameters are the contents of the game saved
	 * @param grid 7x7 grid, as a flat array, containing tile ids
	 * @param tiles array containing tile description
	 * @param waitingLine 5-array containing tile description in the waiting line, or false if no tile
	 * @param orientation board orientation, in quarter of turns
	 */
	notifySave(grid, tiles, waitingLine, orientation) {
		this.savedGame = {
			grid : grid,
			tiles : tiles,
			waitingLine : waitingLine,
			orientation : orientation};
		this.persistentData.gameProgress = this.savedGame;
		this.writeToStorage();
	}
	
	/**
	 * Save current settings and game to local storage
	 */
	writeToStorage() {
		localStorage.setItem("2048over13Data", JSON.stringify(this.persistentData));
	}
	
	/**
	 * Called when the window is resized and the window layout changes
	 * Transmits it to the controls
	 * @param windowLayout new layout (grid size, control banner size, drop areas ..)
	 */
	layoutChanged(windowLayout) {
		this.controls.onLayoutChange(windowLayout);
	}
}
