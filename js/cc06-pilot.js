jQuery(document).ready(function() {
	jQuery('.cc06-image').mouseenter(function(){
		jQuery('.cc06-content').css('display', 'block');
		jQuery('div.cc06-image').removeClass('hide').addClass('show');
		jQuery('.c42v5-content').css('display', 'none');
		jQuery('div.c42v5-image').removeClass('show').addClass('hide');
		});
	jQuery('.cc06-image').mouseleave(function(){
		jQuery('.cc06-content').css('display', 'none');
		jQuery('div.cc06-image').removeClass('show').addClass('hide');
		});
	});

function cc06_chatNow() {
	jQuery('div.cc06-image').css('background-image','url(img/cc06/chat_now_button_sprite.png)');
	};

function cc06_contactUs() {
	jQuery('div.cc06-image').css('background-image','url(img/cc06/contact_us_button_sprite.png)');
	};
