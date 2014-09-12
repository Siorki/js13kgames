/**
 * Wrapper for audio.
 * Sfx and music use Audio HTML tag (load music, play and forget)
 *
 * @constructor
 */
function SoundManager(persistentData) {
	this.persistentData = persistentData;
	try {
			var audioTag = new Audio("");
			var wavSupported = audioTag.canPlayType('audio/wav');
			this.audioTagSupport = (wavSupported=="probably" || wavSupported=="maybe");
		} catch (e) {
			this.audioTagSupport = false;
		}		
}

SoundManager.prototype = {
	
	/**
	 * Create all the audio tags instances with the associated waves compiled by Soundbox Lite
	 */
	initMusic : function() {
		if (this.audioTagSupport) {
			
			var songGen = new CPlayer();
			songGen.init(songShotgunAndBounce);
			songGen.generate();
			this.audioShotgun = new Audio(URL.createObjectURL(new Blob([songGen.createWave()], {type: "audio/wav"})));
			songGen.generate();
			this.audioShotgunAndBounce = new Audio(URL.createObjectURL(new Blob([songGen.createWave()], {type: "audio/wav"})));
			
			songGen = new CPlayer();
			songGen.init(songExplosion);
			songGen.generate();
			this.audioExplosion = new Audio(URL.createObjectURL(new Blob([songGen.createWave()], {type: "audio/wav"})));
			
			songGen = new CPlayer();
			songGen.init(songExit);
			songGen.generate();
			this.audioExit = new Audio(URL.createObjectURL(new Blob([songGen.createWave()], {type: "audio/wav"})));
			
			songGen = new CPlayer();
			songGen.init(songLevelWon);
			songGen.generate();
			songGen.generate();
			this.audioLevelWon = new Audio(URL.createObjectURL(new Blob([songGen.createWave()], {type: "audio/wav"})));
			
			songGen = new CPlayer();
			songGen.init(songLevelLost);
			songGen.generate();
			this.audioLevelLost = new Audio(URL.createObjectURL(new Blob([songGen.createWave()], {type: "audio/wav"})));
			
			songGen = new CPlayer();
			songGen.init(songMusic);
			songGen.generate();
			songGen.generate();
			songGen.generate();
			songGen.generate();
			songGen.generate();
			this.audioMusic = new Audio(URL.createObjectURL(new Blob([songGen.createWave()], {type: "audio/wav"})));
			
			this.audioMusic.loop = true;
		}

	},
	
	/**
	 * Listener for sfx setup change.
	 * Stop sfx in progress
	 */
	sfxFlagChanged : function() {
		if (this.audioTagSupport) { 
			if (!this.persistentData.soundOn) {
				this.audioShotgun.pause();
				this.audioShotgunAndBounce.pause();
				this.audioExplosion.pause();
				this.audioExit.pause();
				this.audioLevelWon.pause();
				this.audioLevelLost.pause();
			}
		}
	},
	
	/**
	 * Start playing music at the beginning of the loop
	 * only if audio supported and music toggled on 
	 */
	startMusic : function() {
		if (this.audioTagSupport && this.persistentData.musicOn) {
			this.audioMusic.currentTime=0;
			this.audioMusic.play();
		}
	},
	
	/**
	 * Stop the music playback
	 */
	stopMusic : function() {
		if (this.audioTagSupport)
		{
			this.audioMusic.pause();
		}
	},	 


	/**
	 * Sound for shotgun fire + reload
	 */
	playShotgun : function() {
		if (this.audioTagSupport && this.persistentData.soundOn) {
			this.audioShotgun.currentTime=0;
			this.audioShotgun.play();
		}
	},

	/**
	 * Sound for shotgun fire + bounce + reload
	 */
	playShotgunAndBounce : function() {
		if (this.audioTagSupport && this.persistentData.soundOn) {
			this.audioShotgunAndBounce.currentTime=0;
			this.audioShotgunAndBounce.play();
		}
	},
	
	/**
	 * Sound for landmine explosion
	 */
	playExplosion : function() {
		if (this.audioTagSupport && this.persistentData.soundOn) {
			this.audioExplosion.currentTime=0;
			this.audioExplosion.play();
		}
	},
	
	/**
	 * Sound when critter exits the play area
	 */
	playExit : function() {
		if (this.audioTagSupport && this.persistentData.soundOn) {
			this.audioExit.currentTime=0;
			this.audioExit.play();
		}
	},

	/**
	 * Sound when a level is won
	 */
	playLevelWon : function() {
		if (this.audioTagSupport && this.persistentData.soundOn) {
			this.audioLevelWon.currentTime=0;
			this.audioLevelWon.play();
		}
	},
		
	/**
	 * Sound when a level is lost
	 */
	playLevelLost : function() {
		if (this.audioTagSupport && this.persistentData.soundOn) {
			this.audioLevelLost.currentTime=0;
			this.audioLevelLost.play();
		}
	}

	
}