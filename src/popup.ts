let checkboxes: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[type=checkbox][name=badge]');
let delegation = document.getElementById('delegation');
let slider = <HTMLInputElement>document.getElementById('container_size');
let follow_disable = <HTMLInputElement>document.getElementById('disable_follow_button');

//init popop setting value
chrome.storage.local.get(['badge_setting'], function (result) {
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

chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (var key in changes) {
        if(namespace === 'local'){
            let storageChange = changes[key];
            if(key === 'container_ratio'){
                slider.value = storageChange.newValue;
            }
        }
    }
});

chrome.storage.local.get(['container_ratio'], function(result){
    let ratio = result.container_ratio;
    if(ratio){
        slider.value = ratio;
    }
});

chrome.storage.local.get(['follow_button_visibility'], function(result){
    follow_disable.checked = result.follow_button_visibility;
});



//Listeners..
if (delegation) {
    delegation.addEventListener('change', e => {
        let target = <HTMLInputElement>e.target;
        if (target.getAttribute('name') === 'badge' || target.getAttribute('checkbox')) {
            let badge_list: Array<string> = [];
            let badge_setting: Array<string> = [];

            checkboxes.forEach(c => {
                if (c.checked) {
                    const id = c.id;
                    if (badge[id]) {
                        badge_setting.push(id);
                        badge_list.push(badge[id][0], badge[id][1]);
                    }
                }
            });

            chrome.storage.local.set({ badge_list: badge_list, badge_setting: badge_setting }, function () {
            });
        }
    })
}
if (slider) {
    slider.addEventListener('change', e => {

        let target = <HTMLInputElement>e.target;

        chrome.storage.local.set({ container_ratio : target.value }, function () {
        });

    });
}
if(follow_disable){
    follow_disable.addEventListener('change', e=>{

        let target = <HTMLInputElement>e.target;

        chrome.storage.local.set({ follow_button_visibility : target.checked }, function () {
        });

    });
}


type Translator = {
    [key: string]: string[];
    streamer: string[];
    manager: string[];
    vip: string[];
    verified: string[];
}
const badge: Translator = {
    streamer: ['스트리머', 'Broadcaster'],
    manager: ['매니저', 'Moderator'],
    vip: ['VIP', 'VIP'],
    verified: ['인증 완료', 'Verified']
}