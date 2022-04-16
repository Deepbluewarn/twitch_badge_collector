import browser from "webextension-polyfill";

const version = chrome.runtime.getManifest().version;
type displayMethod = 'method-twitchui' | 'method-mini';
const dev_checkbox = <HTMLInputElement>document.getElementById('dev-checkbox');
const add_filter_btn = <HTMLButtonElement>document.getElementById('add_filter_btn');
const save_chat_btn = <HTMLButtonElement>document.getElementById('save-chat');
const web_version_btn = <HTMLButtonElement>document.getElementById('web-version');

let dev = false;
const params = new URLSearchParams();
params.set('ext_version', version);

function localizeHtmlPage() {
    const review_link = <HTMLDivElement>document.getElementById('review_link');
    const support_link = <HTMLDivElement>document.getElementById('support_link');
    const homepage_link = <HTMLDivElement>document.getElementById('homepage_link');

    (document.getElementById('i18n-language') as HTMLSpanElement).textContent = browser.i18n.getMessage('language_text');
    (document.getElementById('i18n-theme') as HTMLSpanElement).textContent = browser.i18n.getMessage('chatTheme');

    (document.getElementById('i18n-theme__dark') as HTMLOptionElement).textContent = browser.i18n.getMessage('i18n_theme__dark');
    (document.getElementById('i18n-theme__light') as HTMLOptionElement).textContent = browser.i18n.getMessage('i18n_theme__light');
    (document.getElementById('i18n-fontSize') as HTMLSpanElement).textContent = browser.i18n.getMessage('fontSize');
    (document.getElementById('i18n-fontSize__small') as HTMLOptionElement).textContent = browser.i18n.getMessage('fontSize_small');
    (document.getElementById('i18n-fontSize__default') as HTMLOptionElement).textContent = browser.i18n.getMessage('fontSize_default');
    (document.getElementById('i18n-fontSize__big') as HTMLOptionElement).textContent = browser.i18n.getMessage('fontSize_big');
    (document.getElementById('i18n-fontSize__bigger') as HTMLOptionElement).textContent = browser.i18n.getMessage('fontSize_bigger');
    (document.getElementById('i18n-position') as HTMLSpanElement).textContent = browser.i18n.getMessage('chatPosition');
    (document.getElementById('i18n-position__up') as HTMLOptionElement).textContent = browser.i18n.getMessage('chatPositionUp');
    (document.getElementById('i18n-position__down') as HTMLOptionElement).textContent = browser.i18n.getMessage('chatPositionDown');

    (document.getElementById('i18n-chat-display-method') as HTMLSpanElement).textContent = browser.i18n.getMessage('dispCopiedChatmethod');
    (document.getElementById('i18n-disp-method_ui') as HTMLOptionElement).textContent = browser.i18n.getMessage('method_twitchui');
    (document.getElementById('i18n-disp-method_client') as HTMLOptionElement).textContent = browser.i18n.getMessage('method_mini');

    add_filter_btn.textContent = browser.i18n.getMessage('p_filter_btn');
    save_chat_btn.textContent = browser.i18n.getMessage('p_save_chat_btn');
    web_version_btn.textContent = browser.i18n.getMessage('p_web_version_btn');
    review_link.textContent = browser.i18n.getMessage('review');
    support_link.textContent = browser.i18n.getMessage('support');
    homepage_link.textContent = browser.i18n.getMessage('homepage');
}

window.addEventListener('load', e => {
    localizeHtmlPage();
});
browser.storage.local.get(['position', 'theme', 'font_size', 'language', 'chatDisplayMethod', 'dev']).then(res => {
    (document.getElementById('select_language') as HTMLSelectElement).value = `language__${res.language}`;
    (document.getElementById('select_theme') as HTMLSelectElement).value = `theme__${res.theme}`;
    (document.getElementById('select_font-size') as HTMLSelectElement).value = res.font_size;
    (document.getElementById('select_chat-position') as HTMLSelectElement).value = res.position;
    (document.getElementById('select_disp-method') as HTMLSelectElement).value = res.chatDisplayMethod;
    dev = res.dev
    dev_checkbox.checked = res.dev;
    initOptionStatus(res.chatDisplayMethod);
});

document.getElementById('setting_container')?.addEventListener('change', e => {
    const target = <HTMLSelectElement>e.target;

    if (target.tagName !== 'SELECT') return;

    let changed = target.value;

    if (target.id === 'select_language') {
        changed = changed.substring(changed.lastIndexOf('_') + 1);
        browser.storage.local.set({ language: changed });
    } else if (target.id === 'select_theme') {
        changed = changed.substring(changed.lastIndexOf('_') + 1);
        browser.storage.local.set({ theme: changed });
    } else if (target.id === 'select_font-size') {
        browser.storage.local.set({ font_size: changed });
    } else if (target.id === 'select_chat-position') {
        browser.storage.local.set({ position: changed });
    } else if (target.id === 'select_disp-method') {
        const method: displayMethod = <displayMethod>changed;
        initOptionStatus(method);

        browser.storage.local.set({ chatDisplayMethod: changed });
    }
});

function initOptionStatus(method: displayMethod) {
    const disabled = method === 'method-twitchui';

    (document.getElementById('select_language') as HTMLSelectElement).disabled = disabled;
    (document.getElementById('select_theme') as HTMLSelectElement).disabled = disabled;
    (document.getElementById('select_font-size') as HTMLSelectElement).disabled = disabled;
    // (document.getElementById('save-chat') as HTMLButtonElement).disabled = disabled;
}
dev_checkbox.addEventListener('change', e=> {
    const target = <HTMLInputElement>e.target;

    dev = target.checked;
    browser.storage.local.set({dev: target.checked});
});
add_filter_btn.addEventListener('click', e => {
    if (dev) params.set('dev', 'true');
    browser.tabs.create({ url: `https://wtbc.bluewarn.dev/setting/filter?${params}` });
});
save_chat_btn.addEventListener('click', e => {
    if (dev) params.set('dev', 'true');
    browser.tabs.create({ url: `https://wtbc.bluewarn.dev/chat?${params}` });
});
web_version_btn.addEventListener('click', e=> {
    browser.tabs.create({ url: `https://wtbc.bluewarn.dev?from=ext_popup` });
});