(function () {
    let add_filter_btn = <HTMLButtonElement>document.getElementById('add_filter_btn');

    function localizeHtmlPage() {
        let review_link = <HTMLDivElement>document.getElementById('review_link');
        let support_link = <HTMLDivElement>document.getElementById('support_link');
        let homepage_link = <HTMLDivElement>document.getElementById('homepage_link');

        add_filter_btn.textContent = chrome.i18n.getMessage('p_filter_btn');
        review_link.textContent = chrome.i18n.getMessage('review');
        support_link.textContent = chrome.i18n.getMessage('support');
        homepage_link.textContent = chrome.i18n.getMessage('homepage');
    }

    window.addEventListener('load', e => {
        localizeHtmlPage();
    });

    chrome.storage.local.get(['position', 'theme', 'font_size', 'language'], (res) => {
        (document.getElementById('select_language') as HTMLSelectElement).value = `language__${res.language}`;
        (document.getElementById('select_theme') as HTMLSelectElement).value = `theme__${res.theme}`;
        (document.getElementById('select_font-size') as HTMLSelectElement).value = res.font_size;
        (document.getElementById('select_chat-position') as HTMLSelectElement).value = res.position;
    });

    document.getElementById('setting_container')?.addEventListener('change', e=> {
        const target = <HTMLSelectElement>e.target;

        if(target.tagName !== 'SELECT') return;

        let changed = target.value;

        if(target.id === 'select_language'){
            changed = changed.substring(changed.lastIndexOf('_') + 1);
            chrome.storage.local.set({language : changed});
        }else if(target.id === 'select_theme'){
            changed = changed.substring(changed.lastIndexOf('_') + 1);
            chrome.storage.local.set({theme : changed});
        }else if(target.id === 'select_font-size'){
            chrome.storage.local.set({font_size : changed});
        }else if(target.id === 'select_chat-position'){
            chrome.storage.local.set({position : changed});
        }
    });

    add_filter_btn.addEventListener('click', e => {
        chrome.tabs.create({ url: 'https://wtbc.bluewarn.dev/setting/filter' });
    });
})();
