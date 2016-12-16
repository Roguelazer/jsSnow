/** 
 * jsSnow.js -- xsnow in your browser.
 *
 * Original inspiration from http://freshmeat.net/projects/jssnow/
 *
 * Copyright (C) 2010-2016 James Brown <roguelazer@gmail.com>
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 **/

/* jshint esversion: 6, undef: true, unused: true, browser: true */

var pageWidth = 0;
var pageHeight = 0;
var the_canvas = null;
var numFlakes = 20;
var numSmallFlakes = 80;
var vChangeProb = 0.01;
var vxChangePct = 0.05;
var vyChangePct = 0.05;
var santaProb = 0.1;

var storm_since = 0;
var storm_dur = 1;
var storm_secs = 30;
var storm_vx = 0;
var storm_vy = 0;

var snow_running = false;

var baseImageDir = 'https://www.roguelazer.com/snow/';
var snowImageSources = ["snow1_16.png", "snow2_16.png", "snow3_16.png"];
var smallSnowImageSources = ["small_snow_2.png", "small_snow_4.png"];
var santaImageSource = "sleigh2.gif";

var snowImages = [];
var smallSnowImages = [];
var santaImage = null;
var last_anim = 0;

var flakes = [];
var santa = null;

var Santa = function() {
    this.x = -10;
    this.y = Math.random() * pageHeight;
    this.vx = Math.random() * 50;
    this.vy = Math.random() * 1 - 0.5;
};
Santa.prototype.move = function(duration) {
    this.x += (this.vx + storm_vx) * duration;
    this.y += (this.vy + storm_vy) * duration;
    if (this.x > pageWidth) {
        santa = null;
    }
};
Santa.prototype.draw = function(ctx) {
    ctx.drawImage(santaImage, this.x, this.y);
};

function start_storm(now_seconds) {
    var storm_vx_direction = (now_seconds % 4 === 0) ? 1 : -1;
    var storm_vy_direction = (now_seconds % 5 === 0) ? 1 : 0;
    storm_dur = Math.random() * 2 + 3;
    storm_vx = ((Math.random() * 20) + 10) * storm_vx_direction;
    storm_vy = Math.random() * 4 * storm_vy_direction;
    storm_since = now_seconds;
}

function end_storm() {
    storm_vx = 0;
    storm_vy = 0;
    storm_since = 0;
}

var Flake = function (is_small) {
    if (is_small) {
        this.image = smallSnowImages[Math.floor(Math.random() * smallSnowImages.length)];
    } else {
        this.image = snowImages[Math.floor(Math.random() * snowImages.length)];
    }
    this.x = Math.random() * pageWidth;
    this.y = Math.random() * pageHeight / -10.0;
    this.init_speed();
    this.max_vy = 20.0;
    this.max_vx = 2.0;
    this.min_vy = 0.001;
    this.angle = 0;
    if (!is_small) {
        this.vT = Math.random() - 0.5;
        this.vT /= 40;
    }
};
Flake.prototype.init_speed = function() {
    this.vx = Math.random() * 2.0 - 1.0;
    this.vy = Math.random() * 20.0;
};
Flake.prototype.move = function(duration) {
    this.x = this.x + (this.vx + storm_vx) * duration;
    this.y = this.y + (this.vy + storm_vy) * duration;
    if (this.y > pageHeight) {
        this.y = 0;
        this.x = Math.random() * pageWidth;
        this.init_speed();
    }
    if (this.vT !== 0) {
        this.angle = (this.angle + this.vT) % (Math.PI * 2);
    }
    if (this.x < 0) {
        this.x = pageWidth;
        /*this.x = 0;
        this.vx *= -1;
        this.vT *= -1;*/
    }
    if (this.x > pageWidth) {
        this.x = 0;
        /*
        this.x = pageWidth;
        this.vx *= -1;
        this.vT *= -1;
        */
    }
};

Flake.prototype.draw = function(ctx) {
    if ((this.x < 0) || (this.y < 0)) {
        return;
    }
    if (this.angle !== 0) {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
    }
    ctx.drawImage(this.image, 0, 0);
    if (this.angle !== 0) {
        ctx.rotate(-this.angle);
        ctx.translate(-this.x, -this.y);
    }
};

Flake.prototype.tweak_speed = function() {
    var vx_change = ( (1.0 - vxChangePct) + Math.random() * (vxChangePct * 2));
    var vy_change = ( (1.0 - vyChangePct) + Math.random() * (vyChangePct * 2));
    this.vx *= vx_change;
    this.vy *= vy_change;
    if (this.vx >= this.max_vx) {
        this.vx = this.max_vx;
    }
    if (this.vy >= this.max_vy) {
        this.vy = this.max_vy;
    }
    if (this.vy < this.min_vy) {
        this.vy = this.min_vy;
    }
};

function animate() {
    var now = new Date().getTime();
    var now_seconds = Math.round(now / 1000);
    var duration_ms = now - last_anim;
    var duration = duration_ms / 1000.0;
    if ((storm_since === 0) && (now_seconds % storm_secs === 0)) {
        start_storm(now_seconds);
    } else if ((storm_since !== 0) && (now_seconds - storm_since > storm_dur)) {
        end_storm();
    }
    var ctx = the_canvas.getContext("2d");
    ctx.clearRect(0, 0, pageWidth, pageHeight);
    for (let flake of flakes) {
        flake.draw(ctx);
        flake.move(duration);
        if (Math.random() < vChangeProb / duration_ms) {
            flake.tweak_speed();
        }
    }
    if (santa !== null) {
        santa.draw(ctx);
        santa.move(duration);
    } else if (Math.random() < santaProb / duration_ms) {
        santa = new Santa();
    }
    last_anim = new Date().getTime();
    if (snow_running) {
        window.requestAnimationFrame(animate);
    }
}

function get_page_dimension() {
    pageWidth  = window.innerWidth;
    pageHeight = window.innerHeight;
    if (the_canvas !== null) {
        the_canvas.width = pageWidth;
        the_canvas.height = pageHeight;
    }
}

function preloadImage(source) {
    var im =document.createElement("img");
    im.class = "snowPreloadImage";
    im.src = baseImageDir + source;
    im.style = "display: none";
    document.body.appendChild(im);
    return im;
}

function startSnow() {
    if (snow_running) {
        return;
    }
    snow_running = true;
    get_page_dimension();
    window.addEventListener("resize", get_page_dimension);

    the_canvas = document.createElement("canvas");
    the_canvas.id = "snowCanvas";
    the_canvas.width = pageWidth;
    the_canvas.height = pageHeight;
    the_canvas.style = "position: absolute; top: 0; left: 0; pointer-events: none;";
    document.body.appendChild(the_canvas);

    snowImages = [];
    smallSnowImages = [];
    flakes = [];
    
    // Pre-draw all the images
    for (let source of snowImageSources) {
        snowImages.push(preloadImage(source));
    }
    for (let source of smallSnowImageSources) {
        smallSnowImages.push(preloadImage(source));
    }
    santaImage = preloadImage(santaImageSource);

    for (let i = 0; i < numFlakes ; ++i) {
        flakes.push(new Flake(false));
    }

    for (let i = 0; i < numSmallFlakes ; ++i) {
        flakes.push(new Flake(true));
    }

    last_anim = new Date().getTime();

    animate();
}

/*
function stopSnow() {
    var elem = document.getElementById("snowCanvas");
    if (elem !== undefined) {
        document.body.removeChild(elem);
    }
    var preloaded = document.getElementsByClassName("snowPreloadImage");
    for (var idx in preloaded) {
        document.body.removeChild(preloaded[idx]);
    }
    snow_running = false;
}
*/

startSnow();
