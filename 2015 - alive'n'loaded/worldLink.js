/**
 * Interface between the local World and the server.
 * It acts as a high-level controller :
 *   - it sends the current player's actions to the server (as requests)
 *   - it receives all action results from the server and cascades them to the local World
 * @constructor
 */
function WorldLink(controls, world)
{
	this.controls = controls;
	this.world = world;	

	//this.errorMessageListeners = [];
	
	this.logs = [];
	this.availableCharacters = [false, false, false, false, false];
	this.showResults = false;
}

WorldLink.prototype = {

	/**
	 * Uplink : connect the game server and join a game
	 * Use both for a game in progress (if the player closed his/her browser while playing)
	 * and to start a new game.
	 */
	connectToServer : function() {
		this.socket = io(document.location.href);
		this.socket['on']('cA', this.notifyCharactersAvailable.bind(this));
		this.socket['on']('eW', this.notifyEnterWorld.bind(this));
		this.socket['on']('cy', this.notifyNewCycle.bind(this));
		this.socket['on']('pM', this.notifyPlayerMoved.bind(this));
		this.socket['on']('r3', this.replyPlayerChangedRoom.bind(this));
		//this.socket.on('replyObjectExamined', this.replyObjectExamined.bind(this));
		this.socket['on']('n3', this.notifyPlayerChangedRoom.bind(this));
		this.socket['on']('rR', this.replyRoomAction.bind(this));
		this.socket['on']('n0', this.notifyObjectTaken.bind(this));
		this.socket['on']('nR', this.notifyRoomAction.bind(this));
		//this.socket.on('objectExamined', this.notifyObjectExamined.bind(this));
		this.socket['on']('n9', this.notifyTheftAttempt.bind(this));
		this.socket['on']('sp', this.notifySpeech.bind(this));
		this.socket['on']('ac', this.replyPlayerActivityChanged.bind(this));
		//this.socket.on('cantco', this.notifyCantComply.bind(this));
	},

	/** 
	 * Local : select a character
	 * (selection only, can be changed until it is validated)
	 * Unavailable characters can be selected too, but validation will not be possible
	 * @see validateCharacter
	 * @param characterId : id of the newly selected character in that game
	 */
	selectCharacter : function(characterId) {
		this.world.playerId = characterId;
	},
	
	/**
	 * Uplink : validate the choice of a character
	 * (once this is called there is no undo, you have to play the game
	 * with that character)
	 * Character id is not provided, it uses the selection member variable.
	 */
	validateCharacter : function() {
		if (this.availableCharacters[1+this.world.playerId]) {
			this.socket['emit']('chooseCharacter', this.world.playerId);
		}
	},
	
	/**
	 * Uplink : ask the server to move the player inside the room
	 * @param targetX (integer) room X coordinate of the destination
	 * @param targetY (integer) room Y coordinate of the destination
	 */
	movePlayerTo : function(targetX, targetY) {
		var targetOrientation = -1;
		// if the destination tile is occupied (by an object, a door, ...),
		// move to any tile right next to it, then rotate to face the target tile.
		if (!this.world.accessTree[targetX+2][targetY+2]) {
			var dx=[0,1,0,-1], dy=[1,0,-1,0];
			for (var i=0; i<4&&targetOrientation==-1; ++i) {
				if (this.world.accessTree[targetX+2+dx[i]][targetY+2+dy[i]]) {
					targetX += dx[i];
					targetY += dy[i];
					targetOrientation = i^2;
				}
			}
		}
		this.socket['emit']('move', targetX, targetY, targetOrientation);
	},	

	/**
	 * Uplink : generic entry point for all actions triggered by a button click
	 * on the selected object in the inventory
	 * (usually called from the DOM object's onclick() method
	 *
	 * @param actionId : global id of the action
	 */
	performInventoryAction : function(actionId) {
		if (this.world.actionCost[actionId] <= this.world.actionPoints) {	
			this.socket['emit']('action', actionId, false, this.world.selectedInInventory);
		}
	},
	
	/**
	 * Uplink : generic entry point for all actions triggered by a button click
	 * on an object in the room
	 * (usually called from the DOM object's onclick() method
	 *
	 * @param actionId : global id of the action
	 * @param itemId : id of the object in the current room
	 */
	performRoomAction : function(actionId, itemId) {
		if (this.world.actionCost[actionId] <= this.world.actionPoints
			&& (actionId || this.world.playerInventory.length<12)) {
			this.socket['emit']('action', actionId, true, itemId>=this.world.currentRoom.items.length?itemId-this.world.currentRoom.items.length:itemId);
			// deselect the item once the action is done
			this.world.setSelectedItem(-1);
			this.world.setHighlightedItem(-1);
		}
	},
	
	/**
	 * Uplink : send a message in the chat panel to all other players in the room
	 * 
	 * @param message
	 */
	speak : function(message) {
		this.socket['emit']('speak', message);
	},
	
	/**
	 * Uplink : the player changes his/her activity for the next round
	 */ 
	changeActivity : function(activity) {
		this.socket['emit']('cA', activity);
	},
	
	/**
	 * Downlink (indirect) : log an event
	 * to be displayed in the chat panel
	 * @param playerId id of the character doing the action
	 * @param eventType type of action performed / event happening
	 * @param itemId item related to the action, if any
	 * @param secondPlayerId other character involved, if any
	 * @param message raw text message (for speech event)
	 */
	logEvent : function(playerId, eventType, itemId, secondPlayerId, message) {
		this.logs.push([playerId, eventType, itemId, secondPlayerId, message, new Date()]);
	},
	
	/**
	 * Downlink : inform the client of the characters than can be chosen by the player
	 * (at character selection screen only)
	 * @param characters : array[3] of boolean, true if character can be selected, false otherwise
	 */
	notifyCharactersAvailable : function(characters) {
		this.availableCharacters = [false].concat(characters);
	},
	
	/**
	 * Downlink : start the game
	 * Used when the current player enters the game outside the temple
	 * @param roomContents : room contents
	 */
	notifyEnterWorld : function (roomContents) {
		this.world.setRoomContents(roomContents);
		this.world.lastCycleTime = this.world.startTime = new Date()*1;
		game.changeState(2); // TODO : find a clean way to perform this transition
	},

	
	/**
	 * Downlink : inform that a new cycle has started
	 * @param actionPoints : how many APs (hourglasses) the player now has
	 * @param activity : current activity of the player
	 * @param jolt : intensity of the jolt felt in the player's room
	 * @param blockedDoor : 0..3 id of the door blocked by the collapsed ceiling, -1 if none
	 * @param roomContents : room contents, doors have changed if the ceiling collapsed
	 */
	notifyNewCycle : function(actionPoints, activity, jolt, blockedDoor, roomContents) {
		this.world.actionPoints = actionPoints;
		this.world.currentActivity = activity;
		this.world.setRoomContents(roomContents);
		this.world.joltIntensity = jolt;
		this.world.lastFall = blockedDoor;
		if (jolt > 0) {	// log the earthquake, different messages depending on intensity
			this.logEvent(3, blockedDoor>-1?18:15+Math.floor(Math.min(2, jolt/10)), blockedDoor, 0, "");
		}
		this.world.lastCycleTime = new Date()*1;
		this.world.nextCycleTime = this.world.lastCycleTime+60000;
		this.showResults = (game.state==3);
	},
	
	/**
	 * Downlink : set the walking destination of a character inside a room
	 * @param playerId (0-n) id of the character to move
	 * @param targetX (integer) room X coordinate of the destination
	 * @param targetY (integer) room Y coordinate of the destination
	 * @param targetOrientation : 0..3 orientation upon arrival, -1 means any
	 */
	notifyPlayerMoved : function(playerId, targetX, targetY, targetOrientation) {
		this.world.setPlayerDestination(playerId, targetX, targetY, targetOrientation);
	},
	
	/**
	 * Downlink : another character moved into the room or out of it
	 * @param playerId (0-n) id of the character moving
	 * @param enter : (boolean) true if entering, false if leaving
	 * @param roomId (integer) index of the new room 
	 * @param door : 0..3 index of the door used to enter / leave
	 * @param x : x coordinate of the player in the new room
	 * @param y : y coordinate of the player in the new room
	 */
	notifyPlayerChangedRoom : function(playerId, enter, roomId, door, x, y) {
		this.logEvent(playerId, enter?14:3, door, 0, "");
		this.world.players[playerId].room = roomId;
		this.world.players[playerId].targetDistance = 0;
		this.world.players[playerId].motionPath = [];
		this.world.players[playerId].x = x;
		this.world.players[playerId].y = y;
		this.world.players[playerId].type=enter?192+4*playerId:-1;
		this.world.recomputeClickAreas();	// avoid ghosts when players leave the room
	},

	/**
	 * Downlink : current player changed room
	 * @param door : 0..3 index of the door used to enter / leave
	 * @param roomContents : contents of the room after the action
	 * @param playersCoord : array containing the coordinates of other players, including the current player
	 * @param actionPoints : action points left 
	 */
	replyPlayerChangedRoom : function(door, roomContents, playersCoord, actionPoints) {
		this.world.setHighlightedItem (-1);
		this.world.setSelectedItem (-1);
		this.logEvent(this.world.playerId, 3, door, 0, "");
		var currentPlayer = this.world.players[this.world.playerId];
		currentPlayer.targetDistance = 0;
		currentPlayer.motionPath = [];
		for (var i=0;i<3;++i) {
			this.world.players[i].x = playersCoord[i].x;
			this.world.players[i].y = playersCoord[i].y;
			this.world.players[i].room = playersCoord[i].room;
			this.world.players[i].score = playersCoord[i].score;
		}
		for (var i=0;i<3;++i) {
			this.world.players[i].type=(this.world.players[i].room==currentPlayer.room)?192+4*i:-1;
		}
		this.world.setRoomContents(roomContents);
		this.world.setActionPoints(actionPoints);
		game.changeState(currentPlayer.room==1?3:2); // change to "end game" if exiting the temple (room 1)
		this.showResults = (game.state==3)
	},


	

	/**
	 * Downlink : another player performed a generic action in the room
	 * Logs the event and updates the room contents.
	 * Used for the following actions [actionId]
	 *  - [0] object taken (indirect call)
	 *  - [1] door opened
	 *  - [2] door closed
	 *  - [8] object dropped
	 * @param playerId (0-n) id of the acting character
	 * @param actionId (integer) index of the action to be logged
	 * @param objectType (integer) type of the object concerned with the action, if any
	 * @param roomContents : contents of the room after the action
	 */
	notifyRoomAction : function (playerId, actionId, objectType, roomContents) {
		this.logEvent(playerId, actionId, objectType, 0, "");
		this.world.setRoomContents(roomContents);
	 },

	/**
	 * Downlink : current player performed a generic action in the room
	 * Validates the request, logs the event, updates room contents, player inventory and action points
	 * Used for the following actions [actionId]
	 *  - [0] object taken
	 *  - [1] door opened
	 *  - [2] door closed
	 *  - [8] object dropped
	 *  - [9 to 13] backpack pick attempt (successful or not)
	 * @param actionId (integer) index of the action to be logged
	 * @param secondPlayerId  : id of the other player involved (victim of a theft for instance)
	 * @param clearSelection (integer flags) 1 to clear the room selection, 2 to clear the inventory selection
	 * @param objectType (integer) type of the object concerned with the action, if any
	 * @param roomContents : contents of the room after the action
	 * @param inventory : contents of the player's backpack after the action
	 * @param actionPoints : action points left
	 */
	replyRoomAction : function (actionId, secondPlayerId, clearSelection, objectType, roomContents, inventory, actionPoints) {
		if (clearSelection&1) {
			this.world.setHighlightedItem (-1);
			this.world.setSelectedItem (-1);
		}
		if (clearSelection&2) {
			this.world.selectItemInInventory (-1);
		}
		this.logEvent(this.world.playerId, actionId, objectType, secondPlayerId, "");
		this.world.setRoomContents(roomContents);
		this.world.setInventory(inventory);
		this.world.setActionPoints(actionPoints);
	},
	
	/**
	 * Downlink : another player grabbed an object
	 * @param playerId (0-n) id of the acting character
	 * @param objectId (integer) index of the object inside the room
	 * @param objectType (integer) type of the object inside the room
	 * @param roomContents : contents of the room after the action
	 */
	notifyObjectTaken : function(playerId, objectId, objectType, roomContents) {
		if (this.world.highlightedItem > objectId) {
			--this.world.highlightedItem;
		}
		if (this.world.selectedItem > objectId) {
			--this.world.selectedItem;
		}
		this.notifyRoomAction(playerId, 0, objectType, roomContents);
	},
		
	/**
	 * Downlink : another player examined an object
	 * @param playerId (0-n) id of the acting character
	 * @param objectType (integer) type of the object (31 for an object in the inventory, of unknown type)
	 */
	 /*
	notifyObjectExamined : function(playerId, objectType) {
		this.logEvent(playerId, 7, objectType, 0, "");
	},
	*/
	
	/**
	 * Downlink : current player examined an object
	 * @param requestId : unique id of the request
	 * @param objectType (integer) index of the object inside the room
	 * @param actionPoints : action points left
	 */
	 /*
	replyObjectExamined : function(requestId, objectType, actionPoints) {
		this.logEvent(this.world.playerId, 7, objectType, 0, "");
		this.world.setActionPoints(actionPoints);
	},
*/

	/**
	 * Downlink : another player attempted a theft and failed
	 * (successful snatches are not notified to other players)
	 * @param thiefId (0-n) id of the thief (acting character)
	 * @param outcome : 0 successful, 1 failed but other player didn't notice, 2 failed and other player noticed, 3 successful but empty bag
	 * @param victimId (0-n) id of the victim (target character)
	 * @param inventory : new inventory for the victim, 0 otherwise
 	 */
	notifyTheftAttempt : function(thiefId, outcome, victimId, inventory) {
		if (outcome==2) {
			this.logEvent(victimId, 13, 0, thiefId, "");
		}
		if (this.world.playerId == victimId) {
			this.world.setInventory(inventory);
		}
	},
	
	
	/**
	 * Downlink : another player is speaking
	 * @param playerId (0-n) id of the speaking character
	 * @param message what (s)he sait
	 */
	notifySpeech : function(playerId, message) {
		this.logEvent(playerId, -1, 0, 0, message);
	},
	
	/**
	 * Downlink : confirm an activity change
	 * @param activity (0..2) new activity starting next round
	 */
	replyPlayerActivityChanged : function(activity) {
		this.world.nextActivity = activity;
	},
	
	/**
	 * Downlink : the action cannot be performed
	 * (and should not even have been requested)
	 * @param error : error number, defines the message to display
	 *        0 : not enough action points
	 *        1 : cannot open, object is not a closed door
	 *        2 : cannot close, object is not an open door
	 * @param requestId : unique id of the request
	 * @param param : parameter for the error message, depends on the error
	 * @param actionPoints : action points left
	 */
	 /*
	notifyCantComply : function(error, requestId, param, actionPoints) {
		if (this.acknowledgeRequest(requestId)) {
			for (var i=0 ; i<this.errorMessageListeners.length; ++i) {
				this.errorMessageListeners[i].notifyErrorMessage (error, param);
			}
			this.world.setActionPoints(actionPoints);
		}
	},
	*/
	/**
	 * Internal function to detect whether the mouse cursor is
	 * inside a click area
	 * @param px : x coordinate of the point to check
	 * @param py : y coordinate of the point to check
	 * @param polygon : array [ x, y, ..] of points, first item is ignored
	 */
	pointInPolygon : function(px, py, polygon) {
		var nbVertices = (polygon.length-1)/2;
		var inside = false;
		
		var gx2 = polygon[2*nbVertices-1];
		var gy2 = polygon[2*nbVertices];

		for (var i=0; i < nbVertices; ++i) {
			var gx1 = polygon[2*i+1], gy1 = polygon[2*i+2];
				
			if ( (gy1 >= py ) != (gy2 >= py) ) {	// point Y between top and bottom of the line : possible intersection
				var slope = (gx2-gx1)/(gy2-gy1);
				var intersectX = slope*(py-gy1)+gx1;
				if (px<intersectX) {
					inside = !inside;
				}
			}
			gx2=gx1; gy2=gy1;
		}
		return inside;
	},
	
	
	/**
	 * Take into account user actions (mouse move / click)
	 * Called once each step.
	 */
	processControls : function() {
		
		// detect if the mouse cursor is over an ingame object
		// possible optimization : temple area bounding box
		// possible optimization : recompute on mouse move only
		var mouseOverItem = -1;
		for (var i=0; i<this.world.clickAreas.length && mouseOverItem<0; ++i) {
			if (this.pointInPolygon(this.controls.mouseX, this.controls.mouseY, this.world.clickAreas[i])) {
				mouseOverItem = this.world.clickAreas[i][0];
			}
		}
		this.world.setHighlightedItem(mouseOverItem);
	
		if (this.controls.mouseLeftButton) {
			this.controls.acknowledgeMouseClick();
			if (mouseOverItem!=this.world.selectedItem) {	// click on different item / object / player, or release
				this.world.setSelectedItem(mouseOverItem);
				if (mouseOverItem>-1) {	// move towards selected object
					var target = this.world.getItemOrPlayer(mouseOverItem);
					this.movePlayerTo(target.x, target.y);
				}
			} else {	// no object, click on the ground => move character
				if (controls.roomX>=0 && controls.roomX<this.world.roomSize
					&& controls.roomY>=0 && controls.roomY<this.world.roomSize) {
					this.movePlayerTo(Math.floor(controls.roomX), Math.floor(controls.roomY));
				}
			}
		}
		
		
	}

}