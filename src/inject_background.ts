//import * as _ from "lodash"
(function () {
    let chat_room_observer: MutationObserver | undefined;
    let chat_observer: MutationObserver | undefined;

    let badge_list: string[] = [];
    let chatIsAtBottom = true;

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

    chrome.storage.local.get(['badge_list'], function (result) {
        badge_list = result.badge_list;
    });

    function Mirror_of_Erised() {
        const chat_room: Element | null = document.querySelector('.chat-room__content .chat-list--default .tw-flex');

        if (chat_room) {
            /*let frame = document.createElement('iframe');
            frame.src = 'https://www.twitch.tv/popout/2chamcham2/chat?popout=';
            chat_room.appendChild(frame);*/

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
        }
    }

    let StreamPageCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {
        let stream_chat: Element | undefined = undefined;
        let point_button: HTMLButtonElement | undefined = undefined;

        try {
            stream_chat = document.getElementsByClassName('stream-chat')[0];
            point_button = <HTMLButtonElement>stream_chat.getElementsByClassName('tw-button--success')[0];
        } catch (e) {

        }

        if (point_button) {
            console.log('+50 points, time : ', new Date().toTimeString());
            point_button.click();
        }
        if (stream_chat) {
            if (chat_room_observer) {
                chat_room_observer.disconnect();
            }
            Mirror_of_Erised();
            observeChatRoom(stream_chat);
            observeStreamPage(stream_chat, { childList: true, subtree: false });
            return;
        }
    }

    //채팅창에서 새로운 채팅이 올라오면 분석 후 특정 채팅을 복사.
    let newChatCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {
        let chat_room: JQuery<Node> | null;
        let room_clone: JQuery<Node> | null;
        let chat_clone: JQuery<Node> | null;
        let chat_clone_wrapper: Element | null;
        let badges: JQuery<HTMLElement>;
        let scroll_area: JQuery<HTMLElement> | null;
        let message_container: JQuery<HTMLElement> | null;
    
        Array.from(mutationRecord).forEach(mr => {
            let addedNodes = mr.addedNodes;
            
            if (addedNodes) {
                addedNodes.forEach(node => {
    
                    //let nodeElement: HTMLElement = <HTMLElement>node;
                    let nodeElement = $(node);
                    //console.log('newChatCallback nodeElement : ', nodeElement);
                    let point_button: HTMLButtonElement;
    
                    try {
                        point_button = <HTMLButtonElement>nodeElement.find('tw-button--success')[0];
                        point_button.click();
                        console.log('+50 points, time : ', new Date().toTimeString());
                    } catch (e) {
    
                    }

                    if (nodeElement.hasClass('chat-line__message') && nodeElement.attr('data-a-target') === 'chat-line-message') {
    
                        chat_room = nodeElement.closest('.scrollable-area.origin').parent();
                        if (!chat_room){
                            
                            return;
                        }
                        room_clone = chat_room.find('.scrollable-area.clone');
    
                        message_container = room_clone.find('.chat-scrollable-area__message-container');
                        console.log('message_container : %o, room_clone : %o', message_container, room_clone);
                        scroll_area = room_clone.find('.simplebar-scroll-content');
    
                        chat_clone = nodeElement.clone(true, true);
                        //let temp = <unknown>$(nodeElement).clone(true, true);
                        //chat_clone = nodeElement.clone(true, true);
    
                        badges = chat_clone.find('.chat-badge');
                        
                        Array.from(badges).some((badge) => {
                            
                            let alt = badge.getAttribute('alt')!;
                            console.log('badge_list : ', badge_list);
                            if (badge_list.some(el => alt.includes(el))) {
                                if (message_container && chat_clone) {
                                    
                                    chat_clone.appendTo(message_container);
                                    nodeElement.addClass('tbc_highlight');
    
                                    if (message_container.length > 100) {
                                        message_container.first().remove();
                                    }
    
                                }
                                if (chatIsAtBottom && scroll_area) {
                                    scroll_area.scrollTop(scroll_area.prop('scrollHeight'));
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


    observeStreamPage(document.body || document.documentElement);

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        badge_list = changes.badge_list.newValue;
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === "onHistoryStateUpdated") {
            observeStreamPage(document.body || document.documentElement);
        }
    });

})();







