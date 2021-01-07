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

        //badge_list 배열에 있는 값들을 사용자가 따로 작성할 수 있게 옵션 제공
        //지금 있는 스위치들은 기본값으로 두고, 특별한 배지를 추가하거나 다른 언어 사용자인 경우는 직접 입력할 수 있도록..
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
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab);
        console.log(request);

        if (request.type === 'point') {

        }
        //indexeddb, chart.js
        if (request.greeting == "hello")
            sendResponse({ farewell: "goodbye" });
    }
);

var ctx = <HTMLCanvasElement>document.getElementById('pointChart');
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', '3', '4'],
        datasets: [{

            label: 'Point',
            data: [
                { x: '2016-12-25', y: 4710 },
                { x: '2016-12-25', y: 90 },
                { x: '2016-12-26', y: 4770 },
                { x: '2016-12-25', y: 4830 }
            ],
            backgroundColor: [
                'rgba(221,71, 255, 0.2)',
                'rgba(221,71, 255, 0.2)',
                'rgba(221,71, 255, 0.2)',
                'rgba(221,71, 255, 0.2)'
            ],
            borderColor: [
                'rgba(221,71, 255, 1)',
                'rgba(221,71, 255, 1)',
                'rgba(221,71, 255, 1)',
                'rgba(221,71, 255, 1)'
            ],
            borderWidth: 1,
            lineTension: 0
        }]
    },
    options: {

        scales: {
            yAxes: [{
                type: 'logarithmic',
                ticks: {
                    callback: (value: number, index) => {
                        const remain = value / (Math.pow(10, Math.floor(Chart.helpers.log10(value))));
                        if (remain == 1 || remain == 2 || remain == 5 || index == 0) {
                            return value.toLocaleString();
                        }
                        return '';
                    }
                }
            }]
        }
    }
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