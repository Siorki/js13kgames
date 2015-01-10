/**
 * Main function, using clay.io API
 */

 // clay.io header. See http://clay.io/docs/installation
var Clay = Clay || {};
Clay.gameKey = "weasels";
Clay.readyFunctions = [];
Clay.ready = function( fn ) {
Clay.readyFunctions.push( fn );
};
( function() {
var clay = document.createElement("script"); clay.async = true;
clay.src = ( "https:" == document.location.protocol ? "https://" : "http://" ) + "clay.io/api/api.js";
var tag = document.getElementsByTagName("script")[0]; tag.parentNode.insertBefore(clay, tag);
} )();
		
var globalUseClay = true;
	
		
function main(recordedData) {
controls = new Controls();
var showTrapOnHover = true;

if ('ontouchstart' in document.documentElement) {
	document.ontouchstart = function(event) { return controls.onTouchStart(event); }
	document.ontouchenter = function(event) { return controls.onTouchStart(event); }
	document.ontouchend = function(event) { return controls.onTouchEnd(event); }
	document.ontouchleave = function(event) { return controls.onTouchEnd(event); }
	document.ontouchmove = function(event) { return controls.onTouchMove(event); }
	showTrapOnHover = false;	// do not show the trap upon hovering on mobile platforms using touch screen instead of mouses
} else {
	document.onmousedown = function(event) { return controls.onMouseDown(event); }
	document.onmouseup = function(event) { return controls.onMouseUp(event); }
	document.onmousemove = function(event) { return controls.onMouseMove(event); }
}
document.onkeydown = function(event) { return controls.onKeyDown(event); }
document.onkeyup = function(event) { return controls.onKeyUp(event); }


playField = new PlayField(document.getElementById("noise"));
game = new Game(controls, playField, recordedData);
renderer = new Renderer(document.getElementById("c"), document.getElementById("o"), 
						document.getElementById("bg"), document.getElementById("cover"), document.getElementById("s"),
						game, showTrapOnHover);
window.addEventListener('resize', function(event) {	renderer.resizeWindow(); } );

playField.create(renderer.getSceneryImageData(), renderer.sceneryCanvas.width, renderer.sceneryCanvas.height);

game.world.addExplosionListener(renderer);
game.setRenderer (renderer);
game.launch();

}

Clay.ready( function () {
    Clay.Player.fetchUserData( "WeaselsData", main);
});	
