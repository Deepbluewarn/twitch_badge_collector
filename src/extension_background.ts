function get_new_filter() {
    const filter = new Map();
    filter.set('streamer', { filter_id: 'streamer', category: 'badge_uuid', filter_type: 'include', value: '5527c58c-fb7d-422d-b71b-f309dcb85cc1', note: 'Streamer' });
    filter.set('manager', { filter_id: 'manager', category: 'badge_uuid', filter_type: 'include', value: '3267646d-33f0-4b17-b3df-f923a41db1d0', note: 'Moderator' });
    filter.set('vip', { filter_id: 'vip', category: 'badge_uuid', filter_type: 'include', value: 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec', note: 'VIP' });
    filter.set('verified', { filter_id: 'verified', category: 'badge_uuid', filter_type: 'include', value: 'd12a2e27-16f6-41d0-ab77-b780518f00a3', note: 'Verified' });

    return filter;
}

chrome.runtime.onInstalled.addListener(function (reason: any) {
    if(reason.reason === 'install'){
        chrome.storage.sync.get('filter', result => {
            if(!result.filter){
                chrome.storage.sync.set({filter : Array.from(get_new_filter())});
            }
        });
    }
    chrome.storage.local.get(['position', 'theme', 'font_size', 'language', 'chatDisplayMethod'], (res) => {
        const language = res.language ? res.language : chrome.i18n.getMessage('language');
        const theme = res.theme ? res.theme : 'light';
        const font_size = res.font_size ? res.font_size : 'default';
        const position = res.position ? res.position : 'position-down';
        const method = res.chatDisplayMethod ? res.chatDisplayMethod : 'method-twitchui';

        chrome.storage.local.set({
            language : language,
            theme : theme,
            font_size : font_size, 
            position : position,
            chatDisplayMethod : method
        });
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