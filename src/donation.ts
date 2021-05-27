let ethereum_btn = document.getElementById('ether_btn');
let doge_btn = document.getElementById('doge_btn');
if(ethereum_btn) ethereum_btn.textContent = chrome.i18n.getMessage('ethereum');
if(doge_btn) doge_btn.textContent = chrome.i18n.getMessage('doge');