(function () {
    let stream_page_observer: MutationObserver | undefined;
    let chat_room_observer: MutationObserver | undefined;
    let default_config: MutationObserverInit = { childList: true, subtree: true, attributeFilter: ["class"] };

    let currunt_url: string;
    //let badge_setting = {};
    let filter = {};
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

    // chrome.storage.local.get(['badge_setting'], function (result) {
    //     badge_setting = result.badge_setting;
    // });
    chrome.storage.sync.get(['filter'], function (result) {
        filter = result.filter;
    });

    chrome.storage.local.get(['container_ratio'], function (result) {
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

    function add_chat(origNodeElement: HTMLElement, chat_clone: Element, scroll_area: Element, message_container: Element) {
        if (!(message_container && chat_clone)) return;

        message_container.appendChild(chat_clone);
        origNodeElement.classList.add('tbc_highlight');

        if (message_container.childElementCount > CLONE_CHAT_COUNT) {
            message_container.removeChild(<Element>message_container.firstElementChild);
        }

        if (chatIsAtBottom) scroll_area.scrollTop = scroll_area.scrollHeight;
    }

    let StreamPageCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {

        let stream_chat: Element | undefined = document.getElementsByClassName('stream-chat')[0];

        if (!stream_chat) return;

        Mirror_of_Erised();
        observeChatRoom(stream_chat);

        if (stream_page_observer) stream_page_observer.disconnect();
    }

    let newChatCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {
        let room_clone: Element;
        let chat_clone: Element;
        let badges: HTMLCollection;
        let scroll_area: Element;
        let message_container: Element;

        const point_summary_className = 'community-points-summary';

        Array.from(mutationRecord).forEach(mr => {
            let addedNodes = mr.addedNodes;
            if (!addedNodes) return;
            addedNodes.forEach(node => {
                let nodeElement = <HTMLElement>node;

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
                    if (!room_clone_parent) return false; // nodeElement 가 .scrollable-area.origin 의 자식 요소가 아니면 return.
                    room_clone = room_clone_parent.getElementsByClassName('scrollable-area clone')[0];
                    if (!room_clone) return false;

                    message_container = room_clone.getElementsByClassName('chat-scrollable-area__message-container')[0];
                    scroll_area = room_clone.getElementsByClassName('simplebar-scroll-content')[0];

                    chat_clone = <Element>nodeElement.cloneNode(true);

                    let display_name = chat_clone.getElementsByClassName('chat-author__display-name')[0];
                    let login_name = display_name.getAttribute('data-a-user');
                    let nickname = display_name.textContent;

                    badges = chat_clone.getElementsByClassName('chat-badge');

                    let filter_arr = Object.keys(filter).map(el => filter[el]);

                    let id_include = filter_arr.filter(el => ((el.value === login_name) || el.value === nickname) && (el.filter_type === 'include'));
                    let id_exclude = filter_arr.filter(el => ((el.value === login_name) || el.value === nickname) && (el.filter_type === 'exclude'));
                    let id_available = ((id_include.length != 0) && (id_exclude.length === 0));

                    let badge_checked = false;

                    Array.from(badges).some((badge, index) => {
                        let badges_len = badges.length;
                        let badge_uuid = new URL(badge.getAttribute('src')!).pathname.split('/')[3];

                        let badge_include = filter_arr.filter(el => (el.value === badge_uuid) && el.filter_type === 'include');

                        // 빈 배열을 반환할 경우 제외 대상이 아니라는 의미. 배열에 값이 있는 경우 해당 배지는 제외 대상.
                        let badge_exclude = filter_arr.filter(el => (el.value === badge_uuid) && el.filter_type === 'exclude');

                        let condition_exclude = badge_exclude.length > 0 || id_exclude.length > 0; // 배지 또는 아이디가 제외 대상인 경우 true.
                        let condition_include = badge_include.length === 0 && id_include.length === 0; // 배지 또는 아이디 둘 다 포함되지 않는 경우 true.
                        let condition_success = badge_include.length > 0 || id_include.length > 0;

                        // include 에 없거나 exclude 에 있는 경우
                        if(condition_include || condition_exclude){
                            if(badges_len > index + 1) return false; // 모든 배지를 검사하지 않은 경우에는 false.
                            return true;
                        }
                        if(condition_success){
                            add_chat(nodeElement, chat_clone, scroll_area, message_container);
                            badge_checked = true;
                            return true;
                        }
                    });
                    if(badge_checked && id_available){
                        add_chat(nodeElement, chat_clone, scroll_area, message_container);
                    }
                    
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
            chrome.storage.local.set({ container_ratio }, function () { });
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

        //if (namespace != 'local') return;

        for (var key in changes) {
            let newValue = changes[key].newValue;

            if (key === 'filter') {
                filter = newValue;
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