"use strict";
let checkboxes = document.querySelectorAll('input[type=checkbox][name=badge]');
chrome.storage.local.get(['badge_setting'], function (result) {
    console.log(JSON.stringify(result));
    if (Object.keys(result).length != 0 && result.constructor === Object) {
        result.badge_setting.forEach((b) => {
            let el = document.getElementById(b);
            if (el) {
                const element = el;
                element.checked = true;
            }
        });
    }
});
checkboxes.forEach(ckbox => {
    ckbox.addEventListener('change', e => {
        let badge_list = [];
        let badge_setting = [];
        checkboxes.forEach(c => {
            if (c.checked) {
                const id = c.id;
                if (badge_lang.ko[id]) {
                    badge_setting.push(id);
                    badge_list.push(badge_lang.ko[id]);
                }
            }
        });
        chrome.storage.local.set({ badge_list: badge_list, badge_setting: badge_setting }, function () {
            console.log('Value is set to ' + JSON.stringify({ badge_list: badge_list, badge_setting: badge_setting }));
        });
    });
});
const badge_lang = {
    ko: {
        streamer: '스트리머',
        manager: '매니저',
        vip: 'VIP',
        verified: '인증 완료',
        subscriber: '정기구독자'
    },
    en: {
        streamer: 'Broadcaster',
        manager: 'Moderator',
        vip: 'VIP',
        verified: 'Verified',
        subscriber: 'Subscriber'
    }
};
