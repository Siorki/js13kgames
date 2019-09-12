/**
 * Wrapper for audio.
 * Sfx use WebAudio API (doppler for engine pitch variation) + SpeechSynthesisUtterance
 * Music use Audio HTML tag (load music, play and forget)
 */

 /**
  * @constructor
  */
function SoundManager(persistentData) {
	this.persistentData = persistentData;
}

SoundManager.prototype = {

	initialize : function() {
	
		try {
			var audioTag = new Audio("");
			var wavSupported = audioTag.canPlayType('audio/wav');
			this.audioTagSupport = (wavSupported=="probably" || wavSupported=="maybe");
		} catch (e) {
			this.audioTagSupport = false;
		}
			
		try {
			this.speechSupport = false;
			if (typeof SpeechSynthesisUtterance !== "undefined" && typeof window.speechSynthesis !== "undefined") {
				this.speechSupport = true;
			}
		} catch (e) {
			this.speechSupport = false;
		}
	
		if (this.audioTagSupport) {
			var header="RIFF_oO_WAVEfmt "+atob("EAAAAAEAAQAcRwAAHEcAAAEACABkYXRh"), content = "";
			var lineBuffer=[];
			// Electric guitar Karplus-Strong simulation
			var length = 252;
			for (var i=0; i<length; ++i) {
				lineBuffer[i] = i**2.2/11%1;
				content+=String.fromCharCode(lineBuffer[i]*127+127);
			} 
			for (var i=length; i<3e4; ++i) {
				var lpf = .9*lineBuffer[i%length]+.1*lineBuffer[(i+1)%length];
				lineBuffer[i%length] = lpf;
				content+=String.fromCharCode(Math.min(255, Math.max(0, lpf*127+127)));
			}	
			this.audioFlyback = new Audio("data:audio/wav;base64,"+btoa(header+content));

			content="";
			for (var i=0; i<24576;++i) {
				var envelope = i<150 ? 25 : (i<200 ? 25+2*(i-150) : (i<320 ? 125 : 125*Math.exp((320-i)/500)));
				var square = Math.sin(i*envelope*Math.PI/5000)>0?1:-1;
				var saw = ((1760*256/8000*i)&255)/255;
				var sample = Math.floor(128+.5*envelope*(square+saw));
				content+=String.fromCharCode(sample);
			}
			this.audioCollision = new Audio("data:audio/wav;base64,"+btoa(header+content));
		}
	},
	
	/**
	 * Toggle Voice effects on and off.
	 * Sound playback is stopped immediately when turned off and resumed when turned on.
	 */
	toggleSound : function() {
		if (this.webAudioSupport) { 
			this.persistentData.toggleSound();
			if (!this.persistentData.data.soundOn) {
				window.speechSynthesis.cancel();
			} 
		}
	},
	
	/**
	 * Toggle Background music on and off.
	 * Music playback is stopped immediately when turned off
	 */
	toggleMusic : function() {
		if (this.audioTagSupport) { 
			this.persistentData.toggleMusic();
			if (!this.persistentData.data.musicOn) {
				this.audioFlyback.pause();
				this.audioCollision.pause();
			}
		}
	},
	
	/**
	 * Say a sentence using the speech API
	 * Used for the ship AI's voice
	 * @param pitch Voice pitch, copied straight into SpeechSynthesisUtterance
	 * @param rate Voice rate, 0 = normal, 1 = fast
	 * @param text Text to say
	 */
	speak : function (pitch, rate, text) {
		if (this.speechSupport && this.persistentData.data.soundOn) {
			window.speechSynthesis.cancel();
			var speechContext = new SpeechSynthesisUtterance(text);
			speechContext.pitch = pitch;
			speechContext.rate=.9+rate/2;
			speechContext.lang="en";
			window.speechSynthesis.speak(speechContext);
		}
	},
	
	/**
	 * Sound for flyback 
	 */
	playFlyback : function() {
		//console.log("SFX flyback");
		if (this.audioTagSupport && this.persistentData.data.soundOn) {
			this.audioFlyback.currentTime=0;
			this.audioFlyback.play();
		}
	},

	/**
	 * Sound for collision
	 */
	playCollision : function() {
		//console.log("SFX collision");
		if (this.audioTagSupport && this.persistentData.data.soundOn) {
			this.audioCollision.currentTime=0;
			this.audioCollision.play();
		}
	},	
}
