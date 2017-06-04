// ==UserScript==
// @name         Inverter
// @icon         http://i.imgur.com/wBrRGXc.png
// @namespace    skoshy.com
// @version      0.2.17
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
css.messenger.css = `
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
,._55r /* video chat notices */
,._364g /* from searching, contact names */
,._225b /* from searching, header */
{ background: transparent !important; color: white !important; }

._29_7 ._hh7 /* receiving message boxes */
{ background: rgba(255,255,255,.12) !important; color: white; }

._43by /* sent message boxes */
{ background: rgba(0, 132, 255,.45) !important; }

._497p /* Timestamps and joining video chat messages in the chat */
,._1ht7 /* timestamps in sidebar */
,._ih3 /* Names in group chat */
,._5iwm ._58al::placeholder /* placeholder text for search */
{ color: rgba(255,255,255,.6) !important; }

.sp_1g5zN81j-1P /* tiny icons, like when a video chat ends */
,._5iwm ._58ak::before /* search icon */
,.sp_6SI1R2TSgtb /* more tiny icons */
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
    alert('Saved inversion for '+document.domain);
    } else {
    GM_deleteValue('enabled_'+document.domain);
    alert('Deleted inversion setting for '+document.domain);
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
  
  currentSite = 'none'

    if (url.indexOf('messenger.com') != -1) currentSite = 'messenger';
    if (url.indexOf('youtube.com') != -1) currentSite = 'youtube';
    if (url.indexOf('twitter.com') != -1) currentSite = 'twitter';
    if (url.indexOf('inbox.google.com') != -1) currentSite = 'inbox';
  if (url.indexOf('hangouts.google.com') != -1) currentSite = 'hangouts';
  if (url.indexOf('mail.google.com') != -1) currentSite = 'gmail';
  if (url.indexOf('facebook.com') != -1) currentSite = 'facebook';
  if (url.indexOf('play.pocketcasts.com') != -1) currentSite = 'pocketcasts';

  console.log('Detected site for '+scriptId+' script: '+currentSite);
  
    return currentSite;
}

function init() {
    getSetCurrentSite();

    var styleEnabled = GM_getValue( 'enabled_'+document.domain , false );
  
    console.log('Inversion Enabled for site ('+currentSite+'): '+styleEnabled);
    if (inIframe() && isFalsy(css[currentSite].enableInIframe)) { styleEnabled = false; }
    
    var cssToInclude = '';
    
    if (css[currentSite].includeCommon === false) {}
    else { cssToInclude += css.common.css; }
    
    cssToInclude += css[currentSite].css;

    addGlobalStyle(parseCSS(
        cssToInclude
    ), scriptId+'-css', styleEnabled);
}

init();

/*
* Utility functions
*/

function isTruthy(item) {
  return !isFalsy(item);
}

function isFalsy(item) {
  if (
    !item
    || (typeof item == "object" && Object.keys(item).length == 0) // for empty objects, like {}, []
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