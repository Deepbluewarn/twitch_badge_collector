(function () {

    let stream_page_observer: MutationObserver | undefined;
    let chat_room_observer: MutationObserver | undefined;
    let default_config: MutationObserverInit = { childList: true, subtree: true, attributeFilter: ["class"] };

    let currunt_url: string;
    let badge_setting = {};
    let container_ratio: number;

    let chatIsAtBottom = true;// chat auto scroll [on / off]

    const CLONE_CHAT_COUNT = 100;

    currunt_url = location.href;

    let observeDOM = (function () {

        let MutationObserver = window.MutationObserver;

        return function (obj: Element, config: Object, callback: MutationCallback) {

            if (!obj || obj.nodeType !== 1) return;

            if (MutationObserver) {
                let mutationObserver = new MutationObserver(callback);
                mutationObserver.observe(obj, config);
                return mutationObserver;
            }
        }
    })();

    chrome.storage.sync.get(['badge_setting'], function (result) {
        badge_setting = result.badge_setting;
    });

    chrome.storage.sync.get(['container_ratio'], function (result) {
        if (result.container_ratio) {
            container_ratio = parseInt(result.container_ratio);
        }
    });

    /**
     * Create chat window clone.
     */
    function Mirror_of_Erised() {
        const chat_room: Element | null = document.querySelector('.chat-room__content .chat-list--default');
        if (!chat_room) return false;

        let clone = chat_room.getElementsByClassName('scrollable-area clone')[0];
        if (chat_room.contains(clone)) return false;

        let room_origin = chat_room.getElementsByClassName('scrollable-area')[0];//original chat area.
        let room_clone = <HTMLElement>room_origin.cloneNode(true);

        // resize handle (drag bar)
        const resize_handle = document.createElement('div');
        resize_handle.classList.add('tbc_resize_handle');
        resize_handle.addEventListener('mousedown', startDrag);
        resize_handle.addEventListener('touchstart', startDrag);
        chat_room.firstChild?.appendChild(resize_handle);

        room_origin.classList.add('origin');
        //'chat_room' will has two 'scrollable-area' div elements. One is original chat area, second one is our cloned chat area.

        let scroll_area = room_clone.getElementsByClassName('simplebar-scroll-content')[0];

        scroll_area.addEventListener("scroll", function () {
            //사용자가 스크롤을 40 픽셀 이상 올렸을 때만 false 반환.
            //Return false only when the user raises the scroll by more than 40 pixels.
            chatIsAtBottom = scroll_area.scrollTop + scroll_area.clientHeight >= scroll_area.scrollHeight - 40;
        }, false);
        let message_container = room_clone.getElementsByClassName('chat-scrollable-area__message-container')[0];
        message_container.textContent = '';//remove all chat lines.

        room_clone.classList.add('clone');
        chat_room.firstChild?.appendChild(room_clone);
        //chat_room.appendChild(room_clone);

        change_container_ratio(container_ratio);
    }

    let StreamPageCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {

        let stream_chat: Element | undefined = document.getElementsByClassName('stream-chat')[0];

        if (!stream_chat) return;

        Mirror_of_Erised();
        observeChatRoom(stream_chat);

        if (stream_page_observer) stream_page_observer.disconnect();
    }

    let newChatCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {
        let room_clone: Element | null;
        let chat_clone: Element | null;
        let badges: HTMLCollection;
        let scroll_area: Element;
        let message_container: Element | null;

        const point_summary_className = 'community-points-summary';

        Array.from(mutationRecord).forEach(mr => {
            let addedNodes = mr.addedNodes;
            if (!addedNodes) return;
            addedNodes.forEach(node => {
                let nodeElement = <HTMLElement>node;
                //console.debug(nodeElement);
                //console.debug("nodeElement.className === 'chat-line__status' : " + nodeElement.className)
                //console.debug("nodeElement.getAttribute('data-a-target') === 'chat-welcome-message' : " + nodeElement.getAttribute('data-a-target'))

                if (!nodeElement || nodeElement.nodeType !== 1) return;

                // nodeElement 가 community-points-summary class 를 포함하거나 community-points-summary 의 자식 요소인 경우.
                let point_summary = <HTMLDivElement>(nodeElement.getElementsByClassName(point_summary_className)[0] || nodeElement.closest('.' + point_summary_className));
                let is_chat_msg = nodeElement.className === 'chat-line__message' && nodeElement.getAttribute('data-a-target') === 'chat-line-message';

                if (point_summary) {
                    let point_button = point_summary.children[1].getElementsByTagName('button')[0];

                    if (point_button) {
                        point_button.click();
                        console.log('points claimed, time : %o, channel_name : %o', new Date().toTimeString(), currunt_url);
                    }

                }

                if (is_chat_msg) {
                    let room_clone_parent = <Element>nodeElement.closest('.scrollable-area.origin')?.parentNode;
                    if(!room_clone_parent) return false; // nodeElement 가 .scrollable-area.origin 의 자식 요소가 아니면 return.
                    room_clone = room_clone_parent.getElementsByClassName('scrollable-area clone')[0];
                    if (!room_clone) return false;
                    
                    message_container = room_clone.getElementsByClassName('chat-scrollable-area__message-container')[0];
                    scroll_area = room_clone.getElementsByClassName('simplebar-scroll-content')[0];

                    chat_clone = <Element>nodeElement.cloneNode(true);

                    badges = chat_clone.getElementsByClassName('chat-badge');

                    Array.from(badges).some((badge) => {
                        let badge_uuid = new URL(badge.getAttribute('src')!).pathname.split('/')[3];

                        if (Object.values(badge_setting).includes(badge_uuid)) {

                            if (!(message_container && chat_clone)) return;
                            message_container.appendChild(chat_clone);
                            nodeElement.classList.add('tbc_highlight');

                            if (message_container.childElementCount > CLONE_CHAT_COUNT) {
                                message_container.removeChild(<Element>message_container.firstElementChild);
                            }
                            if (chatIsAtBottom) scroll_area.scrollTop = scroll_area.scrollHeight;
                        }
                    });
                } else if (nodeElement.classList.contains('chat-line__status') && nodeElement.getAttribute('data-a-target') === 'chat-welcome-message') {
                    //채팅방 재접속. (when re-connected to chat room)
                    Mirror_of_Erised();
                }
            });
        })
    }

    /**
     * 
     * @param target Element to be Observed
     * 
     */
    let observeStreamPage = function (target: Element = document.body) {
        if (stream_page_observer) {
            stream_page_observer.observe(target, default_config);
        } else {
            stream_page_observer = observeDOM(target, default_config, StreamPageCallback);
        }
    }

    let observeChatRoom = function (target: Element) {
        //observer 가 중복 할당 되는것을 방지. 두번 할당되면 채팅이 두번씩 올라오는 끔찍한 일이 벌어진다.
        if (chat_room_observer) {
            //chat-line__message class 는 observe 대상인 stream-chat class 의 direct child 가 아니기 때문에 subtree : true 이어야 한다.
            chat_room_observer.observe(target, default_config);
        } else {
            chat_room_observer = observeDOM(target, default_config, newChatCallback);
        }
    }

    let change_container_ratio = function (ratio: number) {
        if (ratio != 0) ratio = ratio ? ratio : 30;

        let original_container = <HTMLElement>document.getElementsByClassName('scrollable-area origin')[0];
        let clone_container = <HTMLElement>document.getElementsByClassName('scrollable-area clone')[0];

        if (!original_container || !clone_container) return;

        let orig_size = ratio === 0 ? 1 : (ratio === 10 ? 0 : 1);
        let clone_size = ratio === 0 ? 0 : (ratio === 10 ? 1 : 0);

        if (1 <= ratio && ratio <= 100) {
            clone_size = parseFloat((ratio * 0.01).toFixed(2));
            orig_size = parseFloat((1 - clone_size).toFixed(2));
        }

        original_container.style.flex = String(orig_size);
        clone_container.style.flex = String(clone_size);
    }

    let startDrag = function (e: MouseEvent | TouchEvent) {
        e.preventDefault();
        window.addEventListener('mousemove', doDrag);
        window.addEventListener('touchmove', doDrag);
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);
    }

    let doDrag = function (e: MouseEvent | TouchEvent) {
        const chat_room = document.querySelector('.chat-room__content .chat-list--default');
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        if (chat_room) {
            const rect = chat_room.getBoundingClientRect();
            let container_ratio = (1 - (clientY - rect.y) / rect.height) * 100;
            container_ratio = Math.max(0, Math.min(100, Math.round(container_ratio)));
            chrome.storage.sync.set({ container_ratio }, function () { });
        }
    }

    let endDrag = function () {
        window.removeEventListener('mousemove', doDrag);
        window.removeEventListener('touchmove', doDrag);
        window.removeEventListener('mouseup', endDrag);
        window.removeEventListener('touchend', endDrag);
    }

    observeStreamPage();

    chrome.storage.onChanged.addListener(function (changes, namespace) {

        //if (namespace != 'sync') return;

        for (var key in changes) {
            let newValue = changes[key].newValue;

            if (key === 'badge_setting') {
                badge_setting = newValue;
            } else if (key === 'container_ratio') {
                change_container_ratio(parseInt(newValue));
            }

        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === "onHistoryStateUpdated") {
            currunt_url = location.href;
            observeStreamPage();
        }
        sendResponse({ status: true })
        return true;
    });
})();







