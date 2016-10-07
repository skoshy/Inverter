// ==UserScript==
// @name         Inverter
// @icon         http://i.imgur.com/wBrRGXc.png
// @namespace    skoshy.com
// @version      0.1.3
// @description  Inverts webpages with a hotkey
// @author       Stefan Koshy
// @updateURL    https://github.com/skoshy/Inverter/raw/master/userscript.user.js
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

var currentSite = '';
var scriptId = 'inverter';

var css = {};
css.defaults = {};
css.overrides = {};

css.common = {};
css.common.css = `
html {
  filter: invert(1);
}

img, figure, video {
  filter: invert(1);
}

html, body, body > div {
   background-color: white;
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
        // toggle style
        var cssEl = document.getElementById(scriptId+'-css');

        if (cssEl.disabled === false) {
            cssEl.disabled = true;
        } else {
            cssEl.disabled = false;
        }
    }
});

function getSetCurrentSite() {
    var url = document.documentURI;

    if (url.indexOf('messenger.com') != -1) return currentSite = 'messenger';
    if (url.indexOf('youtube.com') != -1) return currentSite = 'youtube';

    return currentSite = 'none';
}

function init() {
    getSetCurrentSite();

    var styleEnabled = false; // don't automatically enable

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