<?php
/*
Plugin Name: Club Booking Wrapper
Description: Embeds the built web app for Club Mahabaleshwar.
Version: 0.1
*/
function club_booking_render(){
  $url = plugins_url('../web/index.html', __FILE__);
  echo '<iframe src="'.$url.'" style="width:100%;height:85vh;border:none"></iframe>';
}
add_shortcode('club_booking', 'club_booking_render');
