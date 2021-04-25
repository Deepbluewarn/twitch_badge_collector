var gaNewElem: any = {};
var gaElems: any = {};


function gaInit_background() {

    var currdate: any = new Date();
    var url = 'https://ga.bluewarn.dev/www.google-analytics.com/analytics.js';
    //'https://www.google-analytics.com/analytics.js'
    (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * currdate; a = s.createElement(o),
            m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
    })(window, document, 'script', url, 'ga', gaNewElem, gaElems);

    //ga('create', 'UA-194964708-1', 'auto'); //for dev
    ga('create', 'UA-194964708-2', 'auto');
    ga('set', 'checkProtocolTask', null);
    ga('send', 'pageview', '/popup');
}

gaInit_background();

//ga('send', 'event', {'eventCategory' : 'DEBUG', 'eventAction' : 'firefox!', 'eventLabel' : 'please!'});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!sender.tab && request.type === 'ga_sendEvent') {
        ga('send', 'event', request.obj);
        sendResponse({ 'ga_sendEvent': 'done' });
    }
})
chrome.runtime.onInstalled.addListener(function () {

    let badge_list: string[] = ['스트리머', '매니저', 'VIP', '인증 완료', 'Broadcaster', 'Moderator', 'Verified'];
    let badge_setting: string[] = ['streamer', 'manager', 'vip', 'verified'];//just for popup page switch setting.
    chrome.storage.local.set({ badge_list: badge_list, badge_setting: badge_setting }, function () {
    });
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    let url = tab?.url;

    if (!url) {
        return null;
    }
    if (url.match(/https\:\/\/www\.twitch\.tv/)) {
        chrome.pageAction.show(tabId);
    }
    if (changeInfo.status === 'complete' && url.match(/https\:\/\/www\.twitch\.tv/)) {
        ga('send', 'event', { 'eventCategory': 'tabs.onUpdated', 'eventAction': 'url.match', 'eventLabel': url });
    }
});
chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let id: number | undefined = tabs[0].id;
        let url = tabs[0].url;

        chrome.storage.local.set({ current_url: url }, function () {

        });

        if (id) {
            chrome.tabs.sendMessage(id, { action: "onHistoryStateUpdated", url: url }, function (response) {

            });
        }
    });
});