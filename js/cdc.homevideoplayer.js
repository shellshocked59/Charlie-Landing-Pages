cdc.util.ensureNamespace('cdc.homeVideoPlayer');
cdc.homeVideoPlayer.flashCallBacks = {
	play: function(){},
	pause:function(){},
	complete: function(){},
	replay:function(){},
	jsReady: function(){ return true; },
	ready: function(){},
	error: function(){}
};
cdc.homeVideoPlayer.errors = {
	ERROR_GENERAL : 'General Error'
};
cdc.homeVideoPlayer.create = function(args){
	
	/*************************************************************
	 * 
	 * Begin Loading of variables, settings and detection scripts
	 * 
	 ************************************************************/	
	
	//Console
	//if(typeof(console)=="undefined") { console = { log:function(e){} } };

	//Dependency Check
	if(typeof(jQuery)=='undefined') { return false; }

	//Blank Function
	var df=function(){};
	
	//Default Settings
    var default_settings = {
		errorCallback: df,
		readyToStartCallback: df,
		startCallback: df,
		doneCallback: df,
		playCallback: df,
		pauseCallback: df,
        videoSmil:'',
        videoH264:'',
        videoOGG: '',
        videoWebM: '',
        width:960,
        height:540,
        title:'',
        autoplay: false,
        poster: '',
        flashExpressInstall: "/assets/prod/uc/cius/landing/t1m/swf/expressInstall.swf",
        flashPlayerSwf: "/assets/prod/uc/cius/landing/t1m/swf/videoplayer.swf"
    };

	//Create Instance Settings Variable
	var settings = $.extend(default_settings,args || {});
	
	//Create empty Error Item
	var errors = [];	
	function addError(msg){
		errors.push(msg);
		
		//Error Callback
		settings.errorCallback(msg);
	}
	
	//Check Proper Capabilities
	var support = {
		ie: jQuery.browser.msie,
		mobile: (navigator.userAgent.search(/(Pad)|(Pod)|(BlackBerry)|(Phone)|(Mobile)|(Android)|(Symbian)/i ) != -1),
		desktop: !this.mobile,
		ipad : (navigator.userAgent.search(/(iPad)/i ) != -1),
		video: (!!document.createElement('video').canPlayType),
		flash: false
	};
	
	//Check for Flash, No Versions
	function checkFlashPlayer() {
		if( support.ie ){
			try { 
				var a = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
				if(a){ return true; }
			} catch(e) { return false; }
		} else {
			try {
				if(navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin){
					return true;
				}
			} catch(e) { return false; }
		}
		
		return false;
	}
	
	//IE & ExternalInterface Flash Bug - http://newbreedofgeek.blogspot.com/2008/11/ie7-removing-div-containing-swfobject.html
	function removeFlaskLeakInIE(id) { 
	    var obj = document.getElementById(id);
	    if (obj) {
	        for (var i in obj) {
	            if (typeof obj[i] == "function") {
	            obj[i] = null;
	            } 
	    	}
	    	obj.parentNode.removeChild(obj);
		}
	}	
	
	//Shell for Player
	var player = null;
	
	/*************************************************************
	 * 
	 * Begin Initialization of Player Object
	 * 
	 ************************************************************/
	
	init();

	//Initialization of Player
	function init(){

        support.flash = checkFlashPlayer();
        
        if( support.flash ){
            loadFlashPlayer();
        } else {
            if(support.video){
            	loadHtmlPlayer();
            } else {
            	loadNoPlayer();
            }
        }
		
	}

    function convertTime(s){
        var seconds = Math.round(s % 60);
        seconds < 10?seconds = "0" + seconds:seconds;
        return Math.floor(s/60) + ':' + seconds;
    }

	function loadHtmlPlayer() {

	    //build Objects
	    var vc$ = $('<div id="csVideoContainer" class="csvid-container" style="width:'+settings.width+'px;height:'+settings.height+'px;">'
	    	+ '<video id="csVideoElement" width="'+settings.width+'" height="'+settings.height+'"/>' 
	    	+ '<div id="csVideoOverlay" class="csvid-screen" style="position:absolute;top:0px;left:0px;width:'+settings.width+'px;height:'+settings.height+'px;" />'
	    	+ '</div>'
	    );

		//Video Tag
        ve$ = vc$.find('video');
        ve = ve$.get(0);
        
		//Set up Video Error Event
		ve$.bind('error', _onError );
			
		//Adding Sources
		//Each if statement checks for video string, and playability on current browser
        if(settings.videoH264 != '' && ve.canPlayType('video/mp4') ){ 
        	ve.src = settings.videoH264;
    	} else if(settings.videoOGG != '' && ve.canPlayType('video/ogg') ){ 
    		ve.src = settings.videoOGG; 
		} else if (settings.videoWebM != '' && ve.canPlayType('video/webm') ){ 
			ve.src = settings.videoWebM;
		} else {
			//No suitable video was found
			addError( cdc.homeVideoPlayer.errors.ERROR_GENERAL );
		}
        
        //Attempt to load the video
        ve.load();
        
        //Add Poster Image
        if(settings.poster != ''){
        	vc$.find('#csVideoOverlay').
        		append('<img id="imger" src="'+settings.poster+'" style="cursor:pointer;width:'+settings.width+'px;height:'+settings.height+'px;" />');
        }
		
		//Video Controls
		var controlsClass = (support.ipad)? 'csvid-playprogressfs':'csvid-playprogress';
		
        vc$.append('<div class="csvid-controls '+controlsClass+'">'
        	+ '<a id="csVideoPlay" class="csvid-play" href="javascript:void(0);">Play</a>'
        	+ '<div class="csvid-progress"><div class="csvid-current-time" >0:00</div><div class="csvid-progress-right"><div class="csvid-progress-holder"><div class="csvid-load-progress">&nbsp;</div><div class="csvid-play-progress"></div></div></div><div class="csvid-total-time">0:00</div></div>'
         	+ '</div>'
        	);
            
        if(support.ipad){                           
        	vc$.find('.csvid-controls').append('<a id="csVideoFS" class="csvid-fullscreen" href="javascript:void(0);">Full Screen</a>');	
		}
		
		//Build Player Object
		player = {
			config: {
				started:false,
				progress:null,
				duration:null,
				type:'HTML5',
				title: settings.title
			},
			getVideo: function() {
				//This Returns the actual video tag element
				return ve;
			},
			getContainer: function() {
				//This Returns the jQuery object for the video container
				return vc$;
			},
			getOffset: function() {
				var offset = null;
				try{ 
					offset = this.getVideo().currentTime;
					return offset;
				} catch(e) { return null;  }
				return null;
			},			
			play: function(){

				try{

					//Check for Ended Video
					if(this.getVideo().ended){
						if(support.ipad){
							this.getVideo().load();
						} else {
							this.getVideo().currentTime = 0;
						}
					}
					
					//Try to play
					this.getVideo().play();
					
					//Run Callback Function
					//If duration is not yet set, wait to let the time update call the play callback
					if(player.config.duration != null){
						settings.playCallback();
					}
				} catch(e) { }
			},
			pause:function(){
				try {
					
					//Try to pause
					this.getVideo().pause();
					
					//Set to Started and add toggle Pause Class
	            	this.getContainer().find('.csvid-play').removeClass('csvid-pause');
	            	
	            	//Show Controls
                	//setTimeout(this.hideControls, 3000);
				
					//Run Callback Function
					settings.pauseCallback();
					
				} catch(e) { }
			},
			fullscreen: function() {
				//Check for webkit Fullscreen & ipad
				if(!!player.getVideo().webkitEnterFullScreen && (!navigator.userAgent.match("Chrome") && !navigator.userAgent.match("Mac OS X 10.5"))  ){
					try {
						this.getVideo().webkitEnterFullScreen();
					} catch(e) { }
				} else {
					if( this.getContainer().hasClass('csvid-container-fullscreen')){
						this.getContainer().removeClass('csvid-container-fullscreen').css({width:settings.width+'px',height:settings.height+'px'});
					} else {
						this.getContainer().addClass('csvid-container-fullscreen').css({width:'100%',height:'100%'});
					}
				}
			},
			destroy:function(){
				//Clear out Video Container and all of its event & data
				this.getContainer().remove();
			}
		};
		
		//Define Event Functions		
		function _onControlsClick(e) {
	            switch(e.target.id){
	                case 'csVideoPlay':
						//toggle Video according to paused attribute
						if(player.getVideo().paused || player.getVideo().ended){
							player.play();
						} else {
							player.pause();
						}
	                    break;
	                case 'csVideoFS':
	                    player.fullscreen();
	                    break;
	            }
		}		
		
		function _onError(e) {
			if(!e.target.error){ return; }
			var message = '';
			
			switch (e.target.error.code) {
				case e.target.error.MEDIA_ERR_ABORTED:
				case e.target.error.MEDIA_ERR_NETWORK:
				case e.target.error.MEDIA_ERR_DECODE:
				case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
				default:
					message = cdc.homeVideoPlayer.errors.ERROR_GENERAL;
					break;
			}
			
			//Error so unbind
			try{ player.getContainer().find('video').unbind(); } catch(e) { }
			
			//Add Error Message
			//Error Callback is in the addError Function
			addError(message);
			
		}		
		
		function _onPlay(e) {
			//Set to Started and add toggle Pause Class
        	player.config.started = true;
        	player.getContainer().find('.csvid-play').addClass('csvid-pause');
			
			//Hide Overlay
			player.getContainer().find('#csVideoOverlay img').hide();
        	
        	//Autohide Controls
        	//setTimeout(this.hideControls, 3000);

		}
		
		function _onEnd(e) {
			//Reset Video
			try {		
				//Events stay bound to video player, since the user can press play and start the video over again
				
				//Try to drop out of full screen for iPad
				try {
					player.getVideo().webkitExitFullscreen();
				} catch(e) { }
				
				//Reset a couple of variables
				player.config.started = false;
				
				//Show Play Button
				player.getContainer().find('.csvid-play').removeClass('csvid-pause');
				
				//Set to Completed on Controls
	            player.getContainer().find('.csvid-play-progress').css('width', '100%');
	            player.getContainer().find('.csvid-current-time').html( '0:00' );				
			} catch(e) { }
			
			//Run Callback Function
			settings.doneCallback();
		}
		
		function _onTimeUpdate(e) {
			//Checking for pause as well, because chrome passes the first two arguments right at launch
			if(!isNaN(e.target.currentTime) && !isNaN(e.target.duration)  && !e.target.paused){
				if(e.target.currentTime >= e.target.duration){
					//Started variable is set to false when end is reached.  This checks
					//that variable to avoid double-callback of end function
					if(player.config.started){
						_onEnd(e);
					}
					
				} else {
					//Now that time is available, update duration and fire the "play/start" callbacks
					if(player.config.duration == null){
						//Set Started Config
						player.config.started = true;						
						
						//Update Player config duration
						player.config.duration = e.target.duration;
						
						//Run Callback Function (call the play and start callbacks)
						settings.startCallback(player.config.duration);
						settings.playCallback(player.config.duration);
					}
					
					//Still playing
                    var factor = e.target.duration - e.target.currentTime;
                    player.getContainer().find('.csvid-play-progress').css('width', (e.target.currentTime/e.target.duration)*100 +'%');
                    player.getContainer().find('.csvid-current-time').html( convertTime(factor) );
                    player.getContainer().find('.csvid-total-time').html( convertTime(e.target.duration) );
				}

			} else {
				//Time isn't available yet
			}
		}
		
		function _onOverlayClick(e) {
            if(!player.config.started){
                player.play();
            } else {

            }
		}
		
		//Set up other Video Events
		ve$.bind('timeupdate', _onTimeUpdate )
			.bind('playing', _onPlay);
	
		//Set up Events	
		vc$.find('#csVideoOverlay').click( _onOverlayClick );
		vc$.find('.csvid-controls').click( _onControlsClick );
	}

	function loadFlashPlayer() {
		
	    //build Objects
	    var vc$ = $('<div id="csVideoContainer" class="csvid-container" style="width:'+settings.width+'px;height:'+settings.height+'px;" />');

		//Get Flash Object
		var fo = "";
		var fv = {
			width:settings.width,
			height:settings.height,
			smilPath:settings.videoSmil || settings.videoH264 || "",
			videoName:settings.title
		};
		
		if( support.ie ){
			fo = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+settings.width+'" height="'+settings.height+'" id="csVideoFlash">' +
				'<param name="movie" value="'+ settings.flashPlayerSwf +'" />' +
				'<param name="wmode" value="transparent" />' +
				'<param name="allowfullscreen" value="true" />' + 
				'<param name="allowscriptaccess" value="always" />' + 
				'<param name="scale" value="noscale" />' +
				'<param name="salign" value="tl" />' +
				'<param name="flashvars" value="'+jQuery.param(fv)+'" />' +
				'</object>';
		} else {
			fo = '<object type="application/x-shockwave-flash" data="'+ settings.flashPlayerSwf +'" width="'+settings.width+'" height="'+settings.height+'" id="csVideoFlash">' +
				'<param name="wmode" value="transparent" />' +
				'<param name="allowfullscreen" value="true" />' + 
				'<param name="allowscriptaccess" value="always" />' +
				'<param name="scale" value="noscale" />' +
				'<param name="salign" value="tl" />' +				
				'<param name="flashvars" value="'+jQuery.param(fv)+'" />' +
				'</object>';
		}

		var ve = ''; //vc$.find('object').get(0);
		
		//Build Player Object
		player = {
			config: {
				playWhenReady:false,
				started:false,
				progress:null,
				duration:null,
				ready: false,
				type:'Flash',
				title: settings.title
			},
			getVideo: function() {
				//This Returns the actual video tag element
				var flashobj = vc$.find('object');
				if(flashobj.length){
					return flashobj.get(0);
				} else {
					return false;
				}
			},
			getContainer: function() {
				//This Returns the jQuery object for the video container
				return vc$;
			},
			getOffset: function() {
				var offset = null;
				try{ 
					offset = this.getVideo().getTime();
					return offset;
				} catch(e) { return null;  }
				return null;
			},
			init: function(){
				if(settings.autoplay){
					this.config.playWhenReady = true;
				}
                vc$.get(0).innerHTML = fo;
			},
			play: function(){
				try{
					if(this.getVideo()==false){
						this.config.playWhenReady = true;
						this.init();
					} else {
						this.getVideo().playVideo();
					}
					
					//Boolean indicating the video playback is initiated
					this.started=true;

				} catch(e) {
					
				}
			},
			pause:function(){
				try{
					this.getVideo().pauseVideo();
				} catch(e) {
					
				}
			},
			fullscreen: function() {
				return;
			},
			destroy:function(){
				//Fix memory leak issues with IE
				if (support.ie && $("#csVideoFlash").length) {
					try {
						removeFlaskLeakInIE( 'csVideoFlash' );
					} catch(err){}
				}				
				
				//Clear out Video Container and all of its event & data
				this.getContainer().remove();
			}
		};
		
		function _onEnd(){
			//Run Callback Function
			settings.doneCallback();
		}
		function _onPause(t){
			//time offset
			
			//Run Callback Function
			settings.pauseCallback();
		}
		function _onPlay(d){
			//Run Callback Function
			player.config.duration = parseInt(d);
			settings.playCallback();
		}
		function _onReady() {
			//Set Player Ready
			player.config.ready = true;
			
			if(player.config.playWhenReady == true){
				player.play();
			}
		}
		function _onError(msg) {
			//Run Callback Function
			settings.errorCallback(msg);
		}
		cdc.homeVideoPlayer.flashCallBacks.play = _onPlay;
		cdc.homeVideoPlayer.flashCallBacks.pause = _onPause;
		cdc.homeVideoPlayer.flashCallBacks.complete = _onEnd;
		cdc.homeVideoPlayer.flashCallBacks.ready = _onReady;
		cdc.homeVideoPlayer.flashCallBacks.error = _onError;
		
		/**
		 *
		 * Flash Player 9 Fix (http://blog.deconcept.com/2006/07/28/swfobject-143-released/)
		 *
		**/
		if (window.attachEvent) {
			window.attachEvent("onbeforeunload", function(){
				__flash_unloadHandler = function() {};
				__flash_savedUnloadHandler = function() {};
			});
		}
	}
	
	function loadNoPlayer() {
		//Set Error since no player is available
		addError( cdc.homeVideoPlayer.errors.ERROR_GENERAL );
		
		//Build Player Object
		player = null;
	}
	
	//Delayed Ready Callback
	setTimeout( function(){ 
		if(errors.length){
			//Error has already happened so dont do a ready callback
		} else {
			settings.readyToStartCallback(player);
		}}, 25);
		
	//Return Player	
	return player;
};
