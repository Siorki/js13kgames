/**
 * Graphic renderer for the overlaid 2D canvas.
 */
 
/**
 * OverlayRenderer constructor
 * @param canvas the canvas to draw on.
 * @constructor
 */
function OverlayRenderer(canvas) 
{
	this.canvas = canvas;
	this.context = canvas.getContext('2d');
	this.resizeWindow();
	

	this.mainMenuText = ["PLAY", "CONTROLS : ", "SOUND FX : ", "VOICE : "];
	this.pauseMenuText = ["RESUME GAME", "CONTROLS : ", "SOUND FX : ", "VOICE : ", "QUIT TO MENU"];
	this.controlsMenuText = [	["", "MOUSE", "Move", "Left Button", "Right Button"],
								["BACK TO MAIN", "", "MOVE", "ACCELERATE", "FLYBACK"],
								["", "KEYBOARD", "WASD/ZQSD/IJKL/Arrows", "Enter/Left Ctrl/Alt", "Keypad 0/Right Ctrl/Alt Gr"] ];
	this.endRaceMenuText = ["PLAY AGAIN", "BACK TO MAIN MENU"];
	this.difficultyMenuText = ["EASY", "MEDIUM", "HARD", "BACK TO MAIN"];
	this.message = "";
	this.messageTimer = 0;
}

OverlayRenderer.prototype = {

	resizeWindow : function() {
		var width = window.innerWidth, height=window.innerHeight;
		
		this.canvas.height=this.context.height=height;
		this.canvas.width=this.context.width=width;
		this.context.translate(width>>1,height>>1);
		this.scale = .1*Math.min(.5*width, height);
		// common font setup. Reset to default prior to exiting any method that modifies these.
		this.context.lineJoin="bevel";
		this.context.lineWidth=4;
		this.context.textAlign="center";
	},

	outlineText : function(text,x,y,size) {
		this.context.font = Math.ceil(size*this.scale)+"px Verdana";
		this.context.strokeText(text, x, y);
		this.context.fillText(text, x, y);
	},
	
	/**
	 * Clear the canvas
	 */
	clear : function() {
		this.context.clearRect(-this.context.width>>1, -this.context.height>>1, this.context.width, this.context.height);
	},
	
	/**
	 *	Offset menu display for transition
	 *  @param ratio : any value between -1(one screen up) and 1 (one screen down). 0 means unchanged.
	 */
	offsetDisplay : function(ratio) {
		this.context.save();
		this.context.translate(0, this.canvas.height*ratio);
	},
	
	/**
	 * Restore the context as before the offset
	 */
	endOffset : function() {
		this.context.restore();
	},

	/**
	 * Draw the text during the intro sequence
	 */
	renderIntroText : function(timer) {
		this.context.fillStyle="#fff";
		this.context.strokeStyle="#000";
		this.context.textAlign="left";
		if (timer<470){
			this.outlineText("Somewhere in the galaxy".substr(0, Math.floor(timer/10)), -this.context.width/2, -this.context.height/2+this.scale, .6);
		} else if (timer<1000){
			this.outlineText("Somewhere in the galaxy, our last hope".substr(0, Math.floor((timer-240)/10)), -this.context.width/2, -this.context.height/2+this.scale, .6);
		}
		
		if (timer>2000){
			this.outlineText("INFILTRATION".substr(0, Math.floor((timer-2000)/10)), -this.context.width/2, this.context.height/4, 1.5);
		}
		if (timer>2200 && timer<3500) {
			this.outlineText("a game released for js13kgames 2019".substr(0, Math.floor((timer-2200)/10)), -this.context.width/2, this.context.height/4+this.scale, .6);
		}
		if (timer>3500) {
			this.outlineText("press Enter or LMB to start".substr(0, Math.floor((timer-3500)/10)), -this.context.width/2, this.context.height/4+this.scale, .6);
		}
		this.context.textAlign="center";
		
	},
	
	/**
	 * Draw the main menu options
	 * @param menu the active menu (selected line, controls, ...)
	 * @param pause true if the menu was invoked from ingame pause
	 */
	renderMainMenu : function(menu, pause, timer) {
		
		this.context.save();
		var highlightColor = "#fff";
		if ((timer%3)==0 && ((Math.floor(timer/50)&1)==0)) {
			highlightColor = "#f77";
		}
		var gray = Math.round(50+50*Math.cos(timer/20));
			
		for (var index=0; index<(pause?5:4); ++index) {
			this.context.fillStyle=(menu.selectedLine==index?highlightColor : "#aaa");
			this.context.strokeStyle="hsl(0,0%,"+(menu.selectedLine==index?gray:0)+"%)";			
			var text=pause?this.pauseMenuText[index]:this.mainMenuText[index];
			text+=(index==1?(menu.controls.usingMouseInputDevice()?"MOUSE":"KEYBOARD"):"");
			text+=(index==2?(menu.soundManager.audioTagSupport?(menu.soundManager.persistentData.data.musicOn?"ON":"OFF"):"not supported"):"");
			text+=(index==3?(menu.soundManager.speechSupport?(menu.soundManager.persistentData.data.soundOn?"ON":"OFF"):"not supported"):"");
			this.outlineText(text, 0, (index-2)*1.5*this.scale, .8);
		}
		this.context.restore();
	},
	
	/**
	 * Draw the menu that offers actions to edit the control keys
	 */
	renderControlsMenu : function(menu, controls, timer) {
		this.context.save();

		var highlightColor = "#fff";
		if ((timer%3)==0 && ((Math.floor(timer/50)&1)==0)) {
			highlightColor = "#f77";
		}
		var gray = Math.round(50+50*Math.cos(timer/20));
			
		for (var column=0; column<3; ++column) {
			for (var line=0; line<5; ++line) {
				var x=window.innerWidth*(column-1)*.3;
				var selected = column==(controls.usingMouseInputDevice()?0:2);
				var highlighted = column==menu.selectedColumn && (column !=1 || line == 0);
				this.context.strokeStyle="hsl(0,0%,"+(highlighted?gray:0)+"%)";
				this.context.fillStyle=highlighted?highlightColor : (selected? "#fff" : "#aaa");
				this.outlineText(this.controlsMenuText[column][line], x, (line-3)*this.scale, .6);
			}
		}
			
		this.context.restore();
	},
	
	/**
	 * Display on the overlay canvas the difficulty	menu :
	 *  - one header
	 *  - one line for each track, featuring track name and records
	 *  - one final line to return to main menu
	 */ 
	renderDifficultyMenu : function(menu, timer)
	{
		this.context.save();
		var highlightColor = "#fff";
		if ((timer%3)==0 && ((Math.floor(timer/50)&1)==0)) {
			highlightColor = "#f77";
		}
		var gray = Math.round(50+50*Math.cos(timer/20));
			
		for (var index=0; index<menu.lineCount; ++index) {
			this.context.fillStyle=(menu.selectedLine==index?highlightColor : "#aaa");
			this.context.strokeStyle="hsl(0,0%,"+(menu.selectedLine==index?gray:0)+"%)";			
			this.context.textAlign="center";
			var y = (index+1)*9*this.scale/menu.lineCount-(this.context.height>>1);
			this.outlineText(this.difficultyMenuText[index], 0, y, .75);	
		}
		
		this.context.restore();
	},
	
	/**
	 * Formats the time as ss:cc (below 1 mn) or mm:ss:cc otherwise
	 * Leading zeroes are added except for the first block (5:20 vs 1:05:20)
	 * @param time time counter in frames
	 */
	formatTime : function(time)
	{
		if (time==0) 
			return "--:--";
		time*=2;
		var cs = time%100, s = ((time-cs)/100)%60, m = (time-cs-s*100)/6000;
		return (m>0?m+":":"")+(m>0&s<10?"0":"")+s+":"+(cs<10?"0":"")+cs;
	},
	
	/**
	 * Draw an animation when flyback is triggered
	 */
	renderFlybackEffect : function(timer) 
	{
		var transparency = Math.min(1, (200-timer)/20, (timer-100)/70);
		this.context.fillStyle="hsla(240,100%,"+(timer>>1)+"%,"+transparency+")";
		this.context.fillRect(-this.context.width>>1, -this.context.height>>1, this.context.width, this.context.height);
	},
	
	/**
	 * Draw the ingame top bar : ship speed, distance, countdown
	 */
	renderStatusBar : function(ship, timeGiven, timeRemaining, flybackCharge)
	{
		this.context.save();
		this.context.translate(0, -this.context.height>>1);
		this.context.fillStyle="rgba(0,0,0,.5)";
		this.context.fillRect(-this.context.width>>1, 0, this.context.width, .5*this.scale);
		var panelWidth = this.context.width;
		this.context.textAlign="center";
		var panelLeft = -.5*this.context.width;
		
		// ship speed
		this.context.fillStyle="#c00";	
		this.context.strokeStyle="#fff";	
		this.context.fillRect(panelLeft+panelWidth/32, this.scale/15, ship.speed*panelWidth/2, this.scale/3);
		this.context.strokeRect(panelLeft+panelWidth/32, this.scale/15, panelWidth/4, this.scale/3);
		this.context.strokeStyle="#000";	
		this.context.fillStyle="#fff";		
		this.outlineText("speed", panelLeft+panelWidth*19/120, this.scale/3-1, .25);

		// flyback
		this.context.fillStyle="rgb(0,0,"+(flybackCharge>>1)+")";
		this.context.strokeStyle="#fff";	
		this.context.fillRect(panelLeft+panelWidth*5/16, this.scale/15, flybackCharge*panelWidth/4e3, this.scale/3);
		this.context.strokeRect(panelLeft+panelWidth*5/16, this.scale/15, panelWidth/4, this.scale/3);
		this.context.strokeStyle="#000";	
		this.context.fillStyle="#fff";		
		this.outlineText("flyback  :", panelLeft+panelWidth*13/32, this.scale/3-1, .25);
		this.context.fillStyle="hsl(0,0%,"+Math.floor(65+35*Math.sin(flybackCharge/13))+"%)";
		this.outlineText(flybackCharge>999?"ready":"charging",panelLeft+panelWidth*15/32, this.scale/3-1, .25);
		
		// ship location
		var progress = ship.step/656; // 41 blocks, 16 steps each
		var expectedProgress = 1-timeRemaining/timeGiven; // linear rule
		this.context.fillStyle="#c00";	
		this.context.strokeStyle="#fff";	
		this.context.fillRect(panelLeft+panelWidth*19/32, this.scale/15, expectedProgress*panelWidth/4, this.scale/3);
		this.context.strokeRect(panelLeft+panelWidth*19/32, this.scale/15, panelWidth/4, this.scale/3);
		this.context.strokeStyle="#000";	
		this.context.fillStyle="#fff";		
		this.outlineText(">", panelLeft+panelWidth*19/32+progress*panelWidth/4, this.scale/3-1, .25);
		
		
		// countdown
		this.context.fillStyle=timeRemaining > 0 ? "#fff" : "#f00";
		this.context.textAlign="right";
		this.outlineText(this.formatTime(timeRemaining), panelLeft+panelWidth*.95, this.scale/3-1, .25);
		
		
		this.context.restore();
	},
	
	/**
	 * Cinematic sequence when the player destroys the Death Cube
	 */
	renderEndSequence : function(timer) {
		var transparency = Math.min(1, (100-timer)/10);
		this.context.fillStyle="hsla(0,0%,100%,"+transparency+")";this.context.beginPath();
		this.context.arc(0, 0, this.scale*timer*.5, 0, 7, false);
		this.context.fill();
		transparency = Math.min(1, (100-timer)/10, (timer-50)/70);
		this.context.fillStyle="hsla(0,100%,"+Math.min(100, timer)+"%,"+transparency+")";
		this.context.fillRect(-this.context.width>>1, -this.context.height>>1, this.context.width, this.context.height);		
		this.context.fillStyle="#fff";
		this.context.strokeStyle="#000";
		if (timer>150) {
			this.outlineText("The Death Cube is destroyed", 0, 2*this.scale, .8);
		}
		if (timer>200) {
			this.outlineText("A new era begins for the Alliance", 0, 3.2*this.scale, .8);
		}
		if (timer>250) {
			this.outlineText("Congratulations, you won !", 0, 4.4*this.scale, .8);
		}
	},
	
	
	/**
	 * Draw the menu after a game is lost
	 */
	renderEndGameMenu : function(menu, timer) {
		
		this.context.save();
		var highlightColor = "#fff";
		if ((timer%3)==0 && ((Math.floor(timer/50)&1)==0)) {
			highlightColor = "#f77";
		}
		var gray = Math.round(50+50*Math.cos(timer/20));
			
		for (var index=0; index<2; ++index) {
			this.context.strokeStyle="hsl(0,0%,"+(menu.selectedLine==index?gray:0)+"%)";			
			this.context.fillStyle=(menu.selectedLine==index?highlightColor : "#aaa");
			this.outlineText(this.endRaceMenuText[index], 0, (1.4+2*index)*this.scale, .8);
		}
		this.context.restore();
	},
	
	/**
	 * Defines the message to display on the player screen
	 * and sets the display countdown (the message goes away after 4s)
	 */
	setMessage : function(message) {
		this.message = message;
		this.messageTimer = 200;
	},
	
	/**
	 * Display the current message, if any
	 */
	showMessage : function() {
		if (this.messageTimer) {
			var panelWidth = this.context.width;
			this.context.textAlign="left";
			var panelLeft = -.5*this.context.width;
			var panelTop = -.5*this.context.height;
			var transparency=Math.min(.8, this.messageTimer/50);
			this.context.strokeStyle="rgba(255,255,255,"+transparency+")";			
			this.context.fillStyle="rgba(0,0,0,"+transparency+")";			
			this.context.fillRect(panelLeft+panelWidth/6, panelTop+this.scale, 2*panelWidth/3, .8*this.scale);
			this.context.strokeRect(panelLeft+panelWidth/6, panelTop+this.scale, 2*panelWidth/3, .8*this.scale);
			this.context.font = Math.ceil(.3*this.scale)+"px Verdana";
			this.context.fillStyle="rgba(255,255,255,"+transparency+")";			
			this.context.fillText(this.message, panelLeft+panelWidth/6+20, panelTop+this.scale*1.5);
			--this.messageTimer;
			this.context.textAlign="center";
		}
		
	}
	 
	
}  