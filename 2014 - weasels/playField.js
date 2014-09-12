/**
 * @constructor
 */
 
function PlayField()
{
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
			if (desc[i]==1)	// floor tiles
			{
				for (var x=0; x<desc[i+3]; ++x) for (var y=0; y<desc[i+4]; ++y)
				{
					var n = (x%32)==0 ||(y%16)==0 ? 3 : ((x%32)==31 || (y%16)==15 ? 0 : (((x+y)&20)==20 ? 2 : 1));
					this.setColorAt(x+desc[i+1], y+desc[i+2], [0, 64, 150, 204][n], [32, 160, 224, 255][n], [128, 224, 255, 255][n], 255);
				}
			}
			if (desc[i]==2 || desc[i]==3)	// grass and rock
			{
				var prevY = 0;
				for (var x=0; x<desc[i+3]; ++x) 
				{
					var nextY = prevY+2*this.pseudoRandom()-1.2+(desc[i]==3 ? .05*(x-.7*desc[i+3])*Math.exp(-(x-.7*desc[i+3])*(x-.7*desc[i+3])/4000) : 0);
					var dy = 1+4*this.pseudoRandom();
					var dy2 = dy+1+3*this.pseudoRandom();
					
					for (var y=0; y<dy2; ++y)
					{
						var color = (y>0 && y<dy ? 1 : 0);
						this.setColorAt(x+desc[i+1], nextY+y+desc[i+2], [34, 119][color], [102, 153][color], [34, 0][color], 255);
					}
					for (; nextY+y<desc[i+4]; ++y)
					{
						var n = Math.max(0, Math.floor(4*this.noise(x/10, 10+(y+nextY)/5)));
						//n = Math.floor(4*this.noise2(x/10, (y+nextY)/5));
						this.setColorAt(x+desc[i+1], nextY+y+desc[i+2], [102, 136, 170, 204][n], [0, 34, 85, 119][n], [0, 17, 17, 0][n], 255);
					}
					prevY = nextY;
				}
			}
		}
		this.cacheValid = false;
	},
	
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
	
	/**
	 * Noise function for rocky cliffs
	 * Inspired by Inigo Quilez's Voronoise :
	 * http://www.iquilezles.org/www/articles/voronoise/voronoise.htm
	 */
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
	/*
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
