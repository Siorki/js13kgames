/**
 * Graphics renderer, in charge of displaying all game gfx to the page canvases
 * Handles all ingame modes and planes. 
 */

class Renderer
{
	/**
	 * * @constructor
	 * @param sceneryCanvas HTML5 canvas in the background, showing the main game area
	 * @param spriteImg Sprite sheet as a DOM image
	 * @param game instance of the Game to render - mostly used to access World data
	 */
	constructor(sceneryCanvas, spriteImg, game) {
		this.game = game;
		this.engine = game.world;
		this.sceneryCanvas = sceneryCanvas;
		this.sceneryContext = sceneryCanvas.getContext("2d");
		this.windowLayout = {
			width:140,
			height:200
		};
		
		this.mainMenuText = ["RESUME", "LOAD GAME", "NEW GAME", "SAVE GAME", "MUSIC "];
		
		this.spriteImg = spriteImg;
		
		this.sceneryContext.save(); // resizeWindow() will call restore() 
		this.resizeWindow(); // define the appropriate pixel zoom for the play area
		
		this.targetOrientation = this.orientation = 0;
		this.frameCount = 0;
	}

	

	/** 
	 * Handler for global window resize event, also called once at init time
	 * Defines the zoom factor for the canvas contents and (re)aligns everything
	 * Zoom level is defined so that the number of tiles shown on screen is pretty much constant
	 */
	resizeWindow() {
			
		// Canvas size matches portrait layout of mobile screens
		let refWidth = Math.min(innerWidth, Math.floor(innerHeight*.7));
		let refHeight = Math.floor(refWidth/.7);
		this.sceneryCanvas.width = refWidth;
		this.sceneryCanvas.height = refHeight;
		this.sceneryCanvas.style.width = refWidth+"px";
		this.sceneryCanvas.style.height = refHeight+"px";
		this.sceneryCanvas.style.marginLeft = -(refWidth>>1)+"px";
		this.sceneryCanvas.style.top = ((innerHeight-refHeight)>>1)+"px";
		
		// recompute the transform
		this.sceneryContext.restore();
		this.sceneryContext.save();
		this.sceneryContext.translate(refWidth>>1, refHeight>>1);
		this.sceneryContext.scale(refWidth/16, refWidth/16);

		this.windowLayout.width = refWidth;
		this.windowLayout.height = refHeight;
		this.game.layoutChanged(this.windowLayout);
	}
	
	
	/**
	 * Draw text on the text canvas, with shadow
	 * @param text The text to write
	 * @param x X-coordinate of the text, left/center/right depending on the textAlign property of the canvas
	 * @param y Y-coordinate of the text
	 */
	drawShadedText(text, x, y)
	{
		this.sceneryContext.shadowOffsetX = -1;
		this.sceneryContext.shadowOffsetY = -1;
		this.sceneryContext.fillText(text, x, y);
		this.sceneryContext.shadowOffsetX = 2;
		this.sceneryContext.shadowOffsetY = 2;
		this.sceneryContext.fillText(text, x, y);
	}

	/**
	 * Draw text on the overlay canvas, with an outline (stroke and fill)
	 * Context rendering parameters must be defined beforehand : strokeStyle, fillStyle, lineWidth, textAlign ...
	 * @param text The text to write
	 * @param x X-coordinate of the text, left/center/right depending on the textAlign property of the canvas
	 * @param y Y-coordinate of the text
	 * @param size Text size in px
	 */	
	outlineText(text,x,y,size) {
		this.sceneryContext.font = size+"px cursive";
		this.sceneryContext.strokeText(text, x, y);
		this.sceneryContext.fillText(text, x, y);
	}


	
	/**
	 * Entry point, draw the whole playfield, and the menu if requested
	 * @param showMenu true to render menu 
	 * @param menu menu to show, instance of MenuDriver
	 */
	drawMain(showMenu, menu) {
		
		this.drawPlayfield(showMenu);
		if (showMenu) {
			this.drawMainMenu(menu);
		}
		++this.frameCount;

	}
	
	/**
	 * draw one tile at the given coordinates
	 * @param x tile X coordinate [1 - 5]
	 * @param y tile Y coordinate [1 - 5]
	 * @param value tile value, integer part will be displayed inside the tile
	 * @param rotateText true to counter-rotate the text (inside grid), false for top row
	 * @param dx difference in X with merging tile coordinate (-1 or +1)
	 * @param dy difference in Y with merging tile coordinate (-1 or +1)
	 * @param step merge step from 10 (initial) to 0 (done)
	 */
	drawOneTile(x, y, value, rotateText, dx, dy, step) {
		let tileColor = "#c0f"; // default for multiple of 13
		if (value%13) {
			tileColor = ["#fec", "#fc8", "#fa4", "#f80", "#c84", "#888", "#48c", "#08f", "#04f", "#00f", "#00c", "#008", "#004"][Math.round(Math.log(value)/Math.log(2))];
		} 
		let leftX = Math.min(x, x+dx*step/10);
		let topY = Math.min(y, y+dy*step/10);
		let width = 1+Math.abs(dx)*step/10;
		let height = 1+Math.abs(dy)*step/10;
		
		this.sceneryContext.fillStyle = tileColor;
		this.sceneryContext.beginPath();
		this.sceneryContext.roundRect(leftX*2-7+.02, topY*2-7+.02, width*2-.04, height*2-.04, .2);
		this.sceneryContext.fill();
		
		this.sceneryContext.fillStyle = "#fff";
		this.sceneryContext.fillRect(leftX*2-7+.15, topY*2-7+.15, width*2-.3, height*2-.3);
		
		this.sceneryContext.fillStyle = tileColor;
		this.sceneryContext.fillRect(leftX*2-7+.3, topY*2-7+.3, width*2-.6, height*2-.6);
		
		this.sceneryContext.save();
		this.sceneryContext.fillStyle="#000";
		this.sceneryContext.translate(x*2-7+1, y*2-7+1);
		this.sceneryContext.textAlign = "center";
		this.sceneryContext.textBaseline = "middle";
		if (rotateText) {
			this.sceneryContext.rotate(this.orientation*Math.PI/2);
		}
		this.sceneryContext.scale(.05,.05);
		this.sceneryContext.fillText(Math.round(value), 0, 0);
		this.sceneryContext.restore();
	}

	/**
	 * Draw a combo (three tiles merging to 13)
	 * @param combo structure containing values and coordinates of the three tiles
	 */
	drawCombo(combo) {
		let step = combo.step;
		let alpha = Math.min(1, step/10); // 1 from 20 to 10, then linear to 0
		let beta = Math.max(0, step/10-1); // linear 1->0 from 20 to 10, then 0

		let leftX = combo.x0*alpha+combo.x1*(1-alpha);
		let topY = combo.y0*alpha+combo.y1*(1-alpha);
		let width = 1+(combo.x2-combo.x0)*alpha;
		let height = 1+(combo.y2-combo.y0)*alpha;
		
		let tileColor = step>10?"#ff0":"rgb("+(195+6*step)+","+(25*step)+","+(255-25*step)+")";
		
		this.sceneryContext.fillStyle = tileColor;
		this.sceneryContext.beginPath();
		this.sceneryContext.roundRect(leftX*2-7+.02, topY*2-7+.02, width*2-.04, height*2-.04, .2);
		this.sceneryContext.fill();
		
		this.sceneryContext.fillStyle = "#fff";
		this.sceneryContext.fillRect(leftX*2-7+.15, topY*2-7+.15, width*2-.3, height*2-.3);
		
		this.sceneryContext.fillStyle = tileColor;
		this.sceneryContext.fillRect(leftX*2-7+.3, topY*2-7+.3, width*2-.6, height*2-.6);
		
		this.sceneryContext.textAlign = "center";
		this.sceneryContext.textBaseline = "middle";
		if (step>10) {
			this.sceneryContext.save();
			this.sceneryContext.fillStyle="#000";
			this.sceneryContext.translate(combo.x0*2-7+1, combo.y0*2-7+1);
			this.sceneryContext.rotate(this.orientation*Math.PI/2);
			this.sceneryContext.scale(.05,.05);
			this.sceneryContext.fillText(Math.round(beta*combo.v0), 0, 0);
			this.sceneryContext.restore();

			this.sceneryContext.save();
			this.sceneryContext.fillStyle="#000";
			this.sceneryContext.translate(combo.x2*2-7+1, combo.y2*2-7+1);
			this.sceneryContext.rotate(this.orientation*Math.PI/2);
			this.sceneryContext.scale(.05,.05);
			this.sceneryContext.fillText(Math.round(beta*combo.v2), 0, 0);
			this.sceneryContext.restore();

		}
		this.sceneryContext.save();
		this.sceneryContext.fillStyle="#000";
		this.sceneryContext.translate(combo.x1*2-7+1, combo.y1*2-7+1);
		this.sceneryContext.rotate(this.orientation*Math.PI/2);

		this.sceneryContext.scale(.05,.05);
		this.sceneryContext.fillText(Math.round(combo.v1+(1-beta)*(combo.v0+combo.v2)), 0, 0);
		this.sceneryContext.restore();

		
	}
	
	/**
	 * Draw the top view of the current floor on the scenery canvas
	 * If in a stairway or elevator, draw both floors, below and above, with relative zoom
	 * Private method called by drawMain()
	 * @param showMenu true if menu is displayed on top => blur area below
	 */
	drawPlayfield(showMenu) {
		
		this.sceneryContext.fillStyle="#fed";
		this.sceneryContext.fillRect(-8, -16, 16, 32);
		
		if (showMenu) {	// blur the area below the menu
			this.sceneryContext.filter="blur(4px)";
		} else {
			// draw highlights, if any
			this.sceneryContext.fillStyle="#f87";
			switch (this.game.controls.areaUnderMouse) {
				case 0 :
					this.sceneryContext.fillRect(-3, 9.65, 6, 2.35);
					break;
				case 1 : 
					this.sceneryContext.beginPath();
					this.sceneryContext.arc(0, 0, 7.4, .996, .342, true);
					this.sceneryContext.lineTo(8, 7.4*Math.sin(.342));
					this.sceneryContext.lineTo(8, 9);
					this.sceneryContext.lineTo(7.4*Math.cos(.996), 9);
					this.sceneryContext.fill();
					break;
				case 2 :
					this.sceneryContext.beginPath();
					this.sceneryContext.arc(0, 0, 7.4, 1.15, 1.99);
					this.sceneryContext.lineTo(-3, 9.65);
					this.sceneryContext.lineTo(3, 9.65);
					this.sceneryContext.fill();
					break;
				case 3 :
					this.sceneryContext.beginPath();
					this.sceneryContext.arc(0, 0, 7.4, 2.146, 2.8);
					this.sceneryContext.lineTo(-8, 7.4*Math.sin(2.8));
					this.sceneryContext.lineTo(-8, 9);
					this.sceneryContext.lineTo(7.4*Math.cos(2.146), 9);
					this.sceneryContext.fill();
					break;
				default :
					break;
			}
		}
		
		// copy keys from sprite map
		this.sceneryContext.drawImage(this.spriteImg, 0, 0, 32, 32, -7, 6.5, 1, 1);
		this.sceneryContext.drawImage(this.spriteImg, 32, 0, 32, 32, 6, 6.5, 1, 1);
		this.sceneryContext.drawImage(this.spriteImg, 64, 0, 32, 32, -.5, 8, 1, 1);
		this.sceneryContext.drawImage(this.spriteImg, 96, 0, 32, 32, -.5, 10, 1, 1);
		
		// draw arrows
		for (let i=0; i<2; ++i) {
			this.sceneryContext.fillStyle=this.engine.currentMove==[3,1][i]?"#f00":"#600";
			this.sceneryContext.strokeStyle="#000";
			this.sceneryContext.beginPath();
			this.sceneryContext.arc(0, 0, 8.2, .7*Math.PI, .8*Math.PI);
			this.sceneryContext.lineTo(8*Math.cos(.8*Math.PI), 8*Math.sin(.8*Math.PI));
			this.sceneryContext.lineTo(8.4*Math.cos(.83*Math.PI), 8.4*Math.sin(.83*Math.PI));
			this.sceneryContext.lineTo(8.8*Math.cos(.8*Math.PI), 8.8*Math.sin(.8*Math.PI));
			this.sceneryContext.arc(0, 0, 8.6, .8*Math.PI, .7*Math.PI, true);
			this.sceneryContext.lineTo(8.2*Math.cos(.7*Math.PI), 8.2*Math.sin(.7*Math.PI));
			this.sceneryContext.fill();
			this.sceneryContext.stroke();

			this.sceneryContext.fillStyle=this.engine.currentMove==2?"#f00":"#600";
			this.sceneryContext.beginPath();
			this.sceneryContext.arc(0, 8.5, 1.3, .7*Math.PI, 1.2*Math.PI);
			this.sceneryContext.lineTo(1.5*Math.cos(1.2*Math.PI), 8.5+1.5*Math.sin(1.2*Math.PI));
			this.sceneryContext.lineTo(1.1*Math.cos(1.35*Math.PI), 8.5+1.1*Math.sin(1.35*Math.PI));
			this.sceneryContext.lineTo(.7*Math.cos(1.2*Math.PI), 8.5+.7*Math.sin(1.2*Math.PI));
			this.sceneryContext.arc(0, 8.5, .9, 1.2*Math.PI, .7*Math.PI, true);
			this.sceneryContext.lineTo(1.3*Math.cos(.7*Math.PI), 8.5+1.3*Math.sin(.7*Math.PI));
			this.sceneryContext.fill();
			this.sceneryContext.stroke();
			
			this.sceneryContext.fillStyle=this.engine.currentMove==0?"#f00":"#600";
			this.sceneryContext.beginPath();
			this.sceneryContext.moveTo(1.3, 9.8);
			this.sceneryContext.lineTo(1.3, 10.8);
			this.sceneryContext.lineTo(1.5, 10.8);
			this.sceneryContext.lineTo(1.1, 11.3);
			this.sceneryContext.lineTo(.7, 10.8);
			this.sceneryContext.lineTo(.9, 10.8);
			this.sceneryContext.lineTo(.9, 9.8);
			this.sceneryContext.lineTo(1.3, 9.8);
			this.sceneryContext.fill();
			this.sceneryContext.stroke();
			
			this.sceneryContext.scale(-1, 1); // draw the arrows, mirrored
		}
		this.sceneryContext.filter="none";

		
		// reorient the wheel
		this.targetOrientation = this.engine.orientation;
		if (this.targetOrientation>this.orientation + 2.5) {
			this.targetOrientation-=4;
		}
		if (this.targetOrientation<this.orientation - 2.5) {
			this.targetOrientation+=4;
		}
		if (Math.abs(this.targetOrientation - this.orientation) < .04) {
			this.orientation = this.targetOrientation = this.engine.orientation; 
		} else {
			let headingRate = (this.targetOrientation>this.orientation) ? .04 : -.04;
			this.orientation += headingRate;
		}
		this.sceneryContext.strokeStyle = "#444";
		this.sceneryContext.lineWidth = .04;

		// incoming tiles
		for (let x=0; x<6; ++x) {
			this.sceneryContext.beginPath();
			this.sceneryContext.moveTo(x*2-5, -10); 
			this.sceneryContext.lineTo(x*2-5, -8); 
			this.sceneryContext.stroke();
			if (x<2) {
				this.sceneryContext.beginPath();
				this.sceneryContext.moveTo(-5, x*2-10); 
				this.sceneryContext.lineTo(5, x*2-10); 
				this.sceneryContext.stroke();
				}
		}
		for (let x=0; x<5; ++x) {
			if (this.engine.waitingLine[x]) {
				this.drawOneTile(x+1, this.engine.waitingLine[x].y, this.engine.waitingLine[x].value, false, 0, 0, 0);
			}
		}
		
		// grid and contents
		this.sceneryContext.save();
		this.sceneryContext.rotate(-this.orientation*Math.PI/2);
		for (let x=0; x<6; ++x) {
			this.sceneryContext.beginPath();
			this.sceneryContext.moveTo(x*2-5, -5); 
			this.sceneryContext.lineTo(x*2-5, 5); 
			this.sceneryContext.stroke();
			this.sceneryContext.beginPath();
			this.sceneryContext.moveTo(-5, x*2-5); 
			this.sceneryContext.lineTo(5, x*2-5); 
			this.sceneryContext.stroke();
		}
		
		this.sceneryContext.beginPath();
		this.sceneryContext.arc(0, 0, 7.35, 0, 2*Math.PI);
		this.sceneryContext.stroke();


		this.engine.tiles.forEach (tile => {
			if (tile.merging != MERGE_TO_13)
				this.drawOneTile(tile.x, tile.y, tile.value, true, 
								 tile.dx?tile.dx:0, tile.dy?tile.dy:0, tile.mergeStep?tile.mergeStep:0);
		});
		this.engine.combos.forEach (combo => {
				this.drawCombo(combo);
		});
		this.sceneryContext.restore();
	}

	
	/**
	 * Set the text for first menu entry
	 * @param gameOver true for "GAME OVER", false for "RESUME"
	 */
	setGameOver(gameOver) {
		this.mainMenuText[0]=gameOver ? "GAME OVER" : "RESUME";
	}
	
	/**
	 * Set the text for fourth menu entry
	 * @param saved true for "SAVED", false for "SAVE GAME"
	 */
	setSaved(saved) {
		this.mainMenuText[3]=saved ? "SAVED" : "SAVE GAME";
	}
	
	
	/**
	 * Entry point - Draw the main menu options
	 * @param menu the active menu
	 */
	drawMainMenu(menu) {
		
		this.sceneryContext.save();
		var highlightColor = "#fff";
		/*
		if ((this.frameCount%5)<3 && ((Math.floor(this.frameCount/50)&1)==0)) {
			highlightColor = "#33f";
		}*/
		var gray = Math.round(20+20*Math.cos(this.frameCount/50));
			
		this.sceneryContext.lineWidth = .1;
		this.sceneryContext.textAlign="center";
		for (var index=0; index<5; ++index) {
			var text=this.mainMenuText[index];
			if (index==4) { // MUSIC ON / OFF
				text+=this.game.persistentData.musicOn ? "ON" : "OFF";
			}
			this.sceneryContext.fillStyle = (menu.selectedLine==index ? highlightColor : 
											(menu.enabledLines[index] ? "#aaa" : 
											(text=="GAME OVER" ? "#C00" : "#888")));
			this.sceneryContext.strokeStyle="hsl(0,0%,"+(menu.selectedLine==index?gray:(menu.enabledLines[index] ? 0 : 50))+"%)";			
			/*
			text+=(index==3?(menu.soundManager.audioTagSupport?(menu.soundManager.persistentData.data.musicOn?"ON":"OFF"):"not supported"):"");
			text+=(index==4?(menu.soundManager.webAudioSupport?(menu.soundManager.persistentData.data.soundOn?"ON":"OFF"):"not supported"):"");
			*/
			this.outlineText(text, 0, index*1.2+6, 1.1);
		}
		this.sceneryContext.restore();
		
	}

	

}
