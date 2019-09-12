/**
 * Data saved to local storage :
 *  - sfx / music preferences
 *  - lap and track records
 *
 * Object storage implementation from http://stackoverflow.com/questions/2010892/storing-objects-in-html5-localstorage/3146971
 */
 
/**
 * @constructor
 */
function PersistentData()
{
	this.data = {
		soundOn : true,
		musicOn : true,
		mouseControl : false	// use keyboard by default
	}
	var recordedData = localStorage.getItem("InfiltrationData");
	if (recordedData) {
		this.data = JSON.parse(recordedData);

	}
}

PersistentData.prototype = {
	
	/**
	 * Private method to synchronize local storage with current data
	 */
	storeData : function() {
		localStorage.setItem("InfiltrationData", JSON.stringify(this.data));
	},
	
	/**
	 * Toggle Sound effects on and off.
	 */
	toggleSound : function() {
		this.data.soundOn = ! this.data.soundOn;
		this.storeData();
	},
	
	/**
	 * Toggle music on and off.
	 */
	toggleMusic : function() {
		this.data.musicOn = !this.data.musicOn;
		this.storeData();
	},

	/**
	 * Toggle control device : mouse (true) or keyboard (false)
	 */
	setInputDevice : function(mouseControl) {
		this.data.mouseControl = mouseControl;
		this.storeData();
	}

	
}
