// @ts-nocheck
import {Filter, filter_category, filter_type, default_badge} from './types.js';
let options = <HTMLDivElement>document.getElementById('options');
let add_condition_btn = <HTMLButtonElement>document.getElementById('add_condition_btn');
let slider = <HTMLInputElement>document.getElementsByClassName('container_size')[0];
let range_marks = <HTMLDivElement>document.getElementById('range_marks');
let version_info = <HTMLSpanElement>document.getElementById('version_info');

let current_url = '';

let global_filter: Array<Filter>;

version_info.textContent = 'v' + chrome.runtime.getManifest().version + ' made by bluewarn';

function localizeHtmlPage() {

    let options = document.getElementsByClassName('option');
    let review_link = <HTMLDivElement>document.getElementById('review_link');
    let support_link = <HTMLDivElement>document.getElementById('support_link');
    let homepage_link = <HTMLDivElement>document.getElementById('homepage_link');

    Array.from(options).forEach(e => {
        let text = e.getElementsByClassName('text');
        let id = text[0].getAttribute('id');
        if (id) text[0].textContent = chrome.i18n.getMessage(id);
    });

    review_link.textContent = chrome.i18n.getMessage('review');
    support_link.textContent = chrome.i18n.getMessage('support');
    homepage_link.textContent = chrome.i18n.getMessage('homepage');
}

window.addEventListener('load', e => {
    localizeHtmlPage();
});

//init popop setting value
chrome.storage.sync.get('filter', function (result) {

    let chboxs = Array.from(document.getElementsByClassName('badge_checkbox'));

    global_filter = result.filter;

    chboxs.forEach(e=>{
        global_filter.some(filter=>{
            if(filter.filter_id === e.id){
                (e as HTMLInputElement).checked = filter.filter_type === filter_type.Include ? true : false;
                return true;
            }
        });
    });

});

chrome.storage.local.get(['container_ratio'], function (result) {
    slider.value = result.container_ratio;
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
        let filter = global_filter;

        checkboxes.forEach(c => {
            const id = c.id; // 필터 타입 (include / exclude)
            
            let type = c.checked ? filter_type.Include : filter_type.Exclude;

            filter.forEach((e, i)=>{
                let filter_id = e.filter_id;
                let is_default = Object.values(default_badge).includes(filter_id);

                if(is_default && filter_id === id){
                    filter[i].filter_type = type;
                }

            });
        });

        chrome.storage.sync.set({ filter }, ()=>{});
        
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
});

add_condition_btn.addEventListener('click', e=>{
    let url = chrome.extension.getURL('public/setting.html');
    chrome.tabs.create({ url: url });
});