chrome.runtime.onInstalled.addListener(function (reason: any) {
    chrome.storage.local.get(['position', 'theme', 'font_size', 'language'], (res) => {
        const language = res.language ? res.language : chrome.i18n.getMessage('language');
        const theme = res.theme ? res.theme : 'light';
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