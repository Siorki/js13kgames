Pest Control : Weasels is an arcade puzzle game developed for the 2014 edition of [js13kgames](http://js13kgames.com).

----
** Game instructions ***

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

** Credits **

Game inspired by Lemmings, Worms, Operation Lemmings and Bill's Tomato Game.

Music and sfx use SoundBox by Marcus Geelnard (http://sb.bitsnbites.eu/)
Ingame music is a cover of one of the modules from Lemmings, itself a remake of a piece classical music (I'll update this once I figure out which one)

Fan artwork borrowed from Bill's Tomato Game
Weight artwork borrowed from the original Lemmings.
Rocky cliffs drawn with an algorithm derived from [Inigo Quilez's Voronoise](http://www.iquilezles.org/www/articles/voronoise/voronoise.htm)

---

** Technical details **

The screen is 320 pixels high, css-zoomed up
Spritesheet is 16 colors only.
Weasels animation is 10-frame long, each image displayed during 2 frames at 25 FPS

Initial spritesheet contained diggers but they did not make it into the 13k limitation.
