/*
 * To set-up lightbox links, set the href to the id anchor of the lightbox content (e.g. #lightbox1, lightbox2 )
 * Add the following class to the <a> tag: js-t1m-lightbox
 * 
 * To add video, insert a <div> into your lightbox content with the class of 't1m-video-clip'
 * Add the following attributes:  data-videoh264,data-smil,title and data-poster (optional)
 * The script below will look for those attributes to build the video player
 * 
 */

$(document).ready(function(){

	var videoplayer = null;
	
	var onDOMWindowClose = function(){ 
		try{ videoplayer.destroy(); videoplayer = null; } catch(e){} 
	};
		
	$('.jqmClose').live('click',function(e){ 
		e.preventDefault(); 
		try{ videoplayer.destroy(); videoplayer = null; } catch(err){}
		$.closeDOMWindow({functionCallOnClose:onDOMWindowClose});		
	});
	
	$('.js-t1m-lightbox').click(function(e){
		e.preventDefault();
		
		var lb_href =  $(this).attr('href');           
		lb_href = lb_href.substring (lb_href.indexOf('#') );
		
		//var LightboxWidth = $( $(this).attr('href') ).attr('data-width'); // 742 default
		//var LightboxHeight = $( $(this).attr('href') ).attr('data-height'); //442 default
		
		//changed from using data attributes since DOMWindow erased the data elements on the element after opening the window once
		var LightboxWidth = 540;
		var LightboxHeight = 430;
		
		
		$.openDOMWindow({
	        height:LightboxHeight,
	        width:LightboxWidth, 
	        windowBGColor:'#fff',
	        borderColor: '#666', 
	        borderSize:0, 
	        windowPadding:0,
	        overlayColor: '#666',
	        overlayOpacity: '50',
	        windowSourceID: lb_href,
	        overflow: 'hidden',
			functionCallOnOpen:function(){
				var vidclip$ = $('#DOMWindow').find('.t1m-video-clip'),
					hasStarted = false;
				
				if( vidclip$.length){
	
			        videoplayer = cdc.homeVideoPlayer.create( {
						width:720,
						height:425,
						videoOGG: vidclip$.attr('data-videoogg'),
						videoH264: vidclip$.attr('data-videoh264'),
						videoSmil: vidclip$.attr('data-videosmil'),
						title: vidclip$.attr('title'),
						poster: (vidclip$.attr('data-poster')!='')?vidclip$.attr('data-poster'):'',
	    				autoplay:false,					
						flashPlayerSwf: "swf/videoplayer.swf",
						errorCallback:function(message){
							// error, player can't load
						},
						readyToStartCallback:function(player){							
							if(player == null){
								//If there is no flash and no html5, the player is null
							} else {
								$('#DOMWindow .t1m-video-clip').empty().append( player.getContainer() );
								if(player.config.type=="Flash"){
									player.play();
								}
							}
						},
						doneCallback:function(){
							try{
								trackEvent.event('video',{
									campaign_page:document.title,
									content_container:'' ,
									element_type:'video',
									video_player:videoplayer.config.type,
									element_name:videoplayer.config.title,
									action:'end',
									video_length:''+Math.round(videoplayer.config.duration),
									video_offset:''+Math.round(videoplayer.getOffset() )
								});
							}catch(err){}
							
							
							videoplayer.destroy();
							videoplayer = null;
							try { $.closeDOMWindow(); } catch(e){}
						},
						playCallback:function(){
							if (!hasStarted) {
								hasStarted = true;
								// do metrics "start" action here
								trackEvent.event('video',{
									campaign_page:document.title,
									content_container:'',
									element_type:'video',
									video_player:videoplayer.config.type,
									element_name:videoplayer.config.title,
									action:'start',
									video_length:''+Math.round(videoplayer.config.duration),
									video_offset:'0'
								});
								trackEvent.event('video',{
									campaign_page:document.title,
									content_container:'',
									element_type:'video',
									video_player:videoplayer.config.type,
									element_name:videoplayer.config.title,
									action:'click play',
									video_length:''+Math.round(videoplayer.config.duration),
									video_offset: 0
								});
							}
						}
					});
				}
			}
		});
	});
	
	//Social Ticker
    if( $('#socialmediaticker').length){
        
        //'http://socialmedia.cisco.com/webservices?callback='
        //http://extranet.the1stmovement.com/Cisco/Brand_Landing_0302/t1m/js/ticker.json?callback=?
        var ticker_url = 'http://socialmedia.cisco.com/webservices'+ ( ($('#socialmediaticker').attr('data-ticker')!="")?'/'+$('#socialmediaticker').attr('data-ticker'): '' )  +'/?callback=?';
        $.getJSON(ticker_url, function(d){
             
            var max_ticker_text_length = 60;
             
            //Populate Ticker
            var items = '';
            $.each(d,function(i,v){
                items += '<li class="t1m-ticker-'+v.type+'" data-index="'+i+'"><a name="&amp;lpos=socialdialog_hn" href="'+v.link+'">' + ( (v.title.length > max_ticker_text_length)?v.title.substr(0, max_ticker_text_length)+'...':v.title )  + '</a><span class="date"> - '+v.date+'</span></li>'
            });
            $('#socialmediaticker ol').empty().append(items);
             
            $('#socialmediaticker').data('ticker',{
                list$: $('#socialmediaticker ol'),
                button_next$: $('#socialmediaticker .newsitem-next a'),
                button_prev$: $('#socialmediaticker .newsitem-previous a'),
                length: $('#socialmediaticker ol li').length,
                index: -1,
                interval: null,
                onInterval: null,
                onNext: null,
                onPrev: null,
                goTo: null
            });
             
            var ticker = $('#socialmediaticker').data('ticker');
             
            ticker.goTo = function(i) {
                ticker.list$.find('li').eq(ticker.index).fadeOut('slow');
                ticker.index = i;
                ticker.list$.find('li').eq(ticker.index).fadeIn('slow');
            };
             
            ticker.onNext = function(e,isLoop){ 
                if(isLoop == undefined){
                    //This was not a loop trigger
                    clearInterval(ticker.interval);
                    ticker.interval = setInterval(ticker.onInterval,5000);
                }
                ticker.goTo( (ticker.index+1) % ticker.length );
                return false;
            }
             
            ticker.onPrev = function(e,isLoop){ 
                if(isLoop == undefined){
                    //This was not a loop trigger
                    clearInterval(ticker.interval);
                    ticker.interval = setInterval(ticker.onInterval,5000);
                }
                ticker.goTo ( ((ticker.index==0)?ticker.length:ticker.index)-1 );//  Math.max(ticker.index-1) % ticker.length;
                return false;
            }
             
            ticker.onInterval = function() {
                ticker.button_next$.triggerHandler('click',true);
            }
             
            //Wire Buttons
            ticker.button_next$.click( ticker.onNext );
            ticker.button_prev$.click( ticker.onPrev );
             
            //Initially Hide all other items
            ticker.list$.find('li:gt(0)').hide();
             
            //Start Auto Ticker
            ticker.button_next$.trigger('click');
        });
    }
});

$(window).ready(function(){
	$('.main-hero-content').animate({left: '27'}, 1250).fadeIn('5000');
});

