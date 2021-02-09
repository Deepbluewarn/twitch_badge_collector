(function () {
    let chat_room_observer: MutationObserver | undefined;
    let chat_observer: MutationObserver | undefined;
    let currunt_url: string;
    let badge_list: string[] = [];
    let container_ratio_default: number;
    let container_ratio: number;
    let Invisibility_cloak = true; //for hidden follow button.
    let chatIsAtBottom = true;

    currunt_url = location.href;

    let observeDOM = (function () {

        let MutationObserver = window.MutationObserver;

        return function (obj: Element, config: Object, callback: MutationCallback) {

            if (!obj || obj.nodeType !== 1) {
                return;
            };

            if (MutationObserver) {
                let mutationObserver = new MutationObserver(callback)
                mutationObserver.observe(obj, config);
                return mutationObserver;
            }
        }
    })();

    chrome.storage.local.get(['badge_list'], function(result) {
        badge_list = result.badge_list;
    });
    
    chrome.storage.local.get(['container_ratio'], function(result){
        if(result.container_ratio){
            container_ratio = parseInt(result.container_ratio);
        }
    });

    chrome.storage.local.get(['follow_button_visibility'], function(result){
        Invisibility_cloak = result.follow_button_visibility;
    });

    function Mirror_of_Erised() {
        const chat_room: Element | null = document.querySelector('.chat-room__content .chat-list--default .tw-flex');

        if (chat_room) {

            let room_origin = chat_room.getElementsByClassName('scrollable-area')[0];//original chat area.

            if (chat_room.contains(chat_room.getElementsByClassName('scrollable-area clone')[0])) {
                return false;
            }

            let room_clone = <HTMLElement>room_origin.cloneNode(true);
            room_origin.classList.add('origin');
            //'chat_room' will has two 'scrollable-area' div elements. One is original chat area, second one is our cloned chat area.

            let scroll_area = room_clone.getElementsByClassName('simplebar-scroll-content')[0];

            scroll_area.addEventListener("scroll", function () {
                chatIsAtBottom = scroll_area.scrollTop + scroll_area.clientHeight >= scroll_area.scrollHeight;
            }, false);

            let message_container = room_clone.getElementsByClassName('chat-scrollable-area__message-container')[0];
            message_container.textContent = '';//remove all chat lines.

            room_clone.classList.add('clone');
            chat_room.appendChild(room_clone);
            change_container_ratio(container_ratio);
        }
    }

    let StreamPageCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {
        let stream_chat: Element | undefined = undefined;
        let point_button: HTMLButtonElement | undefined = undefined;
        let follow_div: HTMLButtonElement | undefined = undefined;
        try {
            stream_chat = document.getElementsByClassName('stream-chat')[0];
            point_button = <HTMLButtonElement>stream_chat.getElementsByClassName('tw-button--success')[0];
            follow_div = <HTMLButtonElement>document.getElementsByClassName('follow-btn__follow-btn')[0];
        } catch (e) {

        }
        if (point_button) {
            console.log('+50 points, time : %o, channel_name : %o', new Date().toTimeString(), currunt_url);
            point_button.click();
        }
        if (stream_chat && follow_div) {
            if (chat_room_observer) {
                chat_room_observer.disconnect();
            }
            follow_div.style.visibility = Invisibility_cloak ? 'hidden' : 'visible';
            Mirror_of_Erised();
            observeChatRoom(stream_chat);
            observeStreamPage(stream_chat, { childList: true, subtree: false });
            return;
        }
    }

    //채팅창에서 새로운 채팅이 올라오면 분석 후 특정 채팅을 복사.
    let newChatCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {
        let room_clone: Element | null;
        let chat_clone: Element | null;
        let badges: HTMLCollection;
        let scroll_area: Element;
        let message_container: Element | null;

        Array.from(mutationRecord).forEach(mr => {
            let addedNodes = mr.addedNodes;
            if (addedNodes) {
                addedNodes.forEach(node => {

                    let nodeElement: HTMLElement = <HTMLElement>node;
                    let point_button: HTMLButtonElement;

                    try {
                        point_button = <HTMLButtonElement>nodeElement.getElementsByClassName('tw-button--success')[0];
                        point_button.click();
                        console.log('+50 points, time : %o, channel_name : %o', new Date().toTimeString(), currunt_url);
                    } catch (e) {

                    }

                    if (nodeElement.className === 'chat-line__message' && nodeElement.getAttribute('data-a-target') === 'chat-line-message') {

                        room_clone = <Element>nodeElement.closest('.scrollable-area.origin')?.parentNode;
                        if (!room_clone) return;
                        room_clone = room_clone.getElementsByClassName('scrollable-area clone')[0];

                        message_container = room_clone.getElementsByClassName('chat-scrollable-area__message-container')[0];

                        scroll_area = room_clone.getElementsByClassName('simplebar-scroll-content')[0];

                        chat_clone = <Element>nodeElement.cloneNode(true);

                        chat_clone.addEventListener('click', mc => {
                            let target: HTMLElement = <HTMLElement>mc.target;
                            if (target.classList.contains('chat-author__display-name')) {
                                nodeElement.scrollIntoView();
                            }
                        })


                        badges = chat_clone.getElementsByClassName('chat-badge');

                        Array.from(badges).some((badge) => {
                            let alt = badge.getAttribute('alt')!;

                            if (badge_list.some(el => alt.includes(el))) {

                                if (message_container && chat_clone) {
                                    message_container.appendChild(chat_clone);
                                    nodeElement.classList.add('tbc_highlight');

                                    if (message_container.childElementCount > 100) {
                                        message_container.removeChild(<Element>message_container.firstElementChild);
                                    }

                                }

                                if (chatIsAtBottom) {
                                    scroll_area.scrollTop = scroll_area.scrollHeight;
                                }

                            } else {
                                return false;
                            }
                        });
                    }
                })
            }
        })
    }

    let observeStreamPage = function (target: Element, config?: MutationObserverInit) {
        let default_config: MutationObserverInit = { childList: true, subtree: true, attributeFilter: ['class'] };
        if (config) {
            default_config = config;
        }
        if (chat_room_observer) {
            chat_room_observer.observe(target, default_config);
        } else {
            chat_room_observer = observeDOM(target, default_config, StreamPageCallback);
        }
    }

    let observeChatRoom = function (target: Element) {
        if (chat_observer) {
            chat_observer.observe(target, { childList: true, subtree: true });
        } else {
            chat_observer = observeDOM(target, { childList: true, subtree: true }, newChatCallback);
        }
    }

    let change_container_ratio = function (ratio: number) {

        ratio = ratio ? ratio : container_ratio_default;

        let original_container = <HTMLElement>document.getElementsByClassName('scrollable-area origin')[0];
        let clone_container = <HTMLElement>document.getElementsByClassName('scrollable-area clone')[0];

        if(!original_container || !clone_container){
            return;
        }

        let orig_size = ratio === 0 ? 1 : (ratio === 10 ? 0 : 1);
        let clone_size = ratio === 0 ? 0 : (ratio === 10 ? 1 : 0);

        if (1 <= ratio && ratio <= 100) {
            clone_size = parseFloat((ratio * 0.01).toFixed(2));
            orig_size = parseFloat((1 - clone_size).toFixed(2));
        }

        original_container.style.flex = String(orig_size);
        clone_container.style.flex = String(clone_size);
    }

    let set_visibility = function () {
        let follow_div = <HTMLButtonElement>document.getElementsByClassName('follow-btn__follow-btn')[0];
        follow_div.style.visibility = Invisibility_cloak ? 'hidden' : 'visible';
    }

    observeStreamPage(document.body || document.documentElement);

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (var key in changes) {
            if(namespace === 'local'){
                let storageChange = changes[key];
                if(key === 'badge_list'){
                    badge_list = storageChange.newValue;
                }else if(key === 'container_ratio'){
                    container_ratio = parseInt(storageChange.newValue);
                    console.log('onChanged : container_ratio : %o', container_ratio);
                    change_container_ratio(container_ratio);
                }else if(key === 'container_ratio_default'){
                    container_ratio_default = parseInt(storageChange.newValue);
                }
                else if(key === 'follow_button_visibility'){
                    Invisibility_cloak = storageChange.newValue;
                    set_visibility();
                }
            }
        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === "onHistoryStateUpdated") {
            currunt_url = location.href;
            observeStreamPage(document.body || document.documentElement);
        }
        return true;
    });

})();







