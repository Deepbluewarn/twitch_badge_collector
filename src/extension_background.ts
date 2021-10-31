chrome.runtime.onInstalled.addListener(function (reason: any) {

    // 카테고리 배지를 선택하면 메모를 입력할 수 있는 Input Element 를 표시.
    const filter = new Map();
    filter.set('streamer', { filter_id: 'streamer', category: 'badge_uuid', filter_type: 'include', value: '5527c58c-fb7d-422d-b71b-f309dcb85cc1', note: '스트리머' });
    filter.set('manager', { filter_id: 'manager', category: 'badge_uuid', filter_type: 'include', value: '3267646d-33f0-4b17-b3df-f923a41db1d0', note: '매니저' });
    filter.set('vip', { filter_id: 'vip', category: 'badge_uuid', filter_type: 'include', value: 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec', note: 'VIP' });
    filter.set('verified', { filter_id: 'verified', category: 'badge_uuid', filter_type: 'include', value: 'd12a2e27-16f6-41d0-ab77-b780518f00a3', note: '인증 완료' });

    let filter_arr = Array.from(filter);

    chrome.storage.local.set({ default_filter: filter_arr }, function () { });
    chrome.storage.sync.set({ filter: filter_arr }, function () { });
    chrome.storage.local.set({ container_ratio: 30 }, function () { });

    let version = chrome.runtime.getManifest().version;

    if (version === '1.3.17') {
        chrome.notifications.create('intro_kwd_ft', {
            title: "Twitch Badge Collector",
            type: 'basic',
            iconUrl: '../public/icons/cc_icon128.png',
            message: chrome.i18n.getMessage('f_introduce'),
            requireInteraction: true,
            silent: true
        });
    }

});



chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    chrome.pageAction.show(tabId);
});

chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let id = tabs[0].id;
        let url = tabs[0].url;
        if (!(id && url)) return;
        chrome.storage.local.set({ current_url: url }, function () { });
        chrome.tabs.sendMessage(id, { action: "onHistoryStateUpdated", url: url }, function (response) {
        });
    });
});