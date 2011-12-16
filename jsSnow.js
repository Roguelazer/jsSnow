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
var santaImageDir = '//www.roguelazer.com/snow/';
var flakeImageDir = santaImageDir;
var santaSize  = '2';                   // 1, 2 or 3 (smaller number specifies smaller image)

var flakes = 100;						// total number of snowflakes
var small_flakes = 400;
var santa_mass = 5;                     // santa's effective mass during storms
                                        //   specified as the ratio to snow flakes
                                        //   exept 0, which means santa won't be pushed by storms
var santa_speed_PperS =  25;			// santa speed in pixel/second
var flake_speed_PperS =  15;			// flake speed in pixel/second
var storm_speed_PperS = 300;			// storm speed in pixel/second

var santa_init_x	 = -256;			// santa's initial X-position
var santa_direction  = 0;				// santa's movement direction in degree
										//   (between [0:360]; default is (1,0), 90 is to go up )
var santa_appearance = 0.025;			// probability between [0:1] for santa to be shown

var flake_TX          = 1.0;            // max. sec. of flake's constant X-movement on fluttering
var flake_XperY		  = 2.0;			// fluttering movement's max. vx/vy ratio
var santa_TY          = 0.5;            // max. sec. of santa's constant Y-movement in his rugged movement
var santa_YperX       = 0.5;            // santa's rugged movement's max. vy/vx ratio

var storm_duration_S  = 10.0;			// storm duration in seconds - watch out: about 1-2 seconds for deceleration
var storm_lag_S       = 60.0;			// no-storm in seconds
var storm_YperX       = 1/3.0;			// storm's max. vy/vx ratio

var santa_width = 112;
var santa_height = 16;
var santa_speed = 0.15;
// ---- Customizable part ---->

var santa;
var santaEnabled = 0;
var santaX	= 0;			// X-position of santa
var santaY	= 0;			// Y-position of santa
var santaDX = 0;
var santaDY = 0;

var flake    = new Array(flakes+small_flakes);
var flakeImg = new Array(flakes+small_flakes);
var flakeSize= new Array(flakes+small_flakes);
var flakeX   = new Array(flakes+small_flakes);
var flakeY   = new Array(flakes+small_flakes);
var flakeVX  = new Array(flakes+small_flakes);
var flakeVY	 = new Array(flakes+small_flakes);
var flakeVIS = new Array(flakes+small_flakes);
var flakeEnabled = new Array(flakes+small_flakes);
var flakeDX  = 0;			// X-movement in pixel/frame, caused by storm
var flakeDY  = 0;			// Y-movement in pixel/frame, caused by storm



var timer_id    = 0;		// ID if timer proc.
var timer_count = 1;		// --''--

var flake_visible = 0;		// start with visble flakes for Opera, all others start invisible
var flake_id	  = 0;		// timer id of make_flake_visible

var scrollbarWidth = 20; 	// too lazy to actually determine this

var snowEnabled = -1;

var kMaxFlakeSize=16;
var kMaxSmallFlakeSize=8;

window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function( callback ) {
                  window.setTimeout(callback, 1000 / 60);
                };
})();

//-------------------------------------------------------------------------
// preload images
//-------------------------------------------------------------------------
var kFlakeImages = 3;
var flake_images = new Array(kFlakeImages);
for (var i = 0; i < kFlakeImages; ++i) {
    flake_images[i] = new Image();
    flake_images[i].src = flakeImageDir+'snow'+((i+1).toString())+'.png';
}
small_flake = new Image();
small_flake.src = flakeImageDir+'small_snow.png';
var santa_image = new Image();
santa_image.src = santaImageDir+'sleigh'+santaSize+'.gif';


var kRotateStyles = 8;
var kFallStyles = 3;


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
	santa   = $('#santa0');
	santaX  = santa_init_x;
	santaY  = Math.random()*pageHeight;

	if (santa_direction != 0) {
		santaMX =  Math.cos(santa_direction/180*Math.PI);
		santaMY = -Math.sin(santa_direction/180*Math.PI);
	}
    santa.css("z-index", kMaxFlakeSize - 2);

	// create flake
	for (var i=0; i<flakes; i++) {
		flake[i]    = $("#flake"+(i.toString()));
        flakeImg[i] = $("#flake"+(i.toString())+" img");
        flakeSize[i] = Math.floor(kMaxFlakeSize - Math.random()*(kMaxFlakeSize*0.5));
        flake[i].css("z-index", flakeSize[i]);
        flakeImg[i].width(flakeSize[i] + "px");
        flakeImg[i].height(flakeSize[i] + "px");
        if (flakeSize[i] >= (kMaxFlakeSize + 2)) {
            flakeImg[i].addClass("snowflake-animation-" + Math.floor(Math.random()*kRotateStyles).toString());
        }
        init_flake(i);
		flakeVIS[i] = flake_visible;
	}
    for (var i=flakes; i<(flakes+small_flakes); ++i) {
		flake[i]    = $("#flake"+(i.toString()));
        flakeImg[i] = $("#flake"+(i.toString())+" img");
        flakeSize[i] = Math.floor(kMaxSmallFlakeSize - Math.random()*(kMaxSmallFlakeSize*0.5));
        flake[i].css("z-index", flakeSize[i]);
        flakeImg[i].width(flakeSize[i] + "px");
        flakeImg[i].height(flakeSize[i] + "px");
        init_flake(i);
		flakeVIS[i] = flake_visible;
    }
}

function init_flake(i) {
    flakeX[i]       = Math.random()*pageWidth;
    flakeY[i]       = Math.random()*pageHeight - pageHeight;
    flakeVY[i]      = (flakeSize[i]/kMaxFlakeSize)*0.25;
    flakeVX[i]      = Math.random()*0.1 - 0.1;
    flakeEnabled[i] = 1;
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
		santaVY = 0;
	} else if (santaX < lmgn) {
		santaX  = rmgn;
		santaY  = Math.random()*pageHeight;
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
	if (santaSY <= 0) {
		santaSY = Math.random()*refresh_FperS*santa_TY;
		santaVY = (2.0*Math.random()-1.0)*santa_YperX*santa_speed;
	}

	// move santa to new position
	move_to(santa,santaX,santaY,(santaY<pageHeight-santa_height && santaX<pageWidth-santa_width));
    console.log("incrementing time by " + time_increment);
}

//-------------------------------------------------------------------------
// snowflake's private movement
//-------------------------------------------------------------------------

function move_snow() {
	for (var i=0; i<(flakes+small_flakes); i++) {
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

var animationStartTime = Date.now();

function animate(time) {
    var time_increment = time - animationStartTime;
    var sb = (pageHeight < document.body.offsetHeight) ? scrollbarWidth : 0;
    for (var i = 0; i < (flakes+small_flakes); i++) {
		var fs = flakeSize[i] * 3;
        flakeX[i] += flakeVX[i]*time_increment;
        flakeY[i] += flakeVY[i]*time_increment;
		if (flakeX[i]<fs) {
		    flakeX[i] += pageWidth - sb;
        }
		if (flakeX[i]>=(pageWidth-fs-sb)) {
			flakeX[i] -= pageWidth-sb;
        }
		if (flakeY[i]>=(pageHeight-fs*1.5)) {
            if (snowEnabled) {
                init_flake(i);
            } else {
                flakeEnabled[i] = 0;
            }
        }
        if (!flakeEnabled[i]) {
            flake[i].hide();
        } else {
            flake[i].show();
        }
        flake[i].css("left", flakeX[i]+"px");
        flake[i].css("top", flakeY[i]+"px");
    }
    if (santaEnabled) {
        if ((santaX>=(pageWidth-santa_width-sb)) || (santaY >= pageHeight - santa_height)) {
            santaEnabled = 0;
            santaX = santa_init_x;
            santaY = Math.random()*pageHeight;
        } else {
            santaX += santaDX*time_increment;
            santaY += santaDY*time_increment;
        }
        santa.css("left", santaX);
        santa.css("top", santaY);
    } else {
        santa.hide();
        if (Math.random() > santa_appearance) {
            santaEnabled = 1;
            santaDX = santa_speed + (Math.random()*0.25*santa_speed - 0.25*santa_speed);
            santaDX = 0.25*santa_speed + (Math.random()*0.1*santa_speed - 0.1*santa_speed);
            santa.show()
        }
    }
    animationStartTime = Date.now();
    requestAnimFrame(animate);
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
	sty.href=flakeImageDir+'jsSnow.css';
	sty.type="text/css";
	sty.rel="StyleSheet";
	document.getElementsByTagName('head')[0].appendChild(sty);
	a = document.createElement("div");
	a.id = "santa0";
	a.style.position = "absolute";
	a.style.left = "-1px";
	a.style.top = "-1px";
	a.style.display = "block";
	im = document.createElement("img");
	im.src=santa_image.src;
	a.appendChild(im);
	document.body.appendChild(a);

	// each snowflake's private layer
	for (var i=0; i<flakes; i++) {
		a = document.createElement("div");
		a.id = "flake" + i;
        ah = $(a);
        ah.css("display", "block");
        ah.append("<img src=" + flake_images[i % kFlakeImages].src + " />");
        ah.addClass("snowflake");
        aih = $(ah.children()[0]);
        $('body').append(ah);
	}
    for (var i = 0; i < small_flakes; i++) {
		a = document.createElement("div");
		a.id = "flake" + (flakes + i);
        ah = $(a);
        ah.css("display", "block");
        ah.append("<img src=" + flake_images[i % kFlakeImages].src + " />");
        ah.addClass("snowflake");
        $('body').append(ah);
    }

	// recalculate page dimension every second
	window.setInterval('get_page_dimension()',1000);
	get_page_dimension();

	// init all objects
	init_snow_and_santa();

    animate(Date.now());

	// place snowflakes, santa & trees
	//r/ebuild_speed_and_timer(refresh);

	// start the animation
	//timer_id = window.setInterval(move_snow_and_santa,refresh);
	//storm_id = window.setInterval(storm_proc,1800);					// init with visible storm
	//flake_id = window.setInterval(make_flake_visible_proc,2000);	// after the storm, let snowflakes fall :-)
}

function stopSnow() {
	snowEnabled = 0;
}

}

$(document).ready(function() {
    console.log('ahllo');
    snowEnabled = -1;
    startSnow();
});
