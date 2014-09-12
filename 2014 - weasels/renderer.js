/**
 * @constructor
 */
 
function Renderer(sceneryCanvas, overlayCanvas, background, spriteImg, game)
{
	this.sceneryCanvas = sceneryCanvas;
	this.overlayCanvas = overlayCanvas;
	this.sceneryContext = sceneryCanvas.getContext("2d");
	this.overlayContext = overlayCanvas.getContext("2d");
	this.background = background;
	
	// create a mirrored version of the sprite sheet
	this.spriteSheet = document.createElement("canvas");
	this.spriteSheet.width=300; //spriteImg.width*2;
	this.spriteSheet.height=480; // spriteImg.height+40;
	var bufferContext = this.spriteSheet.getContext('2d');
	
	bufferContext.drawImage(spriteImg, 0, 0);
//	bufferContext.drawImage(critterImg, 0, 0, critterImg.width, 200, 0, 200, critterImg.width, 200);
	bufferContext.scale(-1, 1);
	bufferContext.drawImage(spriteImg, 0, 0, 140, 200, -140*2, 0, 140, 200);
	bufferContext.drawImage(spriteImg, 0, 200, 150, 200, -150*2, 200, 150, 200);
	bufferContext.scale(-1, 1);

	// add icons background to sprite sheet
	bufferContext.fillStyle = "#22F";
	bufferContext.fillRect(1,440,46,40);
	bufferContext.fillStyle = "#008";
	bufferContext.fillRect(49,440,46,40);
	bufferContext.fillStyle = "#C62";
	bufferContext.fillRect(97,440,46,40);
	bufferContext.fillStyle = "#620";
	bufferContext.fillRect(145,440,46,40);
	var gradient = this.overlayContext.createLinearGradient(0,440,0,480);
	gradient.addColorStop(0, "rgba(255,255,255,.6)");  
	gradient.addColorStop(1, "rgba(255,255,255,0)");  
	bufferContext.fillStyle = gradient;
	bufferContext.fillRect(4,443,40,34);
	bufferContext.fillRect(52,443,40,34);
	bufferContext.fillRect(100,443,40,34);
	bufferContext.fillRect(148,443,40,34);
	
	
	
	// define the appropriate pixel zoom for the play area
	var width = window.innerWidth, height=window.innerHeight;
	this.pixelRatio = Math.max(1, Math.floor(window.innerHeight/320));
	var overlayHeight = Math.ceil(window.innerHeight/this.pixelRatio);
	var overlayWidth = Math.ceil(window.innerWidth/this.pixelRatio);
	
	this.overlayCanvas.height=overlayHeight;
	this.sceneryCanvas.height=256;
	this.overlayCanvas.width=overlayWidth;
	this.sceneryCanvas.width=1000;
	this.overlayCanvas.style.width=(overlayWidth*this.pixelRatio)+"px";
	this.overlayCanvas.style.height=(overlayHeight*this.pixelRatio)+"px";
	this.sceneryCanvas.style.width=(1000*this.pixelRatio)+"px";
	this.background.style.height=this.sceneryCanvas.style.height=(256*this.pixelRatio)+"px";
	
	
	this.game = game;
	this.frameCount = 0;
	this.sceneryOffsetX = 0;
	this.minSceneryOffsetX = overlayWidth-this.sceneryCanvas.width;	// offset when scrolling to far right
	this.smoke = [];
	
	//this.overlayContext.font="10pt Verdana";
	
	/*
	// prepare gradient
	this.textColor = this.overlayContext.createLinearGradient(0,262,0,272);
	this.textColor.addColorStop(0, "#FFF");  
	this.textColor.addColorStop(1, "#0F0");  
	*/
	
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
	
	getSceneryImageData : function() {
		return this.sceneryContext.getImageData(0, 0, this.sceneryCanvas.width, this.sceneryCanvas.height);
	},

	/**
	 * Scroll the scenery (and whole playing area) laterally. 
	 * Scroll is checked against bounds.
	 * Controls is informed to transled into world coordinates
	 * @param dx pixel count, in canvas coordinates (e.g. zoomed)
	 * @param controls Controls object, to inform it of offset change (a listener would be a better design)
	 * @param absolute true means dx is an absolute value (scroll to dx), false for a relative value (scroll by dx)
	 */
	scrollScenery : function(dx, controls, absolute) {
		if (absolute) {
			this.sceneryOffsetX = 0;
		}
		controls.onHScroll(this.sceneryOffsetX = Math.min(0, Math.max(this.sceneryOffsetX+dx, this.minSceneryOffsetX)));
		this.sceneryCanvas.style.left = (this.pixelRatio*this.sceneryOffsetX)+"px";
	},
	
	/**
	 * Draw text on the overlay canvas
	 */
	drawShadedText : function(text, x, y)
	{
		this.overlayContext.shadowOffsetX = -1;
		this.overlayContext.shadowOffsetY = -1;
		this.overlayContext.fillText(text, x, y);
		this.overlayContext.shadowOffsetX = 2;
		this.overlayContext.shadowOffsetY = 2;
		this.overlayContext.fillText(text, x, y);
	},

	/**
	 * Draw both scenery and overlay canvas 
	 */
	drawMain : function() {

	
		this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
		
		if (this.game.state >= 1)
		{	// Level intro, playing/pause, end : display scenery, traps and critters
		
			// TODO : enable side scrolling
			this.game.world.playField.render(this.sceneryContext);
			//this.sceneryContext.putImageData(this.game.world.playField.imageData, 0, 0);
			
			// shake the play area + sprites whenever a mine was blown
			//  - by moving all the playfield canvas with css
			//  - by translating the sprites in the overlay canvas. Not the whole canvas as the lower part (icons, text) does not move
			var dt = this.game.world.timer - this.game.world.lastExplosionTime;
			var jolt = Math.floor(Math.floor(20*Math.exp(-.2*dt))*Math.cos(dt));
			this.sceneryCanvas.style.top = jolt+"px";
			this.overlayContext.translate(this.sceneryOffsetX, jolt);
			
			this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
			for (var i=0; i<this.game.world.traps.length; ++i)
			{	// display traps
				var trap = this.game.world.traps[i];
				
				if (trap.type == 4) // balloons
				{
					this.overlayContext.drawImage(this.spriteSheet, 59, 108, 12, 17, Math.floor(trap.x-11+4*Math.sin(this.frameCount/30)), trap.y-32, 12, 17);
					this.overlayContext.drawImage(this.spriteSheet, 47, 108, 12, 17, Math.floor(trap.x+6+3*Math.sin(1+this.frameCount/28)), trap.y-33, 12, 17);
					this.overlayContext.drawImage(this.spriteSheet, 1, 301, 12, 17, Math.floor(trap.x-4+3*Math.sin(2+this.frameCount/25)), trap.y-31, 12, 17);
					this.overlayContext.lineWidth=1;
					this.overlayContext.strokeStyle = "#410";
					this.overlayContext.beginPath();
					this.overlayContext.moveTo(trap.x, trap.y);
					this.overlayContext.lineTo(Math.floor(trap.x-6+4*Math.sin(this.frameCount/30)), trap.y-17);
					this.overlayContext.moveTo(trap.x, trap.y);
					this.overlayContext.lineTo(Math.floor(trap.x+11+3*Math.sin(1+this.frameCount/28)), trap.y-18);
					this.overlayContext.moveTo(trap.x, trap.y);
					this.overlayContext.lineTo(Math.floor(trap.x+1+3*Math.sin(2+this.frameCount/25)), trap.y-16);
					this.overlayContext.stroke();
				} else {
					var w = this.game.world.trapSize[trap.type][0];
					var h = this.game.world.trapSize[trap.type][1];
					var frames = [4, 4, 1, 1, 1, 4, 4][trap.type];
					var currentFrame = (this.frameCount>>(trap.type==1?1:2));
					this.overlayContext.drawImage(this.spriteSheet, trap.dir*35*(currentFrame%frames)+(trap.dir==-1?280-2*w:0), 27*trap.type, w*2, h, trap.x-w, trap.y-h+1, w*2, h);
				}
				if (trap.type==2 && this.game.world.draggedTrap != i) {	// flamethrower
					this.smoke.push(0, trap.x + 10*trap.dir, trap.y-12, 2*trap.dir, 0);	// flames
				}
			}
			for (var i=0; i<this.game.world.predators.length; ++i)
			{	// display weasels
				var critter = this.game.world.predators[i];
				if (critter.activity >= 0 && (critter.activity!=8 || critter.timer<10)) {	// alive critters only
					var act = (critter.activity == 5 ? 2 : critter.activity);
					var currentFrame = act==2 ? [5, 6, 7, 8, 9, 8, 7, 6][(critter.timer>>1)%8] : ((critter.timer)%10);
					currentFrame = (act==3 || act==6 || act==7 ? 0 : currentFrame);
					currentFrame = (critter.dir==-1?19:0)+critter.dir*currentFrame;
					this.overlayContext.drawImage(this.spriteSheet, currentFrame*15, 200+20*act, 15, 20, Math.floor(critter.x)-7, Math.floor(critter.y)-19, 15, 20);
					if (act==2) // umbrella/parachute or balloon
					{
						this.overlayContext.drawImage(this.spriteSheet, (critter.dir==-1?285:0), 200+20*critter.activity, 15, 20, Math.floor(critter.x)-7, Math.floor(critter.y)-31, 15, 20);
					}
					if (critter.activity==7&&critter.timer<10) // torched umbrella
					{
						this.overlayContext.drawImage(this.spriteSheet, (critter.dir==-1?285:0)+15*critter.dir*(critter.timer>>1), 240, 15, 20, Math.floor(critter.x)-7, Math.floor(critter.y)-31, 15, 20);
					}
				}
				if (critter.shield)
				{
					this.overlayContext.drawImage(this.spriteSheet, 15*critter.shield, 300, 15, 20, critter.x-7, critter.y-19, 15, 20);
				}
				/*
				this.overlayContext.strokeStyle = "#000";
				this.overlayContext.beginPath();
				this.overlayContext.rect(critter.x-4, critter.y-24, 9, 4);
				this.overlayContext.stroke();
				this.overlayContext.fillStyle = "#0F0";
				this.overlayContext.fillRect(critter.x-4, critter.y-24, .09*critter.life, 4);
				*/
			}
			// trap being added
			if (this.game.world.currentTool > -1 
				&& this.game.world.tools[this.game.world.currentTool] > 0
				&& this.game.world.controls.mouseY<this.sceneryCanvas.height
				&& this.game.world.draggedTrap < 0 // -1 (hovering only) or -2 (LMB down, adding new trap)
				&& this.game.world.trapUnderMouse < 0 // click will add a new trap, not drag an existing one
				&& this.game.state == 2)	// only during game
			{
				var w = this.game.world.trapSize[this.game.world.currentTool][0];
				var h = this.game.world.trapSize[this.game.world.currentTool][1];
				
				// drawing first frame, not animated, and always facing right
				this.overlayContext.drawImage(this.spriteSheet, 0, 27*this.game.world.currentTool, w*2, h, this.game.world.controls.worldX-w, this.game.world.controls.mouseY-h+1, w*2, h);

			}
			this.drawSmoke();
			this.drawWater();
			this.overlayContext.translate(-this.sceneryOffsetX, -jolt);
		}
		
		if (this.game.state == 0)
		{	// main menu
			this.drawTitleScreen();
		}
		
		if (this.game.state == 1)
		{	// level intro : display level description
			this.drawLevelDescription();
			this.smoke = [];	// clean all smoke from previous level
		}
		
		if (this.game.state == 2)
		{	// playing or pause : show icons, timer, level data
			this.drawIcons();
			this.drawWorldInfo();
			this.drawMouseCursor(); // on top, so drawn last
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
		for (var i=0; i<this.smoke.length; i+=5)
		{
			//this.overlayContext.fillStyle = ["#CDF","#EEF","#FFF","#FEC","#FDB","#FC9","#FB7","#FA5","#F81","#F60","#C30","#800","#400","#000"][this.smoke[i]];
			var red = Math.floor(Math.min(255, Math.max(0, 186+50*this.smoke[i]-5*this.smoke[i]*this.smoke[i])));
			var green = Math.floor(Math.min(255, Math.max(0, 229+11*this.smoke[i]-2.83*this.smoke[i]*this.smoke[i])));
			var blue = Math.floor(Math.min(255, Math.max(0, 203+14*this.smoke[i]-4.55*this.smoke[i]*this.smoke[i])));
			var alpha = Math.min(1, Math.max(0, 1.25-.02*this.smoke[i]));
			this.overlayContext.fillStyle = "rgba("+red+","+green+","+blue+","+alpha+")";
			this.overlayContext.beginPath();
			this.overlayContext.arc(this.smoke[i+1], this.smoke[i+2], (this.smoke[i]<10 ? Math.min(2, .5*this.smoke[i]) : .5+.15*this.smoke[i]), 0, 7);
			this.overlayContext.fill();
			if (this.smoke[i]>=64) {
				this.smoke.splice(i,5);
				i-=5;
			} else {
				++this.smoke[i];
				this.smoke[i+1]+=this.smoke[i+3];
				this.smoke[i+2]+=this.smoke[i+4];
				this.smoke[i+3]=this.smoke[i+3]*.98+.2*Math.random()-.1;
				this.smoke[i+4]+=(this.smoke[i]>10?0:.1)-.2*Math.random();
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
		this.overlayContext.textAlign="left";
		this.overlayContext.font="bold 14px sans-serif";
		this.overlayContext.shadowColor="#060";
		this.overlayContext.fillStyle = "#8F8";
		
		// critters inside and remaining
		var textY = 272;
		this.overlayContext.textAlign="center";
		var text = this.game.world.crittersFragged + (this.game.world.fragTarget>0?"/"+this.game.world.fragTarget:"")+" fragged, "+this.game.world.crittersInside+" in, "+this.game.world.crittersExited+" out";
		this.drawShadedText(text, .6*window.innerWidth/this.pixelRatio, textY);

		// time left
		this.overlayContext.textAlign="right";
		var time =  Math.floor((this.game.world.totalTime - this.game.world.timer)/25);
		text = Math.floor(time/60)+":"+((time%60)<10 ? "0":"")+(time%60);
		this.drawShadedText(text, window.innerWidth/this.pixelRatio-5, textY);
		
		// current tool
		this.overlayContext.textAlign="left";
		var prefix = "";
		var toolIndex = this.game.world.currentTool;
		if (this.game.world.highlightedTool > -1) {
			toolIndex = this.game.world.highlightedTool;
		}
		var suffix = (this.game.world.tools[toolIndex]==0 ? " (none left)" : "");
		if (this.game.world.draggedTrap > -1) {
			toolIndex = this.game.world.traps[this.game.world.draggedTrap].type;
			if (this.game.world.dragging) {
				prefix = "Dragging ";
				suffix = "";
			} else {
				prefix = "";
				suffix = " (turn around or move)";
			}
		}
		if (toolIndex > this.game.world.tools.length+1)
		{
			suffix = (this.game.lastButtonClicked == toolIndex - this.game.world.tools.length ? " (click again to confirm)" : " (click twice)");
		}
		if (toolIndex == this.game.world.tools.length-1 && this.game.world.shotgunReloadTime>0)
		{
			suffix = " (reloading)";
		}
		text = prefix + ["", "Landmine", "Fan", "Flamethrower", "Weight", "Shotgun",
						 "Pause", "Fast forward", "Restart level", "Return to main menu"][1+toolIndex] + suffix;
		this.drawShadedText(text, 5, textY);
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
		var tools = this.game.world.tools;
		var tL=0, tT=280, tW = 46, tH = 40, tS = 2;
		this.overlayContext.strokeStyle="#000";
		this.overlayContext.lineWidth=3;
		this.overlayContext.textAlign="center";
		this.overlayContext.font="bold italic 14px sans-serif";
		for (var i=0; i<tools.length; ++i)
		{
			this.overlayContext.drawImage(this.spriteSheet, this.game.world.highlightedTool == i ? 48 : 0, 440, 48, 40, tL+tW*i+tS*i, 280, 48, 40);
			this.overlayContext.drawImage(this.spriteSheet, (i?0:81), (i?27*i:108), 35, 27, tL+tW*i+tS*i+10, tT+8, 35, 27);
			var text = (tools[i]<0 ? "oo" : tools[i]);			
			this.overlayContext.strokeText(text, tL+tW*i+tS*i+.5*tW+10, tT+36);
			this.overlayContext.fillStyle="#FFF";
			this.overlayContext.fillText(text, tL+tW*i+tS*i+.5*tW+10, tT+36);

		}
		var tD = Math.floor(window.innerWidth/this.pixelRatio)-4*(tW+tS);
		for (var i=0; i<4; ++i)
		{
			this.overlayContext.drawImage(this.spriteSheet, this.game.world.highlightedTool == i+tools.length ? 144 : 96, 440, 48, 40, tL+tD+tW*i+tS*i, 280, 48, 40);
			var text = ["| |", ">>", "reset", "menu"][i];
			if ((i==0 && this.game.pause) // paused
				|| (i==1 && this.game.fastForward)) // accelerated game
			{
				if (this.frameCount&32) {	// blink the resume symbol in pause or fast forward
					text = ">";
				}
			}
			this.overlayContext.strokeText(text, tL+tD+tW*i+tS*i+.5*tW, tT+30);
			this.overlayContext.fillStyle="#FFF";
			this.overlayContext.fillText(text, tL+tD+tW*i+tS*i+.5*tW, tT+30);

		}
		this.overlayContext.strokeStyle="#F00";
		if (this.game.world.currentTool>-1) {
			this.overlayContext.beginPath();
			this.overlayContext.rect(tL+tW*this.game.world.currentTool+tS*this.game.world.currentTool+1, tT, tW, tH);
			this.overlayContext.stroke();
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
		if (this.game.world.controls.mouseY<this.sceneryCanvas.height)
		{
			if (this.game.world.draggedTrap != -1) 
			{	// LMB down, moving existing trap (>=0) or adding new trap (-2)
				cursorId = (this.game.world.dragValid ? "pointer" : (this.game.world.dragging ? "no-drop" : "ew-resize"));
			} else if (this.game.world.trapUnderMouse != -1)
			{	// ready to pickup trap and move it
				cursorId = "pointer";
			} else if (this.game.world.currentTool == this.game.world.tools.length-1) 
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
		var textY = 272;
		this.overlayContext.lineWidth=1;
		this.overlayContext.textAlign="left";
		this.overlayContext.font="bold 14px sans-serif";
		this.overlayContext.shadowColor="#060";
		this.overlayContext.fillStyle = "#8F8";

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
	 * Display level debriefing
	 *  - result obtained
	 *  - result expected
	 */
	drawLevelEndText : function()
	{
		var textY = 272;
		this.overlayContext.lineWidth=1;
		this.overlayContext.textAlign="left";
		this.overlayContext.font="bold 14px sans-serif";
		this.overlayContext.shadowColor="#060";
		this.overlayContext.fillStyle = "#8F8";
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
		this.sceneryContext.clearRect(0, 0, this.sceneryCanvas.width, this.sceneryCanvas.height);
		this.sceneryContext.strokeStyle="#080";
		this.sceneryContext.lineWidth=10;
		this.sceneryContext.font="40pt Verdana";
		this.sceneryContext.textAlign="center";
		this.sceneryContext.strokeText("PEST CONTROL", 500, 100);

		this.sceneryContext.font="65pt Verdana";
		this.sceneryContext.strokeText("WEASELS", 500, 200);

		
		var areaHalfWidth = window.innerWidth / 8 / this.pixelRatio;
		this.overlayContext.lineWidth=1;
		var gradient = this.overlayContext.createLinearGradient(0,262,0,314);
		gradient.addColorStop(0, "rgba(255,255,255,.8)");  
		gradient.addColorStop(1, "rgba(255,255,255,.1)");  
	
		for (var i=0; i<4; ++i)
		{
			this.overlayContext.fillStyle = (this.game.controls.buttonAreaX == i && this.game.controls.buttonAreaY>0 && i!=2 ? "#b43" : "#413");
			this.overlayContext.fillRect(1+areaHalfWidth*i*2, 258, 2*areaHalfWidth-2, 60);
			this.overlayContext.fillStyle = gradient;
			this.overlayContext.fillRect(5+areaHalfWidth*i*2, 262, 2*areaHalfWidth-10, 52);
		}
		
		this.overlayContext.fillStyle = (this.game.controls.buttonAreaX == 2 && this.game.controls.buttonAreaY==1 ? "#b43" : "#413");
		this.overlayContext.beginPath();
		this.overlayContext.moveTo(areaHalfWidth*4.5, 276);
		this.overlayContext.lineTo(areaHalfWidth*5.5, 276);
		this.overlayContext.lineTo(areaHalfWidth*5, 266);
		this.overlayContext.fill();
		this.overlayContext.fillStyle = (this.game.controls.buttonAreaX == 2 && this.game.controls.buttonAreaY==2 ? "#b43" : "#413");
		this.overlayContext.beginPath();
		this.overlayContext.moveTo(areaHalfWidth*4.5, 298);
		this.overlayContext.lineTo(areaHalfWidth*5.5, 298);
		this.overlayContext.lineTo(areaHalfWidth*5, 308);
		this.overlayContext.fill();
		if (this.game.level == this.game.persistentData.maxLevel)
		{	// draw a lock if the level above is not accessible
			this.overlayContext.drawImage(this.spriteSheet, 71, 108, 9, 11, areaHalfWidth*5-4, 267, 9, 11);
		}
		
		

		var textY = 292;
		this.overlayContext.fillStyle = "#FFF";
		this.overlayContext.lineWidth=1;
		this.overlayContext.shadowColor = "#413";
		this.overlayContext.textAlign="center";
		this.overlayContext.font="bold italic 16px sans-serif";
		
		var text = "SFX : "+(this.game.persistentData.soundOn ? "ON" : "OFF");
		this.drawShadedText(text, areaHalfWidth, textY);
		
		text = "MUSIC : "+(this.game.persistentData.musicOn ? "ON" : "OFF");
		this.drawShadedText(text, 3*areaHalfWidth, textY);
		
		text = "LEVEL "+(this.game.level<9?"0":"")+(1+this.game.level);
		this.drawShadedText(text, 5*areaHalfWidth, textY);

		text = "START";
		this.drawShadedText(text, 7*areaHalfWidth, textY);
		
		this.overlayContext.shadowOffsetX = 0;
		this.overlayContext.shadowOffsetY = 0;
/*
		textY+=16;
		text = "PASSWORD : NONE";
		this.overlayContext.strokeText(text, 5*areaHalfWidth, textY);
		*/
	}

	

}