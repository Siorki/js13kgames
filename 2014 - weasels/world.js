/**
 * Ingame world, which contains :
 * - a playfield : background to walk on and alter, and for collision detection
 * - tools : represented by the blue icons on the bottom bar (landmine, fan, flamethrower, ice, shotgun)
 * - traps : instance of a tool that has been placed in the playfield
 * - critters : weasels to eliminate, or innocent herbivores 
 * @constructor
 */
function World(controls, playField, soundManager)
{
	this.controls = controls;
	this.soundManager = soundManager;
	
	this.highlightedTool = -1;
	
	this.playField = playField;
	
	this.sourceRate = 43;
	
	this.dragStartObjectX = 0;
	this.dragStartObjectY = 0;
	this.dragStartMouseX = 0;
	this.dragStartMouseY = 0;
	this.dragValid = false;
	this.dragging = false;
	this.lastValidX = 0;
	this.lastValidY = 0;
	
	this.trapSize = [ [3, 3], [12, 27], [12, 15], [12, 25], [12, 27], [17, 27], [13, 25] ];
}


World.prototype = {

	/**
	 * Resets values at the beginning of a level : timer, critters (none)
	 * Loads the level contents
	 * Sets the scenery, action and critter count for that level.
	 * 
	 * @param index 0-based index of the level
	 */
	loadLevel : function(index)
	{	
		this.currentTool = 4;	// gun selected
		this.predators = [];
		this.lastExplosionTime = -999;	// used for rendering only
		this.draggedTrap = -1;	// trap being dragged (mouse down) in the playfield
		this.trapUnderMouse = -1;
		this.shotgunReloadTime = 0;

		var allLevels = 
		[
			[	"Walking through a minefield",
				20,	// number of weasels 
				20, // hit goal
				120,	// time in seconds
				[10, 0, 0, 0, -1], // 10 landmines
				[6, 190, 20, 5, 817, 159],	// entrance and exit
				[2, 100, 160, 800, 96]
			],
			[
				"Gone with the wind",
				20,
				10,
				120,
				[0, 3, 0, 0, -1], // 3 fans
				[6, 300, 20, 5, 400, 219],
				[1, 200, 60, 544, 16, 1, 200, 220, 576, 36, 1, 776, 204, 32, 52]
			],
			[
				"Pop goes the weasel",
				10,
				10,
				120,
				[0, 2, 0, 0, -1], // 2 fans
				[6, 260, 100, 5, 740, 176, 4, 530, 199],
				[2, 200, 200, 350, 56, 2, 660, 180, 100, 76]
			],
			[
				"Cooked to order",
				20,
				15,
				120,
				[0, 0, 3, 0, -1], // 3 flamethrowers,
				[6, 300, 20, 5, 300, 220],
				[1, 280, 60, 384, 16, 1, 220, 140, 256, 16, 1, 508, 140, 256, 16, 1, 252, 220, 480, 16] 
			],
			[
				"Caution, thin ice",
				15,
				15,
				120,
				[3, 0, 0, 0, -1], // 3 mines
				[6, 210, 16, 5, 200, 191],
				[1, 192, 32, 192, 16, 1, 352, 64, 192, 16, 1, 192, 96, 192, 16, 1, 352, 128, 320, 16, 1, 320, 160, 448, 16, 1, 768, 144, 32, 32, 1, 160, 192, 256, 64] 
			],
			[	
				"Stairway to hell",
				4,
				4,
				120,
				[2, 0, 0, 0, -1], // 2 mines
				[6, 260, 100, 5, 740, 175],
				[2, 200, 200, 400, 56, 2, 630, 170, 130, 86]
			],
			[
				"No mines this time",
				15,
				15,
				120,
				[0, 1, 1, 0, -1], // 1 fan, 1 flamethrower
				[6, 210, 16, 5, 200, 191],
				[1, 192, 32, 192, 16, 1, 352, 64, 192, 16, 1, 192, 96, 192, 16, 1, 352, 128, 320, 16, 1, 320, 160, 448, 16, 1, 768, 144, 32, 32, 1, 160, 192, 256, 64] 
			],
			[	
				"Bad kids get grounded",
				4,
				4,
				120,
				[2, 0, 0, 0, -1], // 2 mines
				[6, 260, 100, 5, 740, 174, 4, 530, 199],
				[2, 200, 200, 400, 56, 2, 630, 170, 130, 86]
			],
			[
				"In so many ways",
				10,
				10,
				180,
				[3, 0, 0, 0, -1], // 3 mines
				[6, 300, 50, 5, 220, 239, 5, 280, 239, 5, 340, 239, 5, 400, 239, 5, 460, 239, 5, 520, 239, 5, 580, 239, 5, 640, 239, 5, 700, 239, 5, 760, 239],
				[1, 256, 128, 448, 16, 1, 192, 240, 608, 16]
			],
			[
				"Dark side of the mountain",
				15,
				15,
				120,
				[2, 3, 0, 0, -1], // 2 mines, 3 fans
				[6, 250, 120, 5, 780, 175, 4, 430, 180],
				[3, 200, 180, 600, 126]
			]	
		];
		var level = allLevels[Math.min(9, Math.max(0, index))];
		
		this.levelTitle = level[0];

		this.crittersFragged = 0;
		this.crittersInside = 0;
		this.crittersExited = 0;
		this.crittersWaitingAtSource = level[1];
		this.fragTarget = level[2];

		this.timer = 0;
		this.totalTime = level[3] * 25; // data in seconds, multiply by fps

		this.tools = level[4].slice(); // copy the array by value
		this.traps = [];
		for (var i=0; i<level[5].length; i+=3)	// preset objects, including entrance and exit
		{
			this.traps.push( {	type : level[5][i],
								x : level[5][i+1],
								y : level[5][i+2],
								speedX : 0,
								speedY : 0,
								dir : 1
							 } );
		}
		this.playField.initFromDescription(level[6]);
		this.resetCritterStrategy();
	},

	/**
	 * Clears the critter strategy table
	 * then sets entries for all exits in level
	 * and initiates traversal algorithm
	 */
	resetCritterStrategy : function()
	{
		this.critterStrategy = [];
		this.strategyQueue = [];
		for (var i=0; i<(this.playField.width>>5); ++i)
		{
			this.critterStrategy.push([0,0,0,0,0,0,0,0].slice());	// playfield is 256 pixels = 8x32 high
		}
		for (var i=0; i<this.traps.length; ++i)
		{
			if (this.traps[i].type == 5) // exit
			{
				this.critterStrategy[this.traps[i].x>>5][this.traps[i].y>>5] = 16;	// strategy : exit is here
				this.strategyQueue.push({x:this.traps[i].x>>5, y:this.traps[i].y>>5});
			}
		}
	},
	
	/**
	 * Performs one step of the breadth-first traversal algorithm
	 * to identify the strategy (directions to follow in each square)
	 */
	developStrategy : function()
	{
		if (this.strategyQueue.length == 0)
		{
		} else {
			var square = this.strategyQueue.shift();
			if (square.x > 0)
			{
				if (!this.critterStrategy[square.x-1][square.y])
				{
					this.strategyQueue.push({x:square.x-1, y:square.y});
				}
				if (!(this.critterStrategy[square.x-1][square.y]&20)) 
				{
					this.critterStrategy[square.x-1][square.y] |= 1; // right
				}
			}
			if (square.x+1 < (this.playField.width>>5))
			{
				if (!this.critterStrategy[square.x+1][square.y])
				{
					this.strategyQueue.push({x:square.x+1, y:square.y});
				}
				if (!(this.critterStrategy[square.x+1][square.y]&17)) 
				{
					this.critterStrategy[square.x+1][square.y] |= 4; // left
				}
			}
			if (square.y > 0)
			{
				if (!this.critterStrategy[square.x][square.y-1])
				{
					this.strategyQueue.push({x:square.x, y:square.y-1});
				}
				if (!(this.critterStrategy[square.x][square.y-1]&24)) {
					this.critterStrategy[square.x][square.y-1] |= 2; // down
				}

			}
			if (square.y < 7)
			{
				if (!this.critterStrategy[square.x][square.y+1])
				{
					this.strategyQueue.push({x:square.x, y:square.y+1});
				}
				if (!(this.critterStrategy[square.x][square.y+1]&18))
				{
					this.critterStrategy[square.x][square.y+1] |= 8; // top (hard to achieve)
				}
			}
		}
	},
	
	/**
	 * Performs one step of animation : move critters, check them against traps
	 */
	animateItems : function()
	{
		++this.timer;
	

		var scenery = this.playField; 
		var fraggedCount = 0;
		for (var i=0; i<this.predators.length; ++i)  {
			this.predators[i].move(scenery, this.critterStrategy);
			// avoid gun aim, even when reloading
			this.predators[i].useShield(this.controls.worldX, this.controls.mouseY, this.currentTool == 4 && this.draggedTrap == -1);
			fraggedCount += (this.predators[i].activity < 0 ? 1 :0);
			
			// if hitting a blocker, turn around
			for (var j=0; j<this.predators.length; ++j) {
				if (j != i 
					&& this.predators[j].activity == 3
					&& Math.abs(this.predators[i].x - this.predators[j].x) < 10
					&& Math.abs(this.predators[i].y - this.predators[j].y) < 10
					&& (this.predators[i].x - this.predators[j].x)*this.predators[i].dir < 0)
				{
					this.predators[i].dir *= -1;
				}
			}
		}
		this.crittersFragged = fraggedCount; // atomic change : temp variable prevents concurrent access issues (for display)
		this.crittersInside = this.predators.length-fraggedCount - this.crittersExited;
		this.animateTraps();
		this.developStrategy();
		this.developStrategy();
		if ((this.timer&255)==0)
		{	// every 10 seconds, reconsider the strategy, as some parts of the scenery may have changed / been destroyed
			this.resetCritterStrategy();
		}
	},
	
	/**
	 * Trigger traps, apply gravity to landmines
	 */
	animateTraps : function()
	{
		for (var i=0; i<this.traps.length; ++i) {
			if (this.draggedTrap != i)	// trap being dragged under the mouse cursor is inactive
			{
				var trap = this.traps[i];
				switch (trap.type)
				{
					case 0 :
						if (this.animateLandmine(trap))
						{	// landmine blown
							this.lastExplosionTime = this.timer;
							this.traps.splice(i, 1);
							if (this.draggedTrap>=i) {	// fixed crash upon dragging mine when another one explodes
								--this.draggedTrap;
							}
							--i;
						}
						break;
					case 1 :
						this.animateFan(trap);
						break;
					case 2 :
						this.animateFlamethrower(trap);
						break;
					case 3 :
						this.animateWeight(trap);
						break;
					case 4 :
						this.animateBalloonStand(trap);
						break;
					case 5 : 
						this.animateExit(trap);
						break;
					case 6 :
						this.animateEntrance(trap);
						break;
					default :
						break;
				}
			}
		}
	},
	
	/**
	 * Animation for landmines, called at each frame for every landmine
	 *  - landmine falls down until it hits the ground
	 *  - explodes if any critter comes too close
	 * @return true if exploded, false otherwise
	 */
	animateLandmine : function(trap)
	{
		var triggered = false;
		for (var j=0; !triggered && j<this.predators.length; ++j)
		{
			if (this.predators[j].activity > -1) {	// only if the critter is alive
				var dist2 = Math.pow(trap.x - this.predators[j].x, 2) + Math.pow(trap.y - this.predators[j].y + 6, 2);
				triggered = (dist2 < 60);
			}
		}
		if (triggered)
		{	// mine blows up
			this.playField.explode(trap.x, trap.y, 30);
			for (var j=0; j<this.predators.length; ++j)
			{
				var dist2 = Math.pow(trap.x - this.predators[j].x, 2) + Math.pow(trap.y - this.predators[j].y + 6, 2);
				if (dist2<600) {
					this.predators[j].life -= 500 / (10 + dist2);	// 50 at epicenter, less damage further
					this.predators[j].sendFlying (50*(this.predators[j].x-trap.x)/dist2, 50*(-6+this.predators[j].y-trap.y)/dist2);
				}
			}
			this.soundManager.playExplosion();
			return true;
		} else 
		{	// mine falls down until it hits scenery
			++trap.speedY;
			for (var y=0; y<trap.speedY; ++y)
			{
				if (this.playField.intersectBox(trap.x-this.trapSize[trap.type][0], trap.y+1, this.trapSize[trap.type][0]*2+1, 1))
				{
					trap.speedY=0;
				} else {
					++trap.y;
					trap.x+=trap.speedX/trap.speedY;
				}
			}
		}
		return false;
	},
	
	/**
	 * Animation for fans, called at each frame for every fan
	 *  - causes any critter with parachute or ballon passing in front of the fan to gain sideways speed
	 */
	animateFan : function(trap)
	{
		for (var j=0; j<this.predators.length; ++j)
		{
			if ( (this.predators[j].activity == 2 // parachute
			   || this.predators[j].activity == 5) // balloon
			   && Math.abs(trap.y - this.predators[j].y) < 10
			   && Math.abs(trap.x + 25*trap.dir - this.predators[j].x) < 20)
			{
				this.predators[j].speedX += trap.dir / Math.abs(this.predators[j].x - trap.x - 10*trap.dir);
			}
		}
	},
	
	/**
	 * Animation for flamethrower, called at each frame for every fan
	 *  - causes any critter passing in front of the flamethrower to receive damage
	 */
	animateFlamethrower : function(trap)
	{
		for (var j=0; j<this.predators.length; ++j)
		{
			if ( Math.abs(trap.y - this.predators[j].y) < 8
			   && Math.abs(trap.x + 30*trap.dir - this.predators[j].x) < 20
			   && this.predators[j].activity != 7)
			{
				this.predators[j].life-= 100 / ( 5 + Math.abs(this.predators[j].x - trap.x - 25*trap.dir));
				if (this.predators[j].life < 0)
				{
					this.predators[j].activity = 7; 
					this.predators[j].timer = 0;
				}
			}
		}
	},
	
	
	/**
	 * Effect for weight : NYI
	 */
	animateWeight : function(trap)
	{
		
	},
	
	/**
	 * Effect for exit : critter leaves the play area
	 * May be a defeat condition
	 */
	animateExit : function(trap)
	{
		for (var j=0; j<this.predators.length; ++j)
		{
			if (this.predators[j].activity != 8  
				&& Math.abs(trap.y - this.predators[j].y) < 8
				&& Math.abs(trap.x - this.predators[j].x) < 2)
			{
				this.predators[j].activity = 8; // exiting
				this.predators[j].timer = 0;
				++this.crittersExited;
				this.soundManager.playExit();
			}
		}
	},
	
	/**
	 * Effect for entrance : add a critter to the play area
	 * at a given frequency, if there are still any waiting
	 */
	animateEntrance : function(trap)
	{
		if ((this.timer%this.sourceRate)==0 && this.crittersWaitingAtSource>0) {
			this.predators.push(new Critter(trap.x, trap.y, trap.dir));
			--this.crittersWaitingAtSource;
			++this.crittersInside;
		}
	},
	
	/**
	 * Balloon stand : critters get a ballon
	 * Their activity is changed to "balloonner"
	 */
	animateBalloonStand : function(trap)
	{
		for (var j=0; j<this.predators.length; ++j)
		{
			if ( (this.predators[j].activity == 0 // walking
			   || this.predators[j].activity == 1 // freefall
			   || this.predators[j].activity == 2) // parachute
			   && Math.abs(trap.y - this.predators[j].y) < 5
			   && Math.abs(trap.x - this.predators[j].x) < 2)
			{
				this.predators[j].activity = 5; // balloonner
			}
		}
	},
	
	/**
	 * Take into account user actions (mouse move / click)
	 * Called once each step.
	 */
	processControls : function()
	{
		if (this.shotgunReloadTime) {
			--this.shotgunReloadTime;
		}
	
		this.highlightedTool = this.controls.toolBelowMouse;
		if (this.highlightedTool>-1 && this.highlightedTool<this.tools.length 
			&& this.controls.mouseLeftButton 
			&& this.draggedTrap == -1) // do not change the current tool while dragging a trap, it will cause mayhem
		{
			this.currentTool = this.highlightedTool;
		}		
		if (this.controls.mouseY<this.playField.height) // TODO : adjust to canvas height
		{	// mouse in playfield
			if (this.draggedTrap == -1)
			{	// empty handed. 
				this.dragging = false;
				this.dragValid = false;
				this.trapUnderMouse = this.performGrabTest(this.controls.worldX, this.controls.mouseY, 5);
				if (this.controls.mouseLeftButton)
				{
					if (this.trapUnderMouse>-1) {
						// click over a trap, grab it
						this.draggedTrap = this.trapUnderMouse;
						this.dragStartMouseX = this.controls.worldX;
						this.dragStartMouseY = this.controls.mouseY;
						this.dragStartObjectX = this.traps[this.draggedTrap].x;
						this.dragStartObjectY = this.traps[this.draggedTrap].y;
					} 
					else
					{	// click in an empty area, use the current tool
						if (this.currentTool == 4) 
						{	// shotgun
							if (!this.shotgunReloadTime)
							{
								this.shootAt(this.controls.worldX, this.controls.mouseY);
								this.controls.acknowledgeMouseClick();
							}
						} else {
							if (this.currentTool>-1 && this.tools[this.currentTool]>0)
							{	// other tool, with charges remaining
								this.draggedTrap = -2;
							}
						}
					}
				}
			
			}
			else  if (this.draggedTrap > -1)
			{	// LMB hit on trap, choice to drag or turn it around
				var dx = this.controls.worldX-this.dragStartMouseX;
				var dy = this.controls.mouseY-this.dragStartMouseY;
				this.dragging = this.dragging || (dx*dx+dy*dy > 25); // snap a bit at the beginning, to turn the trap around
				
				if (this.dragging)
				{	// actually dragging, after moving the pointer far enough
					var newX = this.dragStartObjectX + dx;
					var newY = this.dragStartObjectY + dy;

					this.dragValid = this.canPlaceTrapAt(this.traps[this.draggedTrap].type, newX, newY);
					if (this.dragValid)
					{
						this.lastValidX = newX;
						this.lastValidY = newY;
					}
					this.traps[this.draggedTrap].x = newX;
					this.traps[this.draggedTrap].y = newY;
				}
				if (!this.controls.mouseLeftButton)
				{	// LMB released, end drag or action
					if (!this.dragging)
					{	// mouse stayed in place (below snap threshold). Turn trap around
						if (this.traps[this.draggedTrap].type == 1		// fan
							|| this.traps[this.draggedTrap].type == 2)	// flamethrower
						{	// other traps do not rotate
							this.traps[this.draggedTrap].dir *= -1;
						}						
					} else if (!this.dragValid)
					{	// if dropping onto an invalid location, revert to the last valid coordinates
						this.traps[this.draggedTrap].x = this.lastValidX;
						this.traps[this.draggedTrap].y = this.lastValidY;
					}
					
					this.draggedTrap = -1;
					this.dragging = false;
				}
			}
			else	// this.draggedTrap == -2; means attempting to create a trap
			{
				this.dragValid = this.canPlaceTrapAt(this.currentTool, this.controls.worldX, this.controls.mouseY);
				if (!this.controls.mouseLeftButton)
				{	// LMB released, trap creation if allowed
					if (this.dragValid)
					{	// OK to create a trap here
						this.traps.push( {	type : this.currentTool,
											x : this.controls.worldX,
											y : this.controls.mouseY,
											speedX : 0,
											speedY : 0,
											dir : 1
										 } );
						--this.tools[this.currentTool];
					}
					this.draggedTrap = -1;
				}
			}
		}
		else
		{	// mouse outside of playfield
			if (this.draggedTrap != -1 && !this.controls.mouseLeftButton)
			{
				if (this.draggedTrap>-1) {
					// drag a trap outside of the playfield to return it to storage
					this.removeTrap(this.draggedTrap);
				}	// other possible value is -2, meaning trap creation. Returning it to the storage does nothing.
				this.draggedTrap = -1;
			}
		}
	},
	
	/**
	 * Identifies whether there is already a trap under the mouse
	 *  - to display a "grabbing hand" mouse cursor instead of the usual pointer
	 *  - to know what to grab on a mouse click
	 * @param x x-coordinate to test for traps
	 * @param y y-coordinate to test for traps
	 * @param distance maximum distance (in both x and y) allowed for a grab
	 * @return -1 if no trap found, trap index in this.traps otherwise
	 */
	performGrabTest : function(x, y, distance)
	{
		for (var i=0; i<this.traps.length; ++i)
		{
			var trap = this.traps[i];
			var w = this.trapSize[trap.type][0];
			var h = this.trapSize[trap.type][1];
			if (	trap.type < 5 // do not allow to drag entrance and exit
				&&	x>trap.x-w-distance && x<trap.x+w+distance
				&&	y>trap.y-h-distance && y<trap.y+distance)
			{
				return i;
			}
		}
		return -1; // no match
	},
	
	/**
	 * Tests whether a trap can be placed at the given coordinates
	 * False usually means that the playfield is blocking
	 * Called by the mouse handler to determine whether a player action is allowed or not
	 * @param type Trap type index, as in tools (0=mine, 1=fan, ...)
	 * @param x X-coordinate of the trap in playfield
	 * @param y Y-coordinate of the trap in playfield
	 * @return true if trap can be added, false otherwise
	 */
	canPlaceTrapAt : function(type, x, y)
	{
		return true;
	},
	
	/**
	 * Delete a trap and return it into tool storage
	 */
	removeTrap : function(trapIndex)
	{
		++this.tools[this.traps[trapIndex].type];
		this.traps.splice(trapIndex, 1);
	},
	
	/**
	 * Fires the shotgun at the given coordinates.
	 * Destroys balloons, damages umbrellas
	 */
	shootAt : function(x,y)
	{
		this.shotgunReloadTime = 15;	// delay before the next shot
		var shieldHit = false;
		for (var j=0;  j<this.predators.length; ++j)
		{
			var goodAim = (Math.abs(x - this.predators[j].x) < 7) && (Math.abs(y - this.predators[j].y + 22) < 9);
			shieldHit = shieldHit || (Math.abs(x - this.predators[j].x) < 3) && (Math.abs(y - this.predators[j].y + 6) < 5);
			if (this.predators[j].activity == 5 && goodAim) {	// only if the critter has a balloon
				this.predators[j].activity = 6; // blow the balloon
			}
		}
		
		if (shieldHit)
		{
			this.soundManager.playShotgunAndBounce();
		} else {
			this.soundManager.playShotgun();
		}
	},
	
	/**
	 * Return true if player won
	 * Exact conditions depends on current level (all critters eliminated, timeout, ...)
	 */
	won : function()
	{
		return this.fragTarget ? this.crittersFragged >= this.fragTarget
							   : this.timer >= this.totalTime;
	},
	
	/**
	 * Return true if player lost
	 * Exact conditions depends on current level (too many critters exited, timeout, ...)
	 */
	lost : function()
	{
		return this.fragTarget ? this.timer >= this.totalTime || this.crittersWaitingAtSource + this.crittersInside + this.crittersFragged < this.fragTarget
							   : this.crittersExited > 0;
	}
	
}
