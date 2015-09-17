/**
 * Local representation of the ingame world (dungeon / temple, players)
 * - dungeon / temple rooms and content
 * - players : status, condition, backpack contents
 *
 * The World locally mirrors the information manager by the server
 * and is synchronized with it through the handler.
 * It only contains the information accessible to the player, as provided by the server.
 *
 * It holds the local selections (one of each can be selected at a time) :
 *  - item in the environment
 *  - item in the inventory
 *
 * @constructor
 */
function World()
{	
	this.playerId = -1;	// not assigned yet
	this.actionPoints = 0;
	this.currentRoom = { items : [], doors : [] };
	this.players = [];
	this.roomSize = 9;
	this.joltIntensity = 0;
	this.lastFall = -1;
	this.clickAreas = [];
	this.clickAreaShape = [ [-.5, 0.25, -.5, -5.25, 2.5, -6.75, 2.5, -1.25],
							[0, 0, 2, -1, 2, -3.5, 0, -4.5, -2, -3.5, -2, -1],
							[0, 0, 1, -0.5, 1, -1.5, 0, -2, -1, -1.5, -1, -0.5],
							[0, 0, 1, -0.5, 1, -5.5, 0, -6, -1, -5.5, -1, -0.5]
							];
	this.actionCost = [1, 1, 1, 1, 1, 1, 1, 1, 1, 2];
								
	this.highlightedItem = -1;
	this.selectedItem = -1;
	this.selectedInInventory = -1;
}


World.prototype = {

	/** 
	 * Initialize local representation of the world
	 */
	initialize : function() 
	{
		this.players = [ { room:0, x:2, y:0, orientation:0, targetDistance:0, animStep:0, motionPath:[], type:-1 },
						 { room:0, x:2, y:2, orientation:0, targetDistance:0, animStep:0, motionPath:[], type:-1 },
						 { room:0, x:2, y:2, orientation:0, targetDistance:0, animStep:0, motionPath:[], type:-1 },
						 { room:0, x:2, y:2, orientation:0, targetDistance:0, animStep:0, motionPath:[], type:-1 }];
		
		this.playerInventory = [];
		this.currentActivity = 0;
		this.nextActivity = 0;
		this.nextCycleTime = 0;
		this.startTime = 0;
		this.actionPoints = 0;
		this.pathTree = []; // paths to all tiles in the room
		this.accessTree = []; // array for all tiles : true if free, false if occupied
	},
	
	/**
	 * Lists all the allowed actions on an item or character in the room
	 * @param itemType : [0.255] identifier of the type of item
	 * @return a list of action identifiers
	 */
	getActionsByItem : function(itemType) {
		var nature = itemType>>2; // filter out the orientation
		if (nature > 47) { 	// other player
			return [9];		// rob
		}
		if (nature > 31) { 	// collectible
			return [0];		// take
		}
		if (nature > 11) { // pedestal, rocks or blocked door
			return [];
		}
		var actions = [[3], [1], [4], [1]][nature&3];
		if (nature>3 && ((nature&3)==0)) {	// open door, but not a hallway
			actions.push(2); // close the door
		}
		return actions;
	},
	
	setHighlightedItem : function(itemId) {
		this.highlightedItem = itemId;
	},

	/**
	 * Select an item in the environment (game window)
	 * @param itemId id of the item in the room
	 */
	setSelectedItem : function(itemId) {
		this.selectedItem = itemId;
	},
	
	/**
	 * Select an item in the inventory
	 * Does nothing if the inventory contains nothing at this offset
	 * @param itemIndex index of the item in the inventory
	 */
	selectItemInInventory : function(itemIndex) {
		if (this.playerInventory.length > itemIndex) {
			this.selectedInInventory = itemIndex;
		}
	},
	
	/**
	 * Update the room contents with information sent by the server
	 * Then recompute the onscreen areas sensitive to clicks
	 */
	setRoomContents : function(roomContents) {
		this.currentRoom = roomContents;
		this.recomputeClickAreas();
		this.computePaths(true, this.players[this.playerId].x, this.players[this.playerId].y, -2, -2);
	},

	/**
	 * Update the player inventory with information sent by the server
	 */	
	setInventory : function(inventory) {
		this.playerInventory = inventory;
	},
	
	/**
	 * Update the action points left for the current player
	 * with the value sent by the server
	 */
	setActionPoints : function(actionPoints) {
		this.actionPoints = actionPoints;
	},
	
	/**
	 * Return an element from the global array [items, players]
	 * @param id index in the array,
	 */
	getItemOrPlayer : function(id) {
		if (id < this.currentRoom.items.length) {
			return this.currentRoom.items[id];
		} else {
			return this.players[id-this.currentRoom.items.length];
		}
	},
	
	/**
	 * Set the walking destination of a character inside a room
	 * Computes the shortest path, then stores it into the player information
	 * to be unwinded at each animation step
	 * @param playerId (0-n) id of the character to move
	 * @param targetX (integer) room X coordinate of the destination
	 * @param targetY (integer) room Y coordinate of the destination
	 * @param targetOrientation : 0..3 orientation upon arrival, -1 means any
	 */
	setPlayerDestination : function(playerId, targetX, targetY, targetOrientation) {
		var player = this.players[playerId];
		
		// stop the current movement at the next tile
		player.targetDistance = player.targetDistance%5;
		var startX = player.x + player.targetDistance*.2*[0,1,0,-1][player.orientation];
		var startY = player.y + player.targetDistance*.2*[1,0,-1,0][player.orientation];
		
		var path = this.computePaths(playerId==this.playerId, startX, startY, targetX, targetY);
		player.motionPath = path.slice();
		if (targetOrientation>-1) { // rotate at the end
			player.motionPath.push(0, targetOrientation);
		}
	},
	
	/**
	 * Compute the shortest paths to move from one point to eveywhere else within the room
	 */
	computePaths: function(currentPlayer, startX, startY, targetX, targetY) {
		startX = Math.round(startX);
		startY = Math.round(startY);
		// the array contains a border of unreachable tiles
		// to avoid testing for boundaries within the algorithm
		var pathTree = [];
		var distanceTree = [];
		var accessTree = [];
		for (var i=-1; i<this.roomSize+3; ++i) {
			var pathLine = [], distanceLine = [], accessLine = [], nearestLine = [];
			for (var j=-1; j<this.roomSize+3; ++j) {
				pathLine.push([]);
				accessLine.push (i>0 && j>0 && i<=this.roomSize && j<=this.roomSize); // false for outside walls
				distanceLine.push(999);
				nearestLine.push([]);
			}
			pathTree.push(pathLine);
			distanceTree.push(distanceLine);
			accessTree.push(accessLine);
		}
		// flag all tiles containing an item as "do not walk"
		for (var i=0; i<this.currentRoom.items.length; ++i) {
			var item = this.currentRoom.items[i];
			accessTree[item.x+2][item.y+2] = false;
		}
		// flag all tiles containing another player as "do not walk"
		for (var i=0; i<this.players.length; ++i) {
			var player = this.players[i];
			if (player.room == this.players[this.playerId].room && i != this.playerId) {
				accessTree[player.x+2][player.y+2] = false;
			}
		}
		var motionQueue = [0, 2+startX, 2+startY, 0, 0, 2+startX, 2+startY, 1];
		while (motionQueue.length>0) {
			var d0=motionQueue.shift();
			var x=motionQueue.shift();
			var y=motionQueue.shift();
			var dir=motionQueue.shift();
			var path=pathTree[x][y];
			
			var d1=1;dir=(dir+1)&3;
			var dx=[0,1,0,-1][dir], dy=[1,0,-1,0][dir];
			while (accessTree[x+d1*dx][y+d1*dy]) {
				if (d0+d1 < distanceTree[x+d1*dx][y+d1*dy]) {
					distanceTree[x+d1*dx][y+d1*dy] = d0+d1;
					var newPath = path.slice(0); // shallow copy
					newPath.push(d1, dir);
					pathTree[x+d1*dx][y+d1*dy] = newPath;
					motionQueue.push(d0+d1, x+d1*dx, y+d1*dy, dir);
				}
				++d1;
			}
					
			d1=1; dx=-dx; dy=-dy; dir = dir^2;
			while (accessTree[x+d1*dx][y+d1*dy]) {
				if (d0+d1 < distanceTree[x+d1*dx][y+d1*dy]) {
					distanceTree[x+d1*dx][y+d1*dy] = d0+d1;
					var newPath = path.slice(0); // shallow copy
					newPath.push(d1, dir);
					pathTree[x+d1*dx][y+d1*dy] = newPath;
					motionQueue.push(d0+d1, x+d1*dx, y+d1*dy, dir);
				}
				++d1;
			}	
		}
		if (currentPlayer) {
			this.accessTree = accessTree;
			this.pathTree = pathTree;
		} 
		if (targetX>-2) {
			return pathTree[2+targetX][2+targetY];
		}
	},
	
	/**
	 * Performs one step of animation : move players
	 */
	animateItems : function()
	{
		var playerMoved = false;
		for (var i=0; i<this.players.length; ++i) {
			var player = this.players[i];
			if (player.targetDistance>0) {
				player.animStep=(1+player.animStep)%6;
				player.x+=.2*[0,1,0,-1][player.orientation];
				player.y+=.2*[1,0,-1,0][player.orientation];
				--player.targetDistance;
				playerMoved = true;
			} else if (player.motionPath.length > 0) {
				player.targetDistance = 5*player.motionPath.shift();
				player.orientation = player.motionPath.shift();
			} else {	// prevent drifting
				player.x = Math.round(player.x);
				player.y = Math.round(player.y);
				player.animStep=0;
			}
		}
		if (playerMoved) {
			this.recomputeClickAreas();
		}
	},
	
	/**
	 * Lists the clickable areas (polygons) for all the different objects,
	 * doors and characters in the room.
	 *
	 * The list will be used on mouse hover or click
	 */
	recomputeClickAreas : function()
	{
		var tileSize = 16;
		this.players[this.playerId].type=-1;
		this.clickAreas = [];
		var room = this.currentRoom;
		var clickableList = room.items.concat(this.players);
		for (var i=0; i<clickableList.length; ++i) {
			var item = clickableList[i];
			// screen coordinates of object
			var x0 = 2*tileSize*(item.x+item.y+1);
			var y0 = tileSize*(-item.x+item.y+1);
			if (item.type > -1) {
				var clickArea = [i];
				var shape = this.clickAreaShape[item.type>>6];
				var mirror = item.type&1?-1:1;
				var frontDoorOffset = (item.x==-1 || item.y == 9) ? -12 : 0;
				for (var vertex=0; vertex<shape.length; vertex+=2) {
					clickArea.push(x0+mirror*(shape[vertex]*tileSize+2*frontDoorOffset), y0+(shape[vertex+1]*tileSize+frontDoorOffset));
				}
				this.clickAreas.push(clickArea);
			}
		}
		this.clickAreas.sort(function(a,b) {return b[2]-a[2];});	// painter's algorithm - second element is y
	}
}
