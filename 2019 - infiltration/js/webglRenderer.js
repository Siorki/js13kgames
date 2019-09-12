/**
 * @constructor
 */
function WebGLRenderer(canvas, game)
{
	gl=canvas.getContext('webgl');
	this.canvas=canvas;
	this.game=game;
	this.resizeWindow();
}

WebGLRenderer.prototype = {

	initialize : function() {
		gl.clearColor(0., 0., 0., 1.);                      // Set clear color to black, fully opaque
		gl.clearDepth(1.0);                 				// Clear everything
		gl.enable(gl.DEPTH_TEST);                           // Enable depth testing
		gl.depthFunc(gl.LEQUAL);                            // Near things obscure far things

		var solidVertexShader, solidFragmentShader, dustVertexShader, dustFragmentShader;
		// init shaders
		gl.shaderSource(solidVertexShader=gl.createShader(gl.VERTEX_SHADER), "attribute vec3 a;attribute vec2 t;attribute vec3 n;uniform mat4 mX,mP;varying vec2 vT;varying vec4 vP;varying vec3 vN;void main(){vN=(mX*vec4(n,0.)).rgb,vP=mX*vec4(a,1.),gl_Position=mP*vP,vT=t,gl_PointSize=1.;}");
		gl.compileShader(solidVertexShader);  
		gl.shaderSource(solidFragmentShader=gl.createShader(gl.FRAGMENT_SHADER), `
			#ifdef GL_ES
			precision lowp float;
			#endif	
			
			varying lowp vec2 vT;
			varying lowp vec3 vN;
			varying lowp vec4 vP;
			uniform sampler2D uS;
			uniform vec4 uE;
			uniform vec4 uC;
			uniform vec3 uL;
			void main(void) {
				lowp vec3 n = normalize(vN);
				lowp vec4 tC = texture2D(uS, vec2(vT.s, vT.t));
				tC = mix(vec4(uC.rgb, 1.0), tC, tC.a);
				if (uC.a==.6) {
					tC = vec4(uC.rgb, 1.0);
				}
				lowp vec3 lightDir = normalize(uL-vP.xyz);
				lowp vec3 halfDir = normalize(lightDir+normalize(uE.xyz-vP.xyz));
				float diffuse = 0.2+dot(n, lightDir)+2./distance(vec3(718.0, 1.0, 1315.0), vP.xyz); 
				float specular = pow(max(0.0, dot(halfDir, n)), 2.0);
				if (uC.a==.7) {
					diffuse = 1.;
				} 
				gl_FragColor = vec4 (uC.a*specular+diffuse*tC.rgb, tC.a);
			}`);
			
		gl.compileShader(solidFragmentShader);  	
		gl.shaderSource(dustVertexShader=gl.createShader(gl.VERTEX_SHADER), "attribute vec3 a;attribute vec2 t;attribute vec3 c;uniform mat4 mX,mP;varying vec2 vT;varying vec4 vP;varying vec3 vC;void main(){vC=c,vP=mX*vec4(a,1.),gl_Position=mP*vP,vT=t;}");
		gl.compileShader(dustVertexShader);  
		gl.shaderSource(dustFragmentShader=gl.createShader(gl.FRAGMENT_SHADER), `
			#ifdef GL_ES
			precision lowp float;
			#endif	
			
			varying lowp vec2 vT;
			varying lowp vec4 vP;
			varying lowp vec3 vC;
			void main(void) {
				float tI = 1.0-vT.s*vT.s-vT.t*vT.t;
				gl_FragColor = vec4 (vC.rgb, 0.8*tI);
			}`);

		gl.compileShader(dustFragmentShader);  
		
/*
		var s1 = gl.getShaderParameter(solidVertexShader, gl.COMPILE_STATUS);
		alert(gl.getShaderInfoLog(solidVertexShader));
		var s2 = gl.getShaderParameter(solidFragmentShader, gl.COMPILE_STATUS);
		alert(gl.getShaderInfoLog(solidFragmentShader));
		var s3 = gl.getShaderParameter(dustVertexShader, gl.COMPILE_STATUS);
		alert(gl.getShaderInfoLog(dustVertexShader));
		var s4 = gl.getShaderParameter(dustFragmentShader, gl.COMPILE_STATUS);
		alert(gl.getShaderInfoLog(dustFragmentShader));
*/
		
		   
		gl.attachShader(this.solidShaderProgram = gl.createProgram(), solidVertexShader);
		gl.attachShader(this.solidShaderProgram, solidFragmentShader);
		gl.linkProgram(this.solidShaderProgram);

		gl.useProgram(this.solidShaderProgram);
		gl.enableVertexAttribArray(gl.getAttribLocation(this.solidShaderProgram, "a"));	// vertex position
		gl.enableVertexAttribArray(gl.getAttribLocation(this.solidShaderProgram, "t"));	// vertex texture coordinate
		gl.enableVertexAttribArray(gl.getAttribLocation(this.solidShaderProgram, "n"));	// vertex normal

		gl.attachShader(this.dustShaderProgram = gl.createProgram(), dustVertexShader);
		gl.attachShader(this.dustShaderProgram, dustFragmentShader);
		gl.linkProgram(this.dustShaderProgram);
		gl.useProgram(this.dustShaderProgram);
		gl.enableVertexAttribArray(gl.getAttribLocation(this.dustShaderProgram, "a"));	// vertex position
		gl.enableVertexAttribArray(gl.getAttribLocation(this.dustShaderProgram, "t"));	// vertex texture coordinate
		gl.enableVertexAttribArray(gl.getAttribLocation(this.dustShaderProgram, "c"));	// vertex color
		
		gl.useProgram(this.solidShaderProgram);
		this.createShipGeometry();  
		
		this.explosionGeometryRawBuffer = new Float32Array(7200);
		this.explosionTextureRawBuffer = new Float32Array(4800);
		for (var i=0; i<4800; ++i) { 
			this.explosionTextureRawBuffer[i] = [-1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0][i%12]; 
		}
		this.explosionColorRawBuffer = new Float32Array(7200);
		this.explosionGeometryGLBuffer = gl.createBuffer();
		this.explosionTextureGLBuffer = gl.createBuffer();
		this.explosionColorGLBuffer = gl.createBuffer();
				
		this.reset();	// internal non-GL data
		
	},
	
	/**
	 * Draw the contents of the secondary canvas that will be used as a texture
	 */
	initializeTexture : function()
	{
		gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById("m")); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		
	},

	/**
	 * Resets the view contents to the situation at the beginning of the game
	 * No particles, no explosions
	 */
	reset : function() {
		this.explosions = [];
		this.tumblingReactors = [];
	},
	
	
	resizeWindow : function() {
		var width = window.innerWidth, height=window.innerHeight;
		this.canvas.height=gl.height=height;
		this.canvas.width=gl.width=width;
		this.panelWidth = width;
		this.panelHeight = height;
	},
	
	
	createShipGeometry : function()
	{
		this.shipGeometryRawBuffer = [];
		this.shipTextureCoordRawBuffer = [];
		this.shipNormalRawBuffer = [];
		
		// elliptic paraboloid : [ a.u.cos(v) , b.u.sin(v) , u² ]
		// 2x10 strips, 42 vertices each
		var a = .5, b = .2;
		for (var u=0; u<.95; u+=.1) {
			var u2 = u+.1;
			this.shipGeometryRawBuffer.push (a*u, 0, u*u-1);
			this.shipGeometryRawBuffer.push (a*u2, 0, u2*u2-1);
			this.shipNormalRawBuffer.push(...this.normalizeVector3([2*u*b, 0, -a*b]));
			this.shipNormalRawBuffer.push(...this.normalizeVector3([2*u2*b, 0, -a*b]));
			this.shipTextureCoordRawBuffer.push(.75, .5+u*.25, .75, .5+u2*.25);
			for (var v=1; v<21; ++v) {
				var angle = v*Math.PI/10;
				this.shipGeometryRawBuffer.push (a*u*Math.cos(angle), b*u*Math.sin(angle), u*u-1);
				this.shipGeometryRawBuffer.push (a*u2*Math.cos(angle), b*u2*Math.sin(angle), u2*u2-1);
				this.shipNormalRawBuffer.push(...this.normalizeVector3([2*u*b*Math.cos(angle), 2*a*u*Math.sin(angle), -a*b]));
				this.shipNormalRawBuffer.push(...this.normalizeVector3([2*u2*b*Math.cos(angle), 2*a*u2*Math.sin(angle), -a*b]));
				this.shipTextureCoordRawBuffer.push(.75+.25*v/20, .5+u*.25, .75+.25*v/20, .5+u2*.25);
			}
		}
		for (var u=0; u<.95; u+=.1) {
			var u2 = u+.1;
			this.shipGeometryRawBuffer.push (a*u, 0, .16*(1-u*u));
			this.shipGeometryRawBuffer.push (a*u2, 0, .16*(1-u2*u2));
			this.shipNormalRawBuffer.push(...this.normalizeVector3([2*u*b, 0, .4*a*b]));
			this.shipNormalRawBuffer.push(...this.normalizeVector3([2*u2*b, 0, .4*a*b]));
			this.shipTextureCoordRawBuffer.push(.75, .7+u*.05, .75, .7+u2*.05);
			for (var v=1; v<21; ++v) {
				var angle = v*Math.PI/10;
				this.shipGeometryRawBuffer.push (a*u*Math.cos(angle), b*u*Math.sin(angle), .16*(1-u*u));
				this.shipGeometryRawBuffer.push (a*u2*Math.cos(angle), b*u2*Math.sin(angle), .16*(1-u2*u2));
				this.shipNormalRawBuffer.push(...this.normalizeVector3([2*u*b*Math.cos(angle), 2*a*u*Math.sin(angle), .4*a*b]));
				this.shipNormalRawBuffer.push(...this.normalizeVector3([2*u2*b*Math.cos(angle), 2*a*u2*Math.sin(angle), .4*a*b]));
				this.shipTextureCoordRawBuffer.push(.75+.25*v/20, .7+u*.05, .75+.25*v/20, .7+u2*.05);
			}
		}

		
		// structural frame to reactors
		// 4x22 strips, 42 vertices each
		for (var nr=0; nr<4; ++nr) {
			var x0 = [-.2, .2, -.2, .2][nr], y0 = [-.08, -.08, .08, .08][nr], z0 = -.5, h=.04;
			var dx = 1.5*x0, dy = 2.7*y0;
			
			for (var u=0; u<1.05; u+=.1)
			{
				var f = .5*u, u2 = u+.1, f2=.5*u2;
				for (var v=0; v<20; ++v) {
					var angle = v*1.78/19;
					this.shipGeometryRawBuffer.push (x0+u*dx, y0+u*dy+h*Math.sin(angle), z0+f-h*Math.cos(angle));
					this.shipGeometryRawBuffer.push (x0+u2*dx, y0+u2*dy+h*Math.sin(angle), z0+f2-h*Math.cos(angle));
					this.shipNormalRawBuffer.push(...this.normalizeVector3([-dy, dx+h*Math.sin(angle), h*Math.cos(angle)]));
					this.shipNormalRawBuffer.push(...this.normalizeVector3([-dy, dx+h*Math.sin(angle), h*Math.cos(angle)]));
					this.shipTextureCoordRawBuffer.push(.5+.2*u, .5+.25*v/20, .5+.2*u2, .5+.25*v/20);
				}
				this.shipGeometryRawBuffer.push (x0+u*dx, y0+u*dy, z0+f+h*4.7);
				this.shipGeometryRawBuffer.push (x0+u2*dx, y0+u2*dy, z0+f2+h*4.7);
				this.shipNormalRawBuffer.push(...this.normalizeVector3([-dy, dx+h*Math.sin(angle), h*Math.cos(angle)]));
				this.shipNormalRawBuffer.push(...this.normalizeVector3([-dy, dx+h*Math.sin(angle), h*Math.cos(angle)]));
				this.shipTextureCoordRawBuffer.push(.5+.2*u, .5, .5+.2*u2, .5);

				for (var v=0; v<20; ++v) {
					var angle = v*1.78/19;
					this.shipGeometryRawBuffer.push (x0+u*dx, y0+u*dy-h*Math.sin(angle), z0+f-h*Math.cos(angle));
					this.shipGeometryRawBuffer.push (x0+u2*dx, y0+u2*dy-h*Math.sin(angle), z0+f2-h*Math.cos(angle));
					this.shipNormalRawBuffer.push(...this.normalizeVector3([-dy, dx-h*Math.sin(angle), h*Math.cos(angle)]));
					this.shipNormalRawBuffer.push(...this.normalizeVector3([-dy, dx-h*Math.sin(angle), h*Math.cos(angle)]));
					this.shipTextureCoordRawBuffer.push(.5+.2*u, .5+.05*v/20, .5+.2*u2, .5+.05*v/20);
				}
				this.shipGeometryRawBuffer.push (x0+u*dx, y0+u*dy, z0+f+h*4.7);
				this.shipGeometryRawBuffer.push (x0+u2*dx, y0+u2*dy, z0+f2+h*4.7);
				this.shipNormalRawBuffer.push(...this.normalizeVector3([-dy, dx-h*Math.sin(angle), h*Math.cos(angle)]));
				this.shipNormalRawBuffer.push(...this.normalizeVector3([-dy, dx-h*Math.sin(angle), h*Math.cos(angle)]));
				this.shipTextureCoordRawBuffer.push(.5+.2*u, .5, .5+.2*u2, .5);
				
			}
		}
		
		// reactors
		// (4+1)x40 strips, 42 vertices each
		// fifth one is centered on (0,0), used to draw tumbling reactor only
		for (var nr=0; nr<5; ++nr) {
			var x0 = [-.6, .6, -.6, .6, 0][nr] , y0 = [-.4, -.4, .4, .4, 0][nr], r=.1;
			for (var v=0; v<20; ++v) {
				var angle = v*Math.PI/10;
				var angle2 = (v+1)*Math.PI/10;
				this.shipGeometryRawBuffer.push (x0+r*Math.cos(angle), y0+r*Math.sin(angle), -.4);
				this.shipGeometryRawBuffer.push (x0+r*Math.cos(angle2), y0+r*Math.sin(angle2), -.4);
				this.shipNormalRawBuffer.push(0,0,-1);
				this.shipNormalRawBuffer.push(0,0,-1);
				this.shipTextureCoordRawBuffer.push(.5, .5+v*.25/20, .5, .5+(v+1)*.25/20);
				for (var u=.05; u<1.02; u+=.05) {
					var s = u<.32 ? .05*Math.sin(u*Math.PI/.6) : .05*Math.sin((1-u)*Math.PI/1.4);
					this.shipGeometryRawBuffer.push (x0+(r+s)*Math.cos(angle), y0+(r+s)*Math.sin(angle), -.4+.7*u);
					this.shipGeometryRawBuffer.push (x0+(r+s)*Math.cos(angle2), y0+(r+s)*Math.sin(angle2), -.4+.7*u);
					this.shipNormalRawBuffer.push(...this.normalizeVector3([Math.cos(angle), Math.sin(angle), (u<.45 ? Math.cos(u*Math.PI/.8) : Math.sin((1-u)*Math.PI/1.2))]));
					this.shipNormalRawBuffer.push(...this.normalizeVector3([Math.cos(angle2), Math.sin(angle2), (u<.45 ? Math.cos(u*Math.PI/.8) : Math.sin((1-u)*Math.PI/1.2))]));
					this.shipTextureCoordRawBuffer.push(.5+.25*v/20, .5+u*.25, .5+.25*v/20, .5+u2*.25);
				}
				this.shipGeometryRawBuffer.push (x0+r*Math.cos(angle), y0+r*Math.sin(angle), -.4);
				this.shipGeometryRawBuffer.push (x0+r*Math.cos(angle2), y0+r*Math.sin(angle2), -.4);
				this.shipNormalRawBuffer.push(0,0,-1);
				this.shipNormalRawBuffer.push(0,0,-1);
				this.shipTextureCoordRawBuffer.push(.5, .5+v*.25/20, .5, .5+(v+1)*.25/20);
				for (var u=.05; u<1.02; u+=.05) {
					var s = u<.32 ? .05*Math.sin(u*Math.PI/.6) : .05*Math.sin((1-u)*Math.PI/1.4);
					this.shipGeometryRawBuffer.push (x0+(r-s)*Math.cos(angle), y0+(r-s)*Math.sin(angle), -.4+.7*u);
					this.shipGeometryRawBuffer.push (x0+(r-s)*Math.cos(angle2), y0+(r-s)*Math.sin(angle2), -.4+.7*u);
					this.shipNormalRawBuffer.push(...this.normalizeVector3([-Math.cos(angle), -Math.sin(angle), (u<.45 ? Math.cos(u*Math.PI/.8) : Math.sin((1-u)*Math.PI/1.2))]));
					this.shipNormalRawBuffer.push(...this.normalizeVector3([-Math.cos(angle2), -Math.sin(angle2), (u<.45 ? Math.cos(u*Math.PI/.8) : Math.sin((1-u)*Math.PI/1.2))]));
					this.shipTextureCoordRawBuffer.push(.5+.25*v/20, .5+u*.25, .5+.25*v/20, .5+u2*.25);
				}
			}
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.shipGeometryGLBuffer = gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.shipGeometryRawBuffer), gl.STATIC_DRAW);		

		gl.bindBuffer(gl.ARRAY_BUFFER, this.shipTextureCoordGLBuffer = gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.shipTextureCoordRawBuffer), gl.STATIC_DRAW);		
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.shipNormalGLBuffer = gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.shipNormalRawBuffer), gl.STATIC_DRAW);		
		
		this.game.world.setShipGeometry(this.shipGeometryRawBuffer, this.shipTextureCoordRawBuffer);
	},


	normalizeVector3 : function(a) 
	{
		var norm = Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
		return [a[0]/norm, a[1]/norm, a[2]/norm];
	},
	
	get43Matrix : function (ax, ay, tx, ty, tz) {
		var cx=Math.cos(ax), sx=Math.sin(ax);
		var cy=Math.cos(ay), sy=Math.sin(ay);
		return [ cy, -sx*sy, -sy*cx, tx,
				 0, cx, -sx, ty,
				 sy, sx*cy, cx*cy, tz];
	},
	
	/**
	 * 3D rotation + translation performed as a 4x3 matrix multiplication
	 * @param m 4x3 matrix, rotation in first three columns, translation in the 4th
	 * @param v 4-vector, xyz coordinates, then 0 for vector (no translation) or 1 for point (translation)
	 * @return transformed 3-vector
	 */
	multiply43 : function(m, v) {
		return [ 	m[0]*v[0]+m[1]*v[1]+m[2]*v[2]+m[3]*v[3],
					m[4]*v[0]+m[5]*v[1]+m[6]*v[2]+m[7]*v[3],
					m[8]*v[0]+m[9]*v[1]+m[10]*v[2]+m[11]*v[3] ];
	},
		
	/**
	 * Create a section of a corridor to the geometry, 
	 * including normals and texture coordinates
	 */
	addSquareCorridorSection : function(xc, yc, zc, ax, ay, txg, txw, txc) {
		var m = this.get43Matrix(ax, ay, xc, yc, zc);
		var mv1 = this.multiply43(m, [-3, -3, 0, 1]);
		var mv2 = this.multiply43(m, [3, -3, 0, 1]);
		var mv3 = this.multiply43(m, [-3, -3, -8, 1]);
		var mv4 = this.multiply43(m, [3, -3, -8, 1]);
		var mn = this.multiply43(m, [0, 1, 0, 0]);
		this.trackGeometryRawBuffer.push (...mv1);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv4);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackTextureCoordRawBuffer.push(txg, 0);
		this.trackTextureCoordRawBuffer.push(txg+.25, 0);
		this.trackTextureCoordRawBuffer.push(txg, .25);
		this.trackTextureCoordRawBuffer.push(txg, .25);
		this.trackTextureCoordRawBuffer.push(txg+.25, 0);
		this.trackTextureCoordRawBuffer.push(txg+.25, .25);

		var mv1 = this.multiply43(m, [-3, 3, 0, 1]);
		var mv2 = this.multiply43(m, [-3, -3, 0, 1]);
		var mv3 = this.multiply43(m, [-3, 3, -8, 1]);
		var mv4 = this.multiply43(m, [-3, -3, -8, 1]);
		var mn = this.multiply43(m, [1, 0, 0, 0]);
		this.trackGeometryRawBuffer.push (...mv1);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv4);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackTextureCoordRawBuffer.push(txw, .25);
		this.trackTextureCoordRawBuffer.push(txw+.25, .25);
		this.trackTextureCoordRawBuffer.push(txw, .5);
		this.trackTextureCoordRawBuffer.push(txw, .5);
		this.trackTextureCoordRawBuffer.push(txw+.25, .25);
		this.trackTextureCoordRawBuffer.push(txw+.25, .5);
		
		var mv1 = this.multiply43(m, [3, 3, 0, 1]);
		var mv2 = this.multiply43(m, [-3, 3, 0, 1]);
		var mv3 = this.multiply43(m, [3, 3, -8, 1]);
		var mv4 = this.multiply43(m, [-3, 3, -8, 1]);
		var mn = this.multiply43(m, [0, -1, 0, 0]);
		this.trackGeometryRawBuffer.push (...mv1);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv4);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackTextureCoordRawBuffer.push(txc, 0);
		this.trackTextureCoordRawBuffer.push(txc+.25, 0);
		this.trackTextureCoordRawBuffer.push(txc, .25);
		this.trackTextureCoordRawBuffer.push(txc, .25);
		this.trackTextureCoordRawBuffer.push(txc+.25, 0);
		this.trackTextureCoordRawBuffer.push(txc+.25, .25);

		var mv1 = this.multiply43(m, [3, -3, 0, 1]);
		var mv2 = this.multiply43(m, [3, 3, 0, 1]);
		var mv3 = this.multiply43(m, [3, -3, -8, 1]);
		var mv4 = this.multiply43(m, [3, 3, -8, 1]);
		var mn = this.multiply43(m, [-1, 0, 0, 0]);
		this.trackGeometryRawBuffer.push (...mv1);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv4);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackNormalRawBuffer.push(...mn);
		this.trackTextureCoordRawBuffer.push(txw+.25, .5);
		this.trackTextureCoordRawBuffer.push(txw, .5);
		this.trackTextureCoordRawBuffer.push(txw+.25, .25);
		this.trackTextureCoordRawBuffer.push(txw+.25, .25);
		this.trackTextureCoordRawBuffer.push(txw, .5);
		this.trackTextureCoordRawBuffer.push(txw, .25);

	},
	
	addConnectorSubsection : function(index, xc, yc, zc, ax, ay, dax, day)
	{
		// distance 32 = 4 steps
		var radiusY = (dax !=0 ? 32 / dax : 0);
		var radiusX = (day !=0 ? 32 / day : 0);
		
		dax /= 8; // 8 slices
		day /= 8;
		
		var m = this.get43Matrix(ax, ay, xc, yc, zc);

		if (Math.abs(radiusX) < .01 && Math.abs(radiusY) < .01) {	// corridors are on a straight line
			for (var i=0; i<4; ++i) {
				this.addSquareCorridorSection(xc, yc, zc, ax, ay, 0, .25, .5);
				[xc, yc, zc] = this.multiply43(m, [0, 0, -8*i-8, 1]);
			}
			return [xc, yc, zc];
		}

		var xr, yr, zr;
		[xr, yr, zr] = this.multiply43(m, [radiusX, radiusY, 0, 1]);
		this.sectorFrame[index].push(xr, yr, zr, -radiusX, -radiusY);
		
		var m1 = this.get43Matrix(ax, ay, xr, yr, zr);
		
		for (var index=0; index<8; ++index) {	// 8 slices
			ax += dax;
			ay += day;
			var m2 = this.get43Matrix(ax, ay, xr, yr, zr);
			var mv1 = this.multiply43(m1, [-radiusX-3, -radiusY-3, 0, 1]);
			var mv2 = this.multiply43(m1, [-radiusX+3, -radiusY-3, 0, 1]);
			var mv3 = this.multiply43(m2, [-radiusX-3, -radiusY-3, 0, 1]);
			var mv4 = this.multiply43(m2, [-radiusX+3, -radiusY-3, 0, 1]);
			var mn1 = this.multiply43(m1, [0, 1, 0, 0]);
			var mn2 = this.multiply43(m2, [0, 1, 0, 0]);
			this.trackGeometryRawBuffer.push (...mv1);
			this.trackGeometryRawBuffer.push (...mv2);
			this.trackGeometryRawBuffer.push (...mv3);
			this.trackGeometryRawBuffer.push (...mv3);
			this.trackGeometryRawBuffer.push (...mv2);
			this.trackGeometryRawBuffer.push (...mv4);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackTextureCoordRawBuffer.push(0, .2);
			this.trackTextureCoordRawBuffer.push(.25, .25);
			this.trackTextureCoordRawBuffer.push(0, .25);
			this.trackTextureCoordRawBuffer.push(0, .25);
			this.trackTextureCoordRawBuffer.push(.25, .2);
			this.trackTextureCoordRawBuffer.push(.25, .25);

			var mv1 = this.multiply43(m1, [-radiusX-3, -radiusY+3, 0, 1]);
			var mv2 = this.multiply43(m1, [-radiusX-3, -radiusY-3, 0, 1]);
			var mv3 = this.multiply43(m2, [-radiusX-3, -radiusY+3, 0, 1]);
			var mv4 = this.multiply43(m2, [-radiusX-3, -radiusY-3, 0, 1]);
			var mn1 = this.multiply43(m1, [1, 0, 0, 0]);
			var mn2 = this.multiply43(m2, [1, 0, 0, 0]);
			this.trackGeometryRawBuffer.push (...mv1);
			this.trackGeometryRawBuffer.push (...mv2);
			this.trackGeometryRawBuffer.push (...mv3);
			this.trackGeometryRawBuffer.push (...mv3);
			this.trackGeometryRawBuffer.push (...mv2);
			this.trackGeometryRawBuffer.push (...mv4);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackTextureCoordRawBuffer.push(.25, .25);
			this.trackTextureCoordRawBuffer.push(.5, .25);
			this.trackTextureCoordRawBuffer.push(.25, .5);
			this.trackTextureCoordRawBuffer.push(.25, .5);
			this.trackTextureCoordRawBuffer.push(.5, .25);
			this.trackTextureCoordRawBuffer.push(.5, .5);
			
			var mv1 = this.multiply43(m1, [-radiusX+3, -radiusY+3, 0, 1]);
			var mv2 = this.multiply43(m1, [-radiusX-3, -radiusY+3, 0, 1]);
			var mv3 = this.multiply43(m2, [-radiusX+3, -radiusY+3, 0, 1]);
			var mv4 = this.multiply43(m2, [-radiusX-3, -radiusY+3, 0, 1]);
			var mn1 = this.multiply43(m1, [0, -1, 0, 0]);
			var mn2 = this.multiply43(m2, [0, -1, 0, 0]);
			this.trackGeometryRawBuffer.push (...mv1);
			this.trackGeometryRawBuffer.push (...mv2);
			this.trackGeometryRawBuffer.push (...mv3);
			this.trackGeometryRawBuffer.push (...mv3);
			this.trackGeometryRawBuffer.push (...mv2);
			this.trackGeometryRawBuffer.push (...mv4);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackTextureCoordRawBuffer.push(.75, 0);
			this.trackTextureCoordRawBuffer.push(1, 0);
			this.trackTextureCoordRawBuffer.push(.75, .25);
			this.trackTextureCoordRawBuffer.push(.75, .25);
			this.trackTextureCoordRawBuffer.push(1, 0);
			this.trackTextureCoordRawBuffer.push(1, .25);

			var mv1 = this.multiply43(m1, [-radiusX+3, -radiusY-3, 0, 1]);
			var mv2 = this.multiply43(m1, [-radiusX+3, -radiusY+3, 0, 1]);
			var mv3 = this.multiply43(m2, [-radiusX+3, -radiusY-3, 0, 1]);
			var mv4 = this.multiply43(m2, [-radiusX+3, -radiusY+3, 0, 1]);
			var mn1 = this.multiply43(m1, [-1, 0, 0, 0]);
			var mn2 = this.multiply43(m2, [-1, 0, 0, 0]);
			this.trackGeometryRawBuffer.push (...mv1);
			this.trackGeometryRawBuffer.push (...mv2);
			this.trackGeometryRawBuffer.push (...mv3);
			this.trackGeometryRawBuffer.push (...mv3);
			this.trackGeometryRawBuffer.push (...mv2);
			this.trackGeometryRawBuffer.push (...mv4);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackNormalRawBuffer.push(...mn1);
			this.trackNormalRawBuffer.push(...mn2);
			this.trackTextureCoordRawBuffer.push(.5, .5);
			this.trackTextureCoordRawBuffer.push(.25, .5);
			this.trackTextureCoordRawBuffer.push(.5, .25);
			this.trackTextureCoordRawBuffer.push(.5, .25);
			this.trackTextureCoordRawBuffer.push(.25, .5);
			this.trackTextureCoordRawBuffer.push(.25, .25);

			
			m1 = m2;
		}
		
		return this.multiply43(m1, [-radiusX, -radiusY, 0, 1]);
		
	},
	
	/**
	 * Add a cube (with any scaling : can be a bar, block, ...) to the scene
	 */
	 
	addCube : function(m, x, y, z, dx, dy, dz, tx) {
	    //
		//     _.5._
		//  1._  :  _.6
		//  |  '-2-'  | 
		//  |   .8.   |
		//  4._  |  _.7
        //     '-3-'		
		var mv1 = this.multiply43(m, [x, y, z, 1]);
		var mv2 = this.multiply43(m, [x+dx, y, z, 1]);
		var mv3 = this.multiply43(m, [x+dx, y+dy, z, 1]);
		var mv4 = this.multiply43(m, [x, y+dy, z, 1]);
		var mv5 = this.multiply43(m, [x, y, z-dz, 1]);
		var mv6 = this.multiply43(m, [x+dx, y, z-dz, 1]);
		var mv7 = this.multiply43(m, [x+dx, y+dy, z-dz, 1]);
		var mv8 = this.multiply43(m, [x, y+dy, z-dz, 1]);
		
		var mn1 = this.multiply43(m, [0, 0, 1, 0]);
		var mn2 = this.multiply43(m, [1, 0, 0, 0]);
		var mn3 = this.multiply43(m, [0, 0, -1, 0]);
		var mn4 = this.multiply43(m, [-1, 0, 0, 0]);
		var mn5 = this.multiply43(m, [0, 1, 1, 0]);
		var mn6 = this.multiply43(m, [0, -1, 0, 0]);
		
		this.trackGeometryRawBuffer.push (...mv1);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv4);
		this.trackGeometryRawBuffer.push (...mv4);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackNormalRawBuffer.push(...mn1);
		this.trackNormalRawBuffer.push(...mn1);
		this.trackNormalRawBuffer.push(...mn1);
		this.trackNormalRawBuffer.push(...mn1);
		this.trackNormalRawBuffer.push(...mn1);
		this.trackNormalRawBuffer.push(...mn1);
		this.trackTextureCoordRawBuffer.push(tx, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, 1);

		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv6);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv6);
		this.trackGeometryRawBuffer.push (...mv7);
		this.trackNormalRawBuffer.push(...mn2);
		this.trackNormalRawBuffer.push(...mn2);
		this.trackNormalRawBuffer.push(...mn2);
		this.trackNormalRawBuffer.push(...mn2);
		this.trackNormalRawBuffer.push(...mn2);
		this.trackNormalRawBuffer.push(...mn2);
		this.trackTextureCoordRawBuffer.push(tx, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, 1);

		this.trackGeometryRawBuffer.push (...mv6);
		this.trackGeometryRawBuffer.push (...mv5);
		this.trackGeometryRawBuffer.push (...mv7);
		this.trackGeometryRawBuffer.push (...mv7);
		this.trackGeometryRawBuffer.push (...mv5);
		this.trackGeometryRawBuffer.push (...mv8);
		this.trackNormalRawBuffer.push(...mn3);
		this.trackNormalRawBuffer.push(...mn3);
		this.trackNormalRawBuffer.push(...mn3);
		this.trackNormalRawBuffer.push(...mn3);
		this.trackNormalRawBuffer.push(...mn3);
		this.trackNormalRawBuffer.push(...mn3);
		this.trackTextureCoordRawBuffer.push(tx, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, 1);
		
		this.trackGeometryRawBuffer.push (...mv5);
		this.trackGeometryRawBuffer.push (...mv1);
		this.trackGeometryRawBuffer.push (...mv8);
		this.trackGeometryRawBuffer.push (...mv8);
		this.trackGeometryRawBuffer.push (...mv1);
		this.trackGeometryRawBuffer.push (...mv4);
		this.trackNormalRawBuffer.push(...mn4);
		this.trackNormalRawBuffer.push(...mn4);
		this.trackNormalRawBuffer.push(...mn4);
		this.trackNormalRawBuffer.push(...mn4);
		this.trackNormalRawBuffer.push(...mn4);
		this.trackNormalRawBuffer.push(...mn4);
		this.trackTextureCoordRawBuffer.push(tx, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, 1);

		this.trackGeometryRawBuffer.push (...mv1);
		this.trackGeometryRawBuffer.push (...mv5);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv2);
		this.trackGeometryRawBuffer.push (...mv5);
		this.trackGeometryRawBuffer.push (...mv6);
		this.trackNormalRawBuffer.push(...mn5);
		this.trackNormalRawBuffer.push(...mn5);
		this.trackNormalRawBuffer.push(...mn5);
		this.trackNormalRawBuffer.push(...mn5);
		this.trackNormalRawBuffer.push(...mn5);
		this.trackNormalRawBuffer.push(...mn5);
		this.trackTextureCoordRawBuffer.push(tx, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, 1);

		this.trackGeometryRawBuffer.push (...mv4);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv8);
		this.trackGeometryRawBuffer.push (...mv8);
		this.trackGeometryRawBuffer.push (...mv3);
		this.trackGeometryRawBuffer.push (...mv7);
		this.trackNormalRawBuffer.push(...mn6);
		this.trackNormalRawBuffer.push(...mn6);
		this.trackNormalRawBuffer.push(...mn6);
		this.trackNormalRawBuffer.push(...mn6);
		this.trackNormalRawBuffer.push(...mn6);
		this.trackNormalRawBuffer.push(...mn6);
		this.trackTextureCoordRawBuffer.push(tx, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx, 1);
		this.trackTextureCoordRawBuffer.push(tx+.25, .75);
		this.trackTextureCoordRawBuffer.push(tx+.25, 1);

	},
	
	/**
	 * Create the geometry (vertices) representing the Death Cube and corridors
	 * From the corridors description
	 */
	createTrackGeometry : function(track) 
	{
		this.sectorFrame = []; // reference frame for the ship
		
		this.starsGeometryRawBuffer = [];
		for (var i=0; i<8000; ++i) {
			var theta = Math.random()*6.28, phi = Math.random()*6.28, r=850+100*Math.random();
			this.starsGeometryRawBuffer.push(350+r*Math.sin(theta)*Math.cos(phi), r*Math.sin(phi), 650+r*Math.cos(theta)*Math.cos(phi));
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, this.starsGeometryGLBuffer = gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.starsGeometryRawBuffer), gl.STATIC_DRAW);		
		
		
		this.trackGeometryRawBuffer = [];
		this.trackTextureCoordRawBuffer = [];
		this.trackNormalRawBuffer = [];
		
		// external walls of the cube (cheat : only 2 are visible)
		// front face : top and bottom
		this.trackGeometryRawBuffer.push (-250, 250, 3, -250, 3, 3, 250, 3, 3, -250, 250, 3, 250, 3, 3, 250, 250, 3);
		this.trackNormalRawBuffer.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
		this.trackTextureCoordRawBuffer.push(0, .5, 0, .62, .25, .62, 0, .5, .25, .62, .25, .5);
		this.trackGeometryRawBuffer.push (-250, -3, 0, -250, -250, 0, 250, -250, 0, -250, -3, 0, 250, -250, 0, 250, -3, 0);
		this.trackNormalRawBuffer.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
		this.trackTextureCoordRawBuffer.push(0, .63, 0, .75, .25, .75, 0, .63, .25, .75, .25, .63);
		
		// front rim
		this.trackGeometryRawBuffer.push (-250, 3, 3, -247, 3, 0, 247, 3, 0, -250, 3, 3, 247, 3, 0, 250, 3, 3);
		this.trackNormalRawBuffer.push(0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0);
		this.trackTextureCoordRawBuffer.push(0, .62, 0, .63, .25, .63, 0, .62, .25, .63, .25, .63);
		this.trackGeometryRawBuffer.push (-247, -3, 0, -250, -3, 3, 250, -3, 3, -247, -3, 0, 250, -3, 3, 247, -3, 0);
		this.trackNormalRawBuffer.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
		this.trackTextureCoordRawBuffer.push(0, .62, 0, .63, .25, .63, 0, .62, .25, .63, .25, .63);
		this.trackGeometryRawBuffer.push (-247, 3, 0, -247, -3, 0, -3, -3, 0, -247, 3, 0, -3, -3, 0, -3, 3, 0);
		this.trackNormalRawBuffer.push(0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0);
		this.trackTextureCoordRawBuffer.push(0, .62, 0, .63, .12, .63, 0, .62, .12, .63, .12, .62);
		this.trackGeometryRawBuffer.push (3, 3, 0, 3, -3, 0, 247, -3, 0, 3, 3, 0, 247, -3, 0, 247, 3, 0);
		this.trackNormalRawBuffer.push(0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0);
		this.trackTextureCoordRawBuffer.push(.13, .62, .13, .63, .25, .63, .13, .62, .25, .63, .25, .62);
		
		// side rim (cheat : upper and lower sides are almost not visible, thus not defined)
		this.trackGeometryRawBuffer.push (247, 3, 0, 247, -3, 0, 247, -3, -500, 247, 3, 0, 247, -3, -500, 247, 3, -500);
		this.trackNormalRawBuffer.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
		this.trackTextureCoordRawBuffer.push(0, .62, 0, .63, .25, .63, 0, .62, .25, .63, .25, .62);
		
		// side face : top and bottom
		this.trackGeometryRawBuffer.push (250, 250, 3, 250, 3, 3, 250, 3, -500, 250, 250, 3, 250, 3, -500, 250, 250, -500);
		this.trackNormalRawBuffer.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
		this.trackTextureCoordRawBuffer.push(0, .5, 0, .625, .25, .625, 0, .5, .25, .625, .25, .5);
		this.trackGeometryRawBuffer.push (250, -3, 0, 250, -250, 0, 250, -250, -500, 250, -3, 0, 250, -250, -500, 250, -3, -500);
		this.trackNormalRawBuffer.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
		this.trackTextureCoordRawBuffer.push(0, .625, 0, .75, .25, .75, 0, .625, .25, .75, .25, .625);
		
		
		
		var x = 0, y = 0, z = 0;
		var ax = 0, ay = 0;
		for (var index=0; index<track.length; ++index) {
			var sector = track[index];
			ax += sector[0];
			ay += sector[1];
			
			this.sectorFrame.push([x,y,z,ax,ay]);

			var m = this.get43Matrix(ax, ay, x, y, z);
						
			for (var step=0; step<12; ++step) {
				this.addSquareCorridorSection(x, y, z, ax, ay, (index&3?(step&5?0:.75):.25), .25*sector[2], ((step+index)&7)?0:.5);
				[x,y,z] = this.multiply43(m, [0, 0, -8*step-8, 1]);
			}
			for (var obstacleIndex = 3; obstacleIndex < sector.length ; ++obstacleIndex) {
				var obstacle = sector[obstacleIndex];
				switch (obstacle[0]) {
					case 0 :
						this.addCube (m, obstacle[1], obstacle[2], -8*obstacle[3], obstacle[4], obstacle[5], obstacle[6], .25*obstacle[7]);
						break;
					default :
				}
			}
			
			if (index < track.length-1) {
				[x, y, z] = this.addConnectorSubsection(index, x, y, z, ax, ay, track[index+1][0], track[index+1][1]);
			}
		}
		
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.trackGeometryGLBuffer = gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.trackGeometryRawBuffer), gl.STATIC_DRAW);		

		gl.bindBuffer(gl.ARRAY_BUFFER, this.trackTextureCoordGLBuffer = gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.trackTextureCoordRawBuffer), gl.STATIC_DRAW);		
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.trackNormalGLBuffer = gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.trackNormalRawBuffer), gl.STATIC_DRAW);		
	},
	
	/**
	 * Rendering main entry point
	 * @param cameraType 0 = follow ship (ingame camera), 1 = static (endgame), 2 = follow path (intro)
	 * @param timer current frame, at 50 FPS
	 */
	drawMain : function(cameraType, timer) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, this.panelWidth, this.panelHeight);
		gl.useProgram(this.solidShaderProgram);
		gl.activeTexture(gl.TEXTURE0);
		

		var xT = 1500 * Math.sin(.5), yT = 0, zT = 1500 * Math.cos(.5), fov = 25, w = -10, near = 1, far = 1800, pitch = 0, yaw = -.5;

		switch (cameraType) {
			case 0 : // follow ship 
				[xT, yT, zT, pitch, yaw] = this.locateShipInUniverse(this.game.world.ship, true);
				far = 250;
				break;
			case 1 :
				fov = 60;
				break;
			case 2 : // follow predefined path
				//	0-186 : static view of Death Cube
				// 186-806 : view zooms out
				// 400-860 : view rotates  to focus on the spaceship
				// 1028 : side view of spaceship
				// 1028-3140 : view rotates around spaceship
				// 3000 : engines start
				// 3500 : spaceship departs
				xT = 1500 * Math.sin(.5)+2*(1-Math.sin(Math.max(0, Math.min(1.57, (timer-400)/200))));
				zT = 1500 * Math.cos(.5)-2*Math.cos(Math.max(0, Math.min(1.57, (timer-400)/200)));
				yaw = -1.8*Math.sin(Math.max(0, Math.min(7.85, (timer-400)/400)))-.5*Math.cos(Math.max(0, Math.min(3.14, (timer-3000)/127)));
				pitch=-.2+.5*Math.cos(Math.max(0, Math.min(6.28, (timer-1000)/200)))-.3*Math.cos(Math.max(0, Math.min(6.28, (timer-2400)/150)));
				fov=50-30*Math.cos(Math.max(0, Math.min(620, timer-186))/200);	
				w=-1.6-.4*Math.cos(Math.max(0, Math.min(157, timer-750))/50);
				near = .3;
				break;
			default :
		}

		var perspectiveMatrix = this.makePerspective(-xT, -yT, -zT, w, fov, this.panelWidth/this.panelHeight, near, far, pitch, -yaw);
		gl.uniformMatrix4fv(gl.getUniformLocation(this.solidShaderProgram, "mP"), false, new Float32Array(perspectiveMatrix));

		if (cameraType==2) {	// move ship after frame 3500
			var motion = 1500-(timer<3500?0:(timer-3500)*(timer-3500)/1000);
			xT = motion*Math.sin(.5);
			zT = motion*Math.cos(.5);
			yaw = -.5;
			pitch = 0;
			if (timer>3000) {
				var m = this.get43Matrix(0, -.5, xT, yT, zT);
				this.recordReactorTrail([true, true, true, true, true], m, xT, yT, zT);
			}
		}
		
		if (cameraType!=1) { // intro or ingame
			this.drawShip(xT, yT, zT, pitch, yaw, this.game.world.ship, true);
		}
		
		if (this.game.world.flybackCountdown) {
			var ghost = this.game.world.ghosts[(this.game.world.ghostPtr+30)%250];
			[xT, yT, zT, pitch, yaw] = this.locateShipInUniverse(ghost, false);
			this.drawShip(xT, yT, zT, pitch, yaw, ghost, false);
		}
		if (cameraType !=1 || timer<80) {	// stop drawing the Death Cube once it is destroyed (end sequence)
			this.drawTumblingReactors();
			this.drawUniverse();
		}
		
		gl.useProgram(this.dustShaderProgram);
		gl.uniformMatrix4fv(gl.getUniformLocation(this.dustShaderProgram, "mP"), false, new Float32Array(perspectiveMatrix));		
		this.drawDustClouds();

	},
	
	/**
	 * Draw the Death Cube outside, the corridors, any particles and explosions
	 */
	drawUniverse : function() {
		gl.uniformMatrix4fv(gl.getUniformLocation(this.solidShaderProgram, "mX"), false, new Float32Array(
		   [1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0, 
			0.0, 0.0, 1.0, 0.0,
			0.0, 0.0, 0.0, 1.0]));

		// draw Death Cube
		gl.bindBuffer(gl.ARRAY_BUFFER, this.trackGeometryGLBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(this.solidShaderProgram, "a"), 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.trackNormalGLBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(this.solidShaderProgram, "n"), 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.trackTextureCoordGLBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(this.solidShaderProgram, "t"), 2, gl.FLOAT, false, 0, 0);

		gl.uniform4f(gl.getUniformLocation(this.solidShaderProgram, "uC"), .1, .2, .2, .3); // asphalt color & specular
		gl.drawArrays(gl.TRIANGLES, 0, this.trackGeometryRawBuffer.length/3);  

		// draw Stars
		gl.bindBuffer(gl.ARRAY_BUFFER, this.starsGeometryGLBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(this.solidShaderProgram, "a"), 3, gl.FLOAT, false, 0, 0);

		gl.uniform4f(gl.getUniformLocation(this.solidShaderProgram, "uC"), 1.0, 1.0, 1.0, .7); 
		gl.drawArrays(gl.POINTS, 0, this.starsGeometryRawBuffer.length/3);  
			
		
	},

	/**
	 * Draw explosions and reactor exhaust
	 */
	drawDustClouds : function() {
		gl.useProgram(this.dustShaderProgram);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		var coordIndex = 0;
		var lastVisible = 0;
		for (var explosionData of this.explosions) {
			if (explosionData[0] < 200) { 
				explosionData[0]+=(explosionData[11]?30:1);
				++lastVisible;
				if (coordIndex<7200) { // GL uffer not filled yet
					var radius = explosionData[4]*(explosionData[11]>0?(500-explosionData[0])/500:1);
					this.explosionGeometryRawBuffer[coordIndex   ] = explosionData[1]+radius*(-explosionData[5]+explosionData[8]);
					this.explosionGeometryRawBuffer[coordIndex+ 1] = explosionData[2]+radius*(-explosionData[6]+explosionData[9]);
					this.explosionGeometryRawBuffer[coordIndex+ 2] = explosionData[3]+radius*(-explosionData[7]+explosionData[10]);
					this.explosionGeometryRawBuffer[coordIndex+ 3] = explosionData[1]+radius*(-explosionData[5]-explosionData[8]);
					this.explosionGeometryRawBuffer[coordIndex+ 4] = explosionData[2]+radius*(-explosionData[6]-explosionData[9]);
					this.explosionGeometryRawBuffer[coordIndex+ 5] = explosionData[3]+radius*(-explosionData[7]-explosionData[10]);
					this.explosionGeometryRawBuffer[coordIndex+ 6] = explosionData[1]+radius*( explosionData[5]-explosionData[8]);
					this.explosionGeometryRawBuffer[coordIndex+ 7] = explosionData[2]+radius*( explosionData[6]-explosionData[9]);
					this.explosionGeometryRawBuffer[coordIndex+ 8] = explosionData[3]+radius*( explosionData[7]-explosionData[10]);
					this.explosionGeometryRawBuffer[coordIndex+ 9] = explosionData[1]+radius*(-explosionData[5]+explosionData[8]);
					this.explosionGeometryRawBuffer[coordIndex+10] = explosionData[2]+radius*(-explosionData[6]+explosionData[9]);
					this.explosionGeometryRawBuffer[coordIndex+11] = explosionData[3]+radius*(-explosionData[7]+explosionData[10]);
					this.explosionGeometryRawBuffer[coordIndex+12] = explosionData[1]+radius*( explosionData[5]-explosionData[8]);
					this.explosionGeometryRawBuffer[coordIndex+13] = explosionData[2]+radius*( explosionData[6]-explosionData[9]);
					this.explosionGeometryRawBuffer[coordIndex+14] = explosionData[3]+radius*( explosionData[7]-explosionData[10]);
					this.explosionGeometryRawBuffer[coordIndex+15] = explosionData[1]+radius*( explosionData[5]+explosionData[8]);
					this.explosionGeometryRawBuffer[coordIndex+16] = explosionData[2]+radius*( explosionData[6]+explosionData[9]);
					this.explosionGeometryRawBuffer[coordIndex+17] = explosionData[3]+radius*( explosionData[7]+explosionData[10]);
					var red = explosionData[11] ? 0.0 : Math.min(1.0, 6.0/Math.sqrt(explosionData[0]));
					var green = explosionData[11] ? explosionData[11] : Math.min(0.9, 4.0/Math.sqrt(explosionData[0]));
					var blue = explosionData[11];
					this.explosionColorRawBuffer [coordIndex++] = red;
					this.explosionColorRawBuffer [coordIndex++] = green;
					this.explosionColorRawBuffer [coordIndex++] = blue;
					this.explosionColorRawBuffer [coordIndex++] = red;
					this.explosionColorRawBuffer [coordIndex++] = green;
					this.explosionColorRawBuffer [coordIndex++] = blue;
					this.explosionColorRawBuffer [coordIndex++] = red;
					this.explosionColorRawBuffer [coordIndex++] = green;
					this.explosionColorRawBuffer [coordIndex++] = blue;
					this.explosionColorRawBuffer [coordIndex++] = red;
					this.explosionColorRawBuffer [coordIndex++] = green;
					this.explosionColorRawBuffer [coordIndex++] = blue;
					this.explosionColorRawBuffer [coordIndex++] = red;
					this.explosionColorRawBuffer [coordIndex++] = green;
					this.explosionColorRawBuffer [coordIndex++] = blue;
					this.explosionColorRawBuffer [coordIndex++] = red;
					this.explosionColorRawBuffer [coordIndex++] = green;
					this.explosionColorRawBuffer [coordIndex++] = blue;
				}
			}
		}
		if (coordIndex) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.explosionGeometryGLBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.explosionGeometryRawBuffer, gl.DYNAMIC_DRAW);
			gl.vertexAttribPointer(gl.getAttribLocation(this.dustShaderProgram, "a"), 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, this.explosionColorGLBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.explosionColorRawBuffer, gl.DYNAMIC_DRAW);
			gl.vertexAttribPointer(gl.getAttribLocation(this.dustShaderProgram, "c"), 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.explosionTextureGLBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.explosionTextureRawBuffer, gl.DYNAMIC_DRAW);
			gl.vertexAttribPointer(gl.getAttribLocation(this.dustShaderProgram, "t"), 2, gl.FLOAT, false, 0, 0);
			
			gl.uniformMatrix4fv(gl.getUniformLocation(this.dustShaderProgram, "mX"), false, new Float32Array(
		   [1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0, 
			0.0, 0.0, 1.0, 0.0,
			0.0, 0.0, 0.0, 1.0]));

			gl.drawArrays(gl.TRIANGLES, 0, coordIndex/3);
		}
		gl.disable(gl.BLEND);
		
		// trim the items that are no longer visible - new ones are pushed at the beginning of the buffer, making it a fifo
		this.explosions.splice(lastVisible+1, this.explosions.length-lastVisible);
		
	},
	
	/**
	 * Translates the model coordinates provided by the World into real 3D coordinates
	 * For the real ship (not a ghost), turns game events to explosions / tumbling reactors objects
	 *
	 * @param ship an object (syntax defined in World) representing the ship parameters
	 * @param isReal true for the real ship, false for a ghost
	 * @return [-x, -y, -z, ax, ay] with (x,y,z) translation and (ax, ay) rotation to the ship actual coordinates
	 */
	locateShipInUniverse : function(ship, isReal) {
		// translate the game coordinates into real 3d
		var sectorIndex = Math.floor(ship.step/16);
		var block = ship.step-16*sectorIndex;
		var frame = this.sectorFrame[sectorIndex];
		var nextFrame = this.sectorFrame[sectorIndex+1];
		var straightJunction = Math.abs(nextFrame[3]-frame[3]) < .01 && Math.abs(nextFrame[4]-frame[4]) < .01;
		var xT = 0, yT = 0, zT = 0, ax = 0, ay = 0, m=[];
		if (block < 12 || straightJunction) { // corridor or junction in a straight line
			ax = frame[3]; ay = frame[4];
			m = this.get43Matrix(ax, ay, frame[0], frame[1], frame[2]);
			[xT, yT, zT] = this.multiply43(m, [ship.x, ship.y, -block*8, 1]);
			
		} else { // curved junction
			
			ax = frame[3]+(nextFrame[3]-frame[3])*(block-12)/4; ay = frame[4]+(nextFrame[4]-frame[4])*(block-12)/4;
			m = this.get43Matrix(ax, ay, frame[5], frame[6], frame[7]);
			[xT, yT, zT] = this.multiply43(m, [ship.x+frame[8], ship.y+frame[9], 0, 1]);
		}
		
		// game events : add particles and explosions
		if (isReal) {
			for (var eventId of this.game.world.events) {
				if (!eventId) {	// ship loss
					var center = this.multiply43(m, [0, 0, -.8, 0]);	// world coordinates
					for (var i=0; i<1; ++i) {
						var xRight = this.multiply43(m, [1, 0, 0, 0]);
						var yUp = this.multiply43(m, [0, 1, 0, 0]);
						this.explosions.unshift([0, xT+center[0]+.6*Math.random()-.3, yT+center[1]+.6*Math.random()-.3, zT+center[2]+.6*Math.random()-.3, .1, xRight[0], xRight[1], xRight[2], yUp[0], yUp[1], yUp[2], 0]);
					}
				} else 	if (eventId <8) { // loose reactor !
					centerInShipCoordinates = [[0, 0, -.8, 0], [-.6, -.4, 0, 0], [.6, -.4, 0, 0], [-.6, .4, 0, 0], [.6, .4, 0, 0]];
					center = this.multiply43(m, centerInShipCoordinates[eventId&7]);	// world coordinates
					var yDown = this.multiply43(m, [0, -1, 0, 0]);
					this.tumblingReactors.push([0, xT+center[0], yT+center[1], zT+center[2], -ax-ship.jolt[1], ay+ship.jolt[0], ship.dx+.1*Math.random()-.05, ship.dy, yDown[0], yDown[1], yDown[2]]);
				}
			}
			this.recordReactorTrail(ship.componentPresent, m, xT, yT, zT);
		}

		return [xT, yT, zT, ax, ay];
	},
	
	
	/**
	 * Adds a trail behind the reactors, in the dust cloud list
	 * (does not render it)
	 */
	recordReactorTrail : function(componentPresent, m, xT, yT, zT) {
		var reactorRear = [[0, 0, -.8, 0], [-.6, -.4, .2, 0], [.6, -.4, .2, 0], [-.6, .4, .2, 0], [.6, .4, .2, 0]];
		for (var reactorId = 1; reactorId<5; ++reactorId) {
			if (componentPresent[reactorId]) {
				var center = this.multiply43(m, reactorRear[reactorId]);
				var xRight = this.multiply43(m, [1, 0, 0, 0]);
				var yUp = this.multiply43(m, [0, 1, 0, 0]);
				this.explosions.unshift([0, xT+center[0], yT+center[1], zT+center[2], .1, xRight[0], xRight[1], xRight[2], yUp[0], yUp[1], yUp[2], .5]);
			}
		}
	},
	
	/**
	 * Draw a spaceship
	 * @param xT ship center translation along X
	 * @param yT ship center translation along Y
	 * @param zT ship center translation along Z
	 * @param ax ship rotation along X axis
	 * @param ay ship rotation along Y axis
	 * @param ship an object (syntax defined in World) representing the ship parameters
	 * @param isReal true for the real ship, false for a ghost
	 */
	drawShip : function(xT, yT, zT, ax, ay, ship, isReal) {
			
		var yaw = -ay, pitch = ax;
		var w=-20;

		if (isReal) {
			// camera tailgates the ship
			//gl.uniformMatrix4fv(gl.getUniformLocation(this.solidShaderProgram, "mP"), false, new Float32Array(this.makePerspective(-xT, -yT, -zT, w, 20, this.panelWidth/this.panelHeight, 1, far, pitch, yaw)));
			
			// lighting setup
			gl.uniform3f(gl.getUniformLocation(this.solidShaderProgram, "uL"), xT, yT, zT); // light center		
			gl.uniform1i(gl.getUniformLocation(this.solidShaderProgram, "uZ"), 0);
			gl.uniform4f(gl.getUniformLocation(this.solidShaderProgram, "uE"), xT+w*Math.sin(pitch)*Math.sin(yaw), yT+w*Math.sin(pitch)*Math.cos(yaw), zT-w*Math.cos(pitch), 0);
		}
		
		
		// draw spaceship
		gl.bindBuffer(gl.ARRAY_BUFFER, this.shipGeometryGLBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(this.solidShaderProgram, "a"), 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.shipTextureCoordGLBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(this.solidShaderProgram, "t"), 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.shipNormalGLBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(this.solidShaderProgram, "n"), 3, gl.FLOAT, false, 0, 0);

		if (isReal) {
			gl.uniform4f(gl.getUniformLocation(this.solidShaderProgram, "uC"), .2, .2, .2, .8); // specular for ship
		} else {
			gl.uniform4f(gl.getUniformLocation(this.solidShaderProgram, "uC"), .8, .8, .8, .6); // ghost color
		}
	
		var xK = xT;
		var yK = yT;
		var zK = zT;
		var aK = 0.0; // roll
		var cK = Math.cos(aK);
		var sK = Math.sin(aK);
		
		var a1 = -ax-ship.dy-ship.jolt[1];
		var a2 = ay+ship.dx+ship.jolt[0];
		var c1 = Math.cos(a1);
		var s1 = Math.sin(a1);
		var c2 = Math.cos(a2);
		var s2 = Math.sin(a2);
		
		gl.uniformMatrix4fv(gl.getUniformLocation(this.solidShaderProgram, "mX"), false, new Float32Array(

		   [ cK*c2-sK*s1*s2, -sK*c1, cK*s2+sK*s1*c2, 0.0,
			 sK*c2+cK*s1*s2,  cK*c1, sK*s2-cK*s1*c2, 0.0, 
			 -c1*s2        ,  s1   , c1*c2         , 0.0,
			 xK, yK, zK, 1.0]));
			 
		var drawMode = isReal ? gl.TRIANGLE_STRIP : gl.LINE_STRIP;
		for (var i=0; i<108; ++i) {
			gl.drawArrays(drawMode, i*42, 42);
		}
		if (ship.componentPresent[1]) for (var i=108; i<148; ++i) {
			gl.drawArrays(drawMode, i*42, 42);
		}
		if (ship.componentPresent[2]) for (var i=148; i<188; ++i) {
			gl.drawArrays(drawMode, i*42, 42);
		}
		if (ship.componentPresent[3]) for (var i=188; i<228; ++i) {
			gl.drawArrays(drawMode, i*42, 42);
		}
		if (ship.componentPresent[4]) for (var i=228; i<268; ++i) {
			gl.drawArrays(drawMode, i*42, 42);
		}
	},
	
	/** 
	 * Draw any loose reactor
	 * Update the internal list (quick and dirty so far)
	 */
	drawTumblingReactors : function()
	{
		for (var reactorData of this.tumblingReactors) if (reactorData[0]<500) { // only maintain reactors in view for 10 seconds
			++reactorData[0];
			reactorData[1]+=.001*reactorData[0]*reactorData[8];
			reactorData[2]+=.001*reactorData[0]*reactorData[9];
			reactorData[3]+=.001*reactorData[0]*reactorData[10];
			reactorData[4]+=reactorData[6];
			reactorData[5]+=reactorData[7];
			var xK = reactorData[1];
			var yK = reactorData[2];
			var zK = reactorData[3];
			var aK = 0.0; // roll
			var cK = Math.cos(aK);
			var sK = Math.sin(aK);
			
			var a1 = reactorData[4];
			var a2 = reactorData[5];
			var c1 = Math.cos(a1);
			var s1 = Math.sin(a1);
			var c2 = Math.cos(a2);
			var s2 = Math.sin(a2);
			
			gl.uniformMatrix4fv(gl.getUniformLocation(this.solidShaderProgram, "mX"), false, new Float32Array(
			   [ cK*c2-sK*s1*s2, -sK*c1, cK*s2+sK*s1*c2, 0.0,
				 sK*c2+cK*s1*s2,  cK*c1, sK*s2-cK*s1*c2, 0.0, 
				 -c1*s2        ,  s1   , c1*c2         , 0.0,
				 xK, yK, zK, 1.0]));
			for (var i=268; i<308; ++i) {
				gl.drawArrays(gl.TRIANGLE_STRIP, i*42, 42);
			}

			// explosion and dust cloud
			var reactorFront = [0, 0, -.4, 1];
			var m = this.get43Matrix(-reactorData[4], reactorData[5], reactorData[1], reactorData[2], reactorData[3]);
			var center = this.multiply43(m, reactorFront);
			var xRight = this.multiply43(m, [1, 0, 0, 0]);
			var yUp = this.multiply43(m, [0, 1, 0, 0]);
			var count = reactorData[0]<10 ? 4 : 0;
			if (reactorData[0]<20) {
				for (var i=0; i<4; ++i) {
					this.explosions.unshift([0, center[0]+.6*Math.random()-.3, center[1]+.6*Math.random()-.3, center[2]+.6*Math.random()-.3, .1, xRight[0], xRight[1], xRight[2], yUp[0], yUp[1], yUp[2], 0]);
				}
			} else {
				this.explosions.unshift([150, center[0]+.2*Math.random()-.1, center[1]+.2*Math.random()-.1, center[2]+.2*Math.random()-.1, .1, xRight[0], xRight[1], xRight[2], yUp[0], yUp[1], yUp[2], 0]);
			}
			
		}
		
	},
  
	/**
	 * Create the perspective matrix from the coordinates of the camera
	 * Parameters fovy, aspect, znear and zfar define the first projection
	 * the same way gluMakePerspective() does. The camera is then, in that order :
	 *  - translated by (xT, yT, zT)
	 *  - rotated by rotY around the Y axis (ship yaw)
	 *  - rotated by rotX around the new X axis (ship pitch)
	 *  - translated by (0, 0, w) in the new coordinate system (camera follow)
	 *
	 * @param xT : x-target coordinate of the camera
	 * @param yT : y-target coordinate of the camera
	 * @param zT : z-target coordinate of the camera
	 * @param w : distance from camera to target
	 * @param fovy : field of view in Y, in degrees
	 * @param aspect : aspect ratio X/Y
	 * @param znear : near cutting plane in Z
	 * @param zfar : far cutting plane in Z
	 * @param rotX : rotation around X-axis, in radian
	 * @param rotY : rotation around Y-axis, in radian
	 */
	 
  	makePerspective : function(xT, yT, zT, w, fovy, aspect, znear, zfar, rotX, rotY)
	{
		var halfheight = znear * Math.tan(fovy * Math.PI / 360.0)  
		var ymax = halfheight;
		var ymin = -halfheight;
		var xmin = - halfheight * aspect;
		var xmax = halfheight * aspect;
		//var cZ = Math.cos(rotZ), sZ = Math.sin(rotZ);
		var cY = Math.cos(rotY), sY = Math.sin(rotY);
		var cX = Math.cos(rotX), sX = Math.sin(rotX);

		var X = 2*znear/(xmax-xmin);
		var Y = 2*znear/(ymax-ymin);
		var C = -(zfar+znear)/(zfar-znear);
		var D = -2*zfar*znear/(zfar-znear);

		return [ X*cY,  Y*sX*sY, 	C*cX*sY, 	-cX*sY,
				 0,		Y*cX,		-C*sX,		sX,
				 -X*sY,	Y*sX*cY,	C*cX*cY,	-cX*cY,
				 (xT*cY-zT*sY)*X, Y*(xT*sX*sY+yT*cX+zT*sX*cY), C*(xT*cX*sY-yT*sX+zT*cX*cY+w)+D, -xT*cX*sY+yT*sX-zT*cX*cY-w ];
		/*
		return [  X*cZ, -cX*Y*sZ, sX*sZ*C, -sX*sZ,
				  X*sZ,  Y*cZ*cX, -C*sX*cZ, sX*cZ,
				  0,  sX*Y, C*cX, -cX,
				  xT*X*cZ+yT*X*sZ, -xT*cX*Y*sZ+yT*Y*cZ*cX+zT*sX*Y, 
				  xT*sX*sZ*C-yT*C*sX*cZ+zT*C*cX+w*C+D, -xT*sX*sZ+yT*sX*cZ-zT*cX-w];
		*/
	}
	
}
