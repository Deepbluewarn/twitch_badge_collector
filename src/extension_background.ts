let gaNewElem: any = {};
let gaElems: any = {};
let USER_ID: string;
let GA_AGREEMENT = false;
const EXTENSION_VERSION = chrome.runtime.getManifest().version;


function getRandomString() {
    return Math.random().toString(36).substr(2,11);
}

function gaInit_background() {

    var currdate: any = new Date();
    var url = 'https://www.google-analytics.com/analytics.js';
    (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * currdate; a = s.createElement(o),
            m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
    })(window, document, 'script', url, 'ga', gaNewElem, gaElems);

    chrome.storage.sync.get('USER_ID', result=>{

        let res = result.USER_ID;

        if(res){
            USER_ID = res;
        }else{
            USER_ID = getRandomString();
            chrome.storage.sync.set({USER_ID});
        }
        ga('create', 'UA-194964708-5', 'auto', {
            userId : USER_ID
        }); // live
        // ga('create', 'UA-194964708-6', 'auto',{
        //     userId : USER_ID
        // }); // debug
        ga('set', 'checkProtocolTask', null);
        send_ga_event({ 'eventCategory': 'background', 'eventAction': 'onLoaded', 'eventLabel': GA_AGREEMENT});
    });
}

gaInit_background();

chrome.storage.sync.get('GA_AGREEMENT', result=>{
    GA_AGREEMENT = result.GA_AGREEMENT;
});

function send_ga_event(obj: any){
    let whitelist = ['onInstalled', 'onLoaded'].includes(obj.eventAction);
    if(!whitelist && !GA_AGREEMENT) return;
    let cat = obj.eventCategory

    try{
        obj.eventCategory = cat + '_' + EXTENSION_VERSION;
        console.debug(obj);
        ga('send', 'event', obj);
    }catch(e){
        console.debug(e); // ga undefined.
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ga_sendEvent') {
        send_ga_event(request.obj);
        sendResponse({ 'ga_sendEvent': 'done' });
    }
    return true;
});

chrome.runtime.onInstalled.addListener(function (reason: any) {

    const filter = [
        { filter_id: 'streamer', category: 'badge_uuid', filter_type: 'include', value: '5527c58c-fb7d-422d-b71b-f309dcb85cc1' },
        { filter_id: 'manager', category: 'badge_uuid', filter_type: 'include', value: '3267646d-33f0-4b17-b3df-f923a41db1d0' },
        { filter_id: 'vip', category: 'badge_uuid', filter_type: 'include', value: 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec' },
        { filter_id: 'verified', category: 'badge_uuid', filter_type: 'include', value: 'd12a2e27-16f6-41d0-ab77-b780518f00a3' }
    ]
    chrome.storage.local.set({ default_filter: filter }, function () { });
    chrome.storage.sync.set({ filter }, function () { });
    chrome.storage.local.set({ container_ratio: 30 }, function () { });

    //send_ga_event({ 'eventCategory': 'background', 'eventAction': 'onInstalled', 'eventLabel': EXTENSION_VERSION });
    send_ga_event({ 'eventCategory': 'background', 'eventAction': 'onInstalled', 'eventLabel': JSON.stringify(reason) });

});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    chrome.pageAction.show(tabId);
});

chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let id = tabs[0].id;
        let url = tabs[0].url;
        if (!(id && url)) return;
        chrome.storage.local.set({ current_url: url }, function () { });
        chrome.tabs.sendMessage(id, { action: "onHistoryStateUpdated", url: url }, function (response) {
        });
    });
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (var key in changes) {

        let newValue = changes[key].newValue;

        if (key === 'GA_AGREEMENT') {
            GA_AGREEMENT = newValue;
            //if(GA_AGREEMENT) gaInit_background();
        }

    }
});