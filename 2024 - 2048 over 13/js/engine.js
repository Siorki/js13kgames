/**
 * Ingame world, contains all game mechanisms
 * along with the information for the game in progress (grid, options)
 * *
 */

const MERGE_DOWN = 1;
const MERGE_IN_PLACE = 2;
const MERGE_TO_13 = 3;

class World
{
	/**
	 * @constructor
	 * @param controls Instance of the Controls class, used to process player actions
	 */
	constructor(controls) {
		this.controls = controls;
		
		// gris shows 2 0 4 8 on a line, then 13 on another
		this.grid = [ 	0, 0, 0, 0, 0, 0, 0,
						0, 0, 0, 0, 0, 0, 0,
						0, 0, 1, 2, 3, 4, 0,
						0, 0, 0, 0, 0, 0, 0,
						0, 0, 0, 5, 0, 0, 0,
						0, 0, 0, 0, 0, 0, 0,
						0, 0, 0, 0, 0, 0, 0
					];
		this.tiles = [ {x:2, y:2, value:2, moving:0, merging:0}, 
					 {x:3, y:2, value:0, moving:0, merging:0}, 
					 {x:4, y:2, value:4, moving:0, merging:0},
					 {x:5, y:2, value:8, moving:0, merging:0},
					 {x:3, y:4, value:13, moving:0, merging:0}
 					];
		this.waitingLine = [false, false, false, false, false];
		this.combos = [];
		this.orientation = 0;
		this.moves = 0;
		this.fallingDown = false; // during animation, step 1 : tiles fall to the ground
		this.merging = false; // during animation, step 2 : identical tiles merge
		this.mergingTo13 = false; // during animation, step 3 : lines of 8 4 1 merge to 13
		
		this.gameInProgress = false;
		this.animationInProgress = false;
		this.currentMove = -1;
	
		this.saveGameListeners = [];
	}


	/**
	 * Create a new game
	 * Empties the grid (save for a 1 tile) and resets the scores
	 */
	startNewGame() {
		this.grid = [	0, 0, 0, 0, 0, 0, 0,
						0, 0, 0, 0, 0, 0, 0,
						0, 0, 0, 0, 0, 0, 0,
						0, 0, 0, 0, 0, 0, 0,
						0, 0, 0, 0, 0, 0, 0,
						0, 1, 0, 0, 0, 0, 0,
						0, 0, 0, 0, 0, 0, 0
					];
		this.tiles = [{x:1, y:5, value:4, moving:0, merging:0}
					];
		this.waitingLine = [false, false, false, false, false];
		this.combos = [];
		this.orientation = 0;
		this.currentMessage = 0;
		this.moves = 0;
		this.fallingDown = false;
		this.merging = false;
		this.mergingTo13 = false;
		
		this.gameInProgress = true;
		this.animationInProgress = false;
		this.currentMove = -1;
		this.addTileToQueue();
	}
	

	/**
	 * Loads the game progress from a previously saved game
	 * @param gameProgress saved data, retrieved from local storage
	 */
	loadGame(gameProgress) {
		// deep copy the saved game
		this.grid = gameProgress.grid.slice();
		this.tiles = [];
		gameProgress.tiles.forEach(tile => {
			this.tiles.push(structuredClone(tile));
		});
		this.waitingLine = [];
		gameProgress.waitingLine.forEach(square => {
			this.waitingLine.push(structuredClone(square));
		});
		this.orientation = gameProgress.orientation;
		this.gameInProgress = true;
	}
	
	/**
	 * Randomly add a tile to the waiting line
	 * @return true if added, false if the line is already full ( = game over)
	 */
	addTileToQueue() {
		let randomX = Math.floor(5*Math.random()); 
		let randomValue = Math.random(); // [0 - 0.5[ : 1 ; [0.5 - 0.9[ : 2 ; [0.9 - 1[ : 4
		// add the tile to the first empty spot on the line
		for (let x=0; x<5; ++x) {
			let tileX = (randomX+x)%5;
			if (!this.waitingLine[tileX]) { // found an empty spot
				this.waitingLine[tileX] = { value : randomValue>.9?4:(randomValue>.5?2:1), y : -1.5, speedY : 0, targetY : -1.5 }
				return true;
			}
		}
		return false; // waiting line is already full
	}
	
	/**
	 * Identify and mark tiles that will be falling
	 * Output written directly in this.tiles as attributes targetX and targetY
	 */
	beginFall() {
		// the grid itself does not rotate, but the routine has to handles all orientations
		// Since the grid is a 1D array, we achieve this by using different step values
		// depending on orientation
		let bottomLeftSquare = [36, 8, 12, 40][this.orientation];
		let up = [-7, 1, 7, -1][this.orientation]
		let right = [1, 7, -1, -7][this.orientation];
		for (let column=0; column<5; ++column) {
			let freeSquares = 0, lastValue = 0, willMerge = false;
			for (let row=0; row<5; ++row) {
				let tileId = this.grid[bottomLeftSquare+column*right+row*up]-1;
				if (tileId>=0) {
					this.tiles[tileId].speedX = 0;
					this.tiles[tileId].speedY = 0;
					this.tiles[tileId].targetX = this.tiles[tileId].x + freeSquares*[0, -1, 0, 1][this.orientation];
					this.tiles[tileId].targetY = this.tiles[tileId].y + freeSquares*[1, 0, -1, 0][this.orientation];
					this.tiles[tileId].moving = freeSquares;
					// allow a drop without enough room now it the tiles below are going to merge and free some space
					willMerge = willMerge || (lastValue == this.tiles[tileId].value);
					lastValue = this.tiles[tileId].value;
				} else {
					++freeSquares; 
				}
			}
			// have tiles in the waiting line above fall, if there is (or will be) room for them
			// they stay in the waitingLine array to be displayed unrotated
			// then move to the tiles array and the rotated coordinates once their fall ends
			if (this.waitingLine[column]) {
				// if no free square, no merge inside the column
				// but the tile has the same value as the one on top, allow it to fall and merge
				let topTileId = this.grid[bottomLeftSquare+column*right+4*up]-1;
				willMerge = willMerge || (topTileId>-1 && this.tiles[topTileId].value == this.waitingLine[column].value);
				if (freeSquares || willMerge) {
					this.waitingLine[column].targetY = freeSquares;
				}
			}
		}
		this.fallingDown = this.animationInProgress = true;
	}
	
	/**
	 * Internal method to initiate merges when two identical tiles are one above the other,
	 * removing the upper tile from this.tiles
	 * Also causes the tiles above to fall down following the merge
	 * @return true if merge initiated, false if nothing moves
	 */
	triggerMerge() {
		let removedTiles = [];
		let bottomLeftSquare = [36, 8, 12, 40][this.orientation];
		let up = [-7, 1, 7, -1][this.orientation]
		let right = [1, 7, -1, -7][this.orientation];
		let deltaX = [0, -1, 0, 1][this.orientation];
		let deltaY = [1, 0, -1, 0][this.orientation];
		for (let column=0; column<5; ++column) {
			let tileBelow = this.grid[bottomLeftSquare+column*right]-1;
			let merges = 0;
			for (let row=1; row<6; ++row) {
				let tileId = this.grid[bottomLeftSquare+column*right+row*up]-1;
				if (tileId>=0) {
					if (tileBelow>=0 && this.tiles[tileId].value == this.tiles[tileBelow].value && !this.tiles[tileBelow].merging) {
						this.tiles[tileBelow].merging = MERGE_IN_PLACE;
						this.tiles[tileBelow].targetX = this.tiles[tileBelow].x+merges*deltaX;
						this.tiles[tileBelow].targetY = this.tiles[tileBelow].y+merges*deltaY;
						this.tiles[tileBelow].speedX += .1*merges*deltaX;
						this.tiles[tileBelow].speedY += .1*merges*deltaY;
						this.tiles[tileBelow].targetValue = 2*this.tiles[tileId].value;
						this.tiles[tileBelow].deltaValue = .1*this.tiles[tileId].value;
						this.tiles[tileBelow].mergeStep = 10;
						this.tiles[tileBelow].dx = this.tiles[tileId].x-this.tiles[tileBelow].x;
						this.tiles[tileBelow].dy = this.tiles[tileId].y-this.tiles[tileBelow].y;
						this.tiles[tileId].merging = MERGE_DOWN; // avoid merge with 3 identical tiles
						++merges;
						removedTiles.push(tileId);
					} else { // readjust if tiles below the current one are merging
						this.tiles[tileId].targetX = this.tiles[tileId].x+merges*deltaX;
						this.tiles[tileId].targetY = this.tiles[tileId].y+merges*deltaY;
						this.tiles[tileId].speedX += .1*merges*deltaX;
						this.tiles[tileId].speedY += .1*merges*deltaY;
						this.tiles[tileId].moving = (merges > 0);
						this.tiles[tileId].targetValue = this.tiles[tileId].value;
						this.tiles[tileId].deltaValue = 0;
					}
				}
				tileBelow = tileId;
			}
		}
		// get rid of merging tiles
		removedTiles.sort((a,b) => b-a); // sort in descending order, to remove tiles from the end and not worry about reindexing
		removedTiles.forEach (tileIndex => {
			this.tiles.splice(tileIndex, 1);
		});
		return removedTiles.length > 0;
	}
	
	/**
	 * Internal method to record a combo (8 4 1 turning to 13)
	 * Combo is added to the list this.combos
	 * 
	 * @param id0 id of the left or upper tile
	 * @param id1 id of the center tile
	 * @param id2 id of the right or lower tile
	 */
	recordCombo(id0, id1, id2) {
		this.combos.push({	x0	: this.tiles[id0].x,
							y0	: this.tiles[id0].y,
							v0	: this.tiles[id0].value,
							x1	: this.tiles[id1].x,
							y1	: this.tiles[id1].y,
							v1	: this.tiles[id1].value,
							x2	: this.tiles[id2].x,
							y2	: this.tiles[id2].y,
							v2	: this.tiles[id2].value,
							step: 20
		});
	}
	
	/**
	 * Internal method to mutate blocks of 8,4,1 to 13
	 * 
	 * @return true if merge initiated, false if nothing moves
	 */
	checkFor13() {
		// this one is independent of rotation, there is no privilieged direction "up" nor "down"
		// so there is no need to redefine directions.
		// neighbouring 8 4 1 are turned to a 13 as the middle tile, the two outer ones are removed
		
		let removedTiles = [];
		for (let column=0; column<5; ++column) {
			for (let row=0; row<5; ++row) {
				// first check horizontals
				// we can safely add -1 and +1 because the grid extends one extra (empty) square around
				let tileLeft = this.grid[7+column+7*row]-1;
				let tileCenter = this.grid[8+column+7*row]-1;
				let tileRight = this.grid[9+column+7*row]-1;
				if (tileLeft>-1 && tileCenter>-1 && tileRight>-1) {
					if (this.tiles[tileLeft].value + this.tiles[tileCenter].value + this.tiles[tileRight].value == 13) {
						// only way to achieve this in three tiles is 8 4 1
						this.recordCombo (tileLeft, tileCenter, tileRight);
						this.tiles[tileCenter].merging = MERGE_TO_13;
						this.tiles[tileCenter].value = 13;
						// clear side tiles so they cannot be reused in another combo
						this.grid[7+column+7*row] = 0;
						this.grid[9+column+7*row] = 0;
						// removal will happen after the loop, as we need grid and tiles synchronized for this to work
						removedTiles.push(tileLeft, tileRight);
					}
				}

				// then verticals
				let tileAbove = this.grid[1+column+7*row]-1;
				let tileBelow = this.grid[15+column+7*row]-1;
				if (tileAbove>-1 && tileCenter>-1 && tileBelow>-1) {
					if (this.tiles[tileAbove].value + this.tiles[tileCenter].value + this.tiles[tileBelow].value == 13) {
						// only way to achieve this in three tiles is 8 4 1
						this.recordCombo(tileAbove, tileCenter, tileBelow);
						this.tiles[tileCenter].merging = MERGE_TO_13;
						this.tiles[tileCenter].value = 13;
						// clear side tiles so they cannot be reused in another combo
						this.grid[1+column+7*row] = 0;
						this.grid[15+column+7*row] = 0;
						// removal will happen after the loop, as we need grid and tiles synchronized for this to work
						removedTiles.push(tileAbove, tileBelow);
					}
				}
			}
		}
		// get rid of side tiles in the combo
		removedTiles.sort((a,b) => b-a); // sort in descending order, to remove tiles from the end and not worry about reindexing
		removedTiles.forEach (tileIndex => {
			this.tiles.splice(tileIndex, 1);
		});
		return removedTiles.length>0;
	}
	
	/**
	 * Performs one step of animation : 
	 *  - tiles fall down
	 *  - identical tiles are merged
	 *  - 8 4 1 on the same line turn into 13
	 */
	animateItems() {
		if (this.fallingDown) {
			let stillMoving = false;
			let accelX = .03*[0, -1, 0, 1][this.orientation];
			let accelY = .03*[1, 0, -1, 0][this.orientation];
			this.tiles.forEach(tile => {
				if (tile.moving) {
					tile.speedX += accelX;
					tile.speedY += accelY;
					tile.x += tile.speedX;
					tile.y += tile.speedY;
					if ((tile.targetX-tile.x)*tile.speedX < 0 || (tile.targetY-tile.y)*tile.speedY < 0) { // target reached
						tile.x = tile.targetX;
						tile.y = tile.targetY;
						tile.speedX = tile.speedY = 0;
						tile.moving = false;
					}
				}
				stillMoving = stillMoving | tile.moving;
			});
			this.waitingLine.forEach((tile, column) => {
				if (tile && tile.targetY > tile.y) { // falling, in its own coordinate system
					tile.speedY += .03
					tile.y += tile.speedY;
					if (tile.y >= tile.targetY) { // ground reached.
						// Move the tile from the waiting line to the grid
						// and into the rotated coordinate system
						let newTile = {
							x : [column+1, 6-tile.targetY, 5-column, tile.targetY][this.orientation],
							y : [tile.targetY, column+1, 6-tile.targetY, 5-column][this.orientation],
							speedX : 0,
							speedY : 0,
							targetX : [column+1, 6-tile.targetY, 5-column, tile.targetY][this.orientation],
							targetY : [tile.targetY, column+1, 6-tile.targetY, 5-column][this.orientation],
							moving : false,
							value : tile.value
						}
						this.tiles.push(newTile);
						this.waitingLine[column] = false;
					} else {
						stillMoving = true;
					}
				}
			});
			this.fallingDown = stillMoving;
			if (!stillMoving) { // resynchronize grid with tiles
				// clear grid, keeping only -1 (border or fixed blocks) and 0 (empty)
				this.grid = this.grid.map(i => Math.min(i, 0));
				// reassign grid items from tiles
				this.tiles.forEach ((tile, index) => {
					this.grid[tile.x+tile.y*7] = index+1;
				});
				
				 // fall completed. Now check for merging tiles
				this.merging = this.triggerMerge();
			}
		}
		
		if (this.merging) {
			let stillMerging = false;
			this.tiles.forEach((tile, index) => { 
				if (tile.moving || tile.merging) {
					tile.x += tile.speedX;
					tile.y += tile.speedY;
					tile.value += tile.deltaValue;
					if (tile.mergeStep) {
						--tile.mergeStep;
					}
					if (tile.moving && ((tile.targetX-tile.x)*tile.speedX < 0 || (tile.targetY-tile.y)*tile.speedY < 0)) { // fall ends
						tile.x = tile.targetX;
						tile.y = tile.targetY;
						tile.speedX = tile.speedY = 0;
						tile.moving = false;
					}
					if (tile.merging && tile.mergeStep < 1) { 
						tile.value = tile.targetValue;
						tile.merging = 0;						
					}
					stillMerging = stillMerging || tile.moving || tile.merging;
				}
			});
			this.merging = stillMerging;
			if (!this.merging) { // resynchronize grid with tiles
				// clear grid, keeping only -1 (border or fixed blocks) and 0 (empty)
				this.grid = this.grid.map(i => Math.min(i, 0));
				// reassign grid items from tiles
				this.tiles.forEach ((tile, index) => {
					this.grid[tile.x+tile.y*7] = index+1;
				});
				
				// and attempt to merge again for chain reactions : 2 2 4 -> 4 4 -> 8
				this.merging = this.triggerMerge();
				if (!this.merging) {
					this.mergingTo13 = this.checkFor13();
				}
			}
		}
		
		if (this.mergingTo13) {
			this.mergingTo13 = false;
			this.combos.forEach(combo => { 
				combo.step = Math.max(0, combo.step-1);
				this.mergingTo13 = this.mergingTo13 || (combo.step>0);
			});
			
			if (!this.mergingTo13) { // all combos completed
				this.combos = [];
				// resynchronize grid with tiles
				// clear grid, keeping only -1 (border or fixed blocks) and 0 (empty)
				this.grid = this.grid.map(i => Math.min(i, 0));
				// reassign grid items from tiles
				this.tiles.forEach ((tile, index) => {
					tile.merging = 0; // remove the value MERGING_TO_13
					this.grid[tile.x+tile.y*7] = index+1;
				});
				
				// and loop to another fall, as the merge may have freed some space below tiles
				this.beginFall(); // will set this.fallingDown
			}
		}
		
		// once all falling and merging has ended, push a new tile to the top row
		// and free the animation flag so the user can play their next move
		if (this.animationInProgress && !this.mergingTo13 && !this.merging && !this.fallingDown) {
			this.animationInProgress = false;
			this.gameInProgress = this.addTileToQueue(); // false if no room left, meaning game over
		}
	}
	
	
	/**
	 * Take into account user actions (mouse move / click)
	 * Called once each step.
	 */
	processControls() {
		// on user action when a messsage is displayed, remove the message, bail out so that the key / mouse press
		// is not reused to rotate the grid
		if (this.currentMessage) {
			if (this.controls.mouseLeftButton || this.controls.controlLeft || this.controls.controlFire
				|| this.controls.controlRight || this.controls.controlUp || this.controls.controlsDown) {
				this.currentMessage = 0;
			}
		} else if (!this.animationInProgress) {
			this.currentMove = this.controls.mouseLeftButton ? this.controls.areaUnderMouse : -1;

			if (this.controls.controlLeft) {
				this.currentMove = 3;
			}
			if (this.controls.controlRight) {
				this.currentMove = 1;
			}			
			if (this.controls.controlUp) {
				this.currentMove = 2;
			}
			if (this.controls.controlDown) {
				this.currentMove = 0;
			}
			
			if (this.currentMove>-1) {
				this.orientation = (this.orientation+this.currentMove)&3;
				++this.moves;
				this.beginFall();
				
			}
		
		}	
		this.controls.totalClear();
	}
	
	/** 
	 * Add a listener to be notified of game save / autosave
	 */
	addSaveGameListener(listener) {
		this.saveGameListeners.push(listener);
	}
	
	/**
	 * Saves the game in progress
	 */
	saveGame() {
		// deep copy the game state
		let tilesClone = [];
		this.tiles.forEach(tile => {
			tilesClone.push(structuredClone(tile));
		});
		let waitingLineClone = [];
		this.waitingLine.forEach(square => {
			waitingLineClone.push(structuredClone(square));
		});
		let gridClone = this.grid.slice();
		// then save it
		for (let i=0; i<this.saveGameListeners.length; ++i) {
			this.saveGameListeners[i].notifySave(gridClone, tilesClone, waitingLineClone, this.orientation);
		}
	}
		
}
