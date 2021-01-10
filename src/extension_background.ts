chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.set({ badge_list: ['스트리머','매니저','VIP','인증 완료'], badge_setting: ['streamer','manager','vip','verified'] }, function(){
        console.log('Default value is set.')
    });
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostEquals: 'www.twitch.tv', schemes: ['https'] },
                    })
                ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }
        ]);
    });
});

chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        let id : number | undefined = tabs[0].id;
        if(id){
            chrome.tabs.sendMessage(id, {action: "onHistoryStateUpdated"}, function(response) {
                
            }); 
        }
    });
});