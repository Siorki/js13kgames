/**
 * Main function, event handler initialization and application setup
 */
		
function main() {
controls = new Controls();

var mainCanvas = document.getElementById("c");

mainCanvas.onmousedown = function(event) { return controls.onMouseDown(event); }
mainCanvas.onmouseup = function(event) { return controls.onMouseUp(event); }
mainCanvas.onmousemove = function(event) { return controls.onMouseMove(event); }

document.onkeydown = function(event) { 
	if (event.which==13) {
		var textBox = document.getElementById("h").firstChild;
		var message = textBox.value;
		if (message != "") {
			textBox.value="";
			game.worldLink.speak(message);
		}
		return false;
	}
	return true;
}
	


game = new Game(controls);
renderer = new Renderer(game);
window.addEventListener('resize', function(event) {	renderer.resizeWindow(false); } );

game.setRenderer (renderer);
game.launch();

}

window.addEventListener('load', main);
