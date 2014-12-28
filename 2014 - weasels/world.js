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
	this.loader = new LevelLoader();
	this.soundManager = soundManager;
	
	this.highlightedTool = -1;
	
	this.playField = playField;
	this.strategy = new Strategy(this.playField);
	
	this.sourceRate = 43;
	
	this.dragStartObjectX = 0;
	this.dragStartObjectY = 0;
	this.dragStartMouseX = 0;
	this.dragStartMouseY = 0;
	this.dragValid = false;
	this.dragging = false;
	this.lastValidX = 0;
	this.lastValidY = 0;
	this.variableTool = 8;
	
	this.trapSize = [ [3, 3], [12, 27], [12, 15], [12, 25], [15, 27], [12, 27], [17, 27], [13, 25], [8, 27], [5, 21], [15, 27] ];
	this.explosionListeners = [];
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
		this.currentToolIndex = 5;	// gun selected
		this.currentTool = 5;	// gun selected
		this.predators = [];
		this.lastExplosionTime = -999;	// used for rendering only
		this.draggedTrap = -1;	// trap being dragged (mouse down) in the playfield
		this.trapUnderMouse = -1;
		this.shotgunReloadTime = 0;
		this.levelIndex = index;

		var level = this.loader.getLevel(index); // allLevels[Math.min(9, Math.max(0, index))];
		this.variableTool = [8, 9, 10][Math.floor(index/15)];
		
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
			this.createTrap(level[5][i], level[5][i+1], level[5][i+2]);		
		}
		this.playField.initFromDescription(level[6]);
		this.strategy.clear(this.traps);
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
			this.predators[i].move(this.timer, scenery, this.strategy);
			// avoid gun aim, even when reloading
			this.predators[i].useShield(this.controls.worldX, this.controls.mouseY, this.currentTool == 5 && this.draggedTrap == -1);
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
					// reset the blocker timer to let it know it actually blocked another weasel
					// and prevent it from resuming walking too soon
					// keep the low 7 bits constant as they are used by the animation
					this.predators[j].timer = this.predators[j].timer & 127; 
				}
			}
		}
		this.crittersFragged = fraggedCount; // atomic change : temp variable prevents concurrent access issues (for display)
		this.crittersInside = this.predators.length-fraggedCount - this.crittersExited;
		this.animateTraps();
		this.strategy.fillDirectionsTable();
		this.strategy.fillDirectionsTable();
		if ((this.timer&1023)==0)
		{	// every 40 seconds, reconsider the strategy, as some parts of the scenery may have changed / been destroyed
			this.strategy.resetDirectionsTable(this.traps);
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
						this.animateBalloonStand(trap);
						break;
					case 6 : 
						this.animateExit(trap);
						break;
					case 7 :
						this.animateEntrance(trap);
						break;
					case 8 :
						this.animateCannonTower(trap);
						break;
					case 9 :
						if (this.animateDynamite(trap))
						{	// landmine blown
							this.lastExplosionTime = this.timer;
							this.traps.splice(i, 1);
							if (this.draggedTrap>=i) {
								--this.draggedTrap;
							}
							--i;
						}
						break;
					case 10 :
						this.animateBuildingBlock(trap);
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
			this.blowExplosives(trap.x, trap.y, 30, 50, 50);
			return true;
		} else {	
			this.applyGravity(trap);
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
	 *  - lights dynamite if approached
	 */
	animateFlamethrower : function(trap)
	{
		for (var j=0; j<this.predators.length; ++j)
		{
			if ( Math.abs(trap.y - 6 - this.predators[j].y) < 8
			   && Math.abs(trap.x + 25*trap.dir - this.predators[j].x) < 15
			   && this.predators[j].activity != 7)
			{
				this.predators[j].wound(100 / ( 5 + Math.abs(this.predators[j].x - trap.x - 25*trap.dir)), this.timer);
			}
		}
		// try to find dynamite nearby
		// test duplicated from the one in animateDynamite() as the latter method is not called if the dynamite is dragged
		// yet it should ignite if dragged next to the firethrower
		for (var i=0; i<this.traps.length; ++i) {
			var otherTrap = this.traps[i];
			if (otherTrap.type == 9 // dynamite
				&& Math.abs(otherTrap.y - 13 - trap.y) < 5
				&& Math.abs(otherTrap.x - 20*trap.dir - trap.x) < 20
				&& otherTrap.timer == 0)
			{
				otherTrap.timer = 50; // ignited !
			}
		}
		
	},
	
	/**
	 * Effect for cannon tower
	 * Shoot the critter with the lowest life level in range
	 * @param trap dynamite instance in this.traps[]
	 */
	animateCannonTower : function(trap)
	{
		this.applyGravity(trap);
		var fireRate = 25;
		var damage = 25;
		if (trap.timer >= fireRate)
		{	// find a new target : locate the one in range with the lowest life level
			trap.timer = 0;
			trap.hitTime = -1;
			trap.targetCritter = -1;
			var minLife = 110;
			for (var j=0; j<this.predators.length; ++j)
			{
				var target = this.predators[j];
				var dist2 = Math.pow(trap.y - 6 - target.y, 2) + Math.pow(trap.x - target.x, 2);
				if (dist2 < 1600 && target.activity > -1) // in range and alive
				{
					if (target.life < minLife)
					{
						minLife = target.life;
						trap.targetCritter = j;
						trap.hitTime = Math.max(2, Math.ceil(Math.sqrt(dist2)/3));
					}
				}
			}
			trap.timer = 0;
		}

		if (trap.timer<=trap.hitTime && trap.targetCritter > -1)
		{
			var target = this.predators[trap.targetCritter];
			var dt = trap.timer/trap.hitTime;
			trap.pelletX = trap.x*(1-dt)+target.x*dt;
			trap.pelletY = (trap.y-13)*(1-dt)+(target.y-6)*dt;
			if (trap.timer==trap.hitTime)
			{
				target.wound(damage, this.timer);
				trap.targetCritter = -1;
			}
		}
		++trap.timer;
	},
	
	
	/**
	 * Effect for dynamite :
	 *  - while unlit, nothing happens
	 *  - gets lit upon approaching flamethrower (starts countdown)
	 *  - explodes after countdown
	 * @param trap dynamite instance in this.traps[]
	 */
	animateDynamite : function(trap)
	{
		this.applyGravity(trap); // dynamite falls down
		if (trap.timer>0)	// -1 means unlit
		{
			--trap.timer;
			if (!trap.timer)
			{
				// BOOM
				this.blowExplosives(trap.x, trap.y, 50, 100, 75);
				return true;
			}
		} else {	
			// try to find a spark nearby
			for (var i=0; i<this.traps.length; ++i) {
				if (this.draggedTrap != i)	// trap being dragged under the mouse cursor is inactive
				{
					var otherTrap = this.traps[i];
					if (otherTrap.type == 2 // flamethrower
						&& Math.abs(otherTrap.y + 13 - trap.y) < 5
						&& Math.abs(otherTrap.x + 20*otherTrap.dir - trap.x) < 20)
					{
						trap.timer = 50; // ignited !
					}
				}
			}
		}
		return false;
	},
	
	/**
	 * Effect for building block : add to the scenery
	 * Cannot be removed
	 */
	animateBuildingBlock : function(trap)
	{
	},
	
	/**
	 * Effect for exit : critter leaves the play area
	 * May be a defeat condition
	 */
	animateExit : function(trap)
	{
		this.applyGravity(trap);
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
				this.predators[j].timer = 0;
			}
		}
	},
	
	/**
	 * Initiate an explosion (landmine, dynamite, ...)
	 * @param x x-coordinate of the center of the explosion
	 * @param y y-coordinate of the center of the explosion
	 * @param holeRadius radius, in pixels, of the hole dug
	 * @param damage maximal damage sustained (at the epicenter)
	 * @param strength strength of the blow, determining the speed to send critters flying
	 */
	blowExplosives : function(x, y, holeRadius, damage, strength)
	{
		this.playField.explode(x, y, holeRadius);
		for (var j=0; j<this.predators.length; ++j)
		{
			var dist2 = Math.pow(x - this.predators[j].x, 2) + Math.pow(y - this.predators[j].y + 6, 2);
			if (dist2<damage*12) {
				this.predators[j].sendFlying(strength*(this.predators[j].x-x)/dist2, strength*(-6+this.predators[j].y-y)/dist2);
				this.predators[j].wound(damage*10 / (10 + dist2), this.timer);	// at epicenter, less damage further
			}
		}
		this.soundManager.playExplosion();
		for (var i=0; i<this.explosionListeners.length; ++i)
		{
			this.explosionListeners[i].notifyExplosion(x, y, holeRadius, strength);
		}
	},
	
	/**
	 * Let a trap fall until it reaches the ground (or something to stand on)
	 * @param trap Trap item, usually landmine or dynamite
	 */
	applyGravity : function(trap)
	{
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
			this.currentToolIndex = this.highlightedTool;
			this.currentTool = (this.currentToolIndex == 4 ? this.variableTool : this.currentToolIndex);
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
					if (this.trapUnderMouse>-1 && this.canMoveTrap(this.traps[this.trapUnderMouse].type)) {
						// click over a trap, grab it
						this.draggedTrap = this.trapUnderMouse;
						this.dragStartMouseX = this.controls.worldX;
						this.dragStartMouseY = this.controls.mouseY;
						this.dragStartObjectX = this.traps[this.draggedTrap].x;
						this.dragStartObjectY = this.traps[this.draggedTrap].y;
						
						// dragged traps are no longer considered a hazard (flame is stopped)
						this.strategy.removeHazard(this.traps[this.draggedTrap]);
					} 
					else if (this.trapUnderMouse == -1)
					{	// click in an empty area, use the current tool
						if (this.currentTool == 5) 
						{	// shotgun
							if (!this.shotgunReloadTime)
							{
								this.shootAt(this.controls.worldX, this.controls.mouseY);
								this.controls.acknowledgeMouseClick();
							}
						} else {
							if (this.currentToolIndex>-1 && this.tools[this.currentToolIndex]>0)
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
					} else {
						if (!this.dragValid)
						{	// if dropping onto an invalid location, revert to the last valid coordinates
							this.traps[this.draggedTrap].x = this.lastValidX;
							this.traps[this.draggedTrap].y = this.lastValidY;
						}
					}
					// trap was removed from hazard list upon dragging (even if ony turning it around), restore it
					this.strategy.addHazard(this.traps[this.draggedTrap]);
						
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
						this.createTrap(this.currentTool, this.controls.worldX, this.controls.mouseY);		
						--this.tools[this.currentToolIndex];
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
					if (this.traps[this.draggedTrap].type == 6)
					{
						// exits cannot be returned to pool. Move them back to their original location
						this.traps[this.draggedTrap].x = this.dragStartObjectX;
						this.traps[this.draggedTrap].y = this.dragStartObjectY;
						
					} else {
						this.removeTrap(this.draggedTrap);
					}
				}	// other possible value is -2, meaning trap creation. Returning it to the storage does nothing.
				this.draggedTrap = -1;
			}
		}
	},
	
	/**
	 * Identifies whether there is already a trap under the mouse (even one that cannot be moved)
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
			if (	x>trap.x-w-distance && x<trap.x+w+distance
				&&	y>trap.y-h-distance && y<trap.y+distance)
			{
				return i;
			}
		}
		return -1; // no match
	},
	
	/**
	 * Returns whether a trap can be dragged and moved or not
	 * True for mine(0), fan(1), flamethrower(2), balloons(3) and dynamite(9)
	 * True for exit(6) on level 30
	 */
	canMoveTrap : function(type)
	{
		return (type>-1 && type<4)||(type==9)||(type==6&&this.levelIndex>=29);
	},
	
	/**
	 * Tests whether a trap can be placed at the given coordinates
	 * False usually means that the playfield is blocking
	 * Called by the mouse handler to determine whether a player action is allowed or not
	 * @param type Trap type index, as in tools (0=mine, 1=fan,2=flamethrower, 3=balloon, ...)
	 * @param x X-coordinate of the trap center in playfield
	 * @param y Y-coordinate of the trap bottom in playfield
	 * @return true if trap can be added, false otherwise
	 */
	canPlaceTrapAt : function(type, x, y)
	{
		return true;
	},
	
	/**
	 * Adds a trap to the trap list (this.traps)
	 * then records it into the critter strategy as well
	 * @param type trap type (0=mine, 1=fan,2=flamethrower, 3=balloon, ...)
	 * @param x X-coordinate of the trap center in playfield
	 * @param y Y-coordinate of the trap bottom in playfield
	 */
	createTrap : function(type, x, y)
	{
		var newTrap = { type : type,
						x : x,
						y : y,
						speedX : 0,
						speedY : 0,
						dir : 1,	// facing right
						timer : -1,	// unlit (dynamite))
					  };
		this.traps.push(newTrap);
		this.strategy.addHazard(newTrap);
	},
	
	/**
	 * Delete a trap and return it into tool storage
	 * Erases it from the critter strategy as well
	 */
	removeTrap : function(trapIndex)
	{
		++this.tools[this.traps[trapIndex].type];
		this.strategy.removeHazard(this.traps[trapIndex]);
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
		return this.fragTarget
	      ? this.timer >= this.totalTime || this.crittersWaitingAtSource + this.crittersInside + this.crittersFragged < this.fragTarget
		  : this.crittersExited > 0;
	},

	/** 
	 * Add a listener to be notified of explosions
	 */
	addExplosionListener : function(listener)
	{
		this.explosionListeners.push(listener);
	}
	
}
