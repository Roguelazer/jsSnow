//---------------------------------------------------------------------------------------
// XSnow for JavaScript - von Mag. Dr. Nikolaus Klepp - dr.klepp@gmx.at - www.klepp.info
//---------------------------------------------------------------------------------------
/*  jsSnow
    Copyright (C) 2002 Mag. Dr. Nikolaus Klepp <dr.klepp@gmx.at>
	Copyright (C) 2002 INOUE Hiroyuki <dombly@kc4.so-net.ne.jp>
	Copyright (C) 2002 Heiko Feldker <hfeldker@web.de>
	Copyright (C) 2010 James Brown <roguelazer.com>
	Release Id: 0.4

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
*/
//---------------------------------------------------------------------------------------

var undefined;

if (snowEnabled === undefined) {

window.onerror = null;

var pageWidth  = 0;						// page dimension & visible offset
var pageHeight = 0;
var pageOffX   = 0;
var pageOffY   = 0;


// <---- Customizable part ----
var santaImageDir	= 'http://www.roguelazer.com/snow/';				// relative path for Santa images
var santaSize  = '2';                   // 1, 2 or 3 (smaller number specifies smaller image)

var flakes = 100;						// total number of snowflakes
var santa_mass = 5;                     // santa's effective mass during storms
                                        //   specified as the ratio to snow flakes
                                        //   exept 0, which means santa won't be pushed by storms
var santa_speed_PperS =  25;			// santa speed in pixel/second
var flake_speed_PperS =  15;			// flake speed in pixel/second
var storm_speed_PperS = 300;			// storm speed in pixel/second

var santa_init_x	 = -256;			// santa's initial X-position
var santa_direction  = 0;				// santa's movement direction in degree
										//   (between [0:360]; default is (1,0), 90 is to go up )
var santa_appearance = 0.15;			// probability between [0:1] for santa to be shown

var flake_TX          = 1.0;            // max. sec. of flake's constant X-movement on fluttering
var flake_XperY		  = 2.0;			// fluttering movement's max. vx/vy ratio
var santa_TY          = 0.5;            // max. sec. of santa's constant Y-movement in his rugged movement
var santa_YperX       = 0.5;            // santa's rugged movement's max. vy/vx ratio

var storm_duration_S  = 10.0;			// storm duration in seconds - watch out: about 1-2 seconds for deceleration
var storm_lag_S       = 60.0;			// no-storm in seconds
var storm_YperX       = 1/3.0;			// storm's max. vy/vx ratio

var santa_width = 112;
var santa_height = 16;
// ---- Customizable part ---->


var refresh_FperS = 20;					// initial frames/second, recalculated.
var refresh 	  = 1000/refresh_FperS;	// ms/frame

var santa_speed 	= 0;				// santa speed in pixel/frame
var flake_speed 	= 0;				// flake speed in pixel/frame
var storm_speed 	= 0;				// storm speed in pixel/frame
var storm_YperX_current = storm_YperX;  // storm direction varies each time
var storm_v_sin     = 0;                // storm speed's sine
var storm_v_cos     = 1;                // storm speed's cosine
var storm_direction = 0;				// storm X-direction, -1/0=quiet/+1
var storm_id    	= 0;				// ID of storm timer

var storm_blowing	= 1;				// start with storm=ON

var santa;
var santaX	= 0;			// X-position of santa
var santaY	= 0;			// Y-position of santa
var santaSY = 0;			// frames till Y-movement changes
var santaVY = 0;			// variant Y-movement in pixel/frame
var santaMX = 1;			// steady movement's X-ratio
var santaMY = 0;			// steady movement's Y-ratio
var santaDX = 0;			// X-movement in pixel/frame, caused by storm
var santaDY = 0;			// Y-movement in pixel/frame, caused by storm

var flake    = new Array(flakes);
var flakeSize= new Array(flakes);
var flakeX   = new Array(flakes);
var flakeY   = new Array(flakes);
var flakeSX  = new Array(flakes);
var flakeVX  = new Array(flakes);
var flakeVY	 = new Array(flakes);
var flakeVIS = new Array(flakes);
var flakeEnabled = new Array(flakes);
var flakeDX  = 0;			// X-movement in pixel/frame, caused by storm
var flakeDY  = 0;			// Y-movement in pixel/frame, caused by storm



var timer_id    = 0;		// ID if timer proc.
var timer_sum   = refresh;	// Inital values for speed calculation
var timer_count = 1;		// --''--

var flake_visible = 0;		// start with visble flakes for Opera, all others start invisible
var flake_id	  = 0;		// timer id of make_flake_visible

var scrollbarWidth = 20; 	// too lazy to actually determine this

var snowEnabled = -1;

//-------------------------------------------------------------------------
// preload images
//-------------------------------------------------------------------------
var kFlakeImages = 3;
var flake_images = new Array(kFlakeImages);
flake_images[0] = "&#10052;";
flake_images[1] = "&#10053;";
flake_images[2] = "&#10054;";
var santa_image = new Image();
santa_image.src = santaImageDir+'sleigh'+santaSize+'.gif';



//-------------------------------------------------------------------------
// calculates optimum framerate & corresponding speed
//-------------------------------------------------------------------------
function rebuild_speed_and_timer() {
	var old = refresh_FperS;
	refresh = Math.floor(timer_sum/timer_count*2)+10;	// ms/Frame + spare
	// cap out at 60fps
	refresh = refresh < (1 / 60) ? (1/60) : refresh;
	refresh_FperS = Math.floor(1000/refresh);			// frames/second

	santa_speed = santa_speed_PperS/refresh_FperS;		// pixel/second  --> pixel/frame
	flake_speed = flake_speed_PperS/refresh_FperS;		// pixel/second  --> pixel/frame
	storm_speed = storm_speed_PperS/refresh_FperS; 		// pixel/second  --> pixel/frame

	if (timer_id) window.clearInterval(timer_id);		// adapt timer
	timer_id = window.setInterval(move_snow_and_santa,refresh);

	// adapt speed - for smoothness
	if (old != refresh_FperS) {
		var ratio = old/refresh_FperS;
		santaVY *= ratio;
		for (i=0; i<flakes; i++) {
			flakeSX[i] *= ratio;
			flakeVX[i] *= ratio;
			flakeVY[i] *= ratio;
		}
	}

	timer_count /= 2;	// moving medium
	timer_sum   /= 2;
}



//-------------------------------------------------------------------------
// make flakes visible: while initalialisation phase flakes are invisble.
//						after make_flakes_visible, all new flakes start visible
//-------------------------------------------------------------------------
function make_flake_visible_proc() {
	window.clearInterval(flake_id);
	flake_visible = true;
}


//-------------------------------------------------------------------------
// storm proc - turn storm on/off
//-------------------------------------------------------------------------
function storm_proc() {
	// keep ourself from restarting while running
	window.clearInterval(storm_id);

	if (storm_blowing == 0) {
		// turn storm on
		storm_blowing = (Math.random()<0.5) ? -1 : 1 ;
		storm_YperX_current = Math.random()*storm_YperX;

		// prepare values by trigonometrical functions - too heavy for move_snow()
		var storm_theta = Math.atan(storm_YperX_current);
		storm_v_cos = Math.cos(storm_theta);
		storm_v_sin = Math.sin(storm_theta);
		storm_id = window.setInterval(storm_proc,storm_duration_S*1000.0);

	} else {
		// turn storm off
		storm_blowing *= 0.7;
		if ((Math.abs(storm_blowing)<0.05) || (!flake_visible)) {
			storm_blowing = 0;
			storm_id = window.setInterval(storm_proc,storm_lag_S*1000.0);
		} else {
			storm_id = window.setInterval(storm_proc,500.0);
		}
	}

	// preapare movement vektor for snow, caused by storm
	flakeDX = storm_v_cos*storm_speed*storm_blowing;
	flakeDY = Math.abs(storm_v_sin*storm_speed*storm_blowing);

	// preapare movement vektor for santa, caused by storm & santa_mass
	if(santa_mass>0) {
		santaDX = flakeDX/santa_mass;
		santaDY = flakeDY/santa_mass;
	} else {
		santaDX=0;
		santaDY=0;
	}
}




//-------------------------------------------------------------------------
// create all layers & Objects
//-------------------------------------------------------------------------
function init_snow_and_santa() {
	// create santa
	santa   = get_layer_by_name('santa0');
	santaX  = santa_init_x;
	santaY  = Math.random()*pageHeight;
	santaSY = 0;

	if (santa_direction != 0) {
		santaMX =  Math.cos(santa_direction/180*Math.PI);
		santaMY = -Math.sin(santa_direction/180*Math.PI);
	}

	// create flake
	for (var i=0; i<flakes; i++) {
		flake[i]    = get_layer_by_name('flake'+i);
		flakeSize[i] = (Math.floor(Math.random()*10) + 8);
		flake[i].style.fontSize = flakeSize[i] + "px";
		flakeX[i]   = Math.random()*pageWidth;
		flakeY[i]   = Math.random()*pageHeight;
		flakeSX[i]  = 0;
		flakeVX[i]  = 0;
		flakeVIS[i] = flake_visible;
		flakeVY[i]  = 1;
	}
}



//-------------------------------------------------------------------------
// get the named layer
//-------------------------------------------------------------------------
function get_layer_by_name(id) {
	return document.getElementById(id);
}




//-------------------------------------------------------------------------
// move all objects
//-------------------------------------------------------------------------
function move_snow_and_santa() {
	var beginn = new Date().getMilliseconds();
	move_santa();
	move_snow();
	var ende = new Date().getMilliseconds();
	var diff = (beginn>ende?1000+ende-beginn:ende-beginn);
	timer_sum   += diff;
	timer_count ++;
	if (timer_count>10) {
		rebuild_speed_and_timer();
	}
}


//-------------------------------------------------------------------------
// santa's private movement
//-------------------------------------------------------------------------
function move_santa() {
	var santa_e_appearance = snowEnabled * santa_appearance;
	var lmgn = -pageWidth*(1-santa_e_appearance)/santa_appearance;
	var rmgn = pageWidth;
	var h    = pageHeight+santa_image.height;

	// santa outside screen ?
	if (santaX > rmgn) {
		santaX  = lmgn;
		santaY  = Math.random()*pageHeight;
		santaSY = 0;
		santaVY = 0;
	} else if (santaX < lmgn) {
		santaX  = rmgn;
		santaY  = Math.random()*pageHeight;
		santaSY = 0;
		santaVY = 0;
	} else if (santaY >= pageHeight) {
		santaY -= h;
	} else if (santaY < -santa_image.height) {
		santaY += h;
	} else {
		santaX += santaMX * santa_speed + santaDX;
		santaY += santaMY * santa_speed + santaDY;
 	}

	// up-down-movement
	santaSY --;
	if (santaSY <= 0) {
		santaSY = Math.random()*refresh_FperS*santa_TY;
		santaVY = (2.0*Math.random()-1.0)*santa_YperX*santa_speed;
	}

	// move santa to new position
	move_to(santa,santaX,santaY,(santaY<pageHeight-santa_height && santaX<pageWidth-santa_width));
}

//-------------------------------------------------------------------------
// snowflake's private movement
//-------------------------------------------------------------------------
function move_snow() {
	for (var i=0; i<flakes; i++) {
		// flake outside screen ?
		flakeX[i] += flakeVX[i] + flakeDX;
		flakeY[i] += flakeVY[i] + flakeDY;
		var fs = flakeSize[i] * 2;
		var sb = (pageHeight < document.body.offsetHeight) ? scrollbarWidth : 0;
		if (flakeY[i]>(pageHeight-fs)) {
			if (snowEnabled) {
				flakeX[i]  = Math.random()*pageWidth;
				flakeY[i]  = 0;
				flakeVY[i] = flake_speed+Math.random()*flake_speed;
				if (Math.random()<0.1) flakeVY[i] *= 2.0;
				if (flake_visible) flakeVIS[i] = true;
				flakeEnabled[i] = 1;
			} else {
				flakeEnabled[i] = 0;
				flakeVIS[i] = false;
				flakeY[i] = 0;
				flakeX[i] = 0;
			}
		}

		// left-right- movement
		flakeSX[i] --;
		if (flakeSX[i] <= 0) {
			flakeSX[i] = Math.random()*refresh_FperS*flake_TX;
			flakeVX[i] = (2.0*Math.random()-1.0)*flake_XperY*flake_speed;
		}

		if (flakeX[i]<fs)
		    flakeX[i] += pageWidth - sb;
		if (flakeX[i]>=(pageWidth-fs-sb))
			flakeX[i] -= pageWidth-sb;

		// move flake to new position
		move_to(flake[i],flakeX[i],flakeY[i],flakeVIS[i]);
	}
}



//-------------------------------------------------------------------------
// move a layer
//-------------------------------------------------------------------------
function move_to(obj, x, y, visible) {
	if (visible) {
		obj.style.left 		= x+"px";
		obj.style.top		= y+"px";
		obj.style.display 	= "block";
	} else {
		obj.style.display 	= "none";
	}
}


//-------------------------------------------------------------------------
// size of page
//-------------------------------------------------------------------------
function get_page_dimension() {
	pageOffX   = scrollX;
	pageOffY   = scrollY;
	pageWidth  = innerWidth  + pageOffX;
	pageHeight = innerHeight + pageOffY;
}


//-------------------------------------------------------------------------
// initialize all objects & timer
//-------------------------------------------------------------------------
function startSnow() {
	if (snowEnabled !== -1) {
		snowEnabled = 1;
		return;
	}
	snowEnabled = 1;
	sty = document.createElement("link");
	sty.href="http://www.roguelazer.com/snow/jsSnow.css"
	sty.type="text/css";
	sty.rel="StyleSheet";
	document.getElementsByTagName('head')[0].appendChild(sty);
	a = document.createElement("div");
	a.id = "santa0";
	a.style.position = "absolute";
	a.style.left = "-1px";
	a.style.top = "-1px";
	a.style.zindex = 10;
	a.style.display = "block";
	im = document.createElement("img");
	im.src=santa_image.src;
	a.appendChild(im);
	document.body.appendChild(a);

	// each snowflake's private layer
	for (var i=0; i<flakes; i++) {
		a = document.createElement("div");
		a.id = "flake" + i;
		a.className += "snowflake";
		a.style.display = "block";
		a.innerHTML = flake_images[i % kFlakeImages];
		document.body.appendChild(a);
	}

	// recalculate page dimension every second
	window.setInterval('get_page_dimension()',1000);
	get_page_dimension();

	// init all objects
	init_snow_and_santa();

	// place snowflakes, santa & trees
	rebuild_speed_and_timer(refresh);

	// start the animation
	timer_id = window.setInterval(move_snow_and_santa,refresh);
	storm_id = window.setInterval(storm_proc,1800);					// init with visible storm
	flake_id = window.setInterval(make_flake_visible_proc,2000);	// after the storm, let snowflakes fall :-)
}

function stopSnow() {
	snowEnabled = 0;
}

}

startSnow();

/* file-variable settings for Emacsen editors
	Local Variables:
	tab-width: 4
	End:
 */
