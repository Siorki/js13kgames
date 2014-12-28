/**
 * Ingame world : scenery, objects and critters
 * @constructor
 */
function Critter(x, y, dir)
{
	this.x = x;
	this.y = y;
	this.dir = dir;	// -1 heading left, 1 heading right
	this.activity = 0;  // -1 dead, 0 walking, 1 freefall, 2 parachute, 3 blocking, 4 building stairs, 5 balloon,
						//6 flying, 7 scorched freefall, 8 exiting, 9 drowning, 10 digging sideways, 11 digging down, 12 burning
	this.life = 100;
	this.lastWound = -50;	// timer for the last time the critter was wounded (used to show/hide the life bar)
	this.fallHeight = 0;
	this.timer = 0;	// before end of current activity
	this.speedX = 0;
	this.speedY = 0;
	this.shield = 0; // shield height. 0 = hidden, 9 = completely raised
	this.timerEnd = 200;	// timeout for builders
}


Critter.prototype = {

	/**
	 * Move the critter for one frame of animation
	 * @param timer world timer
	 * @param scenery background to test for collisions
	 * @param strategy (Strategy class) definition of the critters' strategy (directions to exit, calls for action)
	 */
	move : function(timer, scenery, strategy)
	{
		++this.timer;
		this.life = Math.max(this.life, 0);
		if (this.y >= scenery.height-1 && this.speedY>=0 && this.activity>-1) {
			this.activity = 9;	// drowning in water at the bottom of the playfield
		}
		switch (this.activity)
		{
			case 0 : 
			case 1 : 
				this.moveFaller(scenery, strategy);
				break;
			case 2 : 
				this.moveParachutist(scenery);
				break;
			case 3 :
				this.moveBlocker(scenery);
				break;
			case 4 : 
				this.moveBuilder(scenery);
				break;
			case 5 : 
				this.moveBalloonner(scenery, strategy);
				break;
			case 6 :
				this.moveFlyer(timer, scenery);
				break;
			case 7 :
				this.moveToast(scenery);
				break;
			case 9 :
				this.wound(2, timer);
				break;
/*				
			case 10 : 
				this.digSideways(scenery);
				break;
			case 11 : 
				this.digDown(scenery);
				break;
*/			
			case 12 : 
				this.moveAshes(scenery);
				break;
			default :


		}
	},
	
	/**
	 * Private method : let a critter walk, no freefall detection
	 * @param scenery background to test for collisions
	 * @param distance number of pixels for the motion
	 * @param strategy critters' strategy (array of directions to the nearest exit, calls for action)
	 */
	moveWalker : function(scenery, distance, strategy)
	{
		// if the next move would cause the critter to fall
		// ground check at (-1 .. +5) if going right, (-5 .. +1) if going left
		if (!scenery.intersectBox(this.x+(this.dir==1?-1:-5), this.y+1, 7, 5))
		{	
			var directions = strategy.getDirectionsAt(this.x, this.y);
			
			// if it is dangerously close to water already
			if (this.y>240)
			{	
				this.activity = 4; // builder
				this.timer = 0;
			}
			if (directions !=0)
			{	
				// right =1, bottom = 2, left = 4
				var rightWay = ((directions & (1<<(1-this.dir))) || (directions&5)==0);
				if (rightWay)	
				{	// exit is in the direction the critter is facing
					if ((directions&2)==0) {
						// but not down : build upwards
						this.activity = 4; // builder
						this.timer = 0;
					}
					// else, right direction and down : jump off the cliff
				} else { // critter is heading away from the exit
					this.activity = 3; // blocker
					this.timer = 0;
					this.dir *= -1; // face incoming fellow critters
				}
			}
		}
		if (this.activity>1)
		{	// activity changed to something else than faller or walker
			return;
		}
		while (distance-- > 0) {
			if (scenery.intersectBox(this.x+3*this.dir, this.y-1, 1, 2))
			{	// minor obstacle, attempt to climb
				this.y-=3;
			}
			if (scenery.intersectBox(this.x+3*this.dir, this.y-11, 1, 12))
			{	// obstacle hit : 
				// request stairs if we can see the top and are in the right direction
				var directions = strategy.getDirectionsAt(this.x, this.y);
				var rightWay = directions & (1<<(1-this.dir));
				if (rightWay) {
					var cliffHeight = scenery.assessCliffHeight(this.x+6*this.dir, this.y);
					if (cliffHeight > 0)
					{
						strategy.addCallForAction(4, this.x-this.dir*(cliffHeight+3), this.y, this.dir, cliffHeight*5+10);
					}
				}
				// in all cases, change direction
				this.dir = -this.dir;
			} else {
				this.x += this.dir;
				this.fall(scenery, 3);
			}
		}
		this.speedX = this.dir;
		
		// if the critter is at the right place, travelling in the right direction
		// to answer a call for action, do so
		var newActivity = strategy.findCallForAction(this.x, this.y, this.dir);
		if (newActivity[0]) 
		{
			this.activity = newActivity[0];
			this.timer = 0;
			this.timerEnd = newActivity[1];
		}
		
		// if the critter is facing a hazard, react accordingly
		for (var i=0; this.activity < 2 && i<strategy.hazards.length; ++i)
		{
			var hazard = strategy.hazards[i];
			var dy = hazard[4]+hazard[6]-this.y;	// height above hazard bottom
			var dx = (this.dir == 1 ? hazard[3]-this.x : this.x-hazard[3]-hazard[5]);	// distance to hazard nearest side
			if (dx>0 && this.y>hazard[4] && dy>-10)	// heading into the hazardous rectangle
			{	
				// determine if the critter can still build stairs to get above the hazard
				// (difference between height to climb vs distance to trap) or it is already too close
				if (dx<hazard[6]-dy) { // too late
					this.activity = 3; // block
					this.timer = 0;
					this.dir *= -1; // face incoming fellow critters
				} else if (dx<hazard[6]-dy+6) { // in time for stairs
					this.activity = 4; // build stairs
					this.timer = 0;
					this.timerEnd = (hazard[5]+dx)*5; // build long enough to reach the other side
				}	// otherwise, the critter is still at a safe distance from the hazard
			}
		}
	},
	
	/**
	 * Private method : move a critter which is currently walking or in freefall
	 * @param scenery background to test for collisions
	 * @param strategy critters' survival strategy (directions to exit, calls for action, hazards)
	 */
	moveFaller : function(scenery, strategy)
	{
		if (this.fall(scenery, 4)> 0)
		{	// still falling
			if (this.fallHeight > 40)
			{
				this.activity = 2; // open parachute
			}
			else
			{
				this.activity = 1; // freefall
			}
		} 
		else
		{
			// fall broken.
			//this.life -= Math.max(0, this.fallHeight*2-50);
			var remainingSteps = 4-this.fallHeight;
			this.fallHeight = 0;
			this.activity = 0; // walker
			
			this.moveWalker (scenery, remainingSteps>>1, strategy);
		}

	},
	
	/**
	 * Private method : move a critter which has a parachute (an umbrella actually)
	 * @param scenery background to test for collisions
	 */
	moveParachutist : function(scenery)
	{
		this.x += this.speedX;
		this.speedX *= .9;
		if (this.fall(scenery, 1)== 0)
		{
			// ground reached !
			this.fallHeight = 0;
			this.activity = 0; // walker
			this.speedX = this.dir;
		}
	},

	/**
	 * Private method : move a critter which is blocking
	 * @param scenery background to test for collisions
	 */
	moveBlocker : function(scenery)
	{
		// not much to do as a blocker, they even get a cigarette pause (see animation)
		// If they haven't blocked anyone for 256 frames (10.25 seconds), they resume walking
		if (this.timer > 255)
		{
			this.activity = 0; // walker
			this.timer = 0;
		}
	},
	
	/**
	 * Private method : move a critter which is building stairs
	 * @param scenery background to test for collisions
	 */
	moveBuilder : function(scenery)
	{
		if (this.timer == 1)
		{
			scenery.addFloor(this.x, this.y, this.dir);
			scenery.addStairs(this.x, this.y, this.dir);
		}
		if ((this.timer%10)==0)
		{
			this.y -= 2;
			this.x += 2*this.dir;
			if (scenery.intersectBox(this.x+5*this.dir, this.y-10, 1, 1))
			{
				this.dir *= -1;
				this.activity = 0; // blocked : turn back
			} else {
				scenery.addStairs(this.x, this.y, this.dir);
			}
		}
		if (this.timer > this.timerEnd) {
			this.activity = 0; // walker
			this.timerEnd = 200;
			this.timer = 0;
		}
	},
	
	/**
	 * Private method : move a critter which is holding a balloon
	 * @param scenery background to test for collisions
	 * @param strategy critters' survival strategy (directions to exit, calls for action, hazards)
	 */
	moveBalloonner : function(scenery, strategy)
	{
		var directions = strategy.getDirectionsAt(this.x, this.y);
		if ((  this.y<20 // reaching screen top
			|| scenery.intersectBox(this.x-3, this.y-10, 7, 8) // hitting something
			|| directions == 2 // exit is straight down
			|| ((directions&1) && this.dir==-1) // travelling left and exit is on the right
			|| ((directions&4) && this.dir==1)) // travelling right and exit is on the left
			&& this.timer > 8) // only if far enough from the balloon stand
		{	
			// let go the balloon / stop climbing
			this.activity = 1; // freefall
		} 
		else
		{
			++this.timer;
			--this.y;
			this.x += this.speedX;
		}

	},
	
	/**
	 * Private method : move a critter which is flying around
	 * @param timer world timer to record wounds
	 * @param scenery background to test for collisions
	 */
	moveFlyer : function(timer, scenery)
	{
		this.speedY+=.3;
	
		// Test collisions every pixel 
		// To achieve this we get as many iterations as the biggest speed component, rounded up
		var steps = Math.ceil(Math.max(Math.abs(this.speedY), Math.abs(this.speedX)));
		for (var i=0 ; i<steps ; ++i)
		{
			if (scenery.intersectBox(this.x+(this.speedX<0?-4:4), this.y-11, 1, 12))
			{	// hit something (a cliff ? ) on the side : bounce slightly, keep going down (or up)
				this.speedX=-this.speedX/4;
			}
			if (this.speedY<0 && scenery.intersectBox(this.x+(this.speedX<0?-4:-2), this.y-12, 7, 1))
			{	// this something (the ceiling ?) from below : keep going left / right, start falling down
				this.speedY=0;
			}
			if (this.speedY>0 && scenery.intersectBox(this.x+(this.speedX<0?-4:-2), this.y+1, 7, 1))
			{	// hit the ground. Break the fall. Damage + resume walking
				this.wound(Math.max(0, 2*this.speedY+.05*this.speedX-50), timer);
				this.speedX=this.speedY=0;
				this.activity = 1;
			} 
			if (this.activity == 6)
			{	// still flying, did not reach the ground
				this.x+=this.speedX/steps;
				this.y+=this.speedY/steps;
			}
		}	
	},

	/**
	 * Private method : move (let fall) a critter which has been burned to death while flying
	 * @param scenery background to test for collisions
	 */
	moveToast : function(scenery)
	{
		if (!this.fall(scenery, 4)> 0)
		{	// fall broken
			this.activity = -1;
		}
	},
	
	/**
	 * Private method : move a critter which is digging sideways
	 * @param scenery background to test for collisions
	 */
	/*digSideways : function(scenery)
	{
		if ((this.timer&3)==0)
		{
			this.x+=this.dir;
			if (!scenery.intersectBox(this.x+5*this.dir, this.dir-11, 1, 12))
			{
				this.activity = 0; // nothing to dig, resume walking
			}
			scenery.explode(this.x, this.y-6, 7);
		}
	},*/
	
	/**
	 * Private method : move a critter which is digging down
	 * @param scenery background to test for collisions
	 */
	/*digDown : function(scenery)
	{
		if ((this.timer%5)==0)
		{
			++this.y;
			if (!scenery.intersectBox(this.x-2, this.y+1, 5, 1))
			{
				this.activity = 1; // nothing to dig below : fall down
			}
			scenery.explode(this.x, this.y-6, 6);
		}
	},*/
	
	
	/**
	 * Private method : move (let fall) a critter which is dead on the ground
	 * @param scenery background to test for collisions
	 */
	moveAshes : function(scenery)
	{
		if (this.timer > 9)
		{	// ashes collapsed
			this.activity = -1;
		}
	},
	
	
	/**
	 * Private method : attempt to have the critter fall down, independently of its current activity
	 * Updates the member variable fallHeight to match the height since the very beginning of the fall.
	 * fallHeight is not reset to zero if the fall is broken 
	 * @param scenery background to test for collisions
	 * @param height maximum fall height, in pixels
	 * @return height actually fallen this round in pixels, zero if the ground was hit 
	 */
	fall : function(scenery, height)
	{
		var isFalling = true;
		var localFall = 0;
		while (isFalling && localFall<height)
		{
			if (scenery.intersectBox(this.x-3, this.y+1, 7, 1))
			{
				isFalling = false;
				localFall = 0;
			} 
			else
			{
				++this.fallHeight;
				++localFall;
				++this.y;
			}
		}
		return localFall;
	},
	
	/**
	 * Raise or lower the shield, depending on whether the shotgun is aimed at the critter or not
	 * This has a visual effect only, shield is not used for anything else
	 * @param aimX x position of the current tool aim
	 * @param aimY y position of the current tool aim
	 * @param gunActive turn if shotgun is active, and not dragging another tool
	 */
	useShield : function(aimX, aimY, gunActive)
	{
		// large bounding box, triggers even if the gun is aiming around the critter, not exactly at it
		if (gunActive && Math.abs(aimX-this.x) < 8 && Math.abs(aimY-this.y+8) < 16)
		{
			this.shield = Math.min(9, this.shield + 1);
		} else {
			this.shield = Math.max(0, this.shield - 1);
		}
	},
	
	/**
	 * Send the critter flying following an explosion
	 * Activity is changed to "flying"
	 * @param speedX initial speed along X axis, adds up to existing speed
	 * @param speedY initial speed along Y axis, adds up to existing speed
	 */
	sendFlying : function(speedX, speedY)
	{
		this.activity = 6;
		this.speedX = speedX;
		this.speedY = speedY;
	},
	
	/** 
	 * Inflict damage to a critter. Record the time of the wound (to show/hide the life bar) if the damage is nonzero.
	 * Change the activity if the critter was killed by the wound :
	 *   - walking(0), blocking(3), building(4), exiting(8), digging (10, 11)	 -> 12
	 *   - freefall(1), balloon(5), flying(6) -> 7 (scorched freefall, time set beyond parachute animation)
	 *   - parachute(2) -> 7 (burnt parachute, timer set to 0 to see parachute animation)
	 *   - drowning (9) -> -1 (dead)
	 *   - other values unchanged
	 * @param damage amount of life lost (initial value of 100)
	 * @param timer global world timer, to record the wound
	 */
	wound : function(damage, timer)
	{
		if (this.life > 0)
		{
			this.life -= damage;
			if (damage > 0) {
				this.lastWound = timer;
			}
		}
		if (this.life <= 0)
		{
			switch(this.activity)
			{
				case 0:
				case 3:
				case 4:
				case 8:
				case 10:
				case 11:
					this.activity=12;
					this.timer=0;
					break;
				case 1:
				case 5:
				case 6:
					this.timer=20;
					this.activity=7;
					break;
				case 2:
					this.timer=0;
					this.activity=7;
					break;
				case 9:
					this.activity=-1;
					break;
				default:
					break;
			}
		}
	}
	
}
