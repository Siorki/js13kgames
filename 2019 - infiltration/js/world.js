/**
 * @constructor
 */
function World(controls)
{
	this.controls = controls;
	this.track=[ // format : [junction angle X, junction angle Y, texture square, [0, x, y, z, dx, dy, dz, texture square], repeat]
		[0, 0, 0],
		[0, .4, 2, [0, -3, -3, 6, .5, 6, .2, 2], [0, 2.5, -3, 6, .5, 6, .2, 2], [0, -3, -3, 8, .5, 6, .2, 2], [0, 2.5, -3, 8, .5, 6, .2, 2] ],
		[0, -.4, 2, [0, -3, -3, 6, .5, 6, .2, 2], [0, 2.5, -3, 6, .5, 6, .2, 2], [0, -3, -3, 10, .5, 6, .2, 2], [0, 2.5, -3, 10, .5, 6, .2, 2]],
		[.3, 0, 0],
		[-.3, 0, 1, [0, -3, -3, 6, .5, 6, .2, 2], [0, 2.5, -3, 6, .5, 6, .2, 2], [0, -3, -3, 10, .5, 6, .2, 2], [0, 2.5, -3, 10, .5, 6, .2, 2]],
		[0, -.4, 2, [0, -3, -3, 2, .5, 6, .2, 2], [0, 2.5, -3, 2, .5, 6, .2, 2], [0, 0, -3, 6, .5, 6, .2, 2], [0, -3, -3, 10, .5, 6, .2, 2], [0, 2.5, -3, 10, .5, 6, .2, 2]],
		[0, -.4, 2, [0, -3, -3, 2, .5, 6, .2, 2], [0, -1.4, -3, 4, .5, 6, .2, 2], [0, -.2, -3, 6, .5, 6, .2, 2], [0, 1.2, -3, 8, .5, 6, .2, 2], [0, 2.5, -3, 10, .5, 6, .2, 2]],
		[0, -.4, 2, [0, -3, -3, 2, .5, 6, .2, 2], [0, -1.4, -3, 4, .5, 6, .2, 2], [0, -.2, -3, 6, .5, 6, .2, 2], [0, 1.2, -3, 8, .5, 6, .2, 2], [0, 2.5, -3, 10, .5, 6, .2, 2]],
		[0, -.4, 2, [0, -2.2, -3, 4, .4, 2, .2, 1], [0, -.2, -3, 4, .4, 2, .2, 1], [0, 1.8, -3, 4, .4, 2, .2, 1] ],
		[.3, 0, 0],
		[0, 0, 1, [0, -2.2, -3, 4, .4, 2, .2, 1], [0, -.2, -3, 4, .4, 2, .2, 1], [0, 1.8, -3, 4, .4, 2, .2, 1] ],
		[-.3, 0, 0],
		[0, -.4, 3, [0, -2.2, -3, 4, .4, 4, .2, 1], [0, -.2, -3, 4, .4, 4, .2, 1], [0, 1.8, -3, 4, .4, 4, .2, 1], [0, -2.2, -1, 7, .4, 4, .2, 1], [0, -.2, -1, 7, .4, 4, .2, 1], [0, 1.8, -1, 7, .4, 4, .2, 1], [0, -2.2, -3, 10, .4, 4, .2, 1], [0, -.2, -3, 10, .4, 4, .2, 1], [0, 1.8, -3, 10, .4, 4, .2, 1]],
		[0, -.4, 3, [0, -3, -3, 2, .5, 6, .2, 2], [0, -1.4, -3, 4, .5, 6, .2, 2], [0, -.2, -3, 6, .5, 6, .2, 2], [0, 1.2, -3, 8, .5, 6, .2, 2], [0, 2.5, -3, 10, .5, 6, .2, 2]],
		[0, -.4, 3, [0, -2.2, -3, 4, .4, 5, .2, 1], [0, -.2, -3, 4, .4, 4, .2, 1], [0, 1.8, -3, 4, .4, 3, .2, 1], [0, -2.2, 0, 7, .4, 3, .2, 1], [0, -.2, -1, 7, .4, 4, .2, 1], [0, 1.8, -2, 7, .4, 5, .2, 1]],
		[0, -.4, 3, [0, -2.2, -3, 4, .4, 4, .2, 1], [0, -.2, -3, 4, .4, 4, .2, 1], [0, 1.8, -3, 4, .4, 4, .2, 1], [0, -2.2, -1, 7, .4, 4, .2, 1], [0, -.2, -1, 7, .4, 4, .2, 1], [0, 1.8, -1, 7, .4, 4, .2, 1], [0, -2.2, -3, 10, .4, 4, .2, 1], [0, -.2, -3, 10, .4, 4, .2, 1], [0, 1.8, -3, 10, .4, 4, .2, 1]],
		[.3, 0, 1, [0, -3, -3, 6, .5, 6, .2, 2], [0, 2.5, -3, 6, .5, 6, .2, 2], [0, -3, -3, 8, .5, 6, .2, 2], [0, 2.5, -3, 8, .5, 6, .2, 2]],
		[-.3, 0, 0],
		[0, -.4, 0],
		[0, -.4, 1, [0, -3, -1.1, 1, 6, .2, 4, 0], [0, -3, .9, 1, 6, .2, 4, 0], [0, -1.1, -2.5, 1, .2, 5, 4, 0], [0, .9, -2.5, 1, .2, 5, 4, 0] ],
		[0, -.4, 2, [0, -3, -1.1, 1, 6, .2, 20, 0], [0, -3, .9, 1, 6, .2, 20, 0], [0, -1.1, -2.5, 1, .2, 5, 20, 0], [0, .9, -2.5, 1, .2, 5, 20, 0] ],
		[0, -.4, 2, [0, -2.6, -3, 2, .2, .6, .2, 2] , [0, -.6, -3, 4, .2, 2.6, .2, 2], [0, 1.4, -3, 6, .2, 4.6, .2, 2], [0, -.6, .4, 8, .2, 2.6, .2, 2] ],
		[0, -.4, 2, [0, -3, -3, 4, 3.9, 6, .2, 0], [0, 0.9, -3, 4, .2, 6, 10, 0] ],
		[0, -.4, 1, [0, -3, -3, 4, 3.9, 6, .2, 0], [0, 0.9, -3, 4, .2, 6, 10, 0], [0, -1.1, -3, 8, .2, 6, 10,0 ], [0, -.9, -3, 8, 3.9, 6, .2, 0] ],
		[0, -.4, 3, [0, -2.2, -3, 4, .4, 5, .2, 1], [0, -.2, -3, 4, .4, 4, .2, 1], [0, 1.8, -3, 4, .4, 3, .2, 1], [0, -2.2, 0, 7, .4, 3, .2, 1], [0, -.2, -1, 7, .4, 4, .2, 1], [0, 1.8, -2, 7, .4, 5, .2, 1]],
		[0, -.4, 3, [0, 1.8, -3, 4, .4, 5, .2, 1], [0, -.2, -3, 4, .4, 4, .2, 1], [0, -2.2, -3, 4, .4, 3, .2, 1], [0, 1.8, 0, 7, .4, 3, .2, 1], [0, -.2, -1, 7, .4, 4, .2, 1], [0, -2.2, -2, 7, .4, 5, .2, 1]],
		[.3, 0, 3, [0, -2.2, -3, 4, .4, 5, .2, 1], [0, -.2, -3, 4, .4, 4, .2, 1], [0, 1.8, -3, 4, .4, 3, .2, 1], [0, -2.2, 0, 7, .4, 3, .2, 1], [0, -.2, -1, 7, .4, 4, .2, 1], [0, 1.8, -2, 7, .4, 5, .2, 1]],
		[-.3, 0, 3, [0, 1.8, -3, 4, .4, 5, .2, 1], [0, -.2, -3, 4, .4, 4, .2, 1], [0, -2.2, -3, 4, .4, 3, .2, 1], [0, 1.8, 0, 7, .4, 3, .2, 1], [0, -.2, -1, 7, .4, 4, .2, 1], [0, -2.2, -2, 7, .4, 5, .2, 1]],
		[0, .31, 3, [0, -2.2, -3, 4, .4, 2, .2, 1], [0, -.2, -3, 4, .4, 2, .2, 1], [0, 1.8, -3, 4, .4, 2, .2, 1], [0, -2.2, 1, 5, .4, 2, .2, 1], [0, -.2, 1, 5, .4, 2, .2, 1], [0, 1.8, 1, 5, .4, 2, .2, 1] ],
		[0, .31, 0],
		[0, .31, 3, [0, -2.2, -3, 4, .4, 4, .2, 1], [0, -.2, -3, 4, .4, 4, .2, 1], [0, 1.8, -3, 4, .4, 4, .2, 1], [0, -2.2, -1, 6, .4, 4, .2, 1], [0, -.2, -1, 6, .4, 4, .2, 1], [0, 1.8, -1, 6, .4, 4, .2, 1], [0, -2.2, -3, 8, .4, 4, .2, 1], [0, -.2, -3, 8, .4, 4, .2, 1], [0, 1.8, -3, 8, .4, 4, .2, 1]],
		[0, .31, 3, [0, -3, -2.2, 2, 6, .4, .2, 1], [0, -3, -.2, 4, 6, .4, .2, 1], [0, -3, 1.8, 6, 6, .4, .2, 1], [0, -3, -.2, 8, 6, .4, .2, 1], [0, -3, -2.2, 10, 6, .4, .2, 1], [0, -3, 1.8, 12, 6, .4, .2, 1]],
		[0, .31, 3, [0, -3, -.2, 2, 6, .4, .2, 1], [0, -3, -2.2, 4, 6, .4, .2, 1], [0, -3, 1.8, 6, 6, .4, .2, 1], [0, -3, -2.2, 8, 6, .4, .2, 1], [0, -3, 1.8, 10, 6, .4, .2, 1], [0, -3, -.2, 12, 6, .4, .2, 1]],
		[0, -.31, 1, [0, -3, -3, 8, 4, 6, .2, 0], [0, 1, -1, 8, 2, 4 , .2, 2], [0, 1.1, -1.1, 4, 1.9, .2, 32, 0], [0, .9, -3, 4, .2, 2.1, 32, 0]],
		[0, -.31, 3, [0, -3, -2.2, 2, 6, .4, .2, 1], [0, -3, -.2, 4, 6, .4, .2, 1], [0, -3, 1.8, 6, 6, .4, .2, 1], [0, -3, -.2, 8, 6, .4, .2, 1], [0, -3, -2.2, 10, 6, .4, .2, 1], [0, -3, 1.8, 12, 6, .4, .2, 1]],
		[0, -.31, 3, [0, -3, -.2, 2, 6, .4, .2, 1], [0, -3, -2.2, 4, 6, .4, .2, 1], [0, -3, 1.8, 6, 6, .4, .2, 1], [0, -3, -2.2, 8, 6, .4, .2, 1], [0, -3, 1.8, 10, 6, .4, .2, 1], [0, -3, -.2, 12, 6, .4, .2, 1]],
		[0, -.31, 3, [0, -3, -2.2, 2, 6, .4, .2, 1], [0, -3, -.2, 4, 6, .4, .2, 1], [0, -3, 1.8, 6, 6, .4, .2, 1], [0, -3, -.2, 8, 6, .4, .2, 1], [0, -3, -2.2, 10, 6, .4, .2, 1], [0, -3, 1.8, 12, 6, .4, .2, 1]],
		[0, -.31, 1, [0, -3, -3, 6, 4, 6, .2, 0], [0, 1, -1, 6, 2, 4 , .2, 2], [0, 1.1, -1.1, 0, 1.9, .2, 64, 0], [0, .9, -3, 0, .2, 2.1, 64, 0]],
		[.3, 0, 3, [0, -3, -2.2, 2, 6, .4, .2, 1], [0, -3, -.2, 4, 6, .4, .2, 1], [0, -3, 1.8, 6, 6, .4, .2, 1], [0, -3, -.2, 8, 6, .4, .2, 1], [0, -3, -2.2, 10, 6, .4, .2, 1], [0, -3, 1.8, 12, 6, .4, .2, 1]],
		[-.3, 0, 3],
		[0, -.31, 3, [0, -2.2, -3, 4, .4, 5, .2, 1], [0, -.2, -3, 4, .4, 4, .2, 1], [0, 1.8, -3, 4, .4, 3, .2, 1], [0, -2.2, 0, 7, .4, 3, .2, 1], [0, -.2, -1, 7, .4, 4, .2, 1], [0, 1.8, -2, 7, .4, 5, .2, 1]],
		[0, 0, 0, [0, -3, -3, 0, 6, 6, .1, 3]]
		];
	this.shipVertices = [];
	this.shipNormals = [];
	this.initialize(0);
}

World.prototype = {

	/**
	 * Reset the member variables to their default values 
	 * at the beginning of a game
	 * @param difficulty : 0 = easy, 1 = medium, 2 = hard, 3 = insane
	 */
	initialize : function(difficulty) {
	
		this.ship = {	x : 0,									// world coordinate
						y : 0,									// world coordinate
						speed : .05,							// minimum speed
						targetX : 0,							// world coordinate, changed according to player control
						targetY : 0,							// world coordinate, changed according to player control
						dx : 0,									// delta X - speed moving along X
						dy : 0,									// delta Y - speed moving along Y
						reactor : 0,							// 0 for off, 1 at max power
						step : 0,								// position in the (linear) tunnel, expressed as tiles
						hp : 5,									// initial hit points
						componentPresent : [1, 1, 1, 1, 1],		// (order : hull, BL, BR, TL, TR) reactors can be lost by a direct hit
						jolt : [0, 0],							// motion following a hit
					};
		this.ghosts = Array(250);								// circular buffer of locations, for flyback
		this.ghostPtr = 0;										// pointer to circular buffer
		this.timeElapsed = 0;
		this.timeGiven = 50*[300, 240, 180, 150][difficulty];	// countdown
		this.countDown = this.timeGiven;
		this.flybackCountdown = 0;								// frames after flyback is triggered
		this.flybackCharge = 0;									// flyback takes 20s (1000 frames) to charge
		this.events = [];
	},

	/**
	 * Set the 3D geometry, used for collision detection
	 * (defined by the WebGLRenderer)
	 */
	setShipGeometry : function (vertices, normals) {
		this.shipVertices = vertices;
		this.shipNormals = normals;
	},
	
	/**
	 * Clear the event stack (this.events) after they are processed by the game
	 * (and given to the renderer and / or sound manager)
	 */
	clearEvents : function() {
		this.events = [];
	},
	
	/**
	 * Return whether the player won the game (reaches the exit in time)
	 */
	won : function() {
		var finished = (this.ship.step > (this.track.length-1)*16);
		return finished;
	},


	normalizeVector3 : function(a) 
	{
		var norm = Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
		return [a[0]/norm, a[1]/norm, a[2]/norm];
	},

	
	/**
	 * Perform one step of model animation (players and CPU cars)
	 */
	animateItems : function() {
		if (this.countDown > 0) {
			--this.countDown;
		}
		++this.timeElapsed;
		this.animatePlayerShip();
	},
	
	/**
	 * Translate the player controls (accelerate, brake, steer) to ship parameters usable by the simulation
	 * Then call it to perform one step of motion
	 */
	animatePlayerShip : function() {

		this.flybackCharge = Math.min(this.flybackCharge+1, 1000);
		this.ship.reactor = Math.min(.5, Math.max(0, this.ship.reactor+ (this.controls.controlFire ? .2 : -.1)));
		this.ship.speed = Math.max(.05, .9*(this.ship.speed+.1*this.ship.reactor));
		
		if (this.controls.controlSecondButton && this.flybackCharge > 999) {	
			// flyback : return 4s (200 frames) in the past
			this.flybackCountdown = 200;
			this.flybackCharge = 0;
			this.countDown += 200;
			this.timeElapsed -= 200;
		}
		if (this.flybackCountdown==180) {
			this.ship = Object.assign({}, this.ghosts[this.ghostPtr]);
			this.ship.componentPresent = this.ship.componentPresent.slice();
			this.ship.jolt = this.ship.jolt.slice();
		}
		
		if (this.controls.usingMouseInputDevice()) {
			this.ship.targetX = 4*this.controls.mouseX/window.innerWidth-2;
			this.ship.targetY = -4*this.controls.mouseY/window.innerHeight+2;
		} else {	// keyboard
			this.ship.targetX = Math.min(2, Math.max(-2, this.ship.targetX + (this.controls.controlLeft ? -2 : 0) + (this.controls.controlRight ? 2 : 0)));
			this.ship.targetY = Math.min(2, Math.max(-2, this.ship.targetY + (this.controls.controlDown ? -2 : 0) + (this.controls.controlUp ? 2 : 0)));
			this.controls.clearLateralKeys();
		}
		
		if (this.ship.componentPresent[1]+this.ship.componentPresent[2]+this.ship.componentPresent[3]+this.ship.componentPresent[4]) {
			// Steering capability are hindered after the ship loses reactors. Even after the first one, no matter what the AI says
			var steeringRight = [.02, .06, .1][this.ship.componentPresent[1]+this.ship.componentPresent[3]];
			var steeringLeft = -[.02, .06, .1][this.ship.componentPresent[2]+this.ship.componentPresent[4]];
			var steeringUp = [.02, .06, .1][this.ship.componentPresent[1]+this.ship.componentPresent[2]];
			var steeringDown = -[.02, .06, .1][this.ship.componentPresent[3]+this.ship.componentPresent[4]];
			
			// Lateral and vertical controls : follow the target set by the pilot
			// Handled through X and Y acceleration, slight damping to avoid oversteering
			var deltaX = Math.abs(this.ship.targetX - this.ship.x);
			if (deltaX < .05) { 
				this.ship.dx = this.ship.targetX - this.ship.x;
			} else {
				var tighten = (this.ship.targetX - this.ship.x > 0 ? steeringRight:  steeringLeft);
				var loosen = (this.ship.targetX - this.ship.x > 0 ? steeringLeft:  steeringRight);
				var steps = Math.abs(this.ship.dx/loosen); // frames to return to level cruise from now
				var moreSteps = (Math.abs(this.ship.dx)+Math.abs(tighten))/Math.abs(loosen); // and if we tighten the turn
				if ((moreSteps+1)*moreSteps*Math.abs(loosen)/2 + .03 < deltaX) {
					// room to accelerate further
					this.ship.dx += tighten;
				} else if ((steps+1)*steps*Math.abs(loosen)/2 -.03 > deltaX) {
					// too much banking, revert to neutral
					this.ship.dx += loosen;
				}
			}
			var deltaY = Math.abs(this.ship.targetY - this.ship.y);
			if (deltaY < .05) { 
				this.ship.dy = this.ship.targetY - this.ship.y;
			} else {
				var tighten = (this.ship.targetY - this.ship.y > 0 ? steeringUp:  steeringDown);
				var loosen = (this.ship.targetY - this.ship.y > 0 ? steeringDown:  steeringUp);
				var steps = Math.abs(this.ship.dy/loosen); // frames to return to level cruise from now
				var moreSteps = (Math.abs(this.ship.dy)+Math.abs(tighten))/Math.abs(loosen); // and if we tighten the turn
				if ((moreSteps+1)*moreSteps*Math.abs(loosen)/2 + .03 < deltaY) {
					// room to accelerate further
					this.ship.dy += tighten;
				} else if ((steps+1)*steps*Math.abs(loosen)/2 -.03 > deltaY) {
					// too much banking, revert to neutral
					this.ship.dy += loosen;
				}
			}
		} else { // all reactors gone
			this.ship.dy -= .001;
		}
		
		this.ship.step += this.ship.speed;
		
		this.ship.x += this.ship.dx;
		this.ship.y += this.ship.dy;
		this.ship.jolt[0] *= .85;
		this.ship.jolt[1] *= .85;
		
		// deep copy current ship to ghost buffer
		this.ghosts[this.ghostPtr] = Object.assign({}, this.ship);
		this.ghosts[this.ghostPtr].componentPresent = this.ship.componentPresent.slice();
		this.ghosts[this.ghostPtr].jolt = this.ship.jolt.slice();
		this.ghostPtr = (this.ghostPtr+1)%250;
		this.flybackCountdown = Math.max (0, this.flybackCountdown-1);
		
	},
	
	
	/**
	 * Detect and apply collisions
	 */
	processCollisions : function()
	{
		var shipBoundingBoxes = [				// xmin, xmax, ymin, ymax, zmin, zmax
			[-.5, .5, -.2, .2, -.16, 1],		// main body
			[-.75, -.45, -.55, -.25, -.4, .3],	// bottom left reactor
			[.45, .75, -.55, -.25, -.4, .3],	// bottom right reactor,
			[-.75, -.45, .25, .55, -.4, .3],	// top left reactor
			[.45, .75, .25, .55, -.4, .3],		// top right reactor,
		];
		
		var sector = this.ship.step>>4;
		var shipZ = this.ship.step-sector*16;
		var sectorData = this.track[sector];
		for (var boxIndex=0; boxIndex<5; ++boxIndex) if (this.ship.componentPresent[boxIndex]) {
			var rawBoundingBox = shipBoundingBoxes[boxIndex];
			var realBoundingBox = [	this.ship.x+rawBoundingBox[0],
									this.ship.x+rawBoundingBox[1],
									this.ship.y+rawBoundingBox[2],
									this.ship.y+rawBoundingBox[3],
									shipZ*8+rawBoundingBox[4],
									shipZ*8+rawBoundingBox[5] ];
			var hitCount = 0, hitNormal = [0, 0, 0];
			for (var obstacleIndex=2; obstacleIndex<sectorData.length; ++obstacleIndex) {
				var obstacleData = sectorData[obstacleIndex];
				if ( 	realBoundingBox[0]<obstacleData[1]+obstacleData[4]
					&& 	realBoundingBox[1]>obstacleData[1]
					&& 	realBoundingBox[2]<obstacleData[2]+obstacleData[5]
					&& 	realBoundingBox[3]>obstacleData[2]
					&& 	realBoundingBox[4]<obstacleData[3]*8+obstacleData[6]
					&& 	realBoundingBox[5]>obstacleData[3]*8) {
					// collision detected in bounding box
					// iterate on vertices to confim
					var firstVertex = [0, 4536, 6216, 7896, 9576];
					var vertexCount = [420 /* front only */, 840, 840, 840, 840 /* reactor outside only */ ];
					for (var vIndex=firstVertex[boxIndex]; vIndex<firstVertex[boxIndex]+vertexCount[boxIndex]; ++vIndex) {
						if (	this.ship.x+this.shipVertices[3*vIndex] > obstacleData[1]
							&& 	this.ship.x+this.shipVertices[3*vIndex] < obstacleData[1]+obstacleData[4]
							&& 	this.ship.y+this.shipVertices[3*vIndex+1] > obstacleData[2]
							&& 	this.ship.y+this.shipVertices[3*vIndex+1] < obstacleData[2]+obstacleData[5]
							&& 	shipZ*8-this.shipVertices[3*vIndex+2] > obstacleData[3]*8
							&& 	shipZ*8-this.shipVertices[3*vIndex+2] < obstacleData[3]*8+obstacleData[6]) {
							++hitCount;
							hitNormal[0] += this.shipNormals[3*vIndex];
							hitNormal[1] += this.shipNormals[3*vIndex+1];
							hitNormal[2] += this.shipNormals[3*vIndex+2];
						}
					} // for (var vIndex
				}
			} // for (var obstacleIndex
			if (hitCount>0) {	// collided !
				hitNormal = this.normalizeVector3(hitNormal);
				if (hitCount>50 || hitNormal[2]<-.5) { // heavy damage
					// ship component destroyed. Game over if it is the main hull
					this.events.push(boxIndex); 
					this.ship.componentPresent[boxIndex] = 0;
					this.ship.jolt[0]+=.5*[0, -1, 1, -1, 1][boxIndex];
					this.ship.jolt[1]+=.5*[0, -1, -1, 1, 1][boxIndex];
				} else { // minor hit
					this.events.push(boxIndex+8); 
					this.ship.dx -= hitNormal[0]*.01;
					this.ship.dy -= hitNormal[1]*.01;
					this.ship.jolt[0]+=.05*[0, -1, 1, -1, 1][boxIndex];
					this.ship.jolt[1]+=.05*[0, -1, -1, 1, 1][boxIndex];
				}
			}
		}
		
		// craft destruction on collision with corridor sides (should only happen after all reactors are gone)
		if (Math.abs(this.ship.x)>2.7 || Math.abs(this.ship.y)>2.8) {
			this.events.push(0);
			this.ship.y = Math.max(this.ship.y, -2.95);	// avoid digging below the tunnel
		}
		
	}

}
