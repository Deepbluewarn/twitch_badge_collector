import browser from "webextension-polyfill";

const msg_id = Math.random().toString(36).substring(2,12);
const filterChannel = new BroadcastChannel('Filter');

browser.storage.sync.get('filter').then(result => {
    const msg = {
        filter : result.filter,
        from : 'tbc',
        to : ['wtbc-main', 'wtbc-filter', 'wtbc-mini'],
        msg_id : msg_id
    };

    if(result.filter){
        filterChannel.postMessage(msg);
    }
});

filterChannel.addEventListener('message', event => {
    if(event.data.from === 'wtbc-filter' && event.data.to.includes('tbc')){
        if(event.data.msg_id !== msg_id) return;
        browser.storage.sync.set({filter : Array.from(event.data.filter)});
    }
});