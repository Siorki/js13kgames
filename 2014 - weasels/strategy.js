/**
 * Class defining the critter strategy (shared intelligence)
 *   - directions to the nearest exit (1 = right, 2 = bottom, 4 = left, 8 = top, 16 = here)
 *   - calls for actions
 * @constructor
 */
function Strategy(playField)
{
	this.playField = playField;
}

Strategy.prototype = {

	/**
	 * Reset the strategy to a clear level
	 */ 
	clear : function(traps)
	{
		this.callsForAction = []; // // requests from a weasel to get above an obstacle or so
		this.resetDirectionsTable(traps);
		this.hazards = [];
	},

	/**
	 * Clears the critter directions table
	 * then sets entries for all exits in level
	 * and initiates traversal algorithm
	 */
	resetDirectionsTable : function(traps)
	{
		this.directionsTable = [];
		this.directionsQueue = [];
		this.directionsSteps = [];
		for (var i=0; i<(this.playField.width>>5); ++i)
		{
			this.directionsTable.push([0,0,0,0,0,0,0,0].slice());	// playfield is 256 pixels = 8x32 high
			this.directionsSteps.push([-2,-2,-2,-2,-2,-2,-2,-2].slice());
		}
		for (var i=0; i<traps.length; ++i)
		{
			if (traps[i].type == 6) // exit
			{
				this.directionsTable[traps[i].x>>5][traps[i].y>>5] = 16;	// strategy : exit is here
				this.directionsSteps[traps[i].x>>5][traps[i].y>>5] = 0;
				this.directionsQueue.push({x:traps[i].x>>5, y:traps[i].y>>5});
			}
		}
	},
	
	/**
	 * Performs one step of the breadth-first traversal algorithm
	 * to identify the strategy (directions to follow in each square)
	 */
	fillDirectionsTable : function()
	{
		if (this.directionsQueue.length == 0)
		{
		} else {
			var square = this.directionsQueue.shift();
			var nextStep = 1+this.directionsSteps[square.x][square.y];
			if (square.x > 0)
			{
				if (this.directionsSteps[square.x-1][square.y]==-2)
				{
					this.directionsQueue.push({x:square.x-1, y:square.y});
					this.directionsSteps[square.x-1][square.y] = nextStep;
				}
				if (this.directionsSteps[square.x-1][square.y] == nextStep) 
				{
					this.directionsTable[square.x-1][square.y] |= 1; // right
				}
			}
			if (square.x+1 < (this.playField.width>>5))
			{
				if (this.directionsSteps[square.x+1][square.y]==-2)
				{
					this.directionsQueue.push({x:square.x+1, y:square.y});
					this.directionsSteps[square.x+1][square.y] = nextStep;
				}
				if (this.directionsSteps[square.x+1][square.y] == nextStep) 
				{
					this.directionsTable[square.x+1][square.y] |= 4; // left
				}
			}
			if (square.y > 0)
			{
				if (!this.directionsTable[square.x][square.y-1])
				{
					this.directionsQueue.push({x:square.x, y:square.y-1});
					this.directionsSteps[square.x][square.y-1] = nextStep;
				}
				if (this.directionsSteps[square.x][square.y-1] == nextStep) 
				{
					this.directionsTable[square.x][square.y-1] |= 2; // down
				}

			}
			if (square.y < 7)
			{
				if (!this.directionsTable[square.x][square.y+1])
				{
					this.directionsQueue.push({x:square.x, y:square.y+1});
					this.directionsSteps[square.x][square.y+1] = nextStep;
				}
				if (this.directionsSteps[square.x][square.y+1] == nextStep) 
				{
					this.directionsTable[square.x][square.y+1] |= 8; // up
				}
			}
		}
	},

	/**
	 * Returns the direction table entry at coordinates x and y, truncated if necessary
	 * @param x x-coordinate (in pixel space)
	 * @param y y-coordinate (in pixel space)
	 * @return or'ed flags 1 (right), 2 (bottom), 4 (left), 8 (top), 16 (here)
	 */
	getDirectionsAt : function(x,y)
	{
		x=Math.min(this.playField.width, Math.max(0, x));
		y=Math.min(this.playField.height, Math.max(0, y));
		return this.directionsTable[x>>5][y>>5];
	},
	 
	
	/**
	 * Creates a request to perform an action at the given coordinates
	 * Possible actions match critter activities.
	 * @param action action to perform : block (3), build (4), dig -sideways (10), dig down (11)
	 * @param x x-coordinate where the action should be performed
	 * @param y y-coordinate where the action should be performed
	 * @param direction where the critter should face to perform the action : left (-1), doesn't matter (0), right (1)
	 * @return true if the action was added to the request list, false if it already exists
	 */
	addCallForAction : function(action, x, y, direction, duration)
	{
		for (var i=0; i<this.callsForAction.length; ++i)
		{
			var call = this.callsForAction[i];
			if (call.action == action
				&& call.x == x
				&& call.y == y
				&& call.dir == direction)
			{
				return false;
			}
		}
		this.callsForAction.push({action:action, x:x, y:y, dir:direction, ack:false, duration:duration});
		return true;
	},
	
	/**
	 * Find an unanswered call for action at current critter location and direction
	 * If there is one, return the action, and flag the call for action as acknowledged
	 * @return array [action, duration], action is 0 if no call for action found, otherwise action identifier
	 */
	findCallForAction : function(x, y, direction)
	{
		for (var i=0; i<this.callsForAction.length; ++i)
		{
			var call = this.callsForAction[i];
			if (!call.ack
				&& (call.dir == direction || !direction)
				&& Math.abs(call.x - x) < 3
				&& Math.abs(call.y - y) < 6)
			{
				call.ack = true;
				return [call.action, call.duration];
			}
		}
		return [0, 0];
	},
	
	/**
	 * Add a trap to the hazard list
	 * Weasels will avoid the bounding rectangle of the trap
	 */
	addHazard : function(trap)
	{
		if (trap.type !=2) return;	// only flamethrowers are classified as hazards so far
		var trapLeft = (trap.dir==-1?trap.x-40:trap.x+10);
		this.hazards.push([trap.x, trap.y, trap.dir, trapLeft, trap.y-20, 30, 15]);
	},

	
	/**
	 * Remove a trap from the hazard list.
	 * The trap is identified by its coordinates
	 * @param trap the trap to remove
	 */
	removeHazard : function(trap)
	{
		if (trap.type !=2) return;	// only flamethrowers are classified as hazards so far
		for (var i=0; i<this.hazards.length; ++i)
		{
			if (this.hazards[i][0]==trap.x && this.hazards[i][1]==trap.y)
			{
				this.hazards.splice(i, 1);
				return;
			}
		}
	}
	 

}