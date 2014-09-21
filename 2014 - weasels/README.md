Pest Control : Weasels is an arcade puzzle game developed for the 2014 edition of [js13kgames](http://js13kgames.com).

----
**Game instructions**

Lemmings were meant to be saved, weasels should instead be disposed of. (consider this as your revenge on small pesky critters!)
Use the four elements to achieve this goal. They come as a variety of tools and traps that you can arrange in the play area.
The game is controlled entirely through the mouse or touch screen.

Weasels are smarter than your average lemming and will evade traps, find their way around and - usually - avoid falling to their demise.
Each level has a subset of tools to use, available inside the blue icons. Select the icon then place the trap on the play area.
You can also click on an already installed trap to move it around. Bring it back to the icon line to remove it entirely.
 - landmines obey gravity and trigger on contact
 - fans give airspeed to flying critters. Click to reverse.
 - flamethrowers are set to roast. Click to turn in the opposite direction.
 - weights obey gravity and crush any critter below. Unfortunately they are not implemented in the compo version
 
A few extra tips before you get started :
 - weasels cannot swim
 - weasels are bulletproof, they carry a bright red individual shield
 - walking weasels enjoy a nice breeze, but that will not affect them
 
---

**Credits**

Game inspired by Lemmings, Worms, Operation Lemmings and Bill's Tomato Game.

Music and sfx use [SoundBox](http://sb.bitsnbites.eu/) by Marcus Geelnard 
Ingame music is a cover of one of the modules from Lemmings, itself a remake of Swan Lake by Tchaikovsky

Fan artwork borrowed from Bill's Tomato Game
Weight artwork borrowed from the original Lemmings.
Rocky cliffs drawn with an algorithm derived from [Inigo Quilez's Voronoise](http://www.iquilezles.org/www/articles/voronoise/voronoise.htm)

---

**Technical details and trivia**

The screen is 320 pixels high, css-zoomed up
Spritesheet is 16 colors only.
Weasels animation is 10-frame long, each image displayed during 2 frames at 25 FPS
Initial spritesheet contained diggers but they did not make it into the 13k limitation.
The js13k version contains 10 levels with 2 different graphics sets.
None provides weights as traps, and their implementation is missing (lack of room).

---

**Minification**

The code was run through [Google Closure Compiler](http://closure-compiler.appspot.com/home) using Advanced settings.
The resulting code was fed to [Javascript-minifier](http://javascript-minifier.com/), resulting in a gain of 1kb uncompressed.
Spritesheet was reduced using [compresspng.com](http://compresspng.com)
The final archive weasels.zip was created using [Ken Silverman's Kzip](http://advsys.net/ken/utils.htm).
