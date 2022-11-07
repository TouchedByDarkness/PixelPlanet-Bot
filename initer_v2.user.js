// ==UserScript==
// @name         PP Bot
// @version      1.1
// @description  Have fun
// @author       Darkness
// @grant 		 GM_xmlhttpRequest
// @grant 		 GM_addElement
// @connect		 githubusercontent.com
// @connect		 github.com
// @downloadURL  https://github.com/TouchedByDarkness/PixelPlanet-Bot/raw/master/initer_v2.user.js
// @updateURL  	 https://github.com/TouchedByDarkness/PixelPlanet-Bot/raw/master/initer_v2.user.js
// @match      	 *://pixelplanet.fun/*
// @match      	 *://fuckyouarkeros.fun/*
// ==/UserScript==

GM_xmlhttpRequest({
	method: 'GET',
	url: 'https://github.com/TouchedByDarkness/PixelPlanet-Bot/raw/master/bytecode',
	onload: e => {
		if (e.readyState !== e.DONE) {
			return;
		}

		if (e.status !== 200) {
			return alert(`cant load Void bot\ncode: ${e.status}\nreason: ${e.statusText}`);
		}

		GM_addElement('script', {
			textContent: atob(e.responseText)
		});
	},
	onerror: e => alert(e)
});
