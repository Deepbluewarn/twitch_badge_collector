let gaNewElem: any = {};
let gaElems: any = {};
let twitch_exist: boolean = false;
const heartbeatInterval = 5;

function gaInit_background() {

    var currdate: any = new Date();
    var url = 'https://www.google-analytics.com/analytics.js';
    (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * currdate; a = s.createElement(o),
            m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
    })(window, document, 'script', url, 'ga', gaNewElem, gaElems);

    //ga('create', 'UA-194964708-5', 'auto'); // live
    ga('create', 'UA-194964708-6', 'auto'); // debug
    ga('set', 'checkProtocolTask', null);
}

function heartbeat() {

    chrome.windows.getAll(windows => {
        if (Array.isArray(windows) && windows.length === 0) {
            chrome.alarms.clear('heartbeat');
        }
    });
    if (twitch_exist) {
        ga('send', 'event', { 'eventCategory': 'background', 'eventAction': 'heartbeat', 'eventLabel': chrome.runtime.getManifest().version });
    } else {
        chrome.alarms.clear('heartbeat');
    }

}

function isTwitch(url: string | undefined) {
    if (url) {
        twitch_exist = url.match(/https\:\/\/www\.twitch\.tv/) ? true : false;
        return twitch_exist;
    }
}

gaInit_background();

chrome.runtime.onInstalled.addListener(function (reason: any) {

    const badge_setting = {
        'streamer': '5527c58c-fb7d-422d-b71b-f309dcb85cc1',
        'manager': '3267646d-33f0-4b17-b3df-f923a41db1d0',
        'vip': 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec',
        'verified': 'd12a2e27-16f6-41d0-ab77-b780518f00a3'
    }

    let version = chrome.runtime.getManifest().version;
    reason.to = version;

    chrome.storage.sync.set({ badge_setting }, function () { });
    chrome.storage.sync.set({ container_ratio: 30 }, function () { });
    
    ga('send', 'event', { 'eventCategory': 'background', 'eventAction': 'onInstalled', 'eventLabel': version });
    ga('send', 'event', { 'eventCategory': 'background', 'eventAction': 'onInstalled', 'eventLabel': JSON.stringify(reason) });
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    heartbeat();
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    let isCompleted = changeInfo.status === 'complete';
    if (!isCompleted) return;

    let url = tab.url;

    if (isTwitch(url)) {
        chrome.alarms.get('heartbeat', (alarm) => {
            if (!alarm) {
                chrome.alarms.create('heartbeat', { periodInMinutes: heartbeatInterval });
                heartbeat();
            };
        });
    }

    chrome.pageAction.show(tabId);
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    chrome.tabs.query({}, function (tabs) {
        twitch_exist = false;
        tabs.forEach(tab => {
            isTwitch(tab.url);
        });
    })
});

chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let id = tabs[0].id;
        let url = tabs[0].url;
        if (!(id && url)) return;

        chrome.storage.sync.set({ current_url: url }, function () { });
        chrome.tabs.sendMessage(id, { action: "onHistoryStateUpdated", url: url }, function (response) {
            return true;
        });
    });
});