var gaNewElem: any = {};
var gaElems: any = {};


function gaInit_background() {

    var currdate: any = new Date();
    var url = 'https://www.google-analytics.com/analytics.js';
    (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * currdate; a = s.createElement(o),
            m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
    })(window, document, 'script', url, 'ga', gaNewElem, gaElems);

    ga('create', 'UA-194964708-5', 'auto'); // live
    //ga('create', 'UA-194964708-6', 'auto'); // debug
    ga('set', 'checkProtocolTask', null);
}

gaInit_background();

chrome.runtime.onInstalled.addListener(function (reason) {
    const badge_setting = {
        'streamer' : '5527c58c-fb7d-422d-b71b-f309dcb85cc1',
        'manager' : '3267646d-33f0-4b17-b3df-f923a41db1d0',
        'vip' : 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec',
        'verified' : 'd12a2e27-16f6-41d0-ab77-b780518f00a3'
    }

    chrome.storage.local.set({ badge_setting: badge_setting, BADGE_LIST: badge_setting }, function () {});
    chrome.storage.local.set({ container_ratio: 30 }, function () {});

    ga('send', 'event', { 'eventCategory': 'background', 'eventAction': 'onInstalled', 'eventLabel': chrome.runtime.getManifest().version });
    ga('send', 'event', { 'eventCategory': 'background', 'eventAction': 'onInstalled', 'eventLabel': JSON.stringify(reason)});

});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    let isCompleted = changeInfo.status === 'complete';
    
    
    
    let url = tab.url;
    if (!url) return null;

    let isTwitch = url.match(/https\:\/\/www\.twitch\.tv/);
    if(isTwitch && isCompleted){
        ga('send', 'event', { 'eventCategory': 'background', 'eventAction': 'onUpdated', 'eventLabel': chrome.runtime.getManifest().version });
    }
    chrome.pageAction.show(tabId);
    //let isMultiStr = url.match(/https\:\/\/multistre\.am/);
    //if (isTwitch || isMultiStr) chrome.pageAction.show(tabId);
    
    

});
chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

        let id = tabs[0].id;
        let url = tabs[0].url;

        chrome.storage.local.set({ current_url: url }, function () {});

        if (id) {
            chrome.tabs.sendMessage(id, { action: "onHistoryStateUpdated", url: url }, function (response) {
                return true;
            });
        }
    });
});