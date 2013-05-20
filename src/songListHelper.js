function getSongListHelper() {

	var songList = [], 
		initialLoadComplete = false,
		songListInitialLoad = false,
		onSongChangeCallback;
	
	$songListUI = $("#songListPage ul");
	
	$(document).on('pageshow', '#songListPage', function(){
		if(!songListInitialLoad) {
			songListInitialLoad = true;
			refreshUI();
		}
	});
	
	function showConfirm(msg, callback) {
		$("#confirmMsg").html(msg);
		$("#confirmbox .btnConfirmYes").on("click.confirmbox", function() {
			$("#confirmbox").dialog("close");
			callback();
		});

		$.mobile.changePage("#confirmbox");
	}

	
	$("#songListPage").on('tap', 'li', function(e) {
		$li = $(e.toElement).parents("li");
		var song = $li.data("song");
	
		if(e.toElement.className === "ui-btn-inner") {
			//delete button - confirm deletion
			showConfirm("<h3>Really delete this song?</h3><p>"+ song.songName +"</p>", function(){
				for(var i=0; i<songList.length; i++) {
					if(songList[i].id == song.id) {
						//Remove it from the list
						songList.splice(i, 1);
						break;
					}
				}
				
				//Now remove the DOM node. This saves us having to re-generate the entire thing
				$li.remove();
				
				//And save
				save();
				
				$songListUI.listview('refresh');
			});
		} else {	
			if(onSongChangeCallback && song) {
				onSongChangeCallback(song);
			}
		}
	});
	
	function getSuperscript(n) {
		switch (Number(pos)) {
			case 1: 
				return "st";
			case 2:
				return "nd";
			case 3:
				return "rd";
			default:
				return "th";
		}
	}
	
	function save() {
		if (window.localStorage && initialLoadComplete) {
			try {
				window.localStorage.setItem("harp-songlist", JSON.stringify(songList));
			} catch(e) {
				//...
			}
		}
	}
	
	document.addEventListener("deviceready", function(){
		if (window.localStorage && window.localStorage.getItem("harp-songlist")) {
			var strStored = window.localStorage.getItem("harp-songlist");
			if(strStored) {
				try {
					songList = JSON.parse(strStored);
					updateUI();
				} catch(e) {
					//...
				}
			}
		}
	});
	
	function sort() {
		//Sort the list
		songList.sort(function(a, b){
			if(a.songName === b.songName) {
				return 0;
			} else {
				return a.songName > b.songName ? 1 : -1;
			}
		});
	}
	
	function getJQObject() {
		var $result = $("");
		
		for(var i=0; i<songList.length; i++) {
			var $item = $("<li><a class=\"songLink\">" +
							"<h2>"+ songList[i].songName +"</h2>" +
							"<p><strong>"+ songList[i].harp +" Harp - "+ songList[i].pos +"<sup>"+ getSuperscript(songList[i].pos) +"</sup> Pos</strong> (Key of "+ songList[i].key.replace("s", "#") +")<br>"+ songList[i].notes +"</p>" +
						"</a><a href=\"#\">Delete</a>" +
					"</li>");
			
			//Add the data item - the song details.
			$item.data("song", songList[i]);
			
			//Add it to the result
			$result = $result.add($item);
		}
		
		return $result;
	}
	
	function refreshUI() {
		$songListUI.html("")
				   .append(getJQObject())
				   .listview('refresh');
	}
	
	//Only allow saving settings a few seconds after the app is opened.
	//This means that saved settings have time to load before they're overwritten.
	setTimeout(function(){
		initialLoadComplete = true;
	}, 2000);
	
	return {
	
		//Callback for when a song is selected
		onSongChange: function(callback) {
			onSongChangeCallback = callback;
		},
	
		add: function(harp, pos, key, tuning, scale, overblows, songName, notes) {
			songList.push({
				id: new Date().getTime(), //Using timestamp as an ID (the user isn't going to add two songs in the same millisecond...)
				harp: harp,
				pos: pos,
				key: key,
				tuning: tuning,
				scale: scale,
				overblows: overblows,
				songName: songName || "",
				notes: notes || ""
			});
			sort();
			refreshUI();
			setTimeout(function(){
				save();
			});
		}
	};
}