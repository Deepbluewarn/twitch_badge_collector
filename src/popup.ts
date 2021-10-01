import { Filter, filter_type } from './types.js.js';

(function () {
    let options = <HTMLDivElement>document.getElementById('options');
    let add_filter_btn = <HTMLButtonElement>document.getElementById('add_filter_btn');
    
    let current_url = '';

    let global_filter: Array<Filter>;

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

        add_filter_btn.textContent = chrome.i18n.getMessage('p_filter_btn');

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

        chboxs.forEach(e => {
            global_filter.some(filter => {
                if (filter.filter_id === e.id) {
                    (e as HTMLInputElement).checked = filter.filter_type === filter_type.Include ? true : false;
                    return true;
                }
            });
        });

    });

    chrome.storage.onChanged.addListener(function (changes, namespace) {

        if (namespace != 'local') return;

        for (var key in changes) {
            let newValue = changes[key].newValue;

            if (key === 'current_url') {
                current_url = newValue;
            }
        }
    });

    //Listeners..

    options.addEventListener('change', e => {

        let target = <HTMLInputElement>e.target;

        if (target.getAttribute('name') === 'badge' || target.getAttribute('checkbox')) {
            const id = target.getAttribute('id');
            const type = target.checked ? filter_type.Include : filter_type.Exclude;

            for (let i = 0; i < global_filter.length; i++) {
                let f = global_filter[i];
                if (f.filter_id === id) {
                    f.filter_type = type;
                    break;
                }
            }

            chrome.storage.sync.set({ filter: global_filter }, () => { });
        }
    });

    add_filter_btn.addEventListener('click', e => {
        let url = chrome.runtime.getURL('public/filter.html');
        chrome.tabs.create({ url: url });
    });
})();
