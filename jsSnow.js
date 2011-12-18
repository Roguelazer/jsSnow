//---------------------------------------------------------------------------------------
// XSnow for JavaScript - von Mag. Dr. Nikolaus Klepp - dr.klepp@gmx.at - www.klepp.info
//---------------------------------------------------------------------------------------
/*  jsSnow
	Copyright (C) 2002 Mag. Dr. Nikolaus Klepp <dr.klepp@gmx.at>
	Copyright (C) 2002 INOUE Hiroyuki <dombly@kc4.so-net.ne.jp>
	Copyright (C) 2002 Heiko Feldker <hfeldker@web.de>
	Copyright (C) 2010-2010 James Brown <roguelazer@roguelazer.com>
	Release Id: 0.5

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


// <---- Customizable part ----
var santaImageDir = '//www.roguelazer.com/snow/';
//var santaImageDir = 'file:///Users/jbrown/repos/jssnow/';
var flakeImageDir = santaImageDir;
var santaSize  = '2';				   // 1, 2 or 3 (smaller number specifies smaller image)

var flakes = 100;						// number of big flakes
var small_flakes = 200;				 // number of little flake2
var santa_init_x	 = -256;			// santa's initial X-position
var santa_appearance = 0.15;			// probability between [0:1] for santa to be shown

var santa_width = 112;
var santa_height = 16;
var santa_speed = 0.15;

var stormEnabled = 0;

var rotate_prob	   = 0.50;		   // probability of a big flake rotating
var vchange_prob	  = 0.005;		  // probability of changing X velocity


var vspeed			= 0.02;
var hspeed			= 0.03;

// ---- Customizable part ---->

var santa;
var santaEnabled = 0;
var santaX	= 0;			// X-position of santa
var santaY	= 0;			// Y-position of santa
var santaDX = 0;
var santaDY = 0;

var flake	= new Array(flakes+small_flakes);
var flakeImg = new Array(flakes+small_flakes);
var flakeSize= new Array(flakes+small_flakes);
var flakeRot = new Array(flakes+small_flakes);
var flakeX   = new Array(flakes+small_flakes);
var flakeY   = new Array(flakes+small_flakes);
var flakeVX  = new Array(flakes+small_flakes);
var flakeVY	 = new Array(flakes+small_flakes);
var flakeVIS = new Array(flakes+small_flakes);
var flakeEnabled = new Array(flakes+small_flakes);
var flakeDX  = 0;			// X-movement in pixel/frame, caused by storm
var flakeDY  = 0;			// Y-movement in pixel/frame, caused by storm



var timer_id	= 0;		// ID if timer proc.
var timer_count = 1;		// --''--

var flake_visible = 0;		// start with visble flakes for Opera, all others start invisible
var flake_id	  = 0;		// timer id of make_flake_visible

var scrollbarWidth = 20; 	// too lazy to actually determine this

var snowEnabled = -1;

var kMaxFlakeSize=16;
var kMinRotSize=12;
var kMinSmallFlakeSize=2;
var kMaxSmallFlakeSize=4;

window.requestAnimFrame = (function(){
	  return window.requestAnimationFrame       || 
			 window.webkitRequestAnimationFrame || 
			 window.mozRequestAnimationFrame    || 
			 window.oRequestAnimationFrame      || 
			 window.msRequestAnimationFrame     || 
			 function( callback ) { window.setTimeout(callback, 1000 / 60); };
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
small_flake_2 = new Image();
small_flake_2.src = flakeImageDir+'small_snow_2.png';
small_flake_4 = new Image();
small_flake_4.src = flakeImageDir+'small_snow_4.png';
var santa_image = new Image();
santa_image.src = santaImageDir+'sleigh'+santaSize+'.gif';


var kRotateStyles = 5;

//-------------------------------------------------------------------------
// create all layers & Objects
//-------------------------------------------------------------------------
function init_snow_and_santa() {
	// create santa
	santa   = $('#santa0');
	santaX  = santa_init_x;
	santaY  = Math.random()*pageHeight;

	santa.css("z-index", kMaxFlakeSize - 2);

	// create flake
	for (var i=0; i<flakes; i++) {
		flake[i]	= $("#flake"+(i.toString()));
		flakeImg[i] = $("#flake"+(i.toString())+" img");
		flakeSize[i] = Math.floor(kMaxFlakeSize - Math.random()*(kMaxFlakeSize*0.75));
		flake[i].css("z-index", flakeSize[i]);
		flake[i].width(flakeSize[i] + "px");
		flake[i].height(flakeSize[i] + "px");
		flakeImg[i].width(flakeSize[i] + "px");
		flakeImg[i].height(flakeSize[i] + "px");
		if (flakeSize[i] >= kMinRotSize) {
			var rot_class = "snowflake-animation-" + Math.floor(Math.random()*kRotateStyles).toString();
			flake[i].addClass(rot_class);
		}
		init_flake(i);
		flakeVIS[i] = flake_visible;
		flakeRot[i]	 = null;
	}
	for (var i=flakes; i<(flakes+small_flakes); ++i) {
		flake[i]	= $("#flake"+(i.toString()));
		flakeImg[i] = $("#flake"+(i.toString())+" img");
		if (Math.random() < 0.1) {
			flakeImg[i].attr("src", small_flake_4.src);
			flakeSize[i] = kMaxSmallFlakeSize;
		} else {
			flakeImg[i].attr("src", small_flake_2.src);
			flakeSize[i] = kMinSmallFlakeSize;
		}
		flake[i].css("z-index", flakeSize[i]);
		flakeImg[i].width(flakeSize[i] + "px");
		flakeImg[i].height(flakeSize[i] + "px");
		init_flake(i);
		flake[i].addClass("snowflake-small-animation");
		flakeVIS[i] = flake_visible;
		flakeRot[i]	 = null;
	}
}

function init_flake(i) {
	flakeX[i]	   = Math.random()*pageWidth;
	flakeY[i]	   = Math.random()*pageHeight - pageHeight;
	flakeVY[i]	  = (Math.random()*0.1 + 0.9)*(flakeSize[i]/kMaxFlakeSize)*vspeed+vspeed;
	flakeVX[i]	  = (Math.random()*0.1 + 0.9)*(flakeSize[i]/kMaxFlakeSize)*hspeed;
	if (Math.random() < 0.5) {
		flakeVX[i]  = -flakeVX[i];
	}
	flakeEnabled[i] = true;
}

var animationStartTime = Date.now();

function startFlakeRotate(i, time) {
	if (flakeVX[i] <= 0) {
		flake[i].addClass("startRotate-2");
	} else {
		flake[i].addClass("startRotate");
	}
	flake[i].removeClass("endRotate");
	flakeRot[i] = time;
}

function stopFlakeRotate(i) {
	flake[i].removeClass("startRotate");
	flake[i].removeClass("startRotate-2");
	flake[i].addClass("endRotate");
	flakeRot[i] = null;
}

var frameCount = 0;

function animate(time) {
	var time_increment = time - animationStartTime;
	frameCount = (frameCount + 1) % 100;
	// Do some tasks fairly rarely
	if (frameCount % 20 == 0) {
		// sometimes, make flakes move differently
		for (var i = 0 ; i < (flakes+small_flakes); ++i) {
			if (Math.random() < vchange_prob) {
				flakeVX[i] = (Math.random()*0.1 + 0.9)*(flakeSize[i]/kMaxFlakeSize)*hspeed;
				if (Math.random() < 0.5) {
					flakeVX[i] *= -1;
				}
			}
		}
		// Do I want to turn on a storm?
		var storm_val = Math.floor(Date.now() / 100000) % 60 + (Math.floor(Date.now() / 8000) % 40);
		if (stormEnabled) {
			if (storm_val != 53) { // Do I want to turn off a storm?
				console.log("storm off");
				flakeDX = 0;
				flakeDY = 0;
				stormEnabled = false;
			}
		} else {
			if (storm_val == 53) { // Do I want to turn on a storm?
				console.log("storm on");
				flakeDX = (time/10000 % 100) / 50;
				flakeDY = (time/10000 % 100) / 500;
				if (Math.random() < 0.5) {
					flakeDX = -flakeDX;
				}
				if (Math.random() < 0.2) {
					flakeDY = -flakeDY;
				}
				stormEnabled = true;
			}
		}
	}
	// Move all flakes
	for (var i = 0; i < (flakes+small_flakes); i++) {
		var fs = flakeSize[i] < 40 ? 40 : flakeSize[i];
		flakeX[i] += (flakeVX[i]+flakeDX)*time_increment;
		flakeY[i] += (flakeVY[i]+flakeDY)*time_increment;
		if (flakeX[i]<fs) {
			flakeX[i] += pageWidth;
		}
		if (flakeX[i]>=(pageWidth-fs)) {
			flakeX[i] -= pageWidth;
		}
		if (flakeY[i]>=(pageHeight-fs)) {
			if (snowEnabled) {
				init_flake(i);
			} else {
				flakeEnabled[i] = false;
			}
		}
		if (flakeRot[i] !== null) {
			if (flakeRot[i] <= (time - 40000)) {
				stopFlakeRotate(i);
			}
		} else if ((flakeSize[i] >= kMinRotSize) && (Math.random() < rotate_prob)) {
			startFlakeRotate(i, time);
		}
		if (!flakeEnabled[i]) {
			flake[i].hide();
		} else {
			flake[i].show();
			flake[i].css("left", flakeX[i]+"px");
			flake[i].css("top", flakeY[i]+"px");
		}
	}
	// Do santa things
	if (santaEnabled) {
		if ((santaX>=(pageWidth-santa_width)) || (santaY >= pageHeight - santa_height)) {
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
		if (Math.random() < santa_appearance) {
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
	console.log("Getting page dimensions");
	pageWidth  = $(window).width();
	pageHeight = $(window).height();
	console.log(pageWidth + "x" + pageHeight);
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
		ah.append("<img src=" + small_flake_4.src + " />");
		ah.addClass("snowflake");
		$('body').append(ah);
	}

	get_page_dimension();
	$(window).resize(get_page_dimension);

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

// vim: set noexpandtab ts=4 sw=4 sts=0:
