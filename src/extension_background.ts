chrome.runtime.onInstalled.addListener(function () {
    
    const badge_setting = {
        'streamer' : '5527c58c-fb7d-422d-b71b-f309dcb85cc1',
        'manager' : '3267646d-33f0-4b17-b3df-f923a41db1d0',
        'vip' : 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec',
        'verified' : 'd12a2e27-16f6-41d0-ab77-b780518f00a3'
    }

    chrome.storage.local.set({ badge_setting: badge_setting, BADGE_LIST: badge_setting }, function () {});
    chrome.storage.local.set({ container_ratio: 30 }, function () {});

});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //let isCompleted = changeInfo.status === 'complete';
    
    let url = tab.url;
    if (!url) return null;

    let isTwitch = url.match(/https\:\/\/www\.twitch\.tv/);
    if (isTwitch) chrome.pageAction.show(tabId);

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