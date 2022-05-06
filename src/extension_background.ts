import browser from "webextension-polyfill";

// const version_history = ["1.3.2", "1.4.0", "1.4.2", "1.4.3", "1.4.4", "1.4.5", "1.4.6"];

function get_new_filter() {
    const filter = new Map();
    filter.set('streamer', { filter_id: 'streamer', category: 'badge_uuid', filter_type: 'include', value: '5527c58c-fb7d-422d-b71b-f309dcb85cc1', note: 'Streamer' });
    filter.set('manager', { filter_id: 'manager', category: 'badge_uuid', filter_type: 'include', value: '3267646d-33f0-4b17-b3df-f923a41db1d0', note: 'Moderator' });
    filter.set('vip', { filter_id: 'vip', category: 'badge_uuid', filter_type: 'include', value: 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec', note: 'VIP' });
    filter.set('verified', { filter_id: 'verified', category: 'badge_uuid', filter_type: 'include', value: 'd12a2e27-16f6-41d0-ab77-b780518f00a3', note: 'Verified' });

    return filter;
}

browser.runtime.onInstalled.addListener(function (details: any) {
    if(details.reason === 'install'){
        browser.storage.local.set({filter : Array.from(get_new_filter())});
    }
    // else if(details.reason === 'update'){
        
    //     const currentVersion = browser.runtime.getManifest().version;
    //     const prev_version = details.previousVersion;

    //     if(prev_version !== currentVersion && version_history.includes(prev_version)){
    //         browser.storage.local.get('filter').then(res => {
    //             browser.storage.local.set({filter : Object.fromEntries(res.filter)});
    //         });
    //     }
    // }
    browser.storage.local.get(['position', 'theme', 'font_size', 'language', 'chatDisplayMethod', 'pointBox_auto', 'replayChatSize']).then(res => {
        const language = res.language ? res.language : navigator.language;
        const theme = res.theme ? res.theme : 'light';
        const font_size = res.font_size ? res.font_size : 'default';
        const position = res.position ? res.position : 'position-down';
        const method = res.chatDisplayMethod ? res.chatDisplayMethod : 'method-twitchui';
        const pointBoxAuto = res.pointBox_auto ? res.pointBox_auto : 'pointBox-method-on';
        const replayChatSize = res.replayChatSize ? res.replayChatSize : '30';

        browser.storage.local.set({
            language : language,
            theme : theme,
            font_size : font_size, 
            position : position,
            chatDisplayMethod : method,
            pointBox_auto : pointBoxAuto,
            replayChatSize : replayChatSize
        });
    });
});

browser.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        if (tabs.length === 0) return;

        let id = tabs[0].id;
        let url = tabs[0].url;
        if (!(id && url)) return;
        browser.tabs.sendMessage(id, { action: "onHistoryStateUpdated", url: url });
    });
});