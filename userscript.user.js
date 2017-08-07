// ==UserScript==
// @name         Inverter
// @icon         http://i.imgur.com/wBrRGXc.png
// @namespace    skoshy.com
// @version      0.2.28
// @description  Inverts webpages with a hotkey
// @author       Stefan Koshy
// @run-at       document-start
// @updateURL    https://github.com/skoshy/Inverter/raw/master/userscript.user.js
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

// From https://gist.github.com/arantius/3123124
// These are replacement functions for GreaseMonkey scripts, but the only work on a single domain instead of being cross domain
// Todo: Implement solution that works cross domain

if (typeof GM_getValue == 'undefined') {
	function GM_getValue(aKey, aDefault) {
		'use strict';
		let val = localStorage.getItem(scriptId + aKey)
		if (null === val && 'undefined' != typeof aDefault) return aDefault;
		return val;
	}
}

if (typeof GM_setValue == 'undefined') {
	function GM_setValue(aKey, aVal) {
		'use strict';
		localStorage.setItem(scriptId + aKey, aVal);
	}
}

var DEBUG_MODE = false;

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

figure img { /* no need to invert imgs in figures */
	filter: invert(0);
}

*[style*="url(/"],
*[style*="blob:"],
*[style*="url('https:"],
*[style*="url('http:"],
*[style*="url('://"],
*[style*="url('blob:"],
*[style*='url("https:'],
*[style*='url("https:'],
*[style*='url("http:'],
*[style*='url("://'],
*[style*='url("blob:']
{ filter: invert(1); }

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

.gbii /* This is for multiple Google Domains to reinvert the profile icon in the top right */
{filter: invert(1);}
`;
css.messenger = {};
css.messenger.includeCommon = false;
css.messenger.javascriptOnce = function() {
	var chatColor = '';

	setInterval(function() {
		var chatColorEl = document.querySelector('._fl2 [data-testid="info_panel_button"] svg polygon, ._fl2 [data-testid="info_panel_button"] svg path'); /* Two elements, depends on if the info button is pressed or not */
		if (!chatColorEl || chatColorEl.style.fill == chatColor) return;

		chatColor = chatColorEl.style.fill;

		var newCss = `
			._43by
			{ background: `+chatColor.replace('rgb', 'rgba').replace(')', ', .3)')+` !important; }
		`;

		addGlobalStyle(newCss, scriptId+'-css', isInverterEnabled(), scriptId+'-messengerSpecialCss');
	}, 500);
};
css.messenger.css = `
body
,._5i_d * /* Text from YouTube/video share */
{ color: white; }

/* Bug Fixes */
._kmc /* message box, min height fix */
{ min-height: 26px !important; }

._4sp8 {
background: black !important;
}

._4rv3 /* Message box container */
,._5743 * /* Top name */
,._1ht6 /* Names in the sidebar */
,._1ht3 ._1htf /* Unread message in sidebar */
,._1tqi ._4qba /* App Name */
,._5swm * /* Text from link shares */
,._hh7 a /* Link from received message */
,._55r /* video chat notices */
,._1enh ._364g /* from searching, contact names */
,._225b /* from searching, header */
,._lll * /* Intro message text for first time chatting someone */
,._3szq /* Info Box text */
,._58ak input /* Composing new message text box */
,._1jt6 ._3oh- /* Info box contact name */
,._4rph ._4rpj /* Info box group chat, add people */
,._4_j5 ._364g /* Info box group chat, additional people */
,._2jnv /* Info box group chat, chat name */
{ background: transparent !important; color: white !important; }

._2y8_ * /* Popup boxes text */
{ color: black; }

._29_7 ._hh7 /* receiving message boxes */
{ background: rgba(255,255,255,.12) !important; color: white; }

._43by /* sent message boxes */
{ background: rgba(0, 132, 255,.45) !important; transition: background 0.3s ease; }

._497p /* Timestamps and joining video chat messages in the chat */
,._1ht7 /* timestamps in sidebar */
,._ih3 /* Names in group chat */
,._5iwm ._58al::placeholder /* placeholder text for search */
,._1lj0 /* Info Box Headers */
,._3eus, ._5uh /* Info Box Person Description */
,._2y8z /* Composing new message "To" field" */
,._58ak input::placeholder /* Composing new message text box, placeholder */
,._5i_d .__6m /* Link share URL */
,._3x6v /* Info box, side text next to notifications if notifications are muted */
{ color: rgba(255,255,255,.6) !important; }

._29_7 ._52mr /* Borders of message bubble stuff, like video chat notifications, links, etc, received */
,._nd_ ._52mr /* Same as above, but sent */
{ border-color: rgba(255,255,255,.2); }

.sp_1g5zN81j-1P /* tiny icons, like when a video chat ends */
,._5iwm ._58ak::before /* search icon */
,.sp_6SI1R2TSgtb /* more tiny icons */
,._2t5t /* more icons, like the forward icon */
{ filter: invert(1); }

a._4ce_ /* games icon */
,._4rv6 /* stickers icon */
{ opacity: .7 !important; filter: invert(1) !important; }

._5iwm ._58al /* search box */
{ background: rgba(255,255,255,.3) !important; color: white !important; }

::-webkit-scrollbar-track
{
	-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3) !important;
	border-radius: 10px !important;
	background-color: #333 !important;
}

::-webkit-scrollbar
{
	width: 12px !important;
	background-color: transparent !important;
}

::-webkit-scrollbar-thumb
{
	border-radius: 10px !important;
	-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3) !important;
	background-color: #555 !important;
}
`;
css.gmail = {};
css.gmail.css = `
iframe[src*="hangouts.google.com"]
{ filter: invert(1); }
`;
css.inbox = {};
css.inbox.css = `
img[src*="ssl.gstatic.com"], img[src*="www.gstatic.com"]
{ filter: invert(0); }
nav#GH > .b4 /* Header bar, kepp the same color */
{ filter: invert(1); }
iframe[src*="hangouts.google.com"]
{ filter: invert(1); }
.cf /* Shipping notification headers */
{ filter: invert(1); }
.xW /* Shipping icon */
{ filter: invert(1) !important; }
`;
css.hangouts = {};
css.hangouts.enableInIframe = true;
css.hangouts.css = `
.Ik:not(.uB) /* Chat Headers */
{ filter: invert(1); }
`;
css.youtube = {};
css.youtube.css = `
.player-api video
{filter: inherit;}

#theater-background
{background: white !important;}

#player-playlist,
.player-api,
#c4-header-bg-container /* Banner on YouTube channel page */
{filter: invert(1);}

#player-playlist img,
#c4-header-bg-container img /* Banner on YouTube channel page */
{filter: invert(0);}

`;
css.facebook = {};
css.facebook.css = `
i /* Emoji and other small icons */
{filter: invert(1);}
`;
css.twitter = {};
css.twitter.css = `
.PermalinkOverlay-with-background /* overlay when clicking on a tweet */
{background: rgba(255,255,255,.55) !important;}

iframe
{background-color: white; filter: invert(1);}

.is-generic-video {
	filter: invert(1);
}
`;
css.soundcloud = {};
css.soundcloud.css = `
span[style]
`;
css.pocketcasts = {};
css.pocketcasts.css = `
#header {filter: invert(1);}
#audio_player {filter: invert(1); background-color: black;}

#header img {filter: invert(0);}
#audio_player img {filter: invert(0);}

#audio_player #audio_player_wrapper .player_top,
#audio_player #audio_player_wrapper .player_bottom
{background-color: transparent;}
`;
css.none = {};
css.none.css = ``;


function addGlobalStyle(css, className, enabled, id) {
	var head, style;
	head = document.getElementsByTagName('head')[0];
	if (!head) { return; }

	// check to see if this element already exists, if it does override it
	var oldEl = document.getElementById(id);

	style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = css;
	style.id = id;
	style.className = className;
	head.appendChild(style);
	style.disabled = !enabled;

	// delete old element if it exists
	if (oldEl) {
		oldEl.parentNode.removeChild(oldEl);
	}
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
			alert('Saved inversion for '+document.domain);
			} else {
			GM_deleteValue('enabled_'+document.domain);
			alert('Deleted inversion setting for '+document.domain);
			}
		} else {
			// toggle style

			if (isInverterEnabled()) {
				disableStyle();
			} else {
				enableStyle();
			}
		}

		timers.lastToggle = timestamp;
	}
});

function getCssStyleElements() {
	return document.getElementsByClassName(scriptId+'-css');
}

function enableStyle() {
	var cssToInclude = '';
	var currentSite = getSetCurrentSite();

	if (css[currentSite].includeCommon === false) {}
	else { cssToInclude += css.common.css; }

	cssToInclude += css[currentSite].css;

	addGlobalStyle(parseCSS(
		cssToInclude
	), scriptId+'-css', true, scriptId+'-css');
}

function disableStyle() {
	var cssEls = getCssStyleElements();
	for (let i = 0; i < cssEls.length; i++) {
		cssEls[i].parentNode.removeChild(cssEls[i]); // remove the element
	}
}

function isInverterEnabled() {
	var cssEl = document.getElementById(scriptId+'-css');

	return isTruthy(cssEl);
}

function getSetCurrentSite() {
	var url = document.documentURI;
	var currentSite = 'none';

	if (url.indexOf('messenger.com') != -1) currentSite = 'messenger';
	if (url.indexOf('youtube.com') != -1) currentSite = 'youtube';
	if (url.indexOf('twitter.com') != -1) currentSite = 'twitter';
	if (url.indexOf('inbox.google.com') != -1) currentSite = 'inbox';
	if (url.indexOf('hangouts.google.com') != -1) currentSite = 'hangouts';
	if (url.indexOf('mail.google.com') != -1) currentSite = 'gmail';
	if (url.indexOf('facebook.com') != -1) currentSite = 'facebook';
	if (url.indexOf('play.pocketcasts.com') != -1) currentSite = 'pocketcasts';

	return currentSite;
}

function init() {
	var currentSite = getSetCurrentSite();

	var styleEnabled = GM_getValue( 'enabled_'+document.domain , false );

	if (DEBUG_MODE) {
		console.log('Inversion Enabled for site ('+currentSite+'): '+styleEnabled);
	}

	if (inIframe() && isFalsy(css[currentSite].enableInIframe)) { styleEnabled = false; }

	if (css[currentSite].javascriptOnce) { css[currentSite].javascriptOnce(); }

	if (styleEnabled) {
		enableStyle();
	}
}

init();

/*
* Utility functions
*/

function isTruthy(item) {
	return !isFalsy(item);
}

// from https://gist.github.com/skoshy/69a7951b3070c2e2496d8257e16d7981
function isFalsy(item) {
	if (
		!item
		|| (typeof item == "object" && (
			Object.keys(item).length == 0 // for empty objects, like {}, []
			&& !(typeof item.addEventListener == "function") // omit webpage elements
		))
	)
		return true;
	else
		return false;
}

function addEvent(obj, evt, fn) {
	if (obj.addEventListener) {
		obj.addEventListener(evt, fn, false);
	}
	else if (obj.attachEvent) {
		obj.attachEvent("on" + evt, fn);
	}
}

function inIframe () {
	try {
		return window.self !== window.top;
	} catch (e) {
		return true;
	}
}