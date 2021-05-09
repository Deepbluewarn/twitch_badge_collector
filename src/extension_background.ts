/*const badge_lists = {
    'ko': ['스트리머', '매니저', 'VIP', '인증 완료'],
    'en': ['Broadcaster', 'Moderator', 'VIP', 'Verified'],
    'ja': ['ストリーマー', 'モデレーター', 'VIP', '認証済み'],
}*/
chrome.runtime.onInstalled.addListener(function () {

    //let badge_list: string[] = ['스트리머', '매니저', 'VIP', '인증 완료', 'Broadcaster', 'Moderator', 'Verified'];
    //let badge_setting: string[] = ['streamer', 'manager', 'vip', 'verified'];//just for popup page switch setting.
    
    const badge_setting = {
        'streamer' : '5527c58c-fb7d-422d-b71b-f309dcb85cc1',
        'manager' : '3267646d-33f0-4b17-b3df-f923a41db1d0',
        'vip' : 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec',
        'verified' : 'd12a2e27-16f6-41d0-ab77-b780518f00a3'
    }
    chrome.storage.local.set({ /*badge_list: badge_list,*/ badge_setting: badge_setting }, function () {
        
    });
    chrome.storage.local.set({ theme: 'light_mode' }, function () {
    });
});
/*chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    let lang = request.twitch_language
    if (!lang) lang = 'ko' // 기본값은 한국어.
    chrome.storage.local.set({ badge_list: badge_list }, function () {

    });
    sendResponse({ farewell: "badge language set done." });
});*/
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    let url = tab?.url;

    if (!url) {
        return null;
    }
    if (url.match(/https\:\/\/www\.twitch\.tv/)) {
        chrome.pageAction.show(tabId);
    }
    /*if (changeInfo.status === 'complete' && url.match(/https\:\/\/www\.twitch\.tv/)) {

    }*/
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