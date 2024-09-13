**2048 / 13** is my entry for [js13kgames edition 2024](https://dev.js13kgames.com/2024/games). Theme was Triskaidekaphobia (fear of the number 13)

## TO PLAY
This is a puzzle game that would play pretty much like a 2048 ...
... if multiples of 13 were not there to thwart your attempts.

Each time you get 8 4 and 1 side by side, they fuse into a 13.

Play with keyboard, mouse or touch screen.

## TO BUILD

The build process runs in the command line. It concatenates all files, minifies them, and creates the final zip archive.

Open `build/buildAll.sh` in any editor and alter lines 2 and 5 to suit your configuration :
 - CURRENT_REVISION is a command that returns a unique number for the current revision. For git, you can use `$(git rev-parse HEAD)` or improve the script to generate an ever-increasing identifier.
 - JSMIN_DIR is the path to a local install of jsMin, the minifier tool by Douglas Crockford
 
Once done, run it : `build\buildAll.-sh`

The output is located in `dist\${BUILD_NUMBER}`


## CREDITS

Soundbox player (player-small.js) by Marcus Geelnard, under zlib/linbpng licence

Background song is a cover of [VectorDance by Cult](https://www.pouet.net/prod.php?which=67022)
