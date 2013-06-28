/*global getHarpHelper : false, window: false, $: false */

$(function(){
	var key = "G",
		pos = 2,
		harp = "C",
		overblows = false,
		scale = "blues",
		tuning = "richter",
		sup = "<sup class=\"hidesup\">&nbsp;</sup>",
		initialLoadComplete,
		helper = getHarpHelper(),
		songList = getSongListHelper(),
		landscape = $(window).height() < $(window).width(),
		fullscreen = false,		
		table = $("#mainTable"),
		cells = $("td", table),
		cache,
		userUpdating = true,
		songListInitialLoad = false,
		pageReady,
		splashShown = false,
		splashTimeout,
		splashAlreadyShown = false, //Bool to allow a shorter splash screen display after the first time it's shown.
		tableRows = [$(".blow2 td", table),
					 $(".blow1 td", table),
					 $(".blow0 td", table),
					 $(".draw0 td", table),
					 $(".draw1 td", table),
					 $(".draw2 td", table),
					 $(".draw3 td", table)];
	
	cache = { dlgs:[], btns:[], inputs:[], active:[] };	
	
	//Register for changes to the selected song
	songList.onSongChange(function(song){
		key = song.key;
		pos = song.pos;
		harp = song.harp;
		overblows = song.overblows;
		scale = song.scale;
		tuning = song.tuning;
		refreshMainUI();
		updateOverblowUI();
		updateTuningButton();
		updateScaleButton();
		$.mobile.changePage( "#mainPage", { transition: 'none'});
	});
		
	function updateDialogUI(buttonId, buttonLabel, dialogId, dialogItemId) {
		var dialog = cache.dlgs[dialogId] || (cache.dlgs[dialogId] = $("#"+ dialogId));
		var button = cache.btns[dialogId] || (cache.btns[dialogId] = $("#"+ buttonId +" .ui-btn-text"));
		var inputs = cache.inputs[dialogId] || (cache.inputs[dialogId] = $("input", dialog));
		
		button.html(buttonLabel); //Update the button label
		
		//Replace the ui-btn-active class
		$(".ui-btn-active", dialog).removeClass("ui-btn-active");
		
		//Add the active class to the selected item
		$('label[for="'+ dialogItemId +'"]').addClass("ui-btn-active");
	}
		
	//Update the UI to reflect the currently selected key.
	function updateSongKeyUI(){
		updateDialogUI("key", sup + "Key " + key.replace("s", "#"), "songKeyDialog", "song-key-" + key);
	}
	
	//Update the UI to reflect the currently selected harp.
	function updateHarpKeyUI(){
		updateDialogUI("harp", sup + harp.replace("s", "#") + " harp", "harpKeyDialog", "harp-key-" + harp);
	}
	
	//Update the UI to reflect the currently selected position.
	function updatePositionUI(){
		var superScript = getSuperscript(pos);
		updateDialogUI("pos", sup + pos + superScript.sup() +" Pos", "positionDialog", "position-" + pos);
	}
	
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
	
	//Update the UI to reflect the currently selected tuning.
	function updateTuningButton(){
		$("#tuning .ui-icon-text").text(tuning.replace("-", " ")); //Update the button label
	}
	
	//Update the UI to reflect the currently selected scale.
	function updateScaleButton(){
		$("#scale .ui-icon-text").text(scale.replace("-", " ")); //Update the button label
	}
	
	//Update the UI to reflect the currently selected overblow status.
	function updateOverblowUI(){
		$("#overblows").toggleClass("obs-on", overblows)
								  .toggleClass("obs-off", !overblows);
		$("#mainTable .overblow").toggle(overblows);
	}
	
	function updateFullscreenUI(){
		$(".ui-header .ui-navbar").toggle(!fullscreen);
		$(".ui-footer").toggle(!fullscreen);
	}
	
	function setRowNotes(row, notes) {
		var i, classes;
		for (i=0; i<notes.length; i++){
			row.get(i).innerHTML = notes[i].note ? "<span>" + notes[i].note + "</span>" : "";
			
			if(notes[i].note) {
				classes = [];
				if (notes[i].overblow) {
					classes.push("overblow");
				}
				if (notes[i].scaleNote >= 0) {
					classes.push("scale-note-" + notes[i].scaleNote);
				}
				row.get(i).firstChild.className = classes.join(" ");
			}
		}
	}
	
	function refreshMainUI() {
		var harpMap = helper.getHarp(harp, tuning, key, scale),
			i;
		for(i=0; i<tableRows.length; i++){
			setRowNotes(tableRows[i], harpMap[i]);
		}
		updateOverblowUI();
		saveSettings();
	}
	
	//Adjust the table size, and also do it on window resize.
	function doCellHeight() {
		var available = $(window).height() - $(".ui-header").height() - $(".ui-footer .ui-navbar").height() - $("#legendTable").height() - 30,
			maxLineHeight = Math.floor(available / 8),
			lineHeight, fontSize;
		//Make the height of the table cells relative to their width
		lineHeight = Math.min(maxLineHeight, Math.floor(cells.width() * 0.9));
		lineHeight = Math.max(14, lineHeight); //Apply a minimum height
		
		fontSize = Math.floor(lineHeight * 0.7);
		fontSize = Math.min(32, Math.max(15, fontSize)); //Apply max and min font size
		
		if(this._previousLineHeight !== lineHeight ||
		   this._previousFontSize !== fontSize) {
			//Apply the line height and font size
			//cells.css("line-height", lineHeight + "px");
			table.css({"font-size": fontSize + "px", "line-height": lineHeight + "px"});
			
			this._previousLineHeight = lineHeight;
			this._previousFontSize = fontSize;
		}
	}
	
	//When the song dialog selection is changed, close it and update.
	$("#songKeyDialog input").change(function(){
		$.mobile.changePage( "#mainPage", { transition: 'none'});
		key = $(this).val(); //Get the new song key
		harp = helper.calcHarp(key, pos); //calculate the new harp
		updateSongKeyUI(); //update the song UI
		updateHarpKeyUI(); //update the harp UI
		refreshMainUI(); 
	});	
	
	//When the key dialog selection is changed, close it and update.
	$("#positionDialog input").change(function(event){
		$.mobile.changePage( "#mainPage", { transition: 'none'});
		pos = Number($(this).val()); //Get the new position
		harp = helper.calcHarp(key, pos); //calculate the new harp
		updatePositionUI(); //update the song UI
		updateHarpKeyUI(); //update the harp UI
		refreshMainUI(); 
	});
	
	//When the harp dialog selection is changed, close it and update.
	$("#harpKeyDialog input").change(function(event){
		harp = $(this).val(); //Get the new harp
		key = helper.calcKey(harp, pos);
		updateHarpKeyUI(); //update the harp UI
		updateSongKeyUI(); //update the song UI
		refreshMainUI(); 
		
		$.mobile.changePage( "#mainPage", { transition: 'none'});
	});
	
	//Handle the overblow button click.
	$("#overblows").on("tap", function(){
		overblows = !overblows;
		updateOverblowUI();
		return false;
	});
	
	//When the tuning dialog selection is changed, close it and update.
	$("#tuningDialog input[name='tuning']").change(function(){
		tuning = $(this).val(); //Get the new tuning
		updateTuningButton(); //update the tuning UI
		refreshMainUI(); //update the main UI for the new tuning
		
		if(userUpdating) {
			$.mobile.changePage( "#mainPage", { transition: 'none'});
		}
	});
	
	//When the scale dialog selection is changed, close it and update.
	$("#scaleDialog input[name='scale']").change(function(){
		scale = $(this).val(); //Get the new scale
		updateScaleButton(); //update the scale UI
		refreshMainUI(); //update the main UI for the new scale
		
		if(userUpdating) {
			$.mobile.changePage( "#mainPage", { transition: 'none'});
		}
	});
	
	$('#fullscreenBtn').on('tap', function(){
		fullscreen = !fullscreen;
		updateFullscreenUI();
		doCellHeight();
		return false;
	});
	
	function makeRadioDialogLookNice(event, ui) {	
		//Get the fieldset and buttons and number of cols.
		var dlg = $(event.currentTarget);
		
		if (dlg.attr("ui-updated")) {
			return;
		} else {				
			var fieldset = $("fieldset", dlg),
				buttons = $(".ui-radio", dlg),
				labels = $("label", dlg),
				spans = $("span", labels),
				cols = Math.floor(fieldset.width() / buttons.width());
			
			//The number of columns that are currently there may need to be reduced
			//so that each row has an equal number of items.
			cols = 12 / Math.ceil(12 / cols);
			
			//Apply a width to the fieldset. This ensures that we do 
			//actually have this correct number of columns!
			var targetFieldsetWidth = cols * buttons.width();
			var paddingToApply = ((fieldset.outerWidth() - targetFieldsetWidth) / 2) - cols; //subtract a pixel for each col to allow for rounding
			fieldset.css("padding-left", (paddingToApply + (cols/2)) + "px")
					.css("padding-right", (paddingToApply - (cols/2))+ "px");
			
			//Remove the existing corners.
			labels.removeClass("ui-first-child ui-last-child");
			
			labels.addClass(function(i){
				switch(i) {
					case 0:
						return "ui-corner-tl";
					case cols-1:
						return "ui-corner-tr";
					case labels.length - cols:
						return "ui-corner-bl";
					case labels.length - 1:
						return "ui-corner-br";
				}
			});
			
			dlg.attr("ui-updated", true);
		}
	}
	
	//Need to make the three radio-button dialogs look nice by 
	//adding rounded edges to the corner items after JQM does it's thing.
	$(document).on('pageshow', '#positionDialog', function(event){
		makeRadioDialogLookNice(event);
		updatePositionUI();
	});
	$(document).on('pageshow', '#songKeyDialog', function(event){
		makeRadioDialogLookNice(event);
		updateSongKeyUI();
	});
	$(document).on('pageshow', '#harpKeyDialog', function(event){
		makeRadioDialogLookNice(event);
		updateHarpKeyUI();
	});
			
	$(window).resize(function(){
		var wasLandscape = landscape;
		landscape = $(window).height() < $(window).width();
		
		//If the orientation has changed
		if(landscape !== wasLandscape) {
			
			if(landscape && !fullscreen) {
				//If it's now landscape, and not already fullscreen, then go fullscreen.
				fullscreen = true;
				updateFullscreenUI();
			} else if(!landscape && fullscreen) {
				//If it's now portrait and already fullscreen, get rid of fullscreen.
				fullscreen = false;
				updateFullscreenUI();
			}
		}
		
		doCellHeight();
	});
	
	function loadUI() {
		//Scale and tuning buttons need to be set up so they can display dynamic text instead of an icon.
		function fixCustomButton(btn){
			$(".ui-icon", btn).removeClass("ui-icon");
		}
		fixCustomButton($("#scale"));
		fixCustomButton($("#tuning"));
		
		updateFullscreenUI();
		doCellHeight();
		updateSongKeyUI();
		updatePositionUI();
		updateHarpKeyUI();
		updateTuningButton();
		updateScaleButton();
		refreshMainUI(); 
	}
	
	//When the app is closed, save the settings
	function saveSettings() {
		if (window.localStorage && initialLoadComplete) {
			window.localStorage.setItem("harp-pos", pos);
			window.localStorage.setItem("harp-overblows", overblows);
			window.localStorage.setItem("harp-key", key);
			window.localStorage.setItem("harp-harp", harp);
			window.localStorage.setItem("harp-scale", scale);
			window.localStorage.setItem("harp-tuning", tuning);
			window.localStorage.setItem("splashShown", true);
		}
	}
	
	//When the phone is ready, check localstorage for a saved state
	document.addEventListener("deviceready", function(){
		
		document.addEventListener("menubutton", function(){
			fullscreen = !fullscreen;
			updateFullscreenUI();
			doCellHeight();
		}, true);
		
		document.addEventListener("backbutton", function(){
			if ($.mobile.activePage.attr('id') == "mainPage") {
				navigator.app.exitApp();
			} else {
				$.mobile.changePage( "#mainPage", { transition: 'none'});
			}
		}, true);
		
		if (window.localStorage && window.localStorage.getItem("harp-key")) {
			splashAlreadyShown = !!window.localStorage.getItem("splashShown");
			pos = Number(window.localStorage.getItem("harp-pos"));
			overblows = Boolean(window.localStorage.getItem("harp-overblows"));
			key = window.localStorage.getItem("harp-key");
			harp = window.localStorage.getItem("harp-harp");
			scale = window.localStorage.getItem("harp-scale");
			tuning = window.localStorage.getItem("harp-tuning");
		}
		
		if (pageShown) {
			//Reload the UI with saved settings
			loadUI();
		}
	}, false);
	
	$(document).on("pagebeforechange", function(event, data) {
		if(data.toPage.length && data.toPage[0].id === "mainPage" && !splashShown) {
			
			data.toPage = $("#splashPage");
			splashShown = true;
			
			splashTimeout = setTimeout(function(){
				//Need to fade out the splash screen and show the main page
				$.mobile.changePage( "#mainPage", {
				  transition: "slideup"
				});
			}, splashAlreadyShown ? 1500 : 2500);
		}
	});
	
	$(document).on('tap', '#splashPage', function(){
		clearTimeout(splashTimeout);
		$.mobile.changePage( "#mainPage", {
		  transition: "none"
		});
	});
	
	$(document).on('pageshow', '#mainPage', function(){
		pageShown = true;
		setTimeout(function(){
			loadUI();
		}, 0);
	});
	
	$(document).on('pageshow', '#tuningDialog', function(){
		userUpdating = false;
		//Select the correct tuning item.
		$('input:radio[name="tuning"]').filter('[id="tuning-' + tuning + '"]').next().click();
		userUpdating = true;
	});
	
	$(document).on('pageshow', '#scaleDialog', function(){
		userUpdating = false;
		$('input:radio[name="scale"]').filter('[id="scale-' + scale + '"]').next().click();
		userUpdating = true;
	});
	
	$(document).on('pagebeforeshow', '#addSongPage', function(){
		//Update the labels to show what the user has currently selected
		$("#addSongName").val('');
		$("#addSongNotes").val('');
		$('#addSongPage .warning').hide();
		$('#addSongHarpKey').html(harp.replace("s", "#") + " ("+ pos + "<sup>" + getSuperscript(pos) +"</sup> Pos)");
		$('#addSongKey').text(key.replace("s", "#"));
		$('#addSongTuning').text(tuning);
		$('#addSongScale').text(scale);
		$('#addSongOverblows').text(overblows ? 'On' : 'Off');
	});
	
	$(document).on('tap', '#addSongOK', function(){
		//Check they've filled in the song name
		$songName = $("#addSongName");
		if(!$songName.val()) {
			$('#addSongPage .warning').show();
		} else {
			songList.add(harp, pos, key, tuning, scale, overblows, $songName.val(), $("#addSongNotes").val());
			$('#addSongPage').dialog('close');
		}
	});
	
	//Only allow saving settings a few seconds after the app is opened.
	//This means that saved settings have time to load before they're overwritten.
	setTimeout(function(){
		initialLoadComplete = true;
	}, 2000);
	
});