
const msg_id = Math.random().toString(36).substring(2,12);
const filterChannel = new BroadcastChannel('Filter');

chrome.storage.sync.get('filter', result => {
    const filter = result.filter;
    result.from = 'tbc';
    result.to = ['wtbc-main', 'wtbc-filter', 'wtbc-mini'];
    result.msg_id = msg_id;

    if(filter){
        filterChannel.postMessage(result);
    }
});

filterChannel.onmessage = event => {
    if(event.data.from === 'wtbc-filter' && event.data.to.includes('tbc')){
        if(event.data.msg_id !== msg_id){
            return;
        }
        chrome.storage.sync.set({filter : Array.from(event.data.filter)});
    }
}

