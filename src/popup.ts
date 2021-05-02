let checkboxes: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[type=checkbox][name=badge]');
let delegation = <HTMLDivElement>document.getElementById('delegation');
let slider = <HTMLInputElement>document.getElementsByClassName('container_size')[0];
let theme_button = <HTMLSpanElement>document.getElementById('theme_button');
//let follow_disable = <HTMLInputElement>document.getElementById('disable_follow_button');
let current_url = '';

const [d, l] = ['dark_mode', 'light_mode'];
const [dark_button, light_button] = ['star', 'light_mode'];

function localizeHtmlPage()
{
    let option_buttons = document.getElementsByClassName('option');
    let title_text = document.getElementById('title_text');
    let footer_text_translate = <HTMLSpanElement>document.getElementById('footer_text_translate');
    Array.from(option_buttons).forEach(e=>{
        let id = e.getElementsByClassName('text')[0].getAttribute('id');
        if(id){
            e.getElementsByClassName('text')[0].textContent = chrome.i18n.getMessage(id);
        }
    });
    if(title_text){
        title_text.textContent = chrome.i18n.getMessage('popup_title');
    }
    if(footer_text_translate){
        footer_text_translate.textContent = chrome.i18n.getMessage('icon');
    }
    
}
function changeTheme(){
    let current_mode;

    let dark_mode = document.body.classList.contains(d);
    let light_mode = document.body.classList.contains(l);
    
    if(dark_mode){
        document.body.classList.replace(d, l);
        theme_button.textContent = light_button;
        current_mode = l;
    }else if(light_mode){
        document.body.classList.replace(l, d);
        theme_button.textContent = dark_button;
        current_mode = d;
    }
    chrome.storage.local.set({theme : current_mode}, function () {
    });
}
window.addEventListener('load',e=>{
    localizeHtmlPage();
});
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
        if (namespace === 'local') {
            let storageChange = changes[key];
            if (key === 'container_ratio') {
                slider.value = storageChange.newValue;
            } else if (key === 'current_url') {
                current_url = storageChange.newValue;
            }
        }
    }
});

chrome.storage.local.get(['container_ratio'], function (result) {
    let ratio = result.container_ratio;
    if (ratio) {
        slider.value = ratio;
    }
});

chrome.storage.local.get(['theme'], result=>{
    if(result){
        let theme = result.theme;
        let button = document.getElementById('theme_button');
        let button_text;
        document.body.classList.remove(d, l);
        document.body.classList.add(theme);
        (theme === d) ? button_text = dark_button : button_text = light_button;
        if(button){
            button.textContent = button_text;
        }
    }
});

/*chrome.storage.local.get(['follow_button_visibility'], function (result) {
    follow_disable.checked = result.follow_button_visibility;
});*/

//Listeners..

theme_button.addEventListener('click', e=>{
    changeTheme();
});

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
});

slider.addEventListener('change', e => {
    let target = <HTMLInputElement>e.target;

    chrome.storage.local.set({ container_ratio: target.value }, function () {
    });

});

/*if (follow_disable) {
    follow_disable.addEventListener('change', e => {
        let target = <HTMLInputElement>e.target;

        chrome.storage.local.set({ follow_button_visibility: target.checked }, function () {
        });

    });
}*/

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