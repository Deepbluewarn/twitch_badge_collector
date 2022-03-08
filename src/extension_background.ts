function get_new_filter() {
    const filter = new Map();
    filter.set('streamer', { filter_id: 'streamer', category: 'badge_uuid', filter_type: 'include', value: '5527c58c-fb7d-422d-b71b-f309dcb85cc1', note: '스트리머' });
    filter.set('manager', { filter_id: 'manager', category: 'badge_uuid', filter_type: 'include', value: '3267646d-33f0-4b17-b3df-f923a41db1d0', note: '매니저' });
    filter.set('vip', { filter_id: 'vip', category: 'badge_uuid', filter_type: 'include', value: 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec', note: 'VIP' });
    filter.set('verified', { filter_id: 'verified', category: 'badge_uuid', filter_type: 'include', value: 'd12a2e27-16f6-41d0-ab77-b780518f00a3', note: '인증 완료' });

    return filter;
}

chrome.runtime.onInstalled.addListener(function (reason: any) {
    chrome.storage.local.get(['position', 'theme', 'font_size', 'language'], (res) => {
        const language = res.language ? res.language : chrome.i18n.getMessage('language');
        const theme = res.theme ? res.theme : 'dark';
        const font_size = res.font_size ? res.font_size : 'default';
        const position = res.position ? res.position : 'position-down';

        chrome.storage.local.set({language : language, theme : theme, font_size : font_size, position : position});
    });

    chrome.tabs.create({ url: 'https://tbc.bluewarn.dev/' });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    chrome.pageAction.show(tabId);
});

chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let id = tabs[0].id;
        let url = tabs[0].url;
        if (!(id && url)) return;
        chrome.tabs.sendMessage(id, { action: "onHistoryStateUpdated", url: url }, function (response) {
        });
    });
});