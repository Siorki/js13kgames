/**
 * @constructor
 */
 
function Renderer(game)
{
	this.game = game;
	this.world = game.world;
	this.overlayPanel = document.getElementById("t");
	this.playerPanel = document.getElementById("p");
	this.chatPanel = document.getElementById("h");
	this.activityPanel = document.getElementById("a");
	this.showActivityPanel = false;
	this.sceneryCanvas = document.getElementById("c");
	this.characterChoicePanel = document.getElementById("i");
	this.resultsPanel = document.getElementById("r");
	this.sceneryContext = this.sceneryCanvas.getContext("2d");
	this.tileSize = 16;
	
	// create a mirrored version of the sprite sheet
	this.spriteSheet = document.createElement("canvas");
	this.spriteSheet.width=640; //spriteImg.width*2;
	this.spriteSheet.height=560; // spriteImg.height;
	var bufferContext = this.spriteSheet.getContext('2d');
	
	var spriteImg = document.getElementById("s");	
	bufferContext.drawImage(spriteImg, 0, 0);
	bufferContext.scale(-1, 1);
	bufferContext.drawImage(spriteImg, 0, 0, 264, 161, -320*2, 0, 264, 161);	
	bufferContext.drawImage(spriteImg, 0, 208, 128, 352, -128*2, 208, 128, 352);
	bufferContext.scale(-1, 1);
	//document.body.appendChild(this.spriteSheet,null);
	
	this.chatPanelDocked = true;
	this.resizeWindow(false); // define the appropriate pixel zoom for the play area

	this.formerSelectedItem = -1;	// cache for overlay panel
	this.formerHighlightedItem = -1;
	
	var renderer = this;
	var actionHandler = this.game.worldLink;

	// show the activity panel when hovering over the current activity
	this.playerPanel.children[5].onmouseover = function () { 
		renderer.setActivityPanelShown(true); 
	}
	// hide it 
	this.activityPanel.onmouseleave = function () { 
		renderer.setActivityPanelShown(false); 
	}
	
	this.activityPanel.children[0].onclick = function() { 
		actionHandler.changeActivity(0); 
		renderer.setActivityPanelShown(false); 
	};
	this.activityPanel.children[1].onclick = function() { 
		actionHandler.changeActivity(1); 
		renderer.setActivityPanelShown(false); 
	};
	this.activityPanel.children[2].onclick = function() { 
		actionHandler.changeActivity(2); 
		renderer.setActivityPanelShown(false); 
	};
	
	// character selection screen : choose character
	this.characterChoicePanel.children[2].onmouseup = function() {
		actionHandler.selectCharacter(0);
	};
	this.characterChoicePanel.children[3].onmouseup = function() {
		actionHandler.selectCharacter(1);
	};
	this.characterChoicePanel.children[4].onmouseup = function() {
		actionHandler.selectCharacter(2);
	};

	//character selection screen : validate button
	this.characterChoicePanel.children[6].onmouseup = function() {
		actionHandler.validateCharacter();
	}
	
	// click on the top-right arrow : dock/undock the chat box
	document.getElementById("f").onclick = function() {
		renderer.resizeWindow(true);
	};
	
	// click on the results panel : hide it
	document.getElementById("r").onclick = function() {
		actionHandler.showResults = false;
	}
	
	this.itemNames = [ "Hallway",
						 "",
						 "",
						 "",
						 "Open door",
						 "Closed door",
						 "",
						 "",
						 "",
						 "",
						 "",
						 "",
						 "Blocked door",
						 "",
						 "",
						 "",
						 "",
						 "Rocks",
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 "outside world",
						 ,
						 "Clay cup",
						 "Metal cup",
						 "Chalice",
						 "Stone idol",
						 "Stone calendar",
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 ,
						 "",
						 "Steven",
						 "Ernesto",
						 "Marzena",
						 ""
					];
	this.actionNames = [ "Take",
						 "Open",
						 "Close",
						 "Walk through",
						 ,
						 ,
						 ,
						 ,
						 "Drop",
						 "Pick backpack"
					    ];

	this.conditionNames = [ "Active",
							"Cautious",
							"Vigilant"
						];
/*						
	this.errorMessages = [	"You need at least $1 ⌛ to perform this action.",
							"You cannot open this.",
							"You cannot close this."
						 ];
*/						 
	this.logMessages = [ " takes a $1",
						 " opens the $1",
						 " closes the $1",
						 " leaves the room towards the $1",
						 ,
						 ,
						 ,
						 ,
						 " drops a $1",
						 " successfully snatches a $1 from $2's backpack",
						 " tries to pick from $2's backpack without success",
						 " catches the attention of $2 trying to steal from $4 backpack",
						 " tries to grab from $2's backpack, only to find it empty",
						 " catches $2 red-handed in $3 backpack",
						 " enters from the $1",
						 " The ground quivers for a short instant, then becomes still again",
						 " A deep rumble rise from the ground as the stones start shaking",
						 " Thunder echoes through the room as the jolts from the ground bring you to your knees",
						 " A sudden quake causes the ceiling to collapse on the $1 side of the room"
						];
	this.logCount = 0;
	
}


Renderer.prototype = {
	

	/** 
	 * Handler for global window resize event, also called once at init time
	 * @param toggleDockedChat true to dock/undock the chat panel, false to resize only 
	 */
	resizeWindow : function(toggleDockedChat) {
		
		this.chatPanelDocked = this.chatPanelDocked ^ toggleDockedChat;
		var dx = Math.floor(Math.max(0, window.innerWidth-800)/3);
		this.windowLayout = [dx, 0, 240];
		this.resultsPanel.style.left = this.sceneryCanvas.style.left = this.chatPanel.style.left = dx+"px";
		this.activityPanel.style.left = this.playerPanel.style.left = (2*dx+576)+"px";
		this.chatPanel.style.top = (this.chatPanelDocked?400:160)+"px";
		this.chatPanel.style.width = (dx+736)+"px";
		this.chatPanel.style.height = window.innerHeight-(this.chatPanelDocked?400:160)+"px";
		this.game.layoutChanged(this.windowLayout);
		document.getElementById("f").innerHTML = this.chatPanelDocked?"▲":"▼";
	},
	
	
	
	/**
	 * Draw both scenery and overlay canvas 
	 */
	drawMain : function() {

		this.sceneryCanvas.style.display=this.playerPanel.style.display=this.activityPanel.style.display=this.game.state>1?"block":"none";
		this.resultsPanel.style.display=this.game.state==3?"block":"none";
		if (this.game.state<2) {
			this.overlayPanel.style.display="none";
		}
		this.characterChoicePanel.style.display=this.game.state==1?"block":"none";
				
		if (this.game.state == 1)
		{	// join game menu
			for (var i=0; i<3; ++i) {
				this.characterChoicePanel.children[i+2].setAttribute("class", (this.world.playerId==i?"selected":"")+(this.game.worldLink.availableCharacters[1+i]?"":" disabled"));
			}
			var canStart = this.game.worldLink.availableCharacters[1+this.world.playerId];
			this.characterChoicePanel.children[6].setAttribute("class", canStart?"":"disabled");
			this.characterChoicePanel.children[6].value = "Play "+(canStart ? "as "+this.itemNames[48+this.world.playerId]:"");
		}
		
		if (this.game.state >1) {	// playing/endgame		: draw the isometric game area
			this.drawChatBox();
			this.drawGameArea();
			this.drawOverlayPanel();
			this.drawPlayerPanel();
			this.drawActivityPanel();
		}
		
		if (this.game.state == 3) {
			this.drawResultsPanel();
		}
		
		//this.drawDebug();
	},
/*
	drawDebug : function()
	{
		this.sceneryContext.fillStyle="red";
		this.sceneryContext.fillText("Mouse at ("+this.game.controls.mouseX+","+this.game.controls.mouseY+") -> ("+Math.floor(this.game.controls.roomX)+","+Math.floor(this.game.controls.roomY)+")",20, 20);
		this.sceneryContext.fillText("P1 at ("+this.world.players[0].x+","+this.world.players[0].y+")", 20, 40);
		this.sceneryContext.fillText("Highlighted = "+this.world.highlightedItem+", selected = "+this.world.selectedItem, 20, 60);
		this.sceneryContext.strokeStyle = "red";
		this.sceneryContext.lineWidth = 1;
		this.sceneryContext.translate(0, this.windowLayout[2]);
		for (var j=0; j<this.world.clickAreas.length; ++j) {
			var polygon = this.world.clickAreas[j];
			this.sceneryContext.beginPath();
			for (var i=1; i<polygon.length; i+=2) {
				if (i==1) {
					this.sceneryContext.moveTo(polygon[i], polygon[i+1]);
				} else {
					this.sceneryContext.lineTo(polygon[i], polygon[i+1]);
				}
			}
			this.sceneryContext.lineTo(polygon[1], polygon[2]);
			this.sceneryContext.stroke();
		}
		this.sceneryContext.translate(0, -this.windowLayout[2]);
	},
	*/
	
	/**
	 * Display the chat box
	 */
	drawChatBox : function() 
	{
		var logs = this.game.worldLink.logs;
		while (this.logCount < logs.length) {
			var oneLog = logs[this.logCount];
			var time = Math.ceil((oneLog[5]-this.world.startTime)/1000)%86400;
			var seconds = time%60;
			var minutes = ((time-seconds)/60)%60;
			var hours = Math.floor(time/3600);
			var newLine = document.createElement("div");
			var message = "<div>"+(hours<10?"0":"")+hours+":"+(minutes<10?"0":"")+minutes+":"+(seconds<10?"0":"")+seconds+"</div><div>"+this.itemNames[48+oneLog[0]]+"</div>";
			if (oneLog[1]==-1) {
				message += "<div class='speech'>"+oneLog[4]+"</div>";
			} else {
				message += "<div>"+this.logMessages[oneLog[1]];
				var param = (oneLog[1]>0&&oneLog[1]<5)||oneLog[1]==18||(oneLog[1]==14&&oneLog[2]<4)?["south","east","north","west"][oneLog[2]]:this.itemNames[oneLog[2]];
				param +=oneLog[1]==1||oneLog[1]==2||oneLog[1]==4||(oneLog[1]==14&&oneLog[2]<4)?" door":"";
				message = message.replace("$1", param).replace("$2", this.itemNames[48+oneLog[3]]).replace("$3", oneLog[0]>1?"her":"his").replace("$4", oneLog[3]>1?"her":"his");;
			}
			newLine.innerHTML = message;
			this.chatPanel.children[1].firstChild.insertBefore(newLine, null);
			++this.logCount;
		}
	},
	
	
	/**
	 * Display the game area : isometric representation of the temple
	 * Sort by items, front to back, then display them in order
	 */
	drawGameArea : function() 
	{
		this.sceneryContext.fillStyle = "black";
		this.sceneryContext.fillRect(0, 0, 576, 512);
		
		var dt = (new Date() - this.game.world.lastCycleTime)/20;
		var jolt = Math.floor(Math.floor(this.game.world.joltIntensity*Math.exp(-dt/80))*Math.cos(dt));
		this.sceneryContext.translate(0, this.windowLayout[2]+jolt);
		var roomId = this.world.players[this.world.playerId].room;
		var room = this.world.currentRoom;
		this.drawRoomBackground(roomId>1, room.doors);
		var drawList = [];
		for (var i=0; i<room.items.length; ++i) {
			var z = -room.items[i].x+room.items[i].y;
			drawList.push([z, 0, room.items[i]]);
		}
		for (var i=0; i<this.world.players.length; ++i)	{
			var player = this.world.players[i];
			if (player.room == roomId) {
				var z = -player.x+player.y;
				drawList.push([z, 1, player, i]);
			}
		}
		drawList.sort(function(a,b) {return a[0]-b[0];});	// painter's algorithm
		for (var i=0; i<drawList.length; ++i) {
			var gfxElem = drawList[i];
			if (gfxElem[1]) {
				this.drawCharacter(gfxElem[3], gfxElem[2]);
			} else {
				this.drawRoomItem(gfxElem[2].type, gfxElem[2].x, gfxElem[2].y);
			}
		}
		this.sceneryContext.translate(0, -this.windowLayout[2]-jolt);
		
	},
	
	/**
	 * Inner rendering routine to display the game area
	 * Draw the room ground and walls
	 * @param inside : boolean, true if inside the temple, false if on the entrance
	 * @param doors : array[4] representing doors in current room, -1 if no door
	 */
	drawRoomBackground : function(inside, doors)
	{
		for (var i=0; i<18; ++i) {
			if (i<7 || i>10 || doors[2]<0) { // north wall
				this.sceneryContext.drawImage(this.spriteSheet, 0, 58, 16, 103, 16*i, -102-8*i, 16, 103);
			}
			if (inside && (i<7 || i>10 || doors[1]<0)) {	// east wall
				this.sceneryContext.drawImage(this.spriteSheet, 624, 58, 16, 103, 288+16*i, -238+8*i, 16, 103);
			}
			if (inside && (i<6 || i>11 || doors[0]<0)) { // south wall outline
				this.sceneryContext.drawImage(this.spriteSheet, 152, 58, 16, 103, 288+16*i, 42-8*i, 16, 103);
			}
			if (inside && (i<6 || i>11 || doors[3]<0)) {	// west wall outline
				this.sceneryContext.drawImage(this.spriteSheet, 452, 58, 16, 103, 16*i, -84+8*i, 16, 103);
			}
		}
		if (doors[2]>-1) {	// north door frame
			this.sceneryContext.drawImage(this.spriteSheet, 16, 0, 96, 153, 96, -200, 96, 153);
		}
		
		if (doors[1]>-1) {	// east door frame
			this.sceneryContext.drawImage(this.spriteSheet, 528, 0, 96, 153, 384, -200, 96, 153);
		}

		if (doors[0]>-1) {	// south door frame
			this.sceneryContext.drawImage(this.spriteSheet, 168, 0, 96, 153, 384, -56, 96, 153);
		}
		
		if (doors[3]>-1) {	// west door frame
			this.sceneryContext.drawImage(this.spriteSheet, 376, 0, 96, 153, 96, -56, 96, 153);
		}
		
		/*
		this.sceneryContext.strokeStyle = "yellow";
		this.sceneryContext.lineWidth = 3;
		this.sceneryContext.beginPath();
		this.sceneryContext.moveTo(0, 0);
		this.sceneryContext.lineTo(2*this.world.roomSize*this.tileSize, -this.world.roomSize*this.tileSize);
		this.sceneryContext.lineTo(4*this.world.roomSize*this.tileSize, 0);
		this.sceneryContext.lineTo(2*this.world.roomSize*this.tileSize, this.world.roomSize*this.tileSize);
		this.sceneryContext.lineTo(0, 0);
		this.sceneryContext.stroke();
		*/
		// highlight tile under mouse
		if (this.world.highlightedItem==-1
			&& this.game.controls.roomX>=0 && this.game.controls.roomX<this.world.roomSize
			&& this.game.controls.roomY>=0 && this.game.controls.roomY<this.world.roomSize)
		{
			var dx = 2*this.tileSize*(Math.floor(this.game.controls.roomX)+Math.floor(this.game.controls.roomY));
			var dy = this.tileSize*(-Math.floor(this.game.controls.roomX)+Math.floor(this.game.controls.roomY));
			this.sceneryContext.translate(dx, dy);
			
			this.sceneryContext.strokeStyle = "#884";
			this.sceneryContext.lineWidth = 2;
			this.sceneryContext.beginPath();
			this.sceneryContext.moveTo(0, 0);
			this.sceneryContext.lineTo(2*this.tileSize, -this.tileSize);
			this.sceneryContext.lineTo(4*this.tileSize, 0);
			this.sceneryContext.lineTo(2*this.tileSize, this.tileSize);
			this.sceneryContext.lineTo(0, 0);
			this.sceneryContext.stroke();
			this.sceneryContext.translate(-dx, -dy);
		}
		
	},
	
	/**
	 * Inner rendering routine to display the game area
	 * Draw one object within the room
	 */
	drawRoomItem : function(itemId, roomX, roomY)
	{
		var dx = 2*this.tileSize*(roomX+roomY+1);
		var dy = this.tileSize*(-roomX+roomY+1);
		// temporary drawing routine
		this.sceneryContext.save();
		this.sceneryContext.translate(dx, dy);
		var itemDir = itemId&3;
		var itemType = itemId>>2;
		if (itemId&1)  {
			this.sceneryContext.scale(-1,1);
		}
		if (itemType==5) { // closed door
			var dx = itemDir==0 || itemDir==3 ? 8 : 0;
			this.sceneryContext.drawImage(this.spriteSheet, 112, 10, 40, 124, -8-2*dx, -126-dx, 40, 124);
		}
		if (itemType>31) {	// collectible
			this.sceneryContext.drawImage(this.spriteSheet,(itemType-31)*32, 176, 32, 32, -16, -32, 32, 32);
		}
		if (itemType==17) { // rockslide
			var stillFalling = (itemDir == this.world.lastFall);
			for (var i=1; i<20; ++i) {
				var size = 80/Math.pow(i,.5);
				var dt = Math.max(0,(new Date() - this.game.world.lastCycleTime)/20-i);
				var sx = ((35*i)&127)-63;
				var sy = -30-sx/2-i*2+(stillFalling?Math.min(0, dt*dt-2500):0);
				this.sceneryContext.drawImage(this.spriteSheet, 192, 176, 32, 32, sx-size/2, sy-size/2, size, size);
			}
		}
/*		
		if (itemType==16) { // column
			this.sceneryContext.scale(this.tileSize, this.tileSize);
			this.sceneryContext.lineWidth = 3/this.tileSize;
			this.sceneryContext.fillStyle = "#660";
			this.sceneryContext.strokeStyle = "yellow";
			this.sceneryContext.beginPath();
			this.sceneryContext.moveTo(0, 0);
			this.sceneryContext.lineTo(2, -1);
			this.sceneryContext.lineTo(2, -3.5);
			this.sceneryContext.lineTo(0, -2.5);
			this.sceneryContext.lineTo(0, 0);
			this.sceneryContext.lineTo(-2, -1);
			this.sceneryContext.lineTo(-2, -3.5);
			this.sceneryContext.lineTo(0, -2.5);
			this.sceneryContext.moveTo(-2, -3.5);
			this.sceneryContext.lineTo(0, -4.5);
			this.sceneryContext.lineTo(-2, -3.5);
			this.sceneryContext.fill();
			this.sceneryContext.stroke();
		}*/
		this.sceneryContext.restore();
	},
	
	/**
	 * Inner rendering routine to display the game area
	 * Draw one character within the room
	 * @param identity : (0..3) index in player array
	 * @param character : character data (x, y, animation step, orientation)
	 */
	drawCharacter : function(identity, character)
	{
		var sx = 64*character.orientation;//32*(character.animStep+6*character.orientation+4);
		var sy = 208+88*identity;
		var dx = 2*this.tileSize*(character.x+character.y+1)-32;
		var dy = this.tileSize*(-character.x+character.y)-88;
		this.sceneryContext.drawImage(this.spriteSheet, sx, sy, 64, 88, dx, dy, 64, 88);
	},
	
	/**
	 * Display the panel over the canvas, showing information on
	 * the highlighted or selected item
	 */
	drawOverlayPanel : function()
	{
		if (this.formerSelectedItem != this.world.selectedItem
			|| this.formerHighlightedItem != this.world.highlightedItem) {
			var actionHandler = this.game.worldLink;
			var itemId = this.world.highlightedItem;
			if (this.world.selectedItem>-1) {
				itemId = this.world.selectedItem;
			}
			if (itemId>-1) {
				var item = this.world.getItemOrPlayer(itemId);
				
				this.overlayPanel.children[0].innerHTML = this.itemNames[item.type>>2];
				var actionList = this.world.getActionsByItem(item.type);
				for (var actionIndex = 0; actionIndex < actionList.length; ++actionIndex) {
					var actionId = actionList[actionIndex];
					var cost = this.world.actionCost[actionId];
					this.overlayPanel.children[actionIndex+1].innerHTML = cost+"⌛ "+this.actionNames[actionId];
					this.overlayPanel.children[actionIndex+1].setAttribute("class",(cost>this.world.actionPoints||(!actionId&&this.world.playerInventory.length>11)?"unavailable":""));
					this.overlayPanel.children[actionIndex+1].actionId = actionId;
					this.overlayPanel.children[actionIndex+1].roomItemId = itemId;
					this.overlayPanel.children[actionIndex+1].onclick = function() { 
						actionHandler.performRoomAction(this.actionId, this.roomItemId); 
					};
				}
				this.overlayPanel.style.display = "block";
				this.overlayPanel.style.left = Math.max(this.windowLayout[0]+2*this.tileSize*(item.x+item.y+1)-100, 0)+"px";
				this.overlayPanel.style.top = (this.windowLayout[2]+this.tileSize*(-item.x+item.y))+12+"px";
				if (this.world.selectedItem>-1) {
					this.overlayPanel.style.height = (24+24*actionList.length)+"px";
				} else {
					this.overlayPanel.style.height = "24px";
				}
			} else {
				this.overlayPanel.style.display = "none";
			}
			this.formerSelectedItem = this.world.selectedItem;
			this.formerHighlightedItem = this.world.highlightedItem;
		}
	},
	
	/**
	 * Display the player status, condition and backpack contents
	 */
	drawPlayerPanel : function() {
		var world = this.world;
		var actionHandler = this.game.worldLink;
		this.playerPanel.children[0].innerHTML = this.itemNames[48+this.world.playerId];
		this.playerPanel.children[2].innerHTML = this.world.actionPoints + " ⌛";
		this.playerPanel.children[5].innerHTML = this.conditionNames[this.world.currentActivity];
		var delay = Math.ceil((this.world.nextCycleTime - new Date())/1000);
		var delaySec = delay%60;
		this.playerPanel.children[6].innerHTML = this.world.nextCycleTime ?"+"+(5-this.world.nextActivity)+" ⌛ in 0"+Math.floor(delay/60)+":"+(delaySec<10?"0":"")+delaySec:"Waiting";
		this.playerPanel.children[7].innerHTML = "Next : "+this.conditionNames[this.world.nextActivity];
		this.playerPanel.children[10].innerHTML = ["","","Burdened : -1⌛","Overloaded : -2⌛","Struggling : -3⌛"][Math.floor((this.world.playerInventory.length+2)/3)];
		var itemIndex = 0;
		for (var i=0; i<this.playerPanel.children[13].children.length; ++i) {
			var line = this.playerPanel.children[13].children[i];
			for (var j=0; j<line.children.length; ++j) {
				var style = -32*(itemIndex>=this.world.playerInventory.length ? 0 : this.world.playerInventory[itemIndex]/4-31)+"px -176px";
				line.children[j].style.backgroundPosition=style;
				line.children[j].setAttribute("class", "equipt"+(this.world.selectedInInventory==itemIndex?" selected":""));
				line.children[j].index = itemIndex;
				line.children[j].onmouseup = function() {
					world.selectItemInInventory(this.index);
				}
				++itemIndex;
			}
		}
		var actionButton = this.playerPanel.children[14].firstChild;
		var cost = this.world.actionCost[8];
		actionButton.style.display = this.world.selectedInInventory>-1?"block":"none";
		actionButton.innerHTML = cost+"⌛ "+this.actionNames[8];
		actionButton.setAttribute("class",(cost>this.world.actionPoints?"unavailable":""));
		actionButton.onclick = function() { 
			actionHandler.performInventoryAction(8); 
		}

	},
	
	/**
	 * Display the activity panel over the player panel,
	 * only if it has been set to visible before.
	 * 
	 */
	drawActivityPanel : function() {
		this.activityPanel.style.display = this.showActivityPanel ? "block" : "none";
	},
	
	/**
	 * Setter for the visibility of the activity panel
	 * Triggered by mouse cursor location
	 */
	setActivityPanelShown : function(show) {
		this.showActivityPanel = show;
	},
	
	/**
	 * Display the results panel
	 * Shows the players names and score
	 */
	drawResultsPanel : function() {
		this.resultsPanel.style.top = this.game.worldLink.showResults?this.sceneryCanvas.style.top:"-360px";
		for (var i=0; i<3; ++i) {
			this.resultsPanel.children[i].children[1].innerHTML=this.itemNames[48+i];
			this.resultsPanel.children[i].children[2].innerHTML=this.world.players[i].score<0?["Trapped inside","Still inside"][2+this.world.players[i].score]:this.world.players[i].score+" ⇪";
		}
	}
	
	/**
	 * Listener for error messages
	 *
	 * @param error : index of the error (and error message)
	 * @param param : parameter this will replace $1 in the message
	 */
	 /*
	notifyErrorMessage : function(error, param) {
		var message = this.errorMessages[error];
		message.replace(/\$1/g,param);
		alert(message);
	}
	*/

	

}