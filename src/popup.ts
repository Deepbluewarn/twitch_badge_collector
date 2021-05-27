
let options = <HTMLDivElement>document.getElementById('options');
let slider = <HTMLInputElement>document.getElementsByClassName('container_size')[0];
let range_marks = <HTMLDivElement>document.getElementById('range_marks');
let donate_link = <HTMLDivElement>document.getElementById('donate_link');
let version_info = <HTMLSpanElement>document.getElementById('version_info');

let current_url = '';
let BADGE_LIST = {};

version_info.textContent = 'v' + chrome.runtime.getManifest().version + ' made by bluewarn';

function localizeHtmlPage() {

    let options = document.getElementsByClassName('option');
    let review_link = <HTMLDivElement>document.getElementById('review_link');
    let support_link = <HTMLDivElement>document.getElementById('support_link');
    let donate_link = <HTMLDivElement>document.getElementById('donate_link');

    Array.from(options).forEach(e => {
        let text = e.getElementsByClassName('text');
        let id = text[0].getAttribute('id');
        if (id) text[0].textContent = chrome.i18n.getMessage(id);
    });

    review_link.textContent = chrome.i18n.getMessage('review');
    support_link.textContent = chrome.i18n.getMessage('support');
    donate_link.textContent = chrome.i18n.getMessage('donate');
}

window.addEventListener('load', e => {
    localizeHtmlPage();
});

//init popop setting value
chrome.storage.local.get(['badge_setting'], function (result) {

    let chboxs = document.getElementsByClassName('badge_checkbox');

    Array.from(chboxs).some(e => {
        if (e.getAttribute('uuid') === result.badge_setting[e.id]) {
            (e as HTMLInputElement).checked = true;
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

chrome.storage.onChanged.addListener(function (changes, namespace) {

    if (namespace != 'local') return;

    for (var key in changes) {
        let newValue = changes[key].newValue;

        if (key === 'container_ratio') {
            slider.value = newValue;
        } else if (key === 'current_url') {
            current_url = newValue;
        }
        
    }
});

//Listeners..

options.addEventListener('change', e => {

    let checkboxes: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[type=checkbox][name=badge]');
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
    let value = (e.target as HTMLInputElement).value;
    chrome.storage.local.set({ container_ratio: value }, function () { });
});

range_marks.addEventListener('click', e =>{
    let target = (e.target as HTMLParagraphElement)
    if(target.nodeName != 'P') return;
    chrome.storage.local.set({ container_ratio: target.textContent }, function () { });
})

donate_link.addEventListener('click', e => {
    let url = chrome.extension.getURL('public/donation.html');
    chrome.tabs.create({ url: url });
});