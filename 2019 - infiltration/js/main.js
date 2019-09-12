window.onload = function() {
controls = new Controls(new PersistentData());
//document.onkeydown = function(event) { console.log ("key "+event.which+ " down"); return controls.onKeyDown(event); }
//document.onkeyup = function(event) { console.log ("key "+event.which+ " up"); return controls.onKeyUp(event); }
game = new Game(controls);
game.soundManager.initialize();

var renderer = new WebGLRenderer (document.getElementById('c'), game);
var overlayRenderer = new OverlayRenderer (document.getElementById('g'));
renderer.initialize();
renderer.initializeTexture();
renderer.createTrackGeometry(game.world.track);

window.addEventListener('resize', function(event) {	game.resizeWindow(); } );
window.addEventListener('keydown', function(event) { /*console.log ("key "+event.which+ " down");*/ return controls.onKeyDown(event); } );
window.addEventListener('keyup', function(event) {	/*console.log ("key "+event.which+ " up");*/ return controls.onKeyUp(event); } );
window.addEventListener('mousedown', function(event) {	return controls.onMouseDown(event); } );
window.addEventListener('mouseup', function(event) {	return controls.onMouseUp(event); } );
window.addEventListener('mousemove', function(event) {	return controls.onMouseMove(event); } );

game.setRenderer (renderer, overlayRenderer);
game.launch();
}