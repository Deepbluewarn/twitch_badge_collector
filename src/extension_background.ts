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

    ga('create', 'UA-194964708-5', 'auto'); // live
    //ga('create', 'UA-194964708-6', 'auto'); // debug
    ga('set', 'checkProtocolTask', null);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ga_sendEvent') {
        ga('send', 'event', request.obj);
        sendResponse({ 'ga_sendEvent': 'done' });
    }
    return true;
})

function heartbeat() {

    chrome.windows.getAll(windows => {
        if (Array.isArray(windows) && windows.length === 0) {
            chrome.alarms.clear('heartbeat');
        }
    });
    if (twitch_exist) {
        // 실시간 사용자 수 파악을 위한 Event.
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

function show_filter_page(){
    let url = chrome.extension.getURL('public/filter.html');
    chrome.tabs.create({ url: url });
}

gaInit_background();

chrome.runtime.onInstalled.addListener(function (reason: any) {

    /**
     * category : 필터링 조건을 배지 또는 아이디로 설정할 수 있습니다. (badge_uuid / login_name)
     * filter_type : 필터링 조건을 포함할지 제외할지 설정합니다.
     * value : 필터에 대한 값 입니다. badge_uuid 인 경우 Twitch badge 링크의 고유값을, login_name 인 경우 아이디를 설정합니다.
     * value 값은 소문자만 입력해야 합니다.
     */
    const filter = [
        {filter_id : 'streamer', category : 'badge_uuid', filter_type : 'include', value : '5527c58c-fb7d-422d-b71b-f309dcb85cc1'},
        {filter_id : 'manager', category : 'badge_uuid', filter_type : 'include', value : '3267646d-33f0-4b17-b3df-f923a41db1d0'},
        {filter_id : 'vip', category : 'badge_uuid', filter_type : 'include', value : 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec'},
        {filter_id : 'verified', category : 'badge_uuid', filter_type : 'include', value : 'd12a2e27-16f6-41d0-ab77-b780518f00a3'}
    ]

    

    let version = chrome.runtime.getManifest().version;

    if(version === '1.3.1'){
        chrome.notifications.create('introduce_filter', {
            title : "Twitch Badge Collector",
            type : 'basic',
            iconUrl : '../public/icons/cc_icon128.png',
            message : "새로 추가된 필터 기능을 사용해보세요!",
            requireInteraction : true,
            buttons : [{
                title : '바로가기'
            }],
            silent : true
        });
    }
    reason.to = version;
    chrome.storage.local.set({ default_filter : filter }, function () { });
    chrome.storage.sync.set({ filter }, function () { });
    chrome.storage.local.set({ container_ratio: 30 }, function () { });

    // 버전 정보 Google Analytics Event 전송
    ga('send', 'event', { 'eventCategory': 'background', 'eventAction': 'onInstalled', 'eventLabel': version });
    ga('send', 'event', { 'eventCategory': 'background', 'eventAction': 'onInstalled', 'eventLabel': JSON.stringify(reason) });
});

chrome.notifications.onButtonClicked.addListener((id)=>{
    if(id === 'introduce_filter') show_filter_page();
});
chrome.notifications.onClicked.addListener(id=>{
    if(id === 'introduce_filter') show_filter_page();
})

chrome.alarms.onAlarm.addListener(function (alarm) {
    heartbeat();
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    let isCompleted = changeInfo.status === 'complete';
    
    chrome.pageAction.show(tabId);

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

        chrome.storage.local.set({ current_url: url }, function () { });
        chrome.tabs.sendMessage(id, { action: "onHistoryStateUpdated", url: url }, function (response) {
            return true;
        });
    });
});