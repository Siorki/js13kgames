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
						//6 flying, 7 scorched freefall, 8 exiting, 9 drowning, 10 digging sideways, 11 digging down
	this.life = 100;
	this.fallHeight = 0;
	this.timer = 0;	// before end of current activity
	this.speedX = 0;
	this.speedY = 0;
	this.shield = 0; // shield height. 0 = hidden, 9 = completely raised
}


Critter.prototype = {

	/**
	 * Move the critter for one frame of animation
	 * @param scenery background to test for collisions
	 * @param strategy array of directions to the nearest exit
	 */
	move : function(scenery, strategy)
	{
		this.life = Math.max(this.life, 0);
		if (this.y >= scenery.height-1 && this.speedY>=0 && this.activity>-1) {
			this.activity = 9;	// drowning in water at the bottom of the playfield
		}
		switch (this.activity)
		{
			case 0 : 
			case 1 : 
				this.moveFaller(scenery, strategy);
				if (this.life<=0) {	// test for death only upon reaching ground, not in flight
					this.activity = -1;
				}
				break;
			case 2 : 
				this.moveParachutist(scenery);
				break;
			case 4 : 
				this.moveBuilder(scenery);
				break;
			case 5 : 
				this.moveBalloonner(scenery);
				break;
			case 6 :
				this.moveFlyer(scenery);
				break;
			case 7 :
				this.moveToast(scenery);
				break;
			case 9 :
				this.life -= 2;
				if (this.life<=0) {	//drowned
					this.activity = -1;
				}				
				break;
/*				
			case 10 : 
				this.digSideways(scenery);
				break;
			case 11 : 
				this.digDown(scenery);
				break;
			default :
*/			

		}
		++this.timer;
	},
	
	/**
	 * Private method : let a critter walk, no freefall detection
	 * @param scenery background to test for collisions
	 * @param distance number of pixels for the motion
	 * @param strategy array of directions to the nearest exit
	 */
	moveWalker : function(scenery, distance, strategy)
	{
		// if the next move would cause the critter to fall
		if (!scenery.intersectBox(this.x-this.dir, this.y+1, 7, 5))
		{	
			var directions = strategy[this.x>>5][this.y>>5];
			
			// if it is dangerously close to water already, or the exit is not that way
			// right =1, bottom = 2, left = 4
			var rightWay = directions & (1<<(1-this.dir));
			if (this.y>240 ||(directions !=0 && (directions&2)==0))
			{	
				if (rightWay)	
				{	// exit is in the direction the critter is facing, but it is not down
					this.activity = 4; // builder
					this.timer = 0;
				} else { // critter is heading away from the exit
					this.activity = 3; // blocker
				}
				return;
			}
		}
		while (distance-- > 0) {
			if (scenery.intersectBox(this.x+3*this.dir, this.y-1, 1, 2))
			{	// minor obstacle, attempt to climb
				this.y-=3;
			}
			if (scenery.intersectBox(this.x+3*this.dir, this.y-11, 1, 12))
			{	// obstacle hit : change direction
				this.dir = -this.dir;
			} else {
				this.x += this.dir;
				this.fall(scenery, 3);
			}
		}
		this.speedX = this.dir;
	},
	
	/**
	 * Private method : move a critter which is currently walking or in freefall
	 * @param scenery background to test for collisions
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
			this.x+=2*this.dir;
			if (scenery.intersectBox(this.x+5*this.dir, this.y-10, 10, 1))
			{
				this.dir *= -1;
				this.activity = 0; // blocked : turn back
			}
			scenery.addStairs(this.x, this.y, this.dir);
		}
		if (this.timer > 200) {
			this.activity = 0; // walker
		}
	},
	
	/**
	 * Private method : move a critter which is holding a balloon
	 * @param scenery background to test for collisions
	 */
	moveBalloonner : function(scenery)
	{
		if (this.y<20 // reaching screen top
			|| scenery.intersectBox(this.x-3*this.dir, this.y-10, 7, 10)) // hitting something
		{	// let go the balloon / stop climbing
			this.activity = 1; // freefall
		} 
		else
		{
			--this.y;
			this.x += this.speedX;
		}

	},
	
	/**
	 * Private method : move a critter which is flying around
	 * @param scenery background to test for collisions
	 */
	moveFlyer : function(scenery)
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
				this.life-=Math.max(0, 2*this.speedY+.05*this.speedX-50);
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
	}
	
}
