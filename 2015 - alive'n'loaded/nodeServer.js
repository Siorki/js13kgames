'use strict';

io = require('sandbox-io');


function createGame() {
	var id = 'g'+Math.random();
	games[id] = new Game;
	return id;
}

function charactersAvailable() {
	var result = [];
	var game = games[latestGameId];
	for (var i=0; i<game.players.length; ++i) {
		result.push(!game.players[i].player);
	}
	return result;
}

/**
 * Event handler for a new connection
 * Register the player to the waiting list and gives him or her the choice of characters
 */
io.on('connection', function(socket) {
	//log.debug('New connection', socket.id);

	waitingList[socket.id]=new Player(socket);
	socket.emit ('cA', charactersAvailable());
});

/**
 * New cycle for all started games. For each player :
 *  - validate activity change for each
 *  - gain action points (3 to 5 depending on activity)
 *  - inform client
 */
function newCycle() {
	for (var gameId in games) {
		var game = games[gameId];
		if (game.playerCount == 3 && game.timer>=0) {
			var targetRoom = -1, roomBehind = -1, targetDoor = -1;
			if (++game.timer>2) { // ceiling collapses and blocks a door
				targetRoom = Math.floor(4+Math.random()*16);
				targetDoor = Math.floor(Math.random()*4);
				var doorId = game.rooms[targetRoom].doors[targetDoor];
				//console.log ("Rockfall, room = "+targetRoom+" and door = "+targetDoor+", doorId = "+doorId);
				if (doorId != -1) {	// there is a door at the chosen location
					if (game.doors[doorId] != 12) {
						game.doors[doorId] = 12;
						game.rooms[targetRoom].items[targetDoor].type = 48+targetDoor;
						game.rooms[targetRoom].items.push({x:[4,8,4,0][targetDoor], y:[8,4,0,4][targetDoor], type:68+targetDoor}); // debris
						roomBehind = roomNextDoor(targetRoom, targetDoor);
						game.rooms[roomBehind].items[2^targetDoor].type = 48+(2^targetDoor);
						game.rooms[roomBehind].items.push({x:[4,0,4,8][targetDoor], y:[0,4,8,4][targetDoor], type:68+(2^targetDoor)}); // debris
					} else {
						targetRoom = -1;	// reset to avoid announcing a collapse 
					}
				}
			}
			for (var i=0; i<3; ++i) {
				game.players[i].activity = game.players[i].nextActivity;
				var apGain = Math.max(0, 5-game.players[i].activity-Math.max(0, Math.floor((game.players[i].inventory.length-1)/3)));
				game.players[i].actionPoints = Math.min(12, game.players[i].actionPoints+apGain);
				game.players[i].player.socket.emit('cy', game.players[i].actionPoints, game.players[i].activity, 10 /*game.timer*/,
					game.players[i].room == targetRoom ? targetDoor : (game.players[i].room == roomBehind ? 2^targetDoor : -1),
					game.rooms[game.players[i].room]);
				// if all players out or locked inside : set timer to -1
			}
		}
	}
	setTimeout (newCycle, 10000); // 1 cycle every 30 s
}


/**
 * Returns the index of the room behind a door.
 * No consistency check is performed
 * @param roomIndex (integer) : index of the current room
 * @param doorIndex (0..3) : index of the door inside the room
 * @return : index of the room behind the door
 */
function roomNextDoor(roomIndex, doorIndex) {
	var x=roomIndex&3, y=roomIndex>>2;
	x+=[0, 1, 0, -1][doorIndex];
	y+=[-1, 0, 1, 0][doorIndex];
	return y*4+x;
}

/**
 * @constructor
 */
function Game () {
	this.players = [ { room:0, x:0, y:2, orientation:0, actionPoints:2, inventory:[], activity:0, nextActivity:0, player:0 },
					 { room:0, x:2, y:2, orientation:0, actionPoints:2, inventory:[], activity:0, nextActivity:0, player:0 },
					 { room:0, x:4, y:2, orientation:0, actionPoints:2, inventory:[], activity:0, nextActivity:0, player:0 }
					];
	this.playerCount = 0;
	this.doors = [ ];
	this.rooms = [ ];
	this.timer = 0;
		
	/** @const */ var templeSize = 4;
	for (var i=0; i<2*templeSize*(templeSize+1); ++i) {
		this.doors.push(i&3?5:0);	// corridors and closed doors
	}
	for( var y=0; y<templeSize+1; ++y) {	
		for (var x=0; x<templeSize; ++x) {
			var room = { items : [], doors : [y<1||(y==1&&x!=1)?-1:8*y+x-4, y<1||x==templeSize-1?-1:8*y+x, (y<1&&x!=1)||y==templeSize?-1:8*y+x+4, y<1||x==0?-1:8*y+x-1] };
			for (var i=0; i<4; ++i) {
				room.items[i]= { type:room.doors[i]==-1?-1:this.doors[room.doors[i]]*4+i,
									x:[4,9,4,-1][i],
									y:[9,4,-1,4][i]
								};
			}
			// 1 semi-random item in each room
			if (y>0) {
				room.items.push ({ type:128+4*((x+y)%5), x: (x*y)&7, y:((8-x)*(2+y))&7 });
			}
			this.rooms.push(room);
		}
	}

}

Game.prototype = {

	/**
	 * Action : a player enters a new room
	 * @param playerId : id of the character
	 * @param direction : (0..3) index of the door in the current room, representing direction
	 */
	playerEntersRoom : function(playerId, direction) {
		var activePlayer = this.players[playerId];
		--activePlayer.actionPoints;
		var formerRoom = activePlayer.room;
		activePlayer.room = roomNextDoor(activePlayer.room, direction);
		activePlayer.x = [4, 0, 4, 8][direction];
		activePlayer.y = [0, 4, 8, 4][direction];
		var playerCoords = [];
		for (var i=0; i<this.players.length;++i) {	// coordinate summary to be sent to active player
			var score = -1;
			if (this.players[i].room==1) {	// out of the temple
				score = 0;
				for (var j=0; j<this.players[i].inventory.length; ++j) {
					var type = this.players[i].inventory[j];
					score+=type<128?0:[1,2,3,3,5,0,0,0][(type>>2)&7];
				}
			}
			playerCoords.push( { x:this.players[i].x, y:this.players[i].y, room:this.players[i].room, score:score});
		}
		for (var i=0; i<this.players.length;++i) {
			if (i==playerId) {
				activePlayer.player.socket.emit('r3', direction, this.rooms[activePlayer.room], playerCoords, activePlayer.actionPoints);
			} else if (this.players[i].room == activePlayer.room) {
				// notify players in the new room of the arrival
				this.players[i].player.socket.emit('n3', playerId, true, activePlayer.room, direction^2, activePlayer.x, activePlayer.y);
			} else if (this.players[i].room == formerRoom) {
				this.players[i].player.socket.emit('n3', playerId, false, activePlayer.room, direction, activePlayer.x, activePlayer.y);				
			}
		}
	},
	
	/**
	 * Action : a player takes an object
	 * @param playerId : id of the player
	 * @param objectId : id of the object in the current room
	 */
	playerTakesObject : function(playerId, objectId) {
		var activePlayer = this.players[playerId];
		if (activePlayer.inventory.length>11) {	// inventory full
			//this.socket.emit('cantco', 3, 1, activePlayer.actionPoints);
			return;
		}
		--activePlayer.actionPoints;
		var room = this.rooms[activePlayer.room];
		var objectType = room.items[objectId].type;
		activePlayer.inventory.push(objectType);
		room.items.splice(objectId, 1);
		for (var i=0; i<this.players.length;++i) {
			if (i==playerId) {
				activePlayer.player.socket.emit('rR', 0, 0, 1, objectType>>2, room, activePlayer.inventory, activePlayer.actionPoints);
			} else if (this.players[i].room == activePlayer.room) {
				this.players[i].player.socket.emit('n0', playerId, objectId, objectType>>2, room);
			}
		}
	},

	/**
	 * Action : a player opens or closes a door
	 * @param playerId : id of the player
	 * @param direction : (0..3) index of the door in the current room, representing direction
	 * @param actionId : 1 for open, 2 for close
	 */
	playerOpensOrClosesDoor : function(playerId, direction, actionId) {
		var activePlayer = this.players[playerId];
		--activePlayer.actionPoints;
		var room = this.rooms[activePlayer.room];
		var doorIndex = room.doors[direction];
		var doorCondition = this.doors[doorIndex];
		if (doorCondition==6-actionId) {
			// open/close the door by changing the object type to matching open/closed door
			// for the entrance door, moves the cursor by one notch, another effort is needed to open it
			this.doors[doorIndex]+=[0,-1,1][actionId];
			var roomBehind = roomNextDoor(activePlayer.room, direction);
			this.rooms[roomBehind].items[2^direction].type = (2^direction)+4*this.doors[doorIndex];
			room.items[direction].type = direction+4*this.doors[doorIndex];
			for (var i=0; i<this.players.length;++i) {
				if (i==playerId) {
					activePlayer.player.socket.emit('rR', actionId, 0, 1, direction, room, activePlayer.inventory, activePlayer.actionPoints);
				} else if (this.players[i].room == activePlayer.room) {
					this.players[i].player.socket.emit ('nR', playerId, actionId, direction, room);
				} else if (this.players[i].room == roomBehind) {
					this.players[i].player.socket.emit ('nR', playerId, actionId, 2^direction, this.rooms[roomBehind]);
				}
			}
		} /*else {	// not a closed door
			activePlayer.player.socket.emit('cantco', 1, 0, this.players[playerId].actionPoints);
		}*/
	},
	
	/**
	 * Action : a player examines an object
	 * @param playerId : id of the player
	 * @param inRoom : true if object from the room, false if from inventory
	 * @param itemIndex : index of the object either in current room or inventory
	 */
	 /*
	playerExaminesObject : function(playerId, inRoom, itemIndex) {
		var activePlayer = this.players[playerId];
		--activePlayer.actionPoints;
		var objectType = inRoom ? this.rooms[activePlayer.room].items[itemIndex].type : activePlayer.inventory[itemIndex];
		for (var i=0; i<this.players.length;++i) {
			if (i==playerId) {
				activePlayer.player.socket.emit('replyObjectExamined', objectType>>2, activePlayer.actionPoints);
			} else if (this.players[i].room == activePlayer.room) {
				this.players[i].player.socket.emit ('objectExamined', playerId, inRoom?objectType>>2:31);
			}
		}
		
	},
	*/
	
	/**
	 * Action : a player drops an object from his/her inventory
	 * @param playerId : id of the player
	 * @param itemIndex : index of the object in the player's inventory
	 */
	playerDropsObject : function(playerId, itemIndex) {
		var activePlayer = this.players[playerId];
		--activePlayer.actionPoints;
		var room = this.rooms[activePlayer.room];
		var objectX = activePlayer.x + [0, 1, 0, -1][activePlayer.orientation];
		var objectY = activePlayer.y + [-1, 0, 1, 0][activePlayer.orientation];
		var objectType = activePlayer.inventory[itemIndex];
		room.items.push({x:objectX, y:objectY, type:objectType});
		activePlayer.inventory.splice(itemIndex, 1);
		for (var i=0; i<this.players.length;++i) {
			if (i==playerId) {
				activePlayer.player.socket.emit('rR', 8, 0, 2, objectType>>2, room, activePlayer.inventory, activePlayer.actionPoints);
			} else if (this.players[i].room == activePlayer.room) {
				this.players[i].player.socket.emit ('nR', playerId, 8, objectType>>2, room);
			}
		}
	},
	
	/**
	 * Action : a player attempts to pick another player's backpack
	 * Result depends on victim's activity and bonus to detect traps
	 * @param playerId : id of the acting player (the thief)
	 * @param victimId : id of the victim
	 */
	 playerPicksBackpack : function(playerId, victimId) {
		var activePlayer = this.players[playerId];
		var victim = this.players[victimId];
		activePlayer.actionPoints-=2;
		var failureChance = [.2, .5, .8][victim.activity];
		var die = Math.random();
		var result = (die<failureChance?(2*die<failureChance?2:1):0);
		var objectId = -1;
		if (!result) { // successful
			if (victim.inventory.length) {
				objectId = victim.inventory.splice(Math.floor(Math.random()*victim.inventory.length))[0];
				activePlayer.inventory.push(objectId);
			} else {
				result = 3; // successful, but empty backpack
			}
		}
		for (var i=0; i<this.players.length;++i) {
			if (i==playerId) {
				activePlayer.player.socket.emit('rR', 9+result, victimId, 1, objectId>>2, this.rooms[activePlayer.room], activePlayer.inventory, activePlayer.actionPoints);
			} else if (i==victimId) {
				this.players[i].player.socket.emit ('n9', playerId, result, victimId, victim.inventory);
			} else if (this.players[i].room == activePlayer.room) {
				this.players[i].player.socket.emit ('n9', playerId, result, victimId, 0);
			}
		}
	}
}

/**
 * @constructor
 */
function Player(socket) {
	this.socket = socket;
	socket.on ('chooseCharacter', this.chooseCharacter.bind(this));
}

Player.prototype = {

	/**
	 * A player in the waiting list validate his or her choice of character.
	 * Event handler for 'chooseCharacter'
	 * @param characterId : (0-3) id of the player in that game
	 */
	chooseCharacter : function(characterId) {
		//console.log("Socket "+this.socket.id+ "chooses character "+characterId+" in game "+latestGameId);
		var game = games[latestGameId];
		this.gameId = latestGameId;
		this.characterId = characterId;
		this.socket.join(latestGameId);
		this.socket.emit('eW', game.rooms[1]);
		for (var i=0; i<game.players.length; ++i) {	// inform the newcomer of players already waiting in front of the temple
			if (game.players[i].player) {
				this.socket.emit('n3', i, true, 1, 30, game.players[i].x, game.players[i].y);
			}
		}
		game.players[characterId].player = this;
		
		io.to(latestGameId).emit('n3', characterId, true, game.players[characterId].room=1, 30, game.players[characterId].x, game.players[characterId].y);
		
		delete waitingList[this.socket.id];
		this.socket.on('move', this.moveInsideRoom.bind(this));
		this.socket.on('speak', this.speak.bind(this));
		this.socket.on('cA', this.changeActivity.bind(this));
		
		if (++games[latestGameId].playerCount == 3) {
			// launch the game. All players start with 2 action points (and will get more each cycle)
			for (var i=0; i<3; ++i) {
				var player = game.players[i].player;
				player.socket.on('action', player.performAction.bind(player));		
				player.socket.emit('cy', 2, game.players[i].activity, 0, -1, game.rooms[1]);
			}
			
			// append a new (empty) game to the list
			latestGameId = createGame();
		}
		
		// inform all players connected that the character list changed
		for (var id in waitingList) {
			waitingList[id].socket.emit('cA', charactersAvailable());
		}
	},
	
	/**
	 * Action : a player moves inside the room
	 * Event handler for 'move'
	 * @param targetX : room X coordinate
	 * @param targetY : room Y coordinate
	 * @param targetOrientation : 0..3 orientation upon arrival, -1 means any
	 */
	moveInsideRoom : function(targetX, targetY, targetOrientation) {
		//console.log("game "+this.gameId+", player "+this.characterId+" moving to ("+targetX+","+targetY+")");
		var game = games[this.gameId];
		game.players[this.characterId].x = targetX;
		game.players[this.characterId].y = targetY;
		for (var i=0; i<game.players.length; ++i) {
			if (game.players[i].room == game.players[this.characterId].room) {
				game.players[i].player.socket.emit('pM', this.characterId, targetX, targetY, targetOrientation);
			}
		}
	},

	
	/**
	 * Generic entry point for all actions, performed both on the room and the inventory (click on an action button)
	 * Event handler for 'action'
	 * Checks that the player has enough action points to perform the action
	 * then triggers it.
	 * @param actionId : global id of the action
	 * @param inRoom : true if object/target is in the room (room index), false for inventory (inventory index)
	 * @param itemIndex : index of the object either in inventory or room
	 */
	performAction : function(actionId, inRoom, itemIndex) {
		var game = games[this.gameId];
		//console.log ("request "+requestId+" : player "+this.characterId+" with "+game.players[this.characterId].actionPoints+" :pa: attempted action "+actionId+" on item "+itemIndex);
		var actionPointsNeeded = [1, 1, 1, 1, 1, 1, 1, 1, 1, 2][actionId];
		if (game.players[this.characterId].actionPoints >= actionPointsNeeded) {
			switch (actionId) {
				case 0 : // take an object from the room
					game.playerTakesObject(this.characterId, itemIndex);
					break;
				case 1 : // open door
				case 2 : // close door
					game.playerOpensOrClosesDoor(this.characterId, itemIndex, actionId);
					break;
				case 3 : // walk through a door
					game.playerEntersRoom(this.characterId, itemIndex);
					break;
					/*
				case 4 : // unlock
					break;
				case 5 : // open cache
					break;
				case 6 : // close cache
					break;
				case 7 : // examine
					game.playerExaminesObject(this.characterId, inRoom, itemIndex);
					break;
					*/
				case 8 : // drop object
					game.playerDropsObject(this.characterId, itemIndex);
					break;
				case 9 : // rob player
					game.playerPicksBackpack(this.characterId, itemIndex);
					break;
			}
		} /*else { // not enough action points to perform the action
			this.socket.emit('cantco', 0, actionPointsNeeded, game.players[this.characterId].actionPoints);
		}*/

	},
	
	
	/**
	 * Action : a player speaks
	 * Event handler for 'speak'
	 * Send the speech to all other players (enven beyond the room)
	 * @param message : message
	 */
	speak : function(message) {
		io.to(this.gameId).emit('sp', this.characterId, message);
		/*
		var game = games[this.gameId];
		for (var i=0; i<this.players.length; ++i) {
			if (game.players[i].room == game.players[this.characterId].room) {
				game.players[i].player.socket.emit('sp', this.characterId, message);
			}
		}*/
	},
	
	/**
	 * Setting : a player changes his/her activity for the next turn
	 * Event handler for 'changeActivity'
	 * @param activity (0..2) : new activity, will be validated at turn change
	 */
	changeActivity : function(activity) {
		var game = games[this.gameId];
		game.players[this.characterId].nextActivity = activity;
		this.socket.emit('ac', activity);
	}

}

var games = {};
var latestGameId = createGame();
var waitingList = {};

// start the update loop
newCycle();