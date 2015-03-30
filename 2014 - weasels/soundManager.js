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
	this.initProgress = 0;
}

SoundManager.prototype = {
	
	/**
	 * Create all the audio tags instances with the associated waves compiled by Soundbox Lite
	 * Designed to be called in an asynchronous loop, iterates until the generation is complete
	 * @return true if init completed, false if more calls are needed
	 */
	initMusic : function() {
		if (this.audioTagSupport) {
			switch (this.initProgress)
			{
				case 0 :
					this.songGen = new CPlayer();
					this.songGen.init(songShotgunAndBounce);
					break;
				case 2 : 
					this.songGen = new CPlayer();
					this.songGen.init(songExplosion);
					break;
				case 3 :
					this.songGen = new CPlayer();
					this.songGen.init(songExit);
					break;
				case 4 : 
					this.songGen = new CPlayer();
					this.songGen.init(songLevelWon);
					break;
				case 6 : 
					this.songGen = new CPlayer();
					this.songGen.init(songLevelLost);
					break;
				case 7 : 
					this.songGen = new CPlayer();
					this.songGen.init(songMusic);
					break;
			}
			this.songGen.generate();
			switch (this.initProgress)
			{
				case 0 :
					this.audioShotgun = new Audio(URL.createObjectURL(new Blob([this.songGen.createWave()], {type: "audio/wav"})));
					break;
				case 1 : 
					this.audioShotgunAndBounce = new Audio(URL.createObjectURL(new Blob([this.songGen.createWave()], {type: "audio/wav"})));
					break;
				case 2 :
					this.audioExplosion = new Audio(URL.createObjectURL(new Blob([this.songGen.createWave()], {type: "audio/wav"})));
					break;
				case 3 :
					this.audioExit = new Audio(URL.createObjectURL(new Blob([this.songGen.createWave()], {type: "audio/wav"})));
					break;
				case 5 :
					this.audioLevelWon = new Audio(URL.createObjectURL(new Blob([this.songGen.createWave()], {type: "audio/wav"})));
					break;
				case 6 :
					this.audioLevelLost = new Audio(URL.createObjectURL(new Blob([this.songGen.createWave()], {type: "audio/wav"})));
					break;
				case 11 : 
					this.audioMusic = new Audio(URL.createObjectURL(new Blob([this.songGen.createWave()], {type: "audio/wav"})));
					this.audioMusic.loop = true;
					break;
			}
			++this.initProgress;
			return (this.initProgress==12);
		} else {
			return true;
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