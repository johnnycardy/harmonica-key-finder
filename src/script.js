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
		landscape = $(window).height() < $(window).width(),
		fullscreen = landscape,		
		table = $("#mainTable"),
		cells = $("td", table),
		cache,
		userUpdating,
		pageReady,
		tableRows = [$(".blow2 td", table),
					 $(".blow1 td", table),
					 $(".blow0 td", table),
					 $(".draw0 td", table),
					 $(".draw1 td", table),
					 $(".draw2 td", table),
					 $(".draw3 td", table)];
	
	cache = { dlgs:[], btns:[], inputs:[], active:[] };	
		
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
		var superScript = null;
		switch (pos) {
			case 1: 
				superScript = "st";
				break;
			case 2:
				superScript = "nd";
				break;
			case 3:
				superScript = "rd";
				break;
			default:
				superScript = "th";
		}
		updateDialogUI("pos", sup + pos + superScript.sup() +" Pos", "positionDialog", "position-" + pos);
	}
	
	//Update the UI to reflect the currently selected tuning.
	function updateTuningUI(){
		$("#tuning .ui-icon-text").text(tuning.replace("-", " ")); //Update the button label
		$("#tuningDialog input").removeAttr("checked"); //Uncheck any others
		$("#tuning-" + tuning).attr("checked", true); //Check the specified
	}
	
	//Update the UI to reflect the currently selected scale.
	function updateScaleUI(){
		$("#scale .ui-icon-text").text(scale); //Update the button label
		$("#scaleDialog input").removeAttr("checked"); //Uncheck any others
		$("#scale-" + scale).attr("checked", true); //Check the specified
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
		
		var padding = !fullscreen && landscape ? 60 : 0;
		$("#mainPage .ui-content").css("padding-bottom", padding + "px");
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
		$('#songKeyDialog').dialog('close');
		key = $(this).val(); //Get the new song key
		harp = helper.calcHarp(key, pos); //calculate the new harp
		updateSongKeyUI(); //update the song UI
		updateHarpKeyUI(); //update the harp UI
		refreshMainUI(); 
	});	
	
	//When the key dialog selection is changed, close it and update.
	$("#positionDialog input").change(function(event){
		$('#positionDialog').dialog('close');
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
		
		$('#harpKeyDialog').dialog('close');
	});
	
	//Handle the overblow button click.
	$("#overblows").tap(function(){
		overblows = !overblows;
		updateOverblowUI();
		return false;
	});
	
	//When the tuning dialog selection is changed, close it and update.
	$("#tuningDialog input[name='tuning']").change(function(){
		tuning = $(this).val(); //Get the new tuning
		updateTuningUI(); //update the tuning UI
		refreshMainUI(); //update the main UI for the new tuning
		$('#tuningDialog').dialog('close');
	});
	
	//When the scale dialog selection is changed, close it and update.
	$("#scaleDialog input[name='scale']").change(function(){
		scale = $(this).val(); //Get the new scale
		updateScaleUI(); //update the scale UI
		refreshMainUI(); //update the main UI for the new scale
		$('#scaleDialog').dialog('close');
	});
	
	$('#fullscreenBtn').click(function(){
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
			var paddingToApply = (fieldset.width() - targetFieldsetWidth) / 2;
			fieldset.css("padding-left", paddingToApply + "px")
					.css("padding-right", paddingToApply + "px");
			
			//Remove the existing corners.
			labels.removeClass("ui-corner-left ui-corner-right");
			spans.removeClass("ui-corner-left ui-corner-right");
			
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
	$('#positionDialog').live('pageshow', function(event){
		makeRadioDialogLookNice(event);
		updatePositionUI();
	});
	$('#songKeyDialog').live('pageshow', function(event){
		makeRadioDialogLookNice(event);
		updateSongKeyUI();
	});
	$('#harpKeyDialog').live('pageshow', function(event){
		makeRadioDialogLookNice(event);
		updateHarpKeyUI();
	});
			
	$(window).resize(function(){
		var nowLandscape = $(window).height() < $(window).width();
		//If it's now landscape and it wasn't previously...
		//todo: listen for orientation change event instead.
		if (nowLandscape && !landscape) {
			//If the navbars are on, turn them off.
			fullscreen = true;
			updateFullscreenUI();
		} else if (!nowLandscape && landscape) {
			//Now portrait and wasn't previously portrait...
			fullscreen = false;
			updateFullscreenUI();
		}
		landscape = nowLandscape;
		doCellHeight();
	});
	
	document.addEventListener("menubutton", function(){
		fullscreen = !fullscreen;
		updateFullscreenUI();
		doCellHeight();
	}, false);
	
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
		updateTuningUI();
		updateScaleUI();
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
		}
	}
	
	//When the phone is ready, check localstorage for a saved state
	document.addEventListener("deviceready", function(){
		if (window.localStorage && window.localStorage.getItem("harp-key")) {
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
	
	$('#mainPage').live('pageshow', function(){
		pageShown = true;
		loadUI();
	});
	
	//Only allow saving settings a few seconds after the app is opened.
	//This means that saved settings have time to load before they're overwritten.
	setTimeout(function(){
		initialLoadComplete = true;
	}, 2000);
	
});