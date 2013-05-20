/*global $: false */
function getHarpHelper(){
	var fifthsKeys = ["C", "G", "D", "A", "E", "B", "Fs", "Cs", "Ab", "Eb", "Bb", "F"],
		straightKeys = ['Ab','A','Bb','B','C','Cs','D','Eb','E','F','Fs','G'],
		harpMaps = {}, //Cache of harp maps to save having to re-calculate every time.
		scaleNotes = {}, //Cache of scale notes
		tunings = { 
			richter: [
				//1   2   3   4   5   6   7   8   9  10
				[-1, -1, -1, -1, -1, -1, -1, -1, -1, 34], //2-note blow bend
				["3",-1, -1,"15","18","22",-1, 27, 30, 35], //1-note blow bend
				[ 0,  4,  7, 12, 16, 19, 24, 28, 31, 36], //blow
				[ 2,  7, 11, 14, 17, 21, 23, 26, 29, 33], //draw
				[ 1,  6, 10, 13, -1, 20,"25",-1,"32","37"], //1-note draw bend
				[-1,  5,  9, -1, -1, -1, -1, -1, -1, -1], //2-note draw bend
				[-1, -1,  8, -1, -1, -1, -1, -1, -1, -1]  //3-note draw bend
			],
			paddyrichter: [
				//1   2   3   4   5   6   7   8   9  10
				[-1, -1, -1, -1, -1, -1, -1, -1, -1, 34], //2-note blow bend
				["3","8",-1,"15","18","22",-1,27,30, 35], //1-note blow bend
				[ 0,  4,  9, 12, 16, 19, 24, 28, 31, 36], //blow
				[ 2,  7, 11, 14, 17, 21, 23, 26, 29, 33], //draw
				[ 1,  6, 10, 13, -1, 20,"25",-1,"32","37"], //1-note draw bend
				[-1,  5, -1, -1, -1, -1, -1, -1, -1, -1], //2-note draw bend
				[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]  //3-note draw bend
			],
			powerbender: [
				//1   2   3   4   5   6   7   8   9  10
				[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], //2-note blow bend
				["3",-1, -1, -1, -1,"20",-1,"27","32","37"], //1-note blow bend
				[ 0,  4,  7, 12, 14, 17, 21, 24, 28, 33], //blow
				[ 2,  7, 11, 14, 16, 19, 23, 26, 31, 36], //draw
				[ 1,  6, 10, 13, 15, 18, 22, 25, 30, 35], //1-note draw bend
				[-1,  5,  9, -1, -1, -1, -1, -1, 29, 34], //2-note draw bend
				[-1, -1,  8, -1, -1, -1, -1, -1, -1, -1]  //3-note draw bend
			],
			minor: [
				//1   2   3   4   5   6   7   8   9  10
				[-1, -1, -1, -1, -1, -1, -1, -1, -1, 34], //2-note blow bend
				[-1, -1,"11",-1,"18",-1, 23, -1, 30, 35], //1-note blow bend
				[ 0,  3,  7, 12, 15, 19, 24, 27, 31, 36], //blow
				[ 2,  7, 10, 14, 17, 21, 22, 26, 29, 33], //draw
				[ 1,  6,  9, 13, 16, 20,"25","28","32","37"], //1-note draw bend
				[-1,  5,  8, -1, -1, -1, -1, -1, -1, -1], //2-note draw bend
				[-1,  4,  -1, -1, -1, -1, -1, -1, -1, -1]  //3-note draw bend
			],
			country: [
				//1   2   3   4   5   6   7   8   9  10
				[-1, -1, -1, -1, -1, -1, -1, -1, -1, 34], //2-note blow bend
				["3",-1, -1,"15",-1,"22",-1, 27, 30, 35], //1-note blow bend
				[ 0,  4,  7, 12, 16, 19, 24, 28, 31, 36], //blow
				[ 2,  7, 11, 14, 18, 21, 23, 26, 29, 33], //draw
				[ 1,  6, 10, 13, 17, 20,"25",-1,"32","37"], //1-note draw bend
				[-1,  5,  9, -1, -1, -1, -1, -1, -1, -1], //2-note draw bend
				[-1, -1,  8, -1, -1, -1, -1, -1, -1, -1]  //3-note draw bend
			],
			melodymaker: [
				//1   2   3   4   5   6   7   8   9  10
				[-1, -1, -1, -1, -1, -1, -1, -1, -1, 34], //2-note blow bend
				["3","8", -1,"15",-1,"22",-1, 27,-1, 35], //1-note blow bend
				[ 0,  4,  9, 12, 16, 19, 24, 28, 31, 36], //blow
				[ 2,  7, 11, 14, 18, 21, 23, 26, 30, 33], //draw
				[ 1,  6, 10, 13, 17, 20,"25","29","32","37"], //1-note draw bend
				[-1,  5, -1, -1, -1, -1, -1, -1, -1, -1], //2-note draw bend
				[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]  //3-note draw bend
			]
		},
		scales = {
			none: [],
			blues: [0, 3, 5, 6, 7, 10],
			major: [0, 2, 4, 5, 7, 9, 11],
			minor: [0, 2, 3, 5, 7, 9, 10]
		};

	
	//Takes an integer and makes sure it's in the range of the keys array.
	function correctKeyIndex(idx, keys) {
		return keys[(idx + keys.length) % keys.length];
	}
	
	function generateScaleNotes(key, scale) {
		var keyIdx = $.inArray(key, straightKeys),
			offsets = scales[scale].slice(0),
			notes = [], i;
		
		//The offsets is in terms of Ab, so change that.
		for(i=0; i<offsets.length; i++) {
			offsets[i] += keyIdx;
		}
		
		//Now calculate the notes and add to the result
		for(i=0; i<offsets.length; i++) {
			notes.push(straightKeys[offsets[i] % 12]);
		}
		
		return notes;
	}
	
	function getScaleNotes(key, scale) {
		var cacheKey = key + ", " + scale;
		if (!scaleNotes[cacheKey]) {
			scaleNotes[cacheKey] = generateScaleNotes(key, scale);
		}
		return scaleNotes[cacheKey];
	}
	
	function combineScaleWithHarp(harpMap, scale) {
		var pos, r, c;
		for(r=0; r<7; r++) {
			for(c=0; c<10; c++) {
				//Check whether the note is in the scale.
				pos = $.inArray(harpMap[r][c].note.replace("#", "s"), scale);
				harpMap[r][c].scaleNote = pos;
			}
		}
		
		//Apply some special cases to scales.
		//1. in some tunings, 2draw and 3blow are the same note. 3blow should be disregarded.
		if (harpMap[2][2].note === harpMap[3][1].note) {
			harpMap[2][2].scaleNote = -1;
		}
		
		return harpMap;
	}
	
	function generateHarpMap(key, tuning) {
		var result = [],
			offsets = tunings[tuning.replace("-", "")],
			keyIdx = $.inArray(key, straightKeys),
			r, c, offset, overblow, note;
		
		for(r=0; r<7; r++) {
			result.push([]);
			for(c=0; c<10; c++) {
				offset = offsets[r][c];
				overblow = false;
				
				//overblows are encoded as strings.
				if (typeof offset === "string") {
					overblow = true;
					offset = Number(offset);
				}
				
				//Get the hole note by adding the key to the offset.
				note = offset < 0 ? "" : straightKeys[(keyIdx + offset) % 12]; //If the offset's -1, then the note isn't playable.
				result[r][c] = {
					note: note.replace("s", "#"),
					overblow: overblow
				};
			}
		}
		return result;
	}

	function getHarpMap(key, tuning) {
		var cacheKey = key + ", " + tuning;
		if(!harpMaps[cacheKey]) {
			harpMaps[cacheKey] = generateHarpMap(key, tuning);
		}
		return harpMaps[cacheKey];
	}
	
	return {
		
		//Gets the hole mapping for a harmonica.
		getHarp: function(key, tuning, songKey, scale) {
			var harpMap = getHarpMap(key, tuning), //Gets the harmonica
				scaleNotes = getScaleNotes(songKey, scale); //gets the specified scale
			return combineScaleWithHarp(harpMap, scaleNotes); //Combine the two
		},
	
		//Given a key and position, calculates the harp.
		calcHarp: function (key, position) {
			var keyIdx = $.inArray(key, fifthsKeys),
				harpIdx = keyIdx - position + 1;
				
			//Harp index index might be outside the bounds of the array.
			return correctKeyIndex(harpIdx, fifthsKeys);
		},
		
		//Given a harp and position, calculates the key.
		calcKey: function (harp, position) {
			var harpIdx = $.inArray(harp, fifthsKeys),
				keyIdx = harpIdx + position - 1;
				
			//Index might be outside the bounds of the array.
			return correctKeyIndex(keyIdx, fifthsKeys);
		}
	};
}