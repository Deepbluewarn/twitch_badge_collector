const tid = 'UA-194964708-5';
const version = chrome.runtime.getManifest().version;

let twitch_exist: boolean = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ga_sendEvent') {
        send_ga_event(request.obj);
        sendResponse({ 'ga_sendEvent': 'done' });
    }
    return true;
});

function send_ga_event(obj: any) {
    var url = `http://www.google-analytics.com/collect?v=1&tid=${tid}&uid=555&t=event&ec=${obj.eventCategory}&ea=${obj.eventAction}&el=${obj.eventLabel}`;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.send();
}

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

    reason.to = version;
    chrome.storage.local.set({ default_filter : filter }, function () { });
    chrome.storage.sync.set({ filter }, function () { });
    chrome.storage.local.set({ container_ratio: 30 }, function () { });

    // 버전 정보 Google Analytics Event 전송
    send_ga_event({ eventCategory : 'background', eventAction : 'onInstalled', eventLabel : version });
    send_ga_event({ eventCategory : 'background', eventAction : 'onInstalled', eventLabel : JSON.stringify(reason) });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    let isCompleted = changeInfo.status === 'complete';
    let url = tab.url;
    chrome.pageAction.show(tabId);

    if (!isCompleted || !url) return;
    
    send_ga_event({ eventCategory : 'background', eventAction : 'onUpdated', eventLabel : version });
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