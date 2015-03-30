/**
 * @constructor
 */
 
function Renderer(sceneryCanvas, overlayCanvas, background, cover, spriteImg, textCanvas, game, showTrapOnHover)
{
	this.game = game;
	this.sceneryCanvas = sceneryCanvas;
	this.overlayCanvas = overlayCanvas;
	this.textCanvas = textCanvas;
	this.sceneryContext = sceneryCanvas.getContext("2d");
	this.overlayContext = overlayCanvas.getContext("2d");
	this.textContext = textCanvas.getContext("2d");
	this.background = background;
	this.cover = cover;
	this.coverDown = false;
	this.showTrapOnHover = showTrapOnHover;	// true to show the trap upon hovering (mouse), false not to show it (touch screen)
	this.scrollingInProgress = 0; // -1 or 1 for direction, used only to draw arrows (smaller upon scrolling)
	this.windowLayout = {
		pixelRatio : 1,
		playArea : [],
		textArea : [],
		toolBar : [],
		controlBar : [],
		titleScreen : []
	};
	
	// create a mirrored version of the sprite sheet
	this.spriteSheet = document.createElement("canvas");
	this.spriteSheet.width=300; //spriteImg.width*2;
	this.spriteSheet.height=600; // spriteImg.height+40;
	var bufferContext = this.spriteSheet.getContext('2d');
	
	bufferContext.drawImage(spriteImg, 0, 0);
	bufferContext.scale(-1, 1);
	bufferContext.drawImage(spriteImg, 0, 0, 140, 200, -140*2, 0, 140, 200);
	bufferContext.drawImage(spriteImg, 0, 300, 150, 240, -150*2, 300, 150, 240);
	bufferContext.scale(-1, 1);

	// add icons background to sprite sheet
	bufferContext.fillStyle = "#22F";
	bufferContext.fillRect(1,561,46,38);
	bufferContext.fillStyle = "#008";
	bufferContext.fillRect(49,561,46,38);
	bufferContext.fillStyle = "#C62";
	bufferContext.fillRect(97,561,46,38);
	bufferContext.fillStyle = "#620";
	bufferContext.fillRect(145,561,46,38);
	var gradient = this.overlayContext.createLinearGradient(0,560,0,590);
	gradient.addColorStop(0, "rgba(255,255,255,.6)");  
	gradient.addColorStop(1, "rgba(255,255,255,0)");  
	bufferContext.fillStyle = gradient;
	bufferContext.fillRect(4,563,40,34);
	bufferContext.fillRect(52,563,40,34);
	bufferContext.fillRect(100,563,40,34);
	bufferContext.fillRect(148,563,40,34);
	
	this.sceneryCanvas.height=256;
	this.sceneryCanvas.width=1000;
	this.sceneryOffsetX = 0;
	
	this.textCanvas.height=64;
	
	this.resizeWindow(); // define the appropriate pixel zoom for the play area
	
	this.frameCount = 0;
	this.animationStartFrame = 0; // used to animate main screen
	this.titleZoomFactor = 1;
	this.smoke = [];
	
	// draw the title on a separate canvas, to simplify the animation on the main screen
	this.titleBuffer=document.createElement("canvas");
	this.titleBuffer.width=1000; 
	this.titleBuffer.height=256;

	/*
	this.sceneryContext.imageSmoothingEnabled = false;
	this.sceneryContext.mozImageSmoothingEnabled = false;
	this.sceneryContext.oImageSmoothingEnabled = false;
	this.sceneryContext.webkitImageSmoothingEnabled = false;	
	this.overlayContext.imageSmoothingEnabled = false;
	this.overlayContext.mozImageSmoothingEnabled = false;
	this.overlayContext.oImageSmoothingEnabled = false;
	this.overlayContext.webkitImageSmoothingEnabled = false;	
	*/
}


Renderer.prototype = {
	
	/**
	 * Returns the bitmap buffer (2D context image data) associated to the scenery context
	 * Used by the game engine to test for collisions and modify (diggers, explosions, stairs).
	 */
	getSceneryImageData : function() {
		return this.sceneryContext.getImageData(0, 0, this.sceneryCanvas.width, this.sceneryCanvas.height);
	},

	/** 
	 * Handler for global window resize event, also called once at init time
	 * Defines the zoom factor for the canvases and (re)aligns everything
	 * Zoom level is the largest integer so that 320 (game height) times zoom level fits vertically in window
	 */
	resizeWindow : function() {
		var oldWidth = this.overlayCanvas.width;
	
	
		
		// recompute zoom level
		this.windowLayout.pixelRatio = Math.max(1, Math.floor(window.innerHeight/320));
		var iconWidth = 48, iconHeight = 40, margin = 8, textHeight = 16; // icon size, in unzoomed pixels
		var overlayWidth = Math.ceil(window.innerWidth/this.windowLayout.pixelRatio);
		this.windowLayout.textArea = [272, 272, 272, "center", 5, .7*overlayWidth, overlayWidth-5, 272];
		this.windowLayout.toolBar = [0, 280, 6*iconWidth, iconHeight, iconWidth, 0];
		this.windowLayout.controlBar = [Math.ceil(window.innerWidth/this.windowLayout.pixelRatio)-4*iconWidth, 280, 4*iconWidth, iconHeight, iconWidth, 0];
		this.splitIconLine = false;
		if (window.innerWidth < (iconWidth*this.windowLayout.pixelRatio*10)) // 6 icons for traps, 4 for game controls
		{	// not enough room to show all icons on one line
			this.windowLayout.pixelRatio = Math.max(1, Math.floor(window.innerHeight/(320+margin+iconHeight+textHeight)));
			this.splitIconLine = true;
			overlayWidth = Math.ceil(window.innerWidth/this.windowLayout.pixelRatio);
			this.windowLayout.textArea = [272, 288, 288, "left", 5, 5, overlayWidth-5, 272];
			this.windowLayout.toolBar = [0, 296, 6*iconWidth, iconHeight, iconWidth, 0];
			this.windowLayout.controlBar = [Math.ceil(window.innerWidth/this.windowLayout.pixelRatio)-4*iconWidth, 344, 4*iconWidth, iconHeight, iconWidth, 0];
		}
		var overlayHeight = Math.ceil(window.innerHeight/this.windowLayout.pixelRatio);
		this.windowLayout.playArea = [0, 0, overlayWidth, 256];
		this.windowLayout.titleScreen = [overlayWidth, 256, 1];
		if (window.innerHeight<640 && window.innerHeight>478) {
			// special layout for FirefoxOS devices (Flame, ZTE Open C : 480 px ; Revolution : 540 px)
			// to avoid falling back to a game area 320px high and a big black bar on the bottom
			this.windowLayout.pixelRatio = 2;
			overlayWidth = Math.ceil(window.innerWidth/this.windowLayout.pixelRatio);
			overlayHeight = Math.ceil(window.innerHeight/this.windowLayout.pixelRatio);
			this.windowLayout.playArea = [iconWidth, 0, overlayWidth-2*iconWidth, Math.min(256, overlayHeight)];
			this.windowLayout.textArea = [16, 32, 16, "left", iconWidth+5, iconWidth+5, overlayWidth-iconWidth-5, overlayHeight-48];
			this.windowLayout.toolBar = [0, 0, iconWidth, 6*iconHeight, 0, iconHeight];
			this.windowLayout.controlBar = [overlayWidth-iconWidth, 0, iconWidth, 4*iconHeight, 0, iconHeight];
			this.windowLayout.titleScreen = [overlayWidth, overlayHeight-64, 1];
		}
		this.windowLayout.titleScreen[2] = Math.min(this.windowLayout.titleScreen[1]/256, this.windowLayout.titleScreen[0]/500);
		

		// set text canvas real size, rendered size and position
		this.textCanvas.width = overlayWidth;
		this.textCanvas.style.width = (overlayWidth*this.windowLayout.pixelRatio)+"px";
		this.textCanvas.style.height = (64*this.windowLayout.pixelRatio)+"px";
		this.textCanvas.style.bottom = (512-Math.min(window.innerHeight, 640))+"px";

		
		// set overlay canvas real size
		// At least 270 px, even if this means overflowing offscreen, to draw water at the bottom
		overlayHeight = Math.max(overlayHeight, 270);
		this.overlayCanvas.height=overlayHeight;
		this.overlayCanvas.width=overlayWidth;
		var overflowOffsetY = this.windowLayout.playArea[3]-256;
		this.sceneryCanvas.style.top = (this.windowLayout.pixelRatio*overflowOffsetY)+"px";
			
		
		// and rendered size for both canvases and background
		this.overlayCanvas.style.width=(overlayWidth*this.windowLayout.pixelRatio)+"px";
		this.overlayCanvas.style.height=(overlayHeight*this.windowLayout.pixelRatio)+"px"; // keep a margin to draw water
		this.sceneryCanvas.style.width=(1000*this.windowLayout.pixelRatio)+"px";
		this.background.style.height=this.sceneryCanvas.style.height=(256*this.windowLayout.pixelRatio)+"px";
		this.cover.style.height=(258*this.windowLayout.pixelRatio)+"px";
		this.cover.style.top = this.coverDown?"0px":(-322*this.windowLayout.pixelRatio)+"px";
		
		// resize and recenter cover image to match
		var endImageContainer = this.cover.firstChild;
		endImageContainer.style.top=(this.windowLayout.pixelRatio*88)+"px";
		endImageContainer.style.width=(this.windowLayout.pixelRatio*160)+"px";
		endImageContainer.style.height=(this.windowLayout.pixelRatio*80)+"px";
		endImageContainer.style.marginLeft=(-this.windowLayout.pixelRatio*80)+"px";
		
		// set scrolling bounds + adjust location to keep the view center constant
		this.minSceneryOffsetX = this.windowLayout.playArea[0]+this.windowLayout.playArea[2]-this.sceneryCanvas.width;	// offset when scrolling to far right
		this.maxSceneryOffsetX = this.windowLayout.playArea[0];
		
		this.game.layoutChanged(this.windowLayout);
		var newOffset = this.sceneryOffsetX+(overlayWidth-oldWidth)/2;
		if (this.game.state == 0) {
			newOffset = Math.min(0, (overlayWidth-1000)/2);
		}
		
		this.scrollScenery(newOffset, true); 
	},
	
	/**
	 * Scroll the scenery (and whole playing area) laterally. 
	 * Scroll is checked against bounds.
	 * Controls is informed to translate into world coordinates
	 * @param dx pixel count, in canvas coordinates (e.g. zoomed)
	 * @param absolute true means dx is an absolute value (scroll to dx), false for a relative value (scroll by dx)
	 */
	scrollScenery : function(dx, absolute) {
		if (absolute) {
			this.sceneryOffsetX = 0;
		} else {
			this.scrollingInProgress = (dx<0?1:-1);
		}	
		this.game.controls.onHScroll(this.sceneryOffsetX = Math.floor(Math.min(this.maxSceneryOffsetX, Math.max(this.sceneryOffsetX+dx, this.minSceneryOffsetX))));
		this.sceneryCanvas.style.left = (this.windowLayout.pixelRatio*this.sceneryOffsetX)+"px";
	},
	
	/**
	 * Draw text on the text canvas
	 * @param text The text to write
	 * @param x X-coordinate of the text, left/center/right depending on the textAlign property of the canvas
	 * @param x Y-coordinate of the text
	 */
	drawShadedText : function(text, x, y)
	{
		this.textContext.shadowOffsetX = -1;
		this.textContext.shadowOffsetY = -1;
		this.textContext.fillText(text, x, y);
		this.textContext.shadowOffsetX = 2;
		this.textContext.shadowOffsetY = 2;
		this.textContext.fillText(text, x, y);
	},
	
	/**
	 * Draw text on the overlay canvas
	 * @param text The text to write
	 * @param x X-coordinate of the text, left/center/right depending on the textAlign property of the canvas
	 * @param x Y-coordinate of the text
	 */
	drawShadedTextOnOverlay : function(text, x, y)
	{
		this.overlayContext.shadowOffsetX = -1;
		this.overlayContext.shadowOffsetY = -1;
		this.overlayContext.fillText(text, x, y);
		this.overlayContext.shadowOffsetX = 2;
		this.overlayContext.shadowOffsetY = 2;
		this.overlayContext.fillText(text, x, y);
	},

	/**
	 * Draw balloons (trap) on the overlay canvas
	 * (either on the play area or icon bar)
	 * @param x x-coordinate of the center of the image
	 * @param y y-coordinate of the bottom of the image
	 * @param timer animation frame
	 */
	drawBalloons : function(x, y, timer) {
		this.overlayContext.drawImage(this.spriteSheet, 59, 135, 12, 17, Math.floor(x-11+4*Math.sin(timer/30)), y-32, 12, 17);
		this.overlayContext.drawImage(this.spriteSheet, 47, 135, 12, 17, Math.floor(x+6+3*Math.sin(1+timer/28)), y-33, 12, 17);
		this.overlayContext.drawImage(this.spriteSheet, 1, 401, 12, 17, Math.floor(x-4+3*Math.sin(2+timer/25)), y-31, 12, 17);
		this.overlayContext.lineWidth=1;
		this.overlayContext.strokeStyle = "#410";
		this.overlayContext.beginPath();
		this.overlayContext.moveTo(x, y);
		this.overlayContext.lineTo(Math.floor(x-6+4*Math.sin(timer/30)), y-17);
		this.overlayContext.moveTo(x, y);
		this.overlayContext.lineTo(Math.floor(x+11+3*Math.sin(1+timer/28)), y-18);
		this.overlayContext.moveTo(x, y);
		this.overlayContext.lineTo(Math.floor(x+1+3*Math.sin(2+timer/25)), y-16);
		this.overlayContext.stroke();
	},
	
	/**
	 * Draw both scenery and overlay canvas 
	 */
	drawMain : function() {

	
		this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
		if (this.coverDown && (this.game.state == 0 || this.game.state == 2 || this.game.state == 3))
		{
			this.coverDown = false;
			this.cover.style.top = (-322*this.windowLayout.pixelRatio)+"px";
			if (this.game.state == 2 || this.game.state == 3)
			{
				this.cover.style.transition = "top 0.3s ease-in";
			}
		}
		if (!this.coverDown && (this.game.state == 1 | this.game.state == 4))
		{
			this.coverDown = true;
			this.cover.style.top = "0px";
		}
		if (this.game.state == 0)
		{
			this.cover.style.transition = "none";
		}
		
		if (this.game.state >= 1)
		{	// Level intro, playing/pause, tutorial, end : display scenery, traps and critters
		
			this.game.world.playField.render(this.sceneryContext);
			
			// shake the play area + sprites whenever a mine was blown
			//  - by moving all the playfield canvas with css
			//  - by translating the sprites in the overlay canvas. Not the whole canvas as the lower part (icons, text) does not move
			// combine this with a vertical offset for FFOS layout if the screen represents less than 256 zoomed pixels
			// we hide the top of the play area in this case, the bottom is more important
			var dt = this.game.world.timer - this.game.world.lastExplosionTime;
			var jolt = Math.floor(Math.floor(20*Math.exp(-.2*dt))*Math.cos(dt));
			var overflowOffsetY = this.windowLayout.playArea[3]-256;
			this.sceneryCanvas.style.top = (this.windowLayout.pixelRatio*(jolt+overflowOffsetY))+"px";
			this.overlayContext.translate(this.sceneryOffsetX, jolt+overflowOffsetY);
			
			this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
			for (var i=0; i<this.game.world.traps.length; ++i)
			{	// display traps
				var trap = this.game.world.traps[i];
				
				if (trap.type == 3) // balloons
				{
					this.drawBalloons(trap.x, trap.y, this.frameCount);
				} else {
					var w = this.game.world.trapSize[trap.type][0];
					var h = this.game.world.trapSize[trap.type][1];
					var frames = [4, 4, 1, 1, 1, 1, 4, 4, 1, 1, 1][trap.type];
					var currentFrame = (this.frameCount>>(trap.type==1?1:2));
					this.overlayContext.drawImage(this.spriteSheet, trap.dir*35*(currentFrame%frames)+(trap.dir==-1?280-2*w:0), 27*trap.type, w*2, h, trap.x-w, trap.y-h+1, w*2, h);
				}
				if (trap.type==8 && trap.timer<=trap.hitTime) // cannon tower, with flying pellet
				{	// draw pellet
					this.overlayContext.drawImage(this.spriteSheet, 35, 5*27, 3, 3, trap.pelletX-1, trap.pelletY-1, 3, 3);
				}
				if (trap.type==9)	// dynamite
				{
					var length = (trap.timer == -1 ? 10 : trap.timer/5);
					this.overlayContext.strokeStyle = "#000";
					this.overlayContext.lineWidth = 1;
					this.overlayContext.beginPath();
					this.overlayContext.moveTo(trap.x-.5, trap.y-17);
					this.overlayContext.lineTo(trap.x-.5, trap.y-17-length);
					this.overlayContext.stroke();
					if (trap.timer>-1) { // ignited
						this.overlayContext.strokeStyle = "#FD4";
						for (var j=0; j<10; ++j)
						{
							var angle = .5*j-1;
							var r = 5+((10+trap.timer-j)%5);
							this.overlayContext.lineWidth = 2;
							this.overlayContext.beginPath();
							this.overlayContext.moveTo(trap.x-.5+r*Math.cos(angle), trap.y-17-length-r*Math.sin(angle));
							this.overlayContext.lineTo(trap.x-.5+(r+2)*Math.cos(angle), trap.y-17-length-(r+2)*Math.sin(angle));
							this.overlayContext.stroke();
						}
					}
				}
				if (trap.type==2 && this.game.world.draggedTrap != i) {	// flamethrower
					this.smoke.push(0, true, 1, trap.x + 10*trap.dir, trap.y-12, 2*trap.dir, 0);	// flames
				}
			}
			for (var i=0; i<this.game.world.predators.length; ++i)
			{	// display weasels
				var critter = this.game.world.predators[i];
				if (critter.activity >= 0 && (critter.activity!=8 || critter.timer<10)) {	// alive critters only
					var act = (critter.activity == 5 ? 2 : critter.activity);
					
					// rolling animation for parachute and balloon
					var currentFrame = act==2 ? [5, 6, 7, 8, 9, 8, 7, 6][(critter.timer>>1)%8] : ((critter.timer)%10);
					
					// no animation for flying and burned
					currentFrame = (act==6 || act==7 ? 0 : currentFrame);
					
					// animation for smok^H^H^H^H blockers : thump the ground for 96 frames, then get a smoke for 32 frames
					if (act == 3)
					{
						var animFrame = (critter.timer&127)>>2;
						currentFrame = (animFrame>23) ? 2+(animFrame&7) : (animFrame&1);
						if (animFrame<24)
						{	// smoke from cigarette held in extended hand
							this.smoke.push(0, false, .5, critter.x-5*critter.dir, critter.y-8, 0, 0);
						}
						if (animFrame>26 && animFrame<30)
						{	
							this.smoke.push(4, false, 1, critter.x+critter.dir, critter.y-9, .5*critter.dir, -.5);	
						}
					}
					
					// use frames 0-9 if heading right (dir==1), 10-19 if heading left
					currentFrame = (critter.dir==-1?19:0)+critter.dir*currentFrame;
					var critterStartY = 300; // in sprite sheet
					this.overlayContext.drawImage(this.spriteSheet, currentFrame*15, critterStartY+20*act, 15, 20, Math.floor(critter.x)-7, Math.floor(critter.y)-19, 15, 20);
					if (act==2) // umbrella/parachute or balloon
					{
						this.overlayContext.drawImage(this.spriteSheet, (critter.dir==-1?285:0), critterStartY+20*critter.activity, 15, 20, Math.floor(critter.x)-7, Math.floor(critter.y)-31, 15, 20);
					}
					if (critter.activity==7&&critter.timer<10) // torched umbrella
					{
						this.overlayContext.drawImage(this.spriteSheet, (critter.dir==-1?285:0)+15*critter.dir*(critter.timer>>1), critterStartY+40, 15, 20, Math.floor(critter.x)-7, Math.floor(critter.y)-31, 15, 20);
					}
				
					if (critter.shield)
					{
						this.overlayContext.drawImage(this.spriteSheet, 15*critter.shield, critterStartY+100, 15, 20, critter.x-7, critter.y-19, 15, 20);
					}
					if (this.game.world.timer < 25+critter.lastWound)
					{
						var alpha = (25+critter.lastWound-this.game.world.timer)/25;
						var dy = (act==2 ||act==7 ? 31 : 24);
						this.overlayContext.lineWidth = 1;
						this.overlayContext.strokeStyle = "rgba(0,0,0,"+alpha+")";
						this.overlayContext.strokeRect(.5+Math.floor(critter.x-5), .5+Math.floor(critter.y-dy-1), 10, 4);
						this.overlayContext.fillStyle = "rgba(0,255,0,"+alpha+")";
						this.overlayContext.fillRect(Math.floor(critter.x-4), Math.floor(critter.y-dy), .09*critter.life, 3);
					}
				}
				
			}
			// trap being added
			if (this.game.world.currentToolIndex > -1 
				&& this.game.world.tools[this.game.world.currentToolIndex] > 0
				&& this.game.controls.mouseInPlayArea
				&& this.game.world.draggedTrap < (this.showTrapOnHover ? 0 : -1) // -1 (hovering only) or -2 (LMB down, adding new trap)
				&& this.game.world.draggedTrap != -3	// scrolling
				&& this.game.world.trapUnderMouse < 0 // click will add a new trap, not drag an existing one
				&& this.game.state == 2)	// only during game
			{
				var w = this.game.world.trapSize[this.game.world.currentTool][0];
				var h = this.game.world.trapSize[this.game.world.currentTool][1];
				
				if (this.game.world.currentTool==3) { // balloons
					this.drawBalloons(this.game.world.controls.worldX, this.game.world.controls.worldY, 5);
				} else {
				// drawing first frame, not animated, and always facing right
					this.overlayContext.drawImage(this.spriteSheet, 
												  0, 27*this.game.world.currentTool, 
												  w*2, h, 
												  this.game.world.controls.worldX-w, this.game.world.controls.worldY-h+1, w*2, h);
				}

			}
			
			/*
			// debug : draw hazards
			this.overlayContext.strokeStyle = "#F00";
			this.overlayContext.lineWidth = 1;
			
			for (var i=0; i<this.game.world.strategy.hazards.length; ++i)
			{
				var hazard = this.game.world.strategy.hazards[i];
				this.overlayContext.beginPath();
				this.overlayContext.rect(hazard[3], hazard[4], hazard[5], hazard[6]);
				this.overlayContext.stroke();
			}
			*/
			
			this.drawSmoke();
			this.drawWater();
			this.overlayContext.translate(-this.sceneryOffsetX, -jolt-overflowOffsetY);
		}
		
		if (this.game.state == 0)
		{	// main menu
			this.drawTitleScreen();
		} else
		{	// so that animationStartFrame is equal to the frame the screen is changed to main menu
			this.animationStartFrame = this.frameCount;
		}
		
		if (this.game.state == 1)
		{	// level intro : display level description
			this.drawLevelDescription();
			this.smoke = [];	// clean all smoke from previous level
		}
		
		if (this.game.state == 2 || this.game.state == 3)
		{	// playing/pause or tutorial : show icons, timer, level data, scrolling arrows
			this.drawIcons();
			this.drawWorldInfo();
		}

		if (this.game.state == 2)
		{	// playing/pause : show scrolling arrows
			if (!this.game.controls.scrollOnSwipe)
			{	// Draw scrolling arrows if not using a touch screen, and not in tutorial
				this.overlayContext.fillStyle="#FFF";
				if (this.sceneryOffsetX < 0)
				{
					var arrowSize = (this.scrollingInProgress<0 ? 6: 10);1	
					this.overlayContext.translate(this.windowLayout.playArea[0], this.windowLayout.playArea[1]);
					this.overlayContext.beginPath();
					this.overlayContext.moveTo(12, 128);
					this.overlayContext.lineTo(12, 128-arrowSize);
					this.overlayContext.lineTo(12-arrowSize, 128);
					this.overlayContext.lineTo(12, 128+arrowSize);
					this.overlayContext.fill();
					this.overlayContext.translate(-this.windowLayout.playArea[0], -this.windowLayout.playArea[1]);
				}
				
				if (this.sceneryOffsetX > this.minSceneryOffsetX)
				{
					var arrowSize = (this.scrollingInProgress>0 ? 6 : 10);
					this.overlayContext.translate(this.windowLayout.playArea[0]+this.windowLayout.playArea[2], this.windowLayout.playArea[1]);
					this.overlayContext.beginPath();
					this.overlayContext.moveTo(-12, 128);
					this.overlayContext.lineTo(-12, 128-arrowSize);
					this.overlayContext.lineTo(-12+arrowSize, 128);
					this.overlayContext.lineTo(-12, 128+arrowSize);
					this.overlayContext.fill();
					this.overlayContext.translate(-this.windowLayout.playArea[0]-this.windowLayout.playArea[2], -this.windowLayout.playArea[1]);
				}
			}

			this.drawMouseCursor(); // on top, so drawn last

		}
		
		if (this.game.state == 3)
		{	// tutorial
			this.drawTutorialInfo();
		}
		
		if (this.game.state == 4)
		{	// level ended
			this.drawLevelEndText();
		}
		++this.frameCount;
	},
	
	/**
	 * Draw the fire and smoke from the flamethrowers,
	 * and from the smoking blockers if it gets implemented.
	 * Moves and ages flames and smoke.
	 */
	drawSmoke : function()
	{
		for (var i=0; i<this.smoke.length; i+=7)
		{
			var radius = 1;
			if (this.smoke[i+1]) 
			{	// heavy smoke : blowtorch or explosion
				var red = Math.floor(Math.min(255, Math.max(0, 186+50*this.smoke[i]-5*this.smoke[i]*this.smoke[i])));
				var green = Math.floor(Math.min(255, Math.max(0, 229+11*this.smoke[i]-2.83*this.smoke[i]*this.smoke[i])));
				var blue = Math.floor(Math.min(255, Math.max(0, 203+14*this.smoke[i]-4.55*this.smoke[i]*this.smoke[i])));
				var alpha = Math.min(1, Math.max(0, 1.25-.02*this.smoke[i]));
				this.overlayContext.fillStyle = "rgba("+red+","+green+","+blue+","+alpha+")";
				radius = this.smoke[i+2]*(this.smoke[i]<10 ? Math.min(2, .5*this.smoke[i]) : .5+.15*this.smoke[i]);
			} else { // light smoke : cigarette
				var alpha = Math.min(1, Math.max(0, .8-.05*this.smoke[i]));
				this.overlayContext.fillStyle = "rgba(160, 160, 160,"+alpha+")";
				radius = this.smoke[i+2]*(.5+.05*this.smoke[i]);
			}
			this.overlayContext.beginPath();
			this.overlayContext.arc(this.smoke[i+3], this.smoke[i+4], radius, 0, 7);
			this.overlayContext.fill();
			if (this.smoke[i]>=64) {
				this.smoke.splice(i,7);
				i-=7;
			} else {
				++this.smoke[i];
				this.smoke[i+3]+=this.smoke[i+5];
				this.smoke[i+4]+=this.smoke[i+6];
				this.smoke[i+5]=this.smoke[i+5]*.98+.2*Math.random()-.1;
				this.smoke[i+6]=(this.smoke[i+1] ? this.smoke[i+6]+(this.smoke[i]>10?0:.1)-.2*Math.random() : Math.max(-1.5, this.smoke[i+6]-.1));
			}
		}
	},
	
	/**
	 * Draw the water (ahem..) pool at the bottom of the play area
	 */
	drawWater : function()
	{
		this.overlayContext.fillStyle = "#138";
		for (var x=0; x<this.overlayCanvas.width; x+=10)
		{
			this.overlayContext.fillRect(x-this.sceneryOffsetX, this.sceneryCanvas.height+2, 10, -12-8*Math.sin(.2*this.frameCount)*Math.sin((this.frameCount+x-this.sceneryOffsetX)/10));
		}
	},
	
	/**
	 * Displays on the overlay canvas information related to the current game
	 *  - number of critters inside and eliminated
	 *  - time remaining
	 */
	drawWorldInfo : function() {
		this.overlayContext.lineWidth=1;
		this.overlayContext.font="bold 14px sans-serif";
		this.overlayContext.shadowColor="#060";
		this.overlayContext.fillStyle = "#8F8";
		
		// critters inside and remaining
		this.overlayContext.textAlign="center";
		var text = this.game.world.crittersFragged + (this.game.world.fragTarget>0?"/"+this.game.world.fragTarget:"")+" fragged, "+this.game.world.crittersInside+" in, "+this.game.world.crittersExited+" out";
		this.overlayContext.textAlign=this.windowLayout.textArea[3];
		this.drawShadedTextOnOverlay(text, this.windowLayout.textArea[5], this.windowLayout.textArea[1]);

		// time left
		this.overlayContext.textAlign="right";
		var time =  Math.max(0, Math.floor((this.game.world.totalTime - this.game.world.timer)/25));	// floored to zero, for the tutorial
		text = Math.floor(time/60)+":"+((time%60)<10 ? "0":"")+(time%60);
		this.drawShadedTextOnOverlay(text, this.windowLayout.textArea[6], this.windowLayout.textArea[2]);
		
		// current tool
		this.overlayContext.textAlign="left";
		var prefix = "";
		var toolIndex = this.game.world.currentTool;
		var suffix = (this.game.world.tools[this.game.world.currentToolIndex]==0 ? " (none left)" : "");
		if (this.game.world.highlightedTool > -1) {
			toolIndex = this.game.world.highlightedTool == 4 ? this.game.world.variableTool : this.game.world.highlightedTool;
			suffix = (this.game.world.tools[this.game.world.highlightedTool]==0 ? " (none left)" : "");
		}
		
		if (this.game.world.trapUnderMouse>-1 && this.game.world.trapUnderMouse<this.game.world.traps.length) {
			toolIndex = this.game.world.traps[this.game.world.trapUnderMouse].type;
			if (this.game.world.canMoveTrap(toolIndex)) {
				suffix = " (click and hold to move)";
			} else {
				suffix = " (cannot be moved)";
			}
		}
		if (this.game.world.draggedTrap > -1 && this.game.world.draggedTrap<this.game.world.traps.length) {
			toolIndex = this.game.world.traps[this.game.world.draggedTrap].type;
			if (this.game.world.dragging) {
				prefix = "Dragging ";
				suffix = "";
			} else {
				prefix = "";
				suffix = " (turn around or move)";
			}
		}
		if (toolIndex > 17)
		{
			suffix = (this.game.lastButtonClicked == toolIndex - 16 ? " (click again to confirm)" : " (click twice)");
		}
		if (toolIndex == this.game.world.tools.length-1 && this.game.world.shotgunReloadTime>0)
		{
			suffix = " (reloading)";
		}

		text = prefix + ["", "Landmine", "Fan", "Flamethrower", "Balloons", "Variable", "Shotgun",
						 "Exit", "Entrance", "Cannon Tower", "Dynamite", "Building Block",  "", "", "", "", "", 
						 "Pause", "Fast forward", "Restart level", "Return to main menu"][1+toolIndex] + suffix;
		this.drawShadedTextOnOverlay(text, this.windowLayout.textArea[4], this.windowLayout.textArea[0]);
		this.overlayContext.shadowOffsetX = 0;
		this.overlayContext.shadowOffsetY = 0;
	},
	
	/**
	 * Draws the icons for tools and game flow controls on the overlay canvas.
	 * Hovered icon (one only) is highlighted 
	 * Selected icon (one tool only) is bordered
	 * Tool icons shown charges (number of uses) remaining.
	 */
	drawIcons : function() {
		// trap toolbar (blue background)
		var tools = this.game.world.tools;
		this.overlayContext.textAlign="center";
		this.overlayContext.font="bold italic 14px sans-serif";
		for (var i=0; i<tools.length; ++i)
		{
			var iconX = this.windowLayout.toolBar[0]+i*this.windowLayout.toolBar[4];
			var iconY = this.windowLayout.toolBar[1]+i*this.windowLayout.toolBar[5];
			this.overlayContext.drawImage(this.spriteSheet, this.game.world.highlightedTool == i ? 48 : 0, 560, 48, 40, iconX, iconY, 48, 40);
			if (i==3) {
				this.drawBalloons(iconX+17, iconY+37, 5);
			} else {
				this.overlayContext.drawImage(this.spriteSheet, (i?0:81), (i==4?this.game.world.variableTool*27:(i?27*i:135)), 35, 27, iconX+10, iconY+8, 35, 27);
			}
			var text = (tools[i]<0 ? "oo" : tools[i]);			
			this.overlayContext.strokeStyle="#000";
			this.overlayContext.lineWidth=3;
			this.overlayContext.strokeText(text, iconX+33, iconY+36);
			this.overlayContext.fillStyle="#FFF";
			this.overlayContext.fillText(text, iconX+33, iconY+36);

		}

		// selected tool
		this.overlayContext.strokeStyle="#F00";
		if (this.game.world.currentToolIndex>-1) {
			this.overlayContext.beginPath();
			this.overlayContext.rect(this.windowLayout.toolBar[0] + this.game.world.currentToolIndex*this.windowLayout.toolBar[4]+1,
									 this.windowLayout.toolBar[1] + this.game.world.currentToolIndex*this.windowLayout.toolBar[5]+1, 46, 38);
			this.overlayContext.stroke();
		}

		// controls toolbar (brown background)
		this.overlayContext.strokeStyle="#000";
		for (var i=0; i<4; ++i)
		{
			var iconX = this.windowLayout.controlBar[0]+i*this.windowLayout.controlBar[4];
			var iconY = this.windowLayout.controlBar[1]+i*this.windowLayout.controlBar[5];
			this.overlayContext.drawImage(this.spriteSheet, this.game.world.highlightedTool == i+16 ? 144 : 96, 560, 48, 40, iconX, iconY, 48, 40);
			var text = ["| |", ">>", "reset", "menu"][i];
			if ((i==0 && this.game.pause) // paused
				|| (i==1 && this.game.fastForward)) // accelerated game
			{
				if (this.frameCount&32) {	// blink the resume symbol in pause or fast forward
					text = ">";
				}
			}
			this.overlayContext.strokeText(text, iconX+23, iconY+30);
			this.overlayContext.fillStyle="#FFF";
			this.overlayContext.fillText(text, iconX+23, iconY+30);

		}
	},
	
	/**
	 * Draw the mouse cursor, 
	 * either by using one of the browser presets
	 * or by hiding it entirely and drawing at its location on the overlay canvas
	 *  - in playfield, shotgun selected : crosshair
	 *  - in playfield, over trap than can be picked up : hand
	 *  - in playfield, dragging trap, location OK to drop : pointer
	 *  - in playfield, dragging trap, location not ok to drop : no-drop
	 *  - all others : default
	 */
	drawMouseCursor : function()
	{
		var cursorId = "default";
		if (this.game.controls.mouseInPlayArea)
		{
			if (this.game.world.draggedTrap > -1 || this.game.world.draggedTrap == -2)
			{	// LMB down, moving existing trap (>=0) or adding new trap (-2)
				cursorId = (this.game.world.dragValid ? "pointer" : "ew-resize");
			} 
			else if (this.game.world.draggedTrap == -3) 
			{	// LMB down, dragging to scroll (-3, touch screen only)
				cursorId = (this.game.world.dragValid ? "ew-resize" : 
							(this.game.world.currentToolIndex == this.game.world.tools.length-1 ? 
								(this.game.world.shotgunReloadTime ? "wait" : "crosshair") : "pointer"));
			}
			else if (this.game.world.trapUnderMouse != -1)
			{	// ready to pickup trap and move it
				cursorId = "pointer";
			} else if (this.game.world.currentToolIndex == this.game.world.tools.length-1) 
			{	// shotgun tool
				cursorId = (this.game.world.shotgunReloadTime ? "wait" : "crosshair");
			} 
		}
		this.overlayCanvas.style.cursor = cursorId;
	},
	
	
	/**
	 * Display the intro text for a level
     *  - goal
     *  - time
	 */
	drawLevelDescription : function() 
	{
		this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
		var textY = 12;
		this.textContext.lineWidth=1;
		this.textContext.textAlign="left";
		this.textContext.font="bold 14px sans-serif";
		this.textContext.shadowColor="#060";
		this.textContext.fillStyle = "#8F8";

		
		var text = "Level "+(1+this.game.level)+" - "+this.game.world.levelTitle;
		this.drawShadedText(text, 20, textY);
		
		textY+=16;
		text = this.game.world.fragTarget
				? "Get rid of "+(this.game.world.fragTarget == this.game.world.crittersWaitingAtSource 	? "all "+this.game.world.fragTarget+" weasels"
																										: this.game.world.fragTarget+" weasels out of "+ this.game.world.crittersWaitingAtSource)
				: "Do not let any weasel out";																			
		this.drawShadedText(text, 20, textY);

		textY+=16;
		time =  Math.floor((this.game.world.totalTime - this.game.world.timer)/50);
		text = "Time "+Math.floor(time/60)+":"+((time%60)<10 ? "0":"")+(time%60);
		this.drawShadedText(text, 20, textY);

		textY+=16;
		text = "Click to start";
		this.drawShadedText(text, 20, textY);

		this.overlayContext.shadowOffsetX = 0;
		this.overlayContext.shadowOffsetY = 0;

	},
	
	/**
	 * Display the different steps of the tutorial
	 *  - highlight or the different tools
	 *  - write the associated explanation text
	 */
	drawTutorialInfo : function()
	{
		var allTutorialTexts = [
			[
				"Your goal is to prevent weasels from",
				"reaching the exit by any means.",
				"A mission statement is given for each level,",
				"you may be asked to eliminate some or",
				"all of them, or block the way and hold for",
				"a given time."
			],
			[
				"Weasels are smarter than the average",
				"lemming and will evade traps, find their way",
				"around and avoid falling to their demise.",
				"Blockers prevent them from jumping off",
				"a cliff. Builders create stairs that they can",
				"all climb to reach higher platforms."
			],
			[	
				"This is an entrance. Weasels come this way",
				"at a regular pace. In difficult levels there",
				"can be several of them throughout",
				"the place. Entrances cannot be moved."
			],
			[
				"This is an exit and weasels will endeavor to",
				"reach it. There may also be several ways out",
				"of the level. Exits can usually not be moved."
			],
			[
				"These traps will help you defend against",
				"weasels. Their availability depends on",
				"the level. Drag a trap from the toolbar to",
				"the playfield, or select it first then tap",
				"or click to place it. You can also drag",
				"an already installed trap to relocate it."
			],
			[
				"Landmines explode when a weasel comes",
				"nearby. They obey gravity so you can drop",
				"them from above. While unexploded they",
				"can be freely moved around."
			],
			[	
				"Fans give lateral speed to already airborne",
				"weasels. The closer they are, the stronger",
				"the push. They are ineffective against walkers.",
				"Click on an already installed fan to",
				"turn it around."
			],
			[
				"Flamethrowers deal lots of damage at close",
				"range but produce a heavy smoke that",
				"obscures the view. Click to turn them",
				"around. Weasels are afraid of fire and thus",
				"will try to walk or climb around these."
			],
			[
				"Weasels will grab balloons on their way",
				"and become airborne. They will let them go",
				"once they are satisfied with the flight.",
				"Some levels come with balloon stands",
				"already installed."
			],
			[
				"Cannon towers shoot at the closest weasel.",
				"They are a slow yet efficient weapon.",
				"Pay attention as they cannot be moved",
				"once installed."
			],
			[
				"Your shotgun is a decent weapon,",
				"however weasels carry a heavy shield",
				"which makes it inefficient against them.",
				"It still serves a purpose though."
			],
			[
				"New traps will be provided in the upper levels.",
				"They are up to you to discover."
			],
			[
				"The toolbar on the right hand side is used",
				"to pause the game, fast forward, restart",
				"the level or return to the main menu."
			],
			[
				"Actual levels are wider than the screen,",
				"and can be scrolled left and right. Bring",
				"your mouse cursor to the edge of",
				"the screen, or swipe on touch screens."
			],
			[	
				"I hear weasels coming. It is now up to you !"
			]
				
		];
		
		var allTextLocations = [80, 80, 110, 150, 50,
								80, 80, 80, 80,  80,
								80, 80, 80, 80,  80];
		var allHighlightedAreas = [
									0, 
									0,
									[400+this.sceneryOffsetX, 74+this.windowLayout.playArea[3]-256, 23],
									[639+this.sceneryOffsetX, 119+this.windowLayout.playArea[3]-256, 25],
									this.windowLayout.toolBar,
									[this.windowLayout.toolBar[0], this.windowLayout.toolBar[1], 48, 40],
									[this.windowLayout.toolBar[0]+this.windowLayout.toolBar[4], this.windowLayout.toolBar[1]+this.windowLayout.toolBar[5], 48, 40],
									[this.windowLayout.toolBar[0]+2*this.windowLayout.toolBar[4], this.windowLayout.toolBar[1]+2*this.windowLayout.toolBar[5], 48, 40],
									[this.windowLayout.toolBar[0]+3*this.windowLayout.toolBar[4], this.windowLayout.toolBar[1]+3*this.windowLayout.toolBar[5], 48, 40],
									[this.windowLayout.toolBar[0]+4*this.windowLayout.toolBar[4], this.windowLayout.toolBar[1]+4*this.windowLayout.toolBar[5], 48, 40],
									[this.windowLayout.toolBar[0]+5*this.windowLayout.toolBar[4], this.windowLayout.toolBar[1]+5*this.windowLayout.toolBar[5], 48, 40],
									0,
									this.windowLayout.controlBar,
									0,
									0
								];
		
		var tutorialText = allTutorialTexts[this.game.tutorialPage];
		var textLocation = allTextLocations[this.game.tutorialPage];
		var highlightedArea = allHighlightedAreas[this.game.tutorialPage];
		
		this.overlayContext.fillStyle = "rgba(0, 0, 0, .7)";
		
		this.overlayContext.beginPath();
		this.overlayContext.rect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
		if (highlightedArea !== false) {
			if (highlightedArea.length > 3)
			{
				this.overlayContext.moveTo(highlightedArea[0], highlightedArea[1]);
				this.overlayContext.lineTo(highlightedArea[0], highlightedArea[1]+highlightedArea[3]);
				this.overlayContext.lineTo(highlightedArea[0]+highlightedArea[2], highlightedArea[1]+highlightedArea[3]);
				this.overlayContext.lineTo(highlightedArea[0]+highlightedArea[2], highlightedArea[1]);
				this.overlayContext.lineTo(highlightedArea[0], highlightedArea[1]);
			} else {
				this.overlayContext.arc(highlightedArea[0], highlightedArea[1], highlightedArea[2], 0, 2*Math.PI, true);
			}
		}
		this.overlayContext.closePath();
		this.overlayContext.fill();

		this.overlayContext.lineWidth=1;
		this.overlayContext.font="bold 14px sans-serif";
		this.overlayContext.shadowColor="#060";
		this.overlayContext.fillStyle = "#8F8";
		this.overlayContext.textAlign="center";
		for (var i=0; i<tutorialText.length; ++i)
		{
			this.drawShadedTextOnOverlay(tutorialText[i], this.overlayCanvas.width>>1, textLocation+30*i);
		}
		this.overlayContext.shadowOffsetX = 0;
		this.overlayContext.shadowOffsetY = 0;

	},
	
	/**
	 * Display level debriefing
	 *  - result obtained
	 *  - result expected
	 */
	drawLevelEndText : function()
	{
		this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
		var textY = 12;
		this.textContext.lineWidth=1;
		this.textContext.textAlign="left";
		this.textContext.font="bold 14px sans-serif";
		this.textContext.shadowColor="#060";
		this.textContext.fillStyle = "#8F8";
		var won = this.game.world.won();
		var text = this.game.world.fragTarget ? (this.game.world.crittersFragged ? this.game.world.crittersFragged : "Not a single")+" weasel"+(this.game.world.crittersFragged?"s":"")+" killed."
											  : (won ? "No weasel made it to the exit." : "A weasel escaped ! ");
		this.drawShadedText(text, 20, textY);
		
		textY+=16;
		if (this.game.world.fragTarget)
		{
			if (this.game.world.crittersFragged==0) {
				text = "Sitting duck !";
			} else if (this.game.world.crittersFragged*2 < this.game.world.fragTarget) {
				text = "Not enough";
			} else if (!won) {
				text = "Close, but no cigar";
			} else {
				text = "Fixed'em once for all !"
			}
		} else {
			text = won ? "Great job! " : "Slick devils, ain't them ?";
		}
		this.drawShadedText(text, 20, textY);
		
		textY+=16;
		text = won ? "Click for next level" : "Click to try again";
		this.drawShadedText(text, 20, textY);
		this.overlayContext.shadowOffsetX = 0;
		this.overlayContext.shadowOffsetY = 0;
	},
	
	/**
	 * Display title and main menu
	 */
	drawTitleScreen : function()
	{
		var time = this.frameCount - this.animationStartFrame;
		if (time==1) {
			var bufferContext = this.titleBuffer.getContext('2d');
			bufferContext.clearRect(0, 0, this.titleBuffer.width, this.titleBuffer.height);
			bufferContext.strokeStyle="#080";
			bufferContext.lineWidth=10;
			bufferContext.font="40pt Verdana";
			bufferContext.textAlign="center";
			bufferContext.strokeText("PEST CONTROL", 500, 100);

			bufferContext.font="65pt Verdana";
			bufferContext.strokeText("WEASELS", 500, 200);			
			this.titleZoomFactor = 2;
		}
		if (time==60) { // first weasel teeth marks
			var cx = 272, cy = 180, r = 30;
			for (var i=0;i<6;++i) { 
				this.punchHoleInTitleScreen(cx+r*Math.cos(.8-.25*i),cy-r*Math.sin(.8-.25*i), 4);
			}
			this.punchHoleInTitleScreen(cx, cy, r);
			this.titleZoomFactor*=.95;
		}
		if (time==105) {	//attempt to shoot weasel, miss 
			this.punchHoleInTitleScreen(342, 190, 9);
			this.titleZoomFactor*=.9;
		}
		if (time==115) { //attempt to shoot weasel, miss again
			this.punchHoleInTitleScreen(300, 142, 9);
			this.titleZoomFactor*=.9;
		}
		if (time==180) {
			var cx = 585, cy = 32, r = 30, a=4;
			for (var i=0;i<6;++i) { 
				this.punchHoleInTitleScreen(cx+r*Math.cos(a+.25*i),cy-r*Math.sin(a+.25*i), 4);
			}
			this.punchHoleInTitleScreen(cx, cy, r);
			this.titleZoomFactor*=.95;
		}
		if (time==225) {
			this.punchHoleInTitleScreen(540, 90, 9);
			this.titleZoomFactor*=.9;
		}
		if (time==235) {
			this.punchHoleInTitleScreen(625, 60, 9);
			this.titleZoomFactor*=.9;
		}
		if (time==300) {
			var cx = 567, cy = 230, r = 30, a=.85;
			for (var i=0;i<6;++i) { 
				this.punchHoleInTitleScreen(cx+r*Math.cos(a+.25*i),cy-r*Math.sin(a+.25*i), 4);
			}
			this.punchHoleInTitleScreen(cx, cy, r);
			this.titleZoomFactor*=.95;
		}
		if (time==350) {
			var cx = 340, cy = 31, r = 30, a=4.1;
			for (var i=0;i<6;++i) { 
				this.punchHoleInTitleScreen(cx+r*Math.cos(a+.25*i),cy-r*Math.sin(a+.25*i), 4);
			}
			this.punchHoleInTitleScreen(cx, cy, r);
			this.titleZoomFactor*=.95;
		}
		if (time==365) {
			var cx = 719, cy = 128, r = 25, a=2.6;
			for (var i=0;i<6;++i) { 
				this.punchHoleInTitleScreen(cx+r*Math.cos(a+.25*i),cy-r*Math.sin(a+.25*i), 4);
			}
			this.punchHoleInTitleScreen(cx, cy, r);
			this.titleZoomFactor*=.95;
		}
		
		this.sceneryContext.clearRect(0, 0, this.titleBuffer.width, this.titleBuffer.height);
//		var zoomLevel = 1+1/(1+time);
		this.titleZoomFactor = (1+ 6*this.titleZoomFactor)/7;
		var realFactor = this.titleZoomFactor*this.windowLayout.titleScreen[2];
		var overflowOffsetY = 256-this.windowLayout.playArea[3];
		this.sceneryContext.drawImage(this.titleBuffer, 0, 0, 1000, 256, 500-500*realFactor, overflowOffsetY+.4*this.windowLayout.titleScreen[1]-128*realFactor, 1000*realFactor, 256*realFactor);
		
		
		// scrolling subtitle 
		this.sceneryContext.strokeStyle="#080";
		this.sceneryContext.lineWidth=2;
		this.sceneryContext.font="15pt Verdana";
		this.sceneryContext.textAlign="center";

		var scrollTextY = overflowOffsetY+this.windowLayout.titleScreen[1]*240/256;
		
		this.sceneryContext.strokeText("SECOND EDITION", 2000-((2*time+1200)%2500), scrollTextY);
		this.sceneryContext.strokeText("EXTRA LEVELS", 2000-((2*time+980)%2500), scrollTextY);
		this.sceneryContext.strokeText("NEW TRAPS", 2000-((2*time+800)%2500), scrollTextY);
		this.sceneryContext.strokeText("AND STILL THE SAME PESKY CRITTERS.", 2000-((2*time+500)%2500), scrollTextY);
		this.sceneryContext.strokeText("WARNING, CONTAINS HAZARDOUS MATERIAL", 2000-((2*time)%2500), scrollTextY);
		this.sceneryContext.strokeText("HANDLE WITH CARE AND WEAR BITE RESISTANT GLOVES.", 2000-((2*time-600)%2500), scrollTextY);

		
		// draw buttons below title screen
		var areaHalfWidth = this.windowLayout.titleScreen[0] / 8;
		this.overlayContext.lineWidth=1;
		var gradient = this.overlayContext.createLinearGradient(0,this.windowLayout.titleScreen[1]+6,0,this.windowLayout.titleScreen[1]+58);
		gradient.addColorStop(0, "rgba(255,255,255,.8)");  
		gradient.addColorStop(1, "rgba(255,255,255,.1)");  
	
		this.overlayContext.fillStyle = "#000";
		this.overlayContext.fillRect(0, this.windowLayout.titleScreen[1], this.windowLayout.titleScreen[0], 64);
		for (var i=0; i<4; ++i)
		{
			this.overlayContext.fillStyle = (this.game.controls.buttonAreaX == i && this.game.controls.buttonAreaY>0 && i!=2 ? "#b43" : "#413");
			this.overlayContext.fillRect(1+areaHalfWidth*i*2, this.windowLayout.titleScreen[1]+2, 2*areaHalfWidth-2, 60);
			this.overlayContext.fillStyle = gradient;
			this.overlayContext.fillRect(5+areaHalfWidth*i*2, this.windowLayout.titleScreen[1]+6, 2*areaHalfWidth-10, 52);
		}
		
		if (this.game.level < this.game.finalLevel)
		{	// arrow up : only if there is at least one level above
			this.overlayContext.fillStyle = (this.game.controls.buttonAreaX == 2 && this.game.controls.buttonAreaY==1 ? "#b43" : "#413");
			this.overlayContext.beginPath();
			this.overlayContext.moveTo(areaHalfWidth*4.5, this.windowLayout.titleScreen[1]+20);
			this.overlayContext.lineTo(areaHalfWidth*5.5, this.windowLayout.titleScreen[1]+20);
			this.overlayContext.lineTo(areaHalfWidth*5, this.windowLayout.titleScreen[1]+10);
			this.overlayContext.fill();
		}
		if (this.game.level > -1)
		{	// arrow down
			this.overlayContext.fillStyle = (this.game.controls.buttonAreaX == 2 && this.game.controls.buttonAreaY==2 ? "#b43" : "#413");
			this.overlayContext.beginPath();
			this.overlayContext.moveTo(areaHalfWidth*4.5, this.windowLayout.titleScreen[1]+42);
			this.overlayContext.lineTo(areaHalfWidth*5.5, this.windowLayout.titleScreen[1]+42);
			this.overlayContext.lineTo(areaHalfWidth*5, this.windowLayout.titleScreen[1]+52);
			this.overlayContext.fill();
		}
		if (this.game.level == this.game.persistentData.maxLevel && this.game.level < this.game.finalLevel)
		{	// draw a lock if the level above exists and is not accessible
			this.overlayContext.drawImage(this.spriteSheet, 71, 135, 9, 11, areaHalfWidth*5-4, this.windowLayout.titleScreen[1]+11, 9, 11);
		}
		
		

		var textY = this.windowLayout.titleScreen[1]+36;
		this.overlayContext.fillStyle = "#FFF";
		this.overlayContext.lineWidth=1;
		this.overlayContext.shadowColor = "#413";
		this.overlayContext.textAlign="center";
		this.overlayContext.font="bold italic 16px sans-serif";
		
		var text = "SFX : "+(this.game.persistentData.soundOn ? "ON" : "OFF");
		this.drawShadedTextOnOverlay(text, areaHalfWidth, textY);
		
		text = "MUSIC : "+(this.game.persistentData.musicOn ? "ON" : "OFF");
		this.drawShadedTextOnOverlay(text, 3*areaHalfWidth, textY);
		
		text = (this.game.level==-1?"TUTORIAL":"LEVEL "+(this.game.level<9?"0":"")+(1+this.game.level));
		this.drawShadedTextOnOverlay(text, 5*areaHalfWidth, textY);

		text = "START";
		this.drawShadedTextOnOverlay(text, 7*areaHalfWidth, textY);
		
		this.overlayContext.shadowOffsetX = 0;
		this.overlayContext.shadowOffsetY = 0;

	},
	
	/**
	 * Erase a disc in the title screen buffer, effectively punching a hole in the title
	 *
	 * Used internally by drawTitleScreen()
	 * @param x0 x-coordinate of the center of the hole (pixels in title buffer)
	 * @param y0 y-coordinate of the center of the hole (pixels in title buffer)
	 * @param radius radius of the hole (pixels in title buffer)
	 */
	punchHoleInTitleScreen : function(x0, y0, radius)
	{
		var bufferContext = this.titleBuffer.getContext('2d');
		var width = this.titleBuffer.width, height = this.titleBuffer.height;
		var imageData = bufferContext.getImageData(0, 0, width, height);
		var imageBuffer = imageData.data;
		for (var y=-radius; y<=radius; ++y)
		{
			for (var x=-radius; x<=radius; ++x)
			{
				if (x+x0>=0 && x+x0<width && y+y0>=0 && y+y0<height)
				{
					// antialiased circle
					imageBuffer[(x+Math.floor(x0))*4+(y+Math.floor(y0))*4*width+3] = Math.min(imageBuffer[(x+Math.floor(x0))*4+(y+Math.floor(y0))*4*width+3], Math.max(0, Math.floor(25*(x*x+y*y-radius*radius))));;
				}
			}
		}
		bufferContext.putImageData(imageData, 0, 0);
	},
	
	/**
	 * Rendering method for the loading screen
	 * @param progress : progress value between 0 and 1
	 */
	drawLoader : function(progress)
	{
		this.overlayContext.fillStyle = "#FFF";
		this.overlayContext.lineWidth=4;
		this.overlayContext.shadowColor = "#000";
		this.overlayContext.textAlign="center";
		this.overlayContext.font="bold italic 40px sans-serif";
		this.drawShadedTextOnOverlay("LOADING", this.windowLayout.titleScreen[0]>>1, 256-this.windowLayout.playArea[3]+(this.windowLayout.titleScreen[1]>>1));
		var textSize = this.overlayContext.measureText("LOADING");
		var textLeft = (this.windowLayout.titleScreen[0]-textSize.width)>>1;
		this.overlayContext.save();
		this.overlayContext.shadowColor="#060";
		this.overlayContext.fillStyle = "#8F8";
		this.overlayContext.moveTo(textLeft,0);
		this.overlayContext.lineTo(textLeft+progress*textSize.width, 0);
		this.overlayContext.lineTo(textLeft+progress*textSize.width, 256);
		this.overlayContext.lineTo(textLeft, 256);
		this.overlayContext.clip();
		this.drawShadedTextOnOverlay("LOADING", this.windowLayout.titleScreen[0]>>1, 256-this.windowLayout.playArea[3]+(this.windowLayout.titleScreen[1]>>1));
		this.overlayContext.restore();
		this.overlayContext.shadowOffsetX = 0;
		this.overlayContext.shadowOffsetY = 0;
	},
	
	
	/**
	 * Implementation of the explosion listener
	 * This method gets called by World when a mine or dynamite explodes
	 * Renders particles at and around ground zero
	 * @param x x-coordinate of the center of the explosion, in pixels
	 * @param y y-coordinate of the center of the explosion, in pixels
	 * @param radius radius of the explosion, in pixels
	 * @param strength strength of the explosions, determines the amount of smoke
	 */
	notifyExplosion : function(x, y, radius, strength)
	{
		this.smoke.push(4, true, 2, x-3, y-3, 0, 0)
		this.smoke.push(1, true, 2, x-3, y+3, 0, 0)
		this.smoke.push(4, true, 2, x+3, y-3, 0, 0)
		this.smoke.push(1, true, 2, x+3, y+3, 0, 0)
		var deltaAngle = Math.PI*2/(strength/6);
		for (var i=0; i<strength/6; ++i)
		{
			var angle = deltaAngle*i;
			this.smoke.push (8+(i%8), true, 4, x+radius*.6*Math.cos(angle), y+radius*.6*Math.sin(angle), Math.cos(angle), Math.sin(angle));
			this.smoke.push (6+(i%6), true, 3, x+radius*.4*Math.cos(angle), y+radius*.4*Math.sin(angle), .75*Math.cos(angle), .75*Math.sin(angle));
			this.smoke.push (4+(i%4), true, 2, x+radius*.2*Math.cos(angle), y+radius*.2*Math.sin(angle), .5*Math.cos(angle), .5*Math.sin(angle));
		}
	},
	
	/**
	 * Listener for state change events
	 *
	 * Changes the picture on the cover div (won, lost, none)
	 
	 *
	 * Values for state : 0 main menu, 	1 level intro screen, 2 level ingame, 3 tutorial, 4 level end screen
	 * @param oldState the former state
	 * @param newState the new state
	 * @param won true if the player won, false if lost
	 */
	notifyStateChange : function(oldState, newState, won)
	{
		// change the cover image (two sprites stacked vertically)
		var coverImage = this.cover.firstChild.firstChild;
		// 0% = victory image , -100% = defeat, -200% = no image
		coverImage.style.top = (newState == 4 ? (won ? "0%" : "-100%") : "-200%");
		
		// Center the view for the main menu
		if (newState==0)
		{
			this.scrollScenery((this.minSceneryOffsetX+this.maxSceneryOffsetX)>>1, true);
		}
		
		// (Re)start level : make sure the entrance is visible on screen
		if (newState==1 || (newState == 2 && oldState == 2))
		{
			var range = this.game.world.getImportantLocations();
			var startX = (range[0]+range[1]-this.windowLayout.playArea[2])>>1; // if possible, center between leftmost and rightmost
			startX = Math.min(startX, range[0]-60);	// make sure the leftmost item is always shown
			this.scrollScenery(-startX+this.windowLayout.playArea[0], true);
		}
	}

	

}