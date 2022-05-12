import browser from "webextension-polyfill";
import { base_url } from "./const";

const version = chrome.runtime.getManifest().version;
type displayMethod = 'method-twitchui' | 'method-mini';
const dev_checkbox = <HTMLInputElement>document.getElementById('dev-checkbox');
const add_filter_btn = <HTMLSpanElement>document.getElementById('add_filter_btn');
const save_chat_btn = <HTMLSpanElement>document.getElementById('save-chat');

let dev = false;
const params = new URLSearchParams();
params.set('ext_version', version);

function localizeHtmlPage() {
    const review_link = <HTMLAnchorElement>document.getElementById('review_link');
    const support_link = <HTMLAnchorElement>document.getElementById('support_link');
    const discord_link = <HTMLAnchorElement>document.getElementById('discord_link');

    (document.getElementById('i18n-general-setting') as HTMLSpanElement).textContent = browser.i18n.getMessage('generalSetting');
    (document.getElementById('i18n-chat-client-setting') as HTMLSpanElement).textContent = browser.i18n.getMessage('chatClientSetting');
    (document.getElementById('i18n-etc-setting') as HTMLSpanElement).textContent = browser.i18n.getMessage('extraSetting');

    (document.getElementById('i18n-language') as HTMLSpanElement).textContent = browser.i18n.getMessage('language_text');
    (document.getElementById('i18n-theme') as HTMLSpanElement).textContent = browser.i18n.getMessage('chatTheme');

    (document.getElementById('i18n-theme__auto') as HTMLOptionElement).textContent = browser.i18n.getMessage('i18n_theme_auto');
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

    (document.getElementById('i18n-point-auto-click') as HTMLSpanElement).textContent = browser.i18n.getMessage('pointBoxAutoClick');
    (document.getElementById('i18n-pointBox-method_on') as HTMLSpanElement).textContent = browser.i18n.getMessage('on');
    (document.getElementById('i18n-pointBox-method_off') as HTMLSpanElement).textContent = browser.i18n.getMessage('off');

    (document.getElementById('i18n-chat-display-method') as HTMLSpanElement).textContent = browser.i18n.getMessage('dispCopiedChatmethod');
    (document.getElementById('i18n-disp-method_ui') as HTMLOptionElement).textContent = browser.i18n.getMessage('method_twitchui');
    (document.getElementById('i18n-disp-method_client') as HTMLOptionElement).textContent = browser.i18n.getMessage('method_mini');

    (document.getElementById('i18n-replay-setting') as HTMLSpanElement).textContent = browser.i18n.getMessage('replay_chat_settings');
    (document.getElementById('i18n-replay-chat-size-setting') as HTMLSpanElement).textContent = browser.i18n.getMessage('chat_window_size_setting');

    (document.getElementById('add_filter_btn_text') as HTMLSpanElement).textContent = browser.i18n.getMessage('p_filter_btn');
    (document.getElementById('save-chat_text') as HTMLSpanElement).textContent = browser.i18n.getMessage('p_save_chat_btn');
    
    review_link.textContent = browser.i18n.getMessage('review');
    support_link.textContent = browser.i18n.getMessage('support');
    discord_link.textContent = browser.i18n.getMessage('discord');
}

window.addEventListener('load', e => {
    localizeHtmlPage();
});
browser.storage.local.get(['position', 'theme', 'font_size', 'language', 'chatDisplayMethod', 'pointBox_auto', 'replayChatSize', 'dev']).then(res => {
    (document.getElementById('select_language') as HTMLSelectElement).value = `language__${res.language}`;
    (document.getElementById('select_theme') as HTMLSelectElement).value = `theme__${res.theme}`;
    (document.getElementById('select_font-size') as HTMLSelectElement).value = res.font_size;
    (document.getElementById('select_chat-position') as HTMLSelectElement).value = res.position;
    (document.getElementById('select_disp-method') as HTMLSelectElement).value = res.chatDisplayMethod;
    (document.getElementById('select_pointBox-method') as HTMLSelectElement).value = res.pointBox_auto;
    (document.getElementById('input_replay-chat-size') as HTMLInputElement).value = res.replayChatSize;

    dev = res.dev;
    dev_checkbox.checked = res.dev;
    initOptionStatus(res.chatDisplayMethod);
});

document.getElementById('setting_container')?.addEventListener('change', e => {
    const target = <HTMLSelectElement>e.target;
    let changed = target.value;

    if(target.tagName === 'INPUT'){
        if(target.id === 'input_replay-chat-size'){
            browser.storage.local.set({ replayChatSize: changed });
        }
    }

    if (target.tagName !== 'SELECT') return;

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
        initOptionStatus(changed as displayMethod);
        browser.storage.local.set({ chatDisplayMethod: changed });
    } else if (target.id === 'select_pointBox-method') {
        browser.storage.local.set({ pointBox_auto : changed });
    }
});

function initOptionStatus(method: displayMethod) {
    const disabled = method === 'method-twitchui';

    (document.getElementById('select_language') as HTMLSelectElement).disabled = disabled;
    (document.getElementById('select_theme') as HTMLSelectElement).disabled = disabled;
    (document.getElementById('select_font-size') as HTMLSelectElement).disabled = disabled;
}
dev_checkbox.addEventListener('change', e=> {
    const target = <HTMLInputElement>e.target;

    dev = target.checked;
    browser.storage.local.set({dev: target.checked});
});
add_filter_btn.addEventListener('click', e => {
    if (dev) params.set('dev', 'true');
    browser.tabs.create({ url: `${base_url}setting/filter?${params}` });
});
save_chat_btn.addEventListener('click', e => {
    if (dev) params.set('dev', 'true');
    browser.tabs.create({ url: `${base_url}chat?${params}` });
});