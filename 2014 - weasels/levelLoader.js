/**
 * @constructor
 */
 
function LevelLoader()
{
	this.levels = [
		[	
			"Walking through a minefield", // Grass 1
			20,	// number of weasels 
			20, // hit goal
			120,	// time in seconds
			[15, 0, 0, 0, 0, -1], // 15 landmines
			[7, 190, 20, 6, 864, 172],	// entrance and exit
			[2, 100, 160, 800, 96,
			 239, 100, 150, 2, 60,
			 239, 900, 160, 2, 60]
		],
		[
			"Pop goes the weasel",	// Grass 2
			10,
			10,
			120,
			[0, 2, 0, 0, 0, -1], // 2 fans
			[7, 260, 100, 6, 740, 176, 3, 530, 199],
			[2, 200, 200, 350, 56,
			 2, 660, 180, 100, 76]
		],
		[
			"Dark side of the mountain", // Grass 3
			15,
			15,
			120,
			[2, 3, 0, 0, 0, -1], // 2 mines, 3 fans
			[7, 250, 120, 6, 780, 175, 3, 430, 180],
			[3, 200, 180, 600, 126]
		],
		[	"Danger is in the air",	// Grass 4
			15,	// number of weasels 
			15, // hit goal
			150,	// time in seconds
			[1, 0, 1, 1, 0, -1], // 1 mine, 1 balloon, 1 flamethrower
			[7, 232, 48, 6, 770, 175],	// entrance and exit
			[2, 200, 128,  64, 128, 
			 2, 264, 160, 236,  96, 
			 2, 500, 208, 120,  48,
			 2, 620, 176, 180,  80]
		],
		[
			"Non-smoking area", // Grass 5
			15,
			15,
			240,
			[5, 0, 0, 0, 0, -1],
			[7, 400, 60, 6, 256, 175],
			[2, 192, 176, 208, 80,
			 2, 352, 104, 320, 16]
		],
		[	
			"Stairway to hell", // Grass 6
			4,
			4,
			120,
			[3, 0, 0, 0, 0, -1], // 3 mines
			[7, 260, 100, 6, 740, 175],
			[2, 200, 200, 400, 56,
			 2, 630, 170, 130, 86]
		],
		[
			"Need a light ?", // Grass 7
			15,
			15,
			240,
			[0, 0, 2, 0, 0, -1],
			[7, 538, 48, 6, 516, 225],
			[2, 320, 224, 368, 32,
			 2, 256, 208, 64, 48,
			 2, 688, 208, 64, 48,
			 2, 256, 136, 272, 8,
			 2, 516, 80, 224, 16,
			 2, 520, 176, 220, 8]
		],
		[
			"Cannons, open fire !", // Grass 8
			20,
			20,
			240,
			[0, 0, 0, 0, 3, -1],
			[7, 538, 48, 6, 516, 225],
			[2, 320, 224, 368, 32,
			 2, 256, 208, 64, 48,
			 2, 688, 208, 64, 48,
			 2, 256, 136, 272, 8,
			 2, 516, 80, 224, 16,
			 2, 520, 176, 220, 8]
		],
		[	// Solution : turn the fan towards the left and push the floating critters so that they miss the platform below
			"Pellets in the wind",	// Grass 9
			15,
			15,
			120,
			[0, 2, 0, 0, 2, -1],
			[7, 360, 60, 6, 755, 222],
			[2, 192, 96, 256, 24,
			 2, 432, 224, 400, 32,
			 2, 512, 112, 32, 16,
			 2, 512, 176, 32, 16]
		],
		[
			"The way of Theseus",	// Grass 10
			20,
			20,
			150,
			[0, 1, 0, 3, 0, -1], // 1 fan, 3 balloons
			[7, 224, 80, 6, 613, 227, 8, 678, 126, 8, 504, 180],
			[2, 192, 228, 320, 28,
			 2, 512, 231, 160, 25, 
			 2, 672, 220, 160, 36, 
			 2, 368, 180, 352, 8,
			 2, 752, 172, 64, 16,
			 2, 336, 128, 64, 16,
			 2, 448, 128, 128, 16,
			 2, 640, 128, 96, 16,
			 2, 736, 112, 32, 32,
			 2, 512, 80, 160, 12]
		],
		[	// Solution : dig a hole, put the tower in the middle
			"Shoot'em from above", // Grass 11
			10,
			10,
			180,
			[4, 0, 0, 0, 1, -1], // 4 mines, 1 tower
			[7, 192, 64, 6, 817, 159],	// entrance and exit
			[2, 100, 160, 800, 96]
		],
		[	// Solution : 3 towers side to side, or place them on platforms + balloons on the ground to get there
			"Anti aircraft weapons ready", // Grass 12
			15,
			15,
			180,
			[0, 0, 0, 3, 3, -1], // 3 balloons, 3 towers
			[7, 192, 64, 6, 840, 142],
			[2, 108, 144, 800, 112,
			 2, 320, 96, 32, 16,
			 2, 456, 80, 32, 16,
			 2, 592, 64, 32, 16,
			 2, 728, 48, 32, 16]
		],
		[	// Solutions : 2 towers on the ground, go after the survivors with the flamethrower
			"A little extra is required", // Grass 13
			15,
			15,
			180,
			[0, 0, 1, 0, 2, -1], // 1 flamethrower, 2 towers
			[7, 768, 64, 6, 241, 157],
			[2, 192, 160, 608, 96,
			 2, 800, 144, 32, 112]
		],
		[	// Solution : place the second balloons right where the critters land from releasing the first one, so they climb back up vertically
			// (with no horizontal speed). Then add a cannon in range.
			"Up and down", // Grass 14
			15,
			15,
			180,
			[0, 0, 0, 2, 2, -1], // 2 balloons, 2 towers
			[7, 192, 64, 6, 748, 138],
			[2, 160, 144, 640, 112,
			 2, 384, 96, 32, 16,
			 2, 576, 80, 32, 16]
		],
		[
			"Winds of change", // Grass 15
			12,
			12,
			240,
			[0, 2, 0, 1, 2, -1], // 2 fans, 1 balloon, 2 towers
			[7, 224, 80, 6, 814, 195],
			[2, 192, 192, 640, 64,
			 2, 448, 144, 320, 16,
			 2, 576, 80, 208, 16,
			 2, 256, 128, 128, 16 ]
		],
		[
			"Gone with the wind", // Ice 1
			20,
			10,
			120,
			[0, 3, 0, 0, 0, -1], // 3 fans
			[7, 300, 20, 6, 750, 207],
			[1, 200, 60, 544, 16,
			 1, 200, 208, 608, 48]
		],
		[
			"Cooked to order", // Ice 2
			20,
			15,
			120,
			[0, 0, 3, 0, 0, -1], // 3 flamethrowers,
			[7, 538, 48, 6, 516, 221],
			[32, 320, 224, 368, 32,
			 32, 256, 208, 64, 48,
			 32, 688, 208, 64, 48,
			 32, 256, 128, 272, 16,
			 32, 520, 80, 224, 16,
			 32, 520, 176, 220, 16] 
		],
		[
			"Caution, thin ice", // Ice 3
			15,
			15,
			120,
			[6, 0, 0, 0, 0, -1], // 6 mines
			[7, 538, 48, 6, 516, 221],
			[32, 480, 224, 208, 32,
			 1, 80, 128, 448, 16,
			 1, 520, 80, 224, 16,
			 1, 520, 176, 224, 16] 
		],
		[
			"Burning hot versus freezing cold", // Ice 4
			15,
			15,
			120,
			[0, 1, 1, 0, 0, -1], // 1 fan, 1 flamethrower
			[7, 250, 16, 6, 200, 223],
			[1, 224, 80, 320, 16,
			 1, 352, 128, 320, 16,
			 1, 320, 176, 448, 16,
			 1, 768, 160, 32, 32,
			 1, 160, 224, 256, 32] 
		],
		[	
			"Bad kids get grounded",	// Grass 5
			4,
			4,
			120,
			[2, 0, 0, 0, 0, -1], // 2 mines
			[7, 260, 100, 6, 740, 166, 3, 530, 193],
			[32, 200, 200, 400, 56,
 			 32, 630, 170, 130, 86]
		],
		[
			"In so many ways",	// Ice 6
			10,
			10,
			180,
			[3, 0, 0, 0, 0, -1], // 3 mines
			[7, 300, 50, 6, 220, 239, 6, 280, 239, 6, 340, 239, 6, 400, 239, 6, 460, 239, 6, 520, 239, 6, 580, 239, 6, 640, 239, 6, 700, 239, 6, 760, 239],
			[1, 256, 128, 448, 16,
 			 1, 192, 240, 608, 16]
		],
		[	// Solution : break the ice barrier with the dynamite, then shoot balloons above the water
			"Sometimes you need to let them in",	// Ice 7
			15,
			15,
			180,
			[0, 1, 1, 1, 1, -1], // fan, flamethrower, balloon, dynamite
			[7, 224, 80, 6, 806, 93],
			[32, 8, 160, 640, 96,
			 1, 488, 0, 32, 256,
			 32, 736, 96, 144, 160,
			 1, 472, 112, 64, 16 ]
		],
		[	// Solution : as in first level, use the dynamites to collapse the bridge below the entrance
			"When the ice bridge collapses", // Ice 8
			15,
			15,
			210,
			[0, 0, 1, 2, 2, -1], // flamethrower, 2 balloons, 2 dynamites
			[7, 224, 80, 6, 300, 127],
			[32, 192, 192, 640, 64,
			 241, 208, 208, 96, 48,
			 241, 336, 208, 96, 48,
			 241, 464, 208, 96, 48,
			 241, 592, 208, 96, 48,
			 241, 720, 208, 96, 48,
			 1, 832, 0, 32, 256,
			 1, 288, 128, 416, 16,
			 1, 400, 80, 288, 16]
		],
		[	// Solution : put balloons right at the entrance, shoot'em immediately so the critters get on the lower platform
			// then move balloons to the far right, letting them reach the upper platform. Blow dynamites on both the middle
			// and lower platform so at the end of the upper one they jump straight to the water (good timing needed)
			"Thawing glaciers", // Ice 9
			12,
			12,
			210,
			[0, 0, 1, 2, 2, -1], // flamethrower, 2 balloons, 1 dynamite
			[7, 224, 80, 6, 320, 127],
			[32, 256, 192, 576, 64,
			 32, 192, 160, 64, 96,
			 241, 336, 208, 96, 48,
			 241, 464, 208, 96, 48,
			 241, 592, 208, 96, 48,
			 241, 720, 208, 96, 48,
			 1, 832, 0, 32, 256,
			 1, 296, 128, 416, 16,
			 1, 400, 80, 288, 16]
		],
		[	// Solution : put balloons so that they remain on the topmost platform, until they hit the wall on the right
			"Keep them at bay", // Ice 10
			12,
			0,
			60,
			[0, 2, 0, 2, 0, -1], // 2 fans, 2 balloons
			[7, 192, 80, 6, 360, 143, 6, 720, 143, 6, 948, 80],
			[1, 0, 0, 32, 256,
			 1, 968, 0, 32, 256,
			 32, 32, 192, 256, 64,
			 32, 288, 224, 256, 64,
			 32, 576, 192, 64, 64,
			 33, 544, 224, 32, 64, 
			 32, 640, 224, 328, 32, 
			 32, 350, 144, 128, 16,
			 32, 342, 80, 162, 16,
			 32, 568, 142, 64, 18,
			 34, 504, 77, 64, 19,
			 32, 704, 144, 128, 16,
			 32, 696, 80, 128, 16,
			 32, 856, 110, 32, 18,
			 34, 824, 77, 32, 19,
			 32, 936, 80, 32, 16
			]
		],
		[	// Solution : blow a balloon to get the first critter on the top platform, have a mine explode above the water,
			// then shoot the others when they get above that point
			"One leading the way down", // Ice 11
			12,
			12,
			180,
			[1, 1, 0, 2, 0, -1], // 1 mine, 1 fan, 2 ballons
			[7, 224, 80, 6, 827, 201],
			[32, 192, 208, 400, 64,
			 32, 656, 208, 192, 64,
			 32, 432, 112, 304, 20,
			 32, 240, 112, 96, 20]
		],
		[
			"A long way up", // Ice 12
			12,
			12,
			120,
			[2, 0, 1, 0, 2, -1], // 2 mines, 1 flamethrower, 2 dynamites
			[7, 192, 80, 6, 938, 85],
			[33, 160, 248, 144, 40,
			 33, 160, 224, 80, 48,
			 33, 160, 200, 56, 48,
			 33, 160, 176, 32, 48,
			 33, 160, 152, 8, 48,
			 32, 160, 144, 112, 32,
			 32, 320, 88, 16, 40,
			 33, 268, 140, 52, 40,
			 32, 448, 88, 16, 40,
			 33, 288, 248, 160, 40,
			 32, 576, 88, 16, 40,
			 33, 416, 248, 160, 40,
			 32, 704, 88, 16, 40,
			 33, 544, 248, 160, 40,
			 32, 832, 88, 160, 40,
			 33, 672, 248, 160, 40
			]
		],
		[	// Solution : remove the balloons on the upper right platform, move the balloons from the center platform a little to the left
			// Add a mine at the beginning of the upper right platform, then stack mines right below as the critters reach the ground,
			// until you dig down to the water
			"All you need is a good landing spot", // Ice 13
			12,
			12,
			120,
			[5, 0, 0, 0, 0, -1], // 5 mines
			[7, 192, 60, 6, 800, 97, 3, 348, 95, 3, 532, 127, 3, 941, 192, 3, 56, 188, 3, 635, 95],
			[1, 0, 0, 32, 256,
			 1, 968, 0, 32, 256,
			 32, 32, 192, 360, 64,
			 32, 450, 128, 103, 128,
			 32, 611, 187, 357, 69,
			 33, 392, 187, 58, 133,
			 34, 553, 127, 59, 129,
			 32, 160, 96, 192, 24,
			 32, 624, 96, 192, 24
			 
			 ],
		],
		[	// Solution : bring the exit to the water with 3 dynamites. Use the other two to destroy the stairs.
			"Double trouble", // Ice 14
			24,
			24,
			150,
			[0, 0, 1, 0, 5, -1], // 1 flamethrower, 5 dynamites
			[7, 160, 60, 7, 750, 60, 6, 500, 143],
			[1, 0, 0, 32, 256,
			 1, 968, 0, 32, 256,
			 32, 32, 192, 384, 64,
			 32, 416, 144, 160, 112,
			 32, 576, 192, 392, 64,
			 32, 128, 96, 224, 24,
			 32, 656, 96, 224, 24
			 ]
		],
		[	// Solution : move all exits until time runs out
			"Last battle, only weasels and your bare hands", // Ice 15
			20,
			0,
			90,
			[0, 0, 0, 0, 0, -1], // nothing !
			[7, 192, 80, 6, 770, 143, 6, 612, 131, 6, 490, 216, 3, 695, 145],
			[32, 160, 192, 128, 64,
			 32, 288, 224, 256, 64,
			 32, 571, 191, 69, 65,
			 33, 544, 217, 27, 70, 
			 32, 640, 224, 288, 32, 
			 32, 336, 142, 128, 24,
			 32, 342, 80, 161, 18,
			 32, 558, 133, 72, 20,
			 34, 503, 76, 56, 21,
			 32, 684, 144, 128, 24,
			 32, 696, 80, 128, 16,
			 32, 856, 110, 32, 18,
			 34, 824, 77, 32, 19,
			 33, 288, 190, 48, 24,
			 33, 640, 188, 44, 24,
			]
		]
	];
}

LevelLoader.prototype = {

	getLevel : function(index)
	{
		if (index<0 || index>=this.levels.length) {
			index = 0;
		}
		return this.levels[index];
	}
	
}
