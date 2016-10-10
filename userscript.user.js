// ==UserScript==
// @name         Inverter
// @icon         http://i.imgur.com/wBrRGXc.png
// @namespace    skoshy.com
// @version      0.2.0
// @description  Inverts webpages with a hotkey
// @author       Stefan Koshy
// @run-at       document-start
// @updateURL    https://github.com/skoshy/Inverter/raw/master/userscript.user.js
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

var currentSite = '';
var scriptId = 'inverter';

var timers = {};
timers.lastToggle = 0; // default the last toggle to nothing

var options = {};
options.toggleDelayMs = 200; // number of milliseconds delay there needs to be to switch from toggle mode to save inversion mode

var css = {};
css.defaults = {};
css.overrides = {};

css.common = {};
css.common.css = `
html {
  filter: invert(1);
  min-height: 100%;
  background-color: black;
}

img, figure, video, picture {
  filter: invert(1);
}

*[style*="url('https:"], *[style*="url('http:"], *[style*="url('://"] {
  filter: invert(1);
}

body, body > div {
  background-color: white;
}

iframe[src*="youtube.com"], iframe[src*="vimeo.com"] {
  filter: invert(1);
}

twitterwidget::shadow .MediaCard-media {
  filter: invert(1);
}

twitterwidget::shadow .Avatar {
  filter: invert(1);
}
`;
css.messenger = {};
css.messenger.css = `
/* Custom CSS can go here */
`;
css.youtube = {};
css.youtube.css = `
.player-api
{filter: invert(1);}
.player-api video
{filter: inherit;}
#theater-background
{background: white !important;}
#player-playlist
{filter: invert(1);}
#player-playlist img
{filter: invert(0);}
`;
css.twitter = {};
css.twitter.css = `
.PermalinkOverlay-with-background /* overlay when clicking on a tweet */
{background: rgba(255,255,255,.55);}

iframe
{background-color: white; filter: invert(1);}
`;
css.none = {};
css.none.css = ``;


function addGlobalStyle(css, id, enabled) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    style.id = id;
    head.appendChild(style);
    style.disabled = !enabled;
}

function parseCSS(parsed) {
    for (attribute in css.defaults) {
        exceptionToReplace = new RegExp('{{'+attribute+'}}', 'g');
        parsed = parsed.replace(exceptionToReplace, css['defaults'][attribute]);
    }

    return parsed;
}

document.addEventListener("keydown", function(e) {
  if (e.altKey === true && e.shiftKey === false && e.ctrlKey === true && e.metaKey === false && e.code == 'KeyI') {
	var timestamp = new Date();
	timestamp = timestamp.getTime();
	
	if (timers.lastToggle > timestamp-options.toggleDelayMs) {
	  if (isInverterEnabled()) {
		GM_setValue('enabled_'+document.domain, true);
		alert('Saved inversion for'+document.domain);
	  } else {
		GM_deleteValue('enabled_'+document.domain);
		alert('Deleted inversion setting for'+document.domain);
	  }
	} else {
	  // toggle style
	  var cssEl = document.getElementById(scriptId+'-css');

	  if (isInverterEnabled()) {
		cssEl.disabled = true;
	  } else {
		cssEl.disabled = false;
	  }
	}
	
	timers.lastToggle = timestamp;
  }
});

function isInverterEnabled() {
  var cssEl = document.getElementById(scriptId+'-css');
  return cssEl.disabled === false;
}

function getSetCurrentSite() {
    var url = document.documentURI;

    if (url.indexOf('messenger.com') != -1) return currentSite = 'messenger';
    if (url.indexOf('youtube.com') != -1) return currentSite = 'youtube';
    if (url.indexOf('twitter.com') != -1) return currentSite = 'twitter';

    return currentSite = 'none';
}

function init() {
    getSetCurrentSite();

    var styleEnabled = GM_getValue( 'enabled_'+document.domain , false );

    addGlobalStyle(parseCSS(
        css.common.css + css[currentSite].css
    ), scriptId+'-css', styleEnabled);
}

init();

/*
* Utility functions
*/


function addEvent(obj, evt, fn) {
    if (obj.addEventListener) {
        obj.addEventListener(evt, fn, false);
    }
    else if (obj.attachEvent) {
        obj.attachEvent("on" + evt, fn);
    }
}