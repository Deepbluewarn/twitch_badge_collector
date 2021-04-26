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