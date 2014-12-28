/**
 * @constructor
 */
 
function PlayField(noiseImage)
{
	this.scenerySource = document.createElement("canvas");
	this.scenerySource.width = 1024;
	this.scenerySource.height = 256;
	var bufferContext = this.scenerySource.getContext('2d');
	
	bufferContext.drawImage(noiseImage, 0, 0);
	this.sourceData = bufferContext.getImageData(0, 0, this.scenerySource.width, this.scenerySource.height).data;
}

PlayField.prototype = {

	create : function(imageData, width, height) {
		this.imageData = imageData;
		this.imageBuffer = imageData.data;
		this.width = width;
		this.height = height;
	},
	
	pseudoRandom : function()
	{
		this.seed = 3.902*this.seed*(1-this.seed);
		return this.seed;
	},
	
	initFromDescription : function(desc)
	{
		this.seed = 1.0/(1+desc.length);
		for (var i=this.height*this.width*4; i; ) {
			this.imageBuffer[--i] = 0;
		}
		for (var i=0; i<desc.length; i+=5)
		{
			switch (desc[i])
			{
				case 1:
					this.drawIceBlocks(desc[i+1], desc[i+2], desc[i+3], desc[i+4]);
					break;
				case 2:
				case 3:
					this.drawGrassTile(desc[i+1], desc[i+2], desc[i+3], desc[i+4], (desc[i]==3));
					break;
				case 32:
					this.drawSnowTile(desc[i+1], desc[i+2], desc[i+3], desc[i+4], 0, true);
					break;					
				case 33:
					this.drawSnowTile(desc[i+1], desc[i+2], desc[i+3], desc[i+4], -1, false);
					break;					
				case 34:
					this.drawSnowTile(desc[i+1], desc[i+2], desc[i+3], desc[i+4], 1, false);
					break;					
				case 239:
					this.carveCliffTopEdge(desc[i+1], desc[i+2], desc[i+3], desc[i+4]);
					break;
				case 240:
					this.carveOverhangingCliff(desc[i+1], desc[i+2], desc[i+3], desc[i+4]);
					break;
				case 241:
					this.carveArch(desc[i+1], desc[i+2], desc[i+3], desc[i+4]);
					break;
				case 256:	// temp
					for (var x=0; x<desc[i+3];++x) for (var y=0;y<desc[i+4];++y) {
						this.setColorAt(x+desc[i+1], y+desc[i+2], 0, 128, 0, 255);
					}
					break;
				default:
			}
			
		}
		this.cacheValid = false;
	},
	
	/**
	 * Draw an (almost) rectangular tile with grass on top and Voronoise-derived earth / rock below
	 * Tile code : 2 (flat) & 3 (with hill)
	 * Grassland theme
	 * @param x0 left coordinate, in pixels
	 * @param y0 top coordinate, in pixels
	 * @param width width in pixels
	 * @param height height in pixels
	 * @param hill true if the ground is a hill, false for a flat ground
	 */
	drawGrassTile : function(x0, y0, width, height, hill)
	{
		var prevY = 0;
		for (var x=0; x<width; ++x) 
		{
			var nextY = prevY+2*this.pseudoRandom()-1.2+(hill ? .05*(x-.7*width)*Math.exp(-(x-.7*width)*(x-.7*width)/4000) : 0);
			var dy = 1+4*this.pseudoRandom();
			var dy2 = dy+1+3*this.pseudoRandom();
			
			for (var y=0; y<dy2; ++y)
			{
				var color = (y>0 && y<dy ? 1 : 0);
				this.setColorAt(x+x0, nextY+y+y0, [34, 119][color], [102, 153][color], [34, 0][color], 255);
			}
			for (; nextY+y<height; ++y)
			{
				// pattern derived from Voronoise
				var n = (y<dy2+4?0:1)+(this.sourceData[4*(1024*Math.floor(nextY+y+y0)+Math.floor(x+x0))]>>6);
				//var n = Math.max(0, Math.floor(4*this.noise(x/10, 10+(y+nextY)/5)));
				this.setColorAt(x+x0, nextY+y+y0, [102, 102, 136, 170, 204][n], [0, 0, 34, 85, 119][n], [0, 0, 17, 17, 0][n], 255);
			}
			prevY = nextY;
		}
	},
	
	/**
	 * Draw a rectangle made of blue-ice 32x16 tiles
	 * Tile code : 1
	 * Winter theme
	 * @param x0 left coordinate, in pixels
	 * @param y0 top coordinate, in pixels
	 * @param width width in pixels
	 * @param height height in pixels
	 */
	drawIceBlocks : function(x0, y0, width, height)
	{
		for (var x=0; x<width; ++x) for (var y=0; y<height; ++y)
		{
			var n = (x%32)==0 ||(y%16)==0 ? 3 : ((x%32)==31 || (y%16)==15 ? 0 : (((x+y)&20)==20 ? 2 : 1));
			this.setColorAt(x+x0, y+y0, [0, 64, 150, 204][n], [32, 160, 224, 255][n], [128, 224, 255, 255][n], 255);
		}
	},
	
	/**
	 * Draw an (almost) rectangular tile covered in snow
	 * Tile code : 32
	 * Winter theme
	 * @param x0 left coordinate, in pixels
	 * @param y0 top coordinate, in pixels
	 * @param width width in pixels
	 * @param height height in pixels
	 * @param slope slope in pixels, for each pixel right (positive = down, negative = up)
	 * @param sides true to have some snow on the sides. Use false on connecting tiles.
	 */
	drawSnowTile : function(x0, y0, width, height, slope, sides)
	{
		var cumulatedSlope = 0;
		var prevY = 0;
		var sideWidth = (sides ? 3 : 0);
		for (var x=-sideWidth; x<width+sideWidth; x+=16) 
		{
			var nextY = prevY+(slope!=0?0:5*this.pseudoRandom()-3);
			for (var dx=0; dx<16&&x+dx<width+sideWidth; ++dx)
			{
				cumulatedSlope+=slope;
				var dy = (prevY*(16-dx)+nextY*dx)>>4;
				var snowStart = -Math.min(0, x+dx)-Math.min(0, width-x-dx);
				for (var y=snowStart; y<10-snowStart && dy+y+y0<this.height; ++y)
				{
					var color = 9-y;
					this.setColorAt(x+dx+x0, dy+y+y0+cumulatedSlope, 
									[0, 32, 64, 152, 240, 240, 240, 240, 240, 64][color], 
									[96, 128, 183, 240, 240, 240, 240, 240, 240, 128][color], 
									[180, 240, 240, 240, 240, 240, 240, 240, 240, 240][color], 
									255);
				}
				for (; dy+y<height && dx+x>=0 && dx+x<width && dy+y+y0+cumulatedSlope<this.height; ++y)
				{
					// pattern derived from Voronoise
					var n = (y<12?0:1)+(this.sourceData[4*(1024*Math.floor(dy+y+y0+cumulatedSlope)+Math.floor(x+dx+x0))]>>6);
					var n2 = (y<12?0:1)+(this.sourceData[4*(1024*(Math.floor(dy+y+y0+cumulatedSlope+2)%256)+(Math.floor(x+dx+x0+2)%1024))]>>6);
					//var n = Math.max(0, Math.floor(4*this.noise(x/10, 10+(y+nextY)/5)));
					this.setColorAt(x+dx+x0, dy+y+y0+cumulatedSlope, [0, 0, 0, 32, 64, 152, 240, 240, 240][n+n2], [32, 32, 96, 128, 183, 240, 240, 240, 240][n+n2], [120, 120, 180, 240, 240, 240, 240, 240, 240][n+n2], 255);
				}

			}
			prevY = nextY;
		}
		
	},
	
	/**
	 * Carve a cliff into existing scenery, deleting pixels as it goes. 
	 * The pixels removed are in shape of a rectangle, tapered towards the bottom, 
	 * so the remaining cliff is rounded at the edge
	 * Tile code : 239
	 * Grassland theme (and possibly others)
	 * @param x0 left coordinate, in pixels
	 * @param y0 top coordinate, in pixels
	 * @param halfWidth width in pixels for each side (width pixels on the left of x0 and as many on the right)
	 * @param height height in pixels
	 */
	carveCliffTopEdge : function(x0, y0, halfWidth, height)
	{
		var w = halfWidth>>1;
		for (var y=height-1; y>=0; --y)
		{
			w += 4*this.pseudoRandom()-2.1;
			for (var x=-w; x<=w; ++x) 
			{
				this.setColorAt(x+x0, y+y0, 255, 0, 0, 0);
			}
		}
	},
	
	/**
	 * Carve a cliff into existing scenery, deleting pixels as it goes. 
	 * The pixels removed are in shape of a rectangle, tapered towards the top, 
	 * so the remaining scenery has the aspect of an overhang
	 * Tile code : 240
	 * Grassland theme (and possibly others)
	 * @param x0 left coordinate, in pixels
	 * @param y0 top coordinate, in pixels
	 * @param halfWidth width in pixels for each side (width pixels on the left of x0 and as many on the right)
	 * @param height height in pixels
	 */
	carveOverhangingCliff : function(x0, y0, halfWidth, height)
	{
		var w = halfWidth>>1;
		for (var y=0; y<height; ++y)
		{
			w += 4*this.pseudoRandom()-2.1;
			for (var x=-w; x<=w; ++x) 
			{
				this.setColorAt(x+x0, y+y0, 255, 0, 0, 0);
			}
		}
	},
	
	/**
	 * Carve an arch into existing scenery, deleting pixels as it goes. 
	 * The pixels removed are in shape of a circle or ellipse
	 * Tile code : 241
	 * Grassland and ice theme (and possibly others)
	 * @param x0 left coordinate, in pixels
	 * @param y0 top coordinate, in pixels
	 * @param width width in pixels
	 * @param height height in pixels
	 */
	carveArch : function(x0, y0, width, height)
	{
		for (var x=0; x<width; ++x)
		{
			var y=Math.floor(height*(1-Math.sqrt(1-Math.pow(x-width/2,2)/(width*width/4))));
			for (; y<height; ++y)
			{
				this.setColorAt(x+x0, y+y0, 255, 0, 0, 0);
			}
		}
	},
	/*
	hash3x : function(x,y)
	{
		var t=(x+y)*(500.15*(x-y)-Math.floor(500.15*(x-y)))*(40.946*y-Math.floor(40.946*y));
		return t-Math.floor(t);
	},

	hash3y : function(x,y)
	{
		var t=(x-y)*((x+y)-51.707-Math.floor((x+y)*51.707))*(Math.ceil(222.2*y)-222.2*y);
		return t-Math.floor(t);
	},

	hash3z : function(x,y,z)
	{
		var t =(x+y)*y+(x-1.414*y)*x;
		return t-Math.floor(t);
	},
	*/
	/**
	 * Noise function for rocky cliffs
	 * Inspired by Inigo Quilez's Voronoise :
	 * http://www.iquilezles.org/www/articles/voronoise/voronoise.htm
	 */
	 /*
	noise : function(x, y)
	{
		var px = Math.floor(x);
		var py = Math.floor(y);
		var fx = x-px;
		var fy = y-py;

		var va = 0.0;
		var wt = 0.0;
		for( var j=-2; j<=2; j++ )
		for( var i=-2; i<=2; i++ )
		{
			var rx = i-fx+this.hash3x(px+i, py+j);
			var ry = j-fy+this.hash3y(px+i, py+j);
			var w = Math.pow(1.0-Math.sqrt(rx*rx+ry*ry), 8.0);
			va += w*this.hash3z(px+i, py+j, 0);
			wt += w;
		}

		return va/wt;
	},

	noise2 : function(x, y)
	{
		var px = Math.floor(x);
		var py = Math.floor(y);
		var fx = x-px;
		var fy = y-py; 
		
		var h00 = this.hash3x(px, py);
		var h10 = this.hash3x(px+1, py);
		var h01 = this.hash3x(px, py+1);
		var h11 = this.hash3x(px+1, py+1);
	
		return (1-fx)*(1-fy)*h00+(1-fx)*fy*h01+fx*(1-fy)*h10+fx*fy*h11;
	},
	*/
	
	setColorAt : function(x, y, r, g, b, a)
	{
		x = Math.floor(x);
		y = Math.floor(y);
		this.imageBuffer[x*4+y*4*this.width]=r;
		this.imageBuffer[x*4+y*4*this.width+1]=g;
		this.imageBuffer[x*4+y*4*this.width+2]=b;
		this.imageBuffer[x*4+y*4*this.width+3]=a;
	},
	
	/**
	 * Retrieve the background buffer.
	 * Used for collision tests during the critter walk.
	 */
	getBuffer : function() {
		return this.imageBuffer;
	},
	
	/**
	 * Test for collision inside a box
	 * Collisions beyond the playfield are always false on top, left and right
	 * and true on the bottom (to avoid infinite fall if the ground collapsed)
	 * @return number of pixels inside the box
	 */
	intersectBox : function(x0, y0, dx, dy) {
		var count = 0;
		x0 = Math.floor(x0);
		y0 = Math.floor(y0);
		for (var y=Math.max(0, y0); y<y0+dy; ++y) {
			if (y>this.height) {
				count+=dx;
			} else {
				for (var x=Math.max(0, x0); x<Math.min(x0+dx, this.width-1); ++x) {
					count += (this.imageBuffer[x*4+y*4*this.width+3]>128 ? 1 : 0);
				}
			}
		}
		return count;
	},

	/**
	 * Attempts to find the height of a cliff
	 * as seen by a critter that located at the bottom.
	 * Used to define a call for action (build stairs here)
	 * @return height in pixels, -1 if it goes to the top of the screen
	 */
	assessCliffHeight : function(x0, y0)
	{
		x0 = Math.floor(x0);
		y0 = Math.floor(y0);
		for (var y=y0; y>0; --y)
		{
			if (this.imageBuffer[x0*4+y*4*this.width+3]<128)
			{
				return y0-y;
			}
		}
		return -1;
	},
	 
	
	
	/**
	 * Detonate a charge, emptying a disc around the epicenter.
	 * @param x0 x-coordinate of the epicenter
	 * @param y0 y-coordinate of the epicenter
	 * @param radius radius in pixels of the emptied area
	 */
	explode : function(x0, y0, radius)
	{
		for (var y=-radius; y<=radius; ++y)
		{
			var rx = Math.floor(Math.sqrt(radius*radius-y*y));
			for (var x=-rx; x<=rx; ++x)
			{
				if (x+x0>=0 && x+x0<this.width && y+y0>=0 && y+y0<this.height)
				{
					this.imageBuffer[(x+x0)*4+(y+y0)*4*this.width+3] = 0;
				}
			}
		}
		this.cacheValid = false;	// scenery modified, redraw needed
	},
	
	/**
	 * Add one step of stairs
	 * @param x location of the critter building the stairs
	 * @param y location of the critter building the stairs
	 * @param dx orientation of the critter (1 = right, -1 = left)
	 */
	addStairs : function(x, y, dx)
	{
		x+=4*dx;
		this.setColorAt(x,y,136,95,17,255);
		--y;
		this.setColorAt(x,y,136,95,17,255);
		x+=dx;
		this.setColorAt(x,y,136,95,17,255);
		x+=dx;
		this.setColorAt(x,y,136,95,17,255);
		this.cacheValid = false;	// scenery modified, redraw needed
	},
	
	/**
	 * When starting to build stairs
	 */
	addFloor : function(x, y, dx)
	{
		x-=3*dx;
		for (var i=0; i<7; ++i)
		{
			this.setColorAt(x,y,136,95,17,255);
			x+=dx;
		}
		this.cacheValid = false;	// scenery modified, redraw needed
	},
	
	/**
	 * Draw call, invoked by the renderer
	 * Only draws if the cache is invalid, i.e. the scenery has changed
	 */
	render : function(context)
	{
		if (!this.cacheValid)
		{
			context.putImageData(this.imageData, 0, 0);
			this.cacheValid = true;
		}
	}
	
}
