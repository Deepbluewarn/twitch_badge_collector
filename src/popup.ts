let checkboxes: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[type=checkbox][name=badge]');

chrome.storage.local.get(['badge_setting'], function (result) {
    console.log(JSON.stringify(result));
    if (Object.keys(result).length != 0 && result.constructor === Object) {
        result.badge_setting.forEach((b: string) => {

            let el: HTMLElement | null = document.getElementById(b);

            if (el) {
                const element = <HTMLInputElement>el;
                element.checked = true;
            }
        });
    }

});

checkboxes.forEach(ckbox => {
    ckbox.addEventListener('change', e => {
        let badge_list: Array<string> = [];
        let badge_setting: Array<string> = [];

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

type Lang = {
    [key: string]: string;
    streamer: string;
    manager: string;
    vip: string;
    verified: string;
    subscriber: string;
}
type Translator = {
    ko: Lang;
    en: Lang;
}
const badge_lang: Translator = {
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
}