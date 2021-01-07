"use strict";
(function () {
    let chat_room_observer;
    let chat_observer;
    let point_observer;
    let badge_list = [];
    let chatIsAtBottom = true;
    let observeDOM = (function () {
        let MutationObserver = window.MutationObserver;
        return function (obj, config, callback) {
            if (!obj || obj.nodeType !== 1) {
                return;
            }
            ;
            if (MutationObserver) {
                let mutationObserver = new MutationObserver(callback);
                mutationObserver.observe(obj, config);
                return mutationObserver;
            }
        };
    })();
    chrome.storage.local.get(['badge_list'], function (result) {
        badge_list = result.badge_list;
    });
    function setup() {
        const chat_room = document.querySelector('.chat-room__content .chat-list--default .tw-flex');
        if (chat_room) {
            let room_origin = chat_room.getElementsByClassName('scrollable-area')[0]; //original chat area.
            if (chat_room.contains(chat_room.getElementsByClassName('scrollable-area clone')[0])) {
                return false;
            }
            let room_clone = room_origin.cloneNode(true);
            room_origin.classList.add('origin');
            //'chat_room' will has two 'scrollable-area' div elements. One is original chat area, second one is our custom chat area.
            let scroll_area = room_clone.getElementsByClassName('simplebar-scroll-content')[0];
            let message_container = room_clone.getElementsByClassName('chat-scrollable-area__message-container')[0];
            message_container.textContent = ''; //remove all chat lines.
            let filter_chat_paused = document.createElement('button');
            filter_chat_paused.classList.add('filter_chat_paused');
            filter_chat_paused.innerText = '내려가기';
            room_clone.appendChild(filter_chat_paused);
            room_clone.classList.add('clone');
            chat_room.appendChild(room_clone);
            scroll_area.addEventListener("scroll", function () {
                chatIsAtBottom = scroll_area.scrollTop + scroll_area.clientHeight >= scroll_area.scrollHeight;
            }, false);
        }
    }
    let StreamChatChallback = function (mutationRecord) {
        let stream_chat = undefined;
        let point_textnode = undefined;
        try {
            point_textnode = document.getElementsByClassName('community-points-summary')[0].getElementsByClassName('tw-animated-number')[0];
            stream_chat = document.getElementsByClassName('stream-chat')[0];
        }
        catch (e) {
            //return;
        }
        if (stream_chat && point_textnode) {
            if (chat_room_observer) {
                chat_room_observer.disconnect();
            }
            setup();
            observeChatRoom(stream_chat);
            observeChannelPoint(point_textnode);
            return;
        }
    };
    //채팅창에서 새로운 채팅이 올라오면 분석 후 특정 채팅을 복사.
    let newChatCallback = function (mutationRecord) {
        let room_clone;
        let chat_clone;
        let badges;
        let scroll_area;
        let message_container;
        Array.from(mutationRecord).forEach(mr => {
            let addedNodes = mr.addedNodes;
            if (addedNodes) {
                addedNodes.forEach(node => {
                    var _a;
                    let nodeElement = node;
                    console.log('newChatCallback nodeElement : ', nodeElement);
                    let point_button;
                    try {
                        point_button = nodeElement.getElementsByClassName('tw-button--success')[0];
                    }
                    catch (e) {
                        return;
                    }
                    if (point_button) {
                        console.log('+50 points');
                        point_button.click();
                    }
                    if (nodeElement.className === 'chat-line__message' && nodeElement.getAttribute('data-a-target') === 'chat-line-message') {
                        room_clone = (_a = nodeElement.closest('.scrollable-area.origin')) === null || _a === void 0 ? void 0 : _a.parentNode;
                        if (!room_clone)
                            return;
                        room_clone = room_clone.getElementsByClassName('scrollable-area clone')[0];
                        message_container = room_clone.getElementsByClassName('chat-scrollable-area__message-container')[0];
                        scroll_area = room_clone.getElementsByClassName('simplebar-scroll-content')[0];
                        chat_clone = nodeElement.cloneNode(true);
                        badges = chat_clone.getElementsByClassName('chat-badge');
                        Array.from(badges).some((badge) => {
                            let alt = badge.getAttribute('alt');
                            if (badge_list.some(el => alt.includes(el))) {
                                if (message_container && chat_clone) {
                                    message_container.appendChild(chat_clone);
                                    if (message_container.childElementCount > 100) {
                                        message_container.removeChild(message_container.firstElementChild);
                                    }
                                }
                                if (chatIsAtBottom) {
                                    scroll_area.scrollTop = scroll_area.scrollHeight;
                                }
                            }
                            else {
                                return false;
                            }
                        });
                    }
                });
            }
        });
    };
    let PointChangeCallback = function (mutationRecord) {
        console.log('PointChangeCallback mutationRecord : ', mutationRecord);
        let point_button = document.getElementsByClassName('tw-button--success')[0];
        let point_textnode = document.getElementsByClassName('community-points-summary')[0].getElementsByClassName('tw-animated-number')[0];
        let point = mutationRecord[0].addedNodes[0];
        if (point_observer && point) {
            point_observer.disconnect();
            console.log('PointChangeCallback');
            setTimeout(() => {
                observeChannelPoint(point_textnode);
            }, 3000);
        }
        //wait 3-4 sec, re-observe point_observer, record point number.
        if (point_button) {
            console.log('+50 points');
            point_button.click();
        }
    };
    let observeStreamChat = function () {
        let doc = document.body || document.documentElement;
        if (chat_room_observer) {
            chat_room_observer.observe(doc, { childList: true, subtree: true, attributeFilter: ['class'] });
        }
        else {
            chat_room_observer = observeDOM(doc, { childList: true, subtree: true, attributeFilter: ['class'] }, StreamChatChallback);
        }
    };
    let observeChatRoom = function (target) {
        if (chat_observer) {
            chat_observer.observe(target, { childList: true, subtree: true });
        }
        else {
            chat_observer = observeDOM(target, { childList: true, subtree: true }, newChatCallback);
        }
    };
    let observeChannelPoint = function (target) {
        console.log("observeChannelPoint");
        if (point_observer) {
            point_observer.observe(target, { childList: true, subtree: true });
        }
        else {
            point_observer = observeDOM(target, { childList: true, subtree: true }, PointChangeCallback);
        }
    };
    let record_point_number = function (num) {
        chrome.runtime.sendMessage({ type: 'point', time: Date.now(), point: num });
    };
    record_point_number(555);
    observeStreamChat();
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        badge_list = changes.badge_list.newValue;
    });
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === "onHistoryStateUpdated") {
            observeStreamChat();
        }
    });
})();
