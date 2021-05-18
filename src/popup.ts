let checkboxes: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[type=checkbox][name=badge]');
let delegation = <HTMLDivElement>document.getElementById('delegation');
let slider = <HTMLInputElement>document.getElementsByClassName('container_size')[0];
//let theme_button = <HTMLSpanElement>document.getElementById('theme_button');
let ethereum_button = <HTMLDivElement>document.getElementById('donate_button');

let current_url = '';
let BADGE_LIST = {};

const [d, l] = ['dark_mode', 'light_mode'];
const [dark_button, light_button] = ['star', 'light_mode'];

/*let clipboard = new ClipboardJS(ethereum_button);
clipboard.on('success', e => {
    console.info('Action:', e.action);
    console.info('Text:', e.text);
    console.info('Trigger:', e.trigger);

    e.clearSelection();
})*/

function localizeHtmlPage() {
    let option_buttons = document.getElementsByClassName('option');
    //let review_link = document.getElementById('review_link');
    //let support_link = document.getElementById('support_link');
    //let donate_button = document.getElementById('donate_button');

    Array.from(option_buttons).forEach(e => {
        let id = e.getElementsByClassName('text')[0].getAttribute('id');
        if (id) {
            e.getElementsByClassName('text')[0].textContent = chrome.i18n.getMessage(id);
        }
    });

    /*if (review_link) {
        review_link.textContent = chrome.i18n.getMessage('review');
    }
    if (support_link) {
        support_link.textContent = chrome.i18n.getMessage('support');
    }
    if(donate_button){
        donate_button.textContent = chrome.i18n.getMessage('donate');
    }*/
}
/*function changeTheme() {
    let current_mode;

    let dark_mode = document.body.classList.contains(d);
    let light_mode = document.body.classList.contains(l);

    if (dark_mode) {
        document.body.classList.replace(d, l);
        theme_button.textContent = light_button;
        current_mode = l;
    } else if (light_mode) {
        document.body.classList.replace(l, d);
        theme_button.textContent = dark_button;
        current_mode = d;
    }
    chrome.storage.local.set({ theme: current_mode }, function () {
    });
}*/

window.addEventListener('load', e => {
    localizeHtmlPage();
});

//init popop setting value
chrome.storage.local.get(['badge_setting'], function (result) {
    let el = document.getElementsByClassName('badge_checkbox');

    Array.from(el).some(e => {
        if (e.getAttribute('uuid') === result.badge_setting[e.id]) {
            const element = <HTMLInputElement>e;
            element.checked = true;
        }
    });
});

chrome.storage.local.get(['BADGE_LIST'], function (result) {
    BADGE_LIST = result.BADGE_LIST;
});

chrome.storage.local.get(['container_ratio'], function (result) {
    let ratio = result.container_ratio;
    if (ratio) slider.value = ratio;
});

/*chrome.storage.local.get(['theme'], result => {
    if (result) {
        let theme = result.theme;
        let button = document.getElementById('theme_button');
        let button_text;
        document.body.classList.remove(d, l);
        document.body.classList.add(theme);
        (theme === d) ? button_text = dark_button : button_text = light_button;
        if (button) button.textContent = button_text;
    }
});*/

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

//Listeners..

/*theme_button.addEventListener('click', e => {
    changeTheme();
});*/

delegation.addEventListener('change', e => {
    let target = <HTMLInputElement>e.target;
    if (target.getAttribute('name') === 'badge' || target.getAttribute('checkbox')) {

        let badge_setting = {};

        checkboxes.forEach(c => {
            if (c.checked) {
                const id = c.id;
                badge_setting[id] = BADGE_LIST[id];
            }
        });
        chrome.storage.local.set({ badge_setting: badge_setting }, function () { });
    }
});

slider.addEventListener('change', e => {
    let target = <HTMLInputElement>e.target;
    chrome.storage.local.set({ container_ratio: target.value }, function () { });
});

/*ethereum_button.addEventListener('click', e=>{
    console.log('이더리움 후원 버튼 클릭 됨');
    chrome.tabs.create({url : 'public/donation.html'});
})*/