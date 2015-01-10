/**
 * Main function, not using any external API
 * (without Clay intergration which is proxied)
 */

// Proxy for the Clay namespace
var Clay = Clay || {};
var globalUseClay = false;

Clay.Achievement = function (members){
	this.members = members;
	this.award = function()
	{
		alert("Achivement nb "+this.members.id);
	}
}
Clay.Achievement.prototype.constructor = Clay.Achievement;

Clay.Player = function() {}



Clay.Player.saveUserData = function(a, b, c) {
		alert("Call to save persistent data on key "+a+", value = "+b);
}

Clay.Player.fetchUserData = function(a,b,c) {
		alert("Call to retrieve persistent data on key "+a+", value = "+b);
}

		
function main() {
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

// Object storage implementation from http://stackoverflow.com/questions/2010892/storing-objects-in-html5-localstorage/3146971
var recordedDataString = localStorage.getItem("WeaselsData");
var recordedData = {};
if (recordedDataString) {
	recordedData = JSON.parse(recordedDataString);
}

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

window.addEventListener('load', main);
