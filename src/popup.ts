import { Filter, filter_type } from './types.js.js';

(function () {
    let options = <HTMLDivElement>document.getElementById('options');
    let add_filter_btn = <HTMLButtonElement>document.getElementById('add_filter_btn');
    
    let current_url = '';

    let global_filter: Map<string, Filter> = new Map();

    function localizeHtmlPage() {

        let bf_op = document.getElementsByClassName('badge_filter_option');
        let review_link = <HTMLDivElement>document.getElementById('review_link');
        let support_link = <HTMLDivElement>document.getElementById('support_link');
        let homepage_link = <HTMLDivElement>document.getElementById('homepage_link');
        let topDisplay = <HTMLDivElement>document.getElementById('topDisplay_text');

        Array.from(bf_op).forEach(e => {
            let text = e.getElementsByClassName('text');
            let id = text[0].getAttribute('id');
            if (id) text[0].textContent = chrome.i18n.getMessage(id);
        });

        add_filter_btn.textContent = chrome.i18n.getMessage('p_filter_btn');

        review_link.textContent = chrome.i18n.getMessage('review');
        support_link.textContent = chrome.i18n.getMessage('support');
        homepage_link.textContent = chrome.i18n.getMessage('homepage');
        topDisplay.textContent = chrome.i18n.getMessage('p_topDisplay');
    }

    window.addEventListener('load', e => {
        localizeHtmlPage();
    });

    //init popop setting value
    chrome.storage.sync.get('filter', function (result) {

        let chboxes = Array.from(document.getElementsByClassName('badge_checkbox'));

        global_filter = new Map(result.filter);

        chboxes.forEach(e => {
            let id = e.getAttribute('id')!;
            let f = global_filter.get(id)!;

            (e as HTMLInputElement).checked = f.filter_type === filter_type.Include ? true : false;
        });

    });

    chrome.storage.local.get('topDisplay', function (result) {
        let chboxes = <HTMLInputElement>document.getElementById('topDisplay');
        chboxes.checked = result.topDisplay;
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

        if(target.getAttribute('type') === 'checkbox'){
            if(target.getAttribute('name') === 'badge'){
                const id = target.getAttribute('id')!;
                const checked = target.checked;
                const type = checked ? filter_type.Include : filter_type.Exclude;
    
                let filter: Filter | undefined = global_filter.get(id);
                if(!filter){
                    target.checked = !checked;
                    return;
                }
                filter.filter_type = type;
                global_filter.set(id, filter);
    
                chrome.storage.sync.set({ filter: Array.from(global_filter) }, () => { });
            }else if(target.getAttribute('name') == 'topDisplay'){
                const type = target.checked;

                chrome.storage.local.set({topDisplay : type});
            }
        }
    });

    add_filter_btn.addEventListener('click', e => {
        let url = chrome.runtime.getURL('public/filter.html');
        chrome.tabs.create({ url: url });
    });
})();
