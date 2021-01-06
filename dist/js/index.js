"use strict";
var element = document.createElement('script');
element.setAttribute("defer", "defer");
element.src = chrome.runtime.getURL('dist/js/inject_background.js');
document.body.appendChild(element);
