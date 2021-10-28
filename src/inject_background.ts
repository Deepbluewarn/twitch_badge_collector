(function () {
    let stream_page_observer: MutationObserver | undefined;
    let chat_room_observer: MutationObserver | undefined;
    let default_config: MutationObserverInit = { childList: true, subtree: true, attributeFilter: ["class"] };

    let currunt_url: string;
    let filter = new Map();
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

    chrome.storage.sync.get(['filter'], function (result) {
        filter = new Map(result.filter);
    });

    chrome.storage.local.get(['container_ratio'], function (result) {
        if (result.container_ratio) {
            container_ratio = parseInt(result.container_ratio);
        }
    });

    function get_chat_room(){
        // 채팅창 폰트 크기 변경 시 css class 이름이 변경되어 element 를 찾을 수 없음. (chat-list--default, chat-list--other)
        const chat_room_default: Element | null = document.querySelector('.chat-room__content .chat-list--default'); // for default font size
        const chat_room_other: Element | null = document.querySelector('.chat-room__content .chat-list--other'); // for default font size
        return chat_room_default ? chat_room_default : chat_room_other;
    }

    /**
     * Create chat window clone.
     */
    function Mirror_of_Erised() {
        const chat_room = get_chat_room();
        if (!chat_room) return false;

        let clone = chat_room.getElementsByClassName('scrollable-area clone')[0];
        if (chat_room.contains(clone)) return false;

        let room_origin = chat_room.getElementsByClassName('scrollable-area')[0];//original chat area.
        let room_clone = <HTMLElement>room_origin.cloneNode(true);

        // resize handle (drag bar)
        const handle_container = document.createElement('div');
        const resize_handle = document.createElement('div');
        handle_container.classList.add('handle_container');
        resize_handle.classList.add('tbc_resize_handle');
        handle_container.addEventListener('mousedown', startDrag);
        handle_container.addEventListener('touchstart', startDrag);
        handle_container.appendChild(resize_handle);
        chat_room.firstChild?.appendChild(handle_container);

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

        change_container_ratio(container_ratio);
    }

    function add_chat(origNodeElement: HTMLElement, chat_clone: Element, scroll_area: Element, message_container: Element, filter_category: string) {
        if (!(message_container && chat_clone)) return;

        message_container.appendChild(chat_clone);
        
        if(filter_category === 'login_name'){
            origNodeElement.classList.add('tbc_highlight_login_name');
        }else if(filter_category === 'keyword'){
            origNodeElement.classList.add('tbc_highlight_keyword');
        }else{
            origNodeElement.classList.add('tbc_highlight'); // default
        }

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
        let text_contents: HTMLCollection;
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

                const is_chat = nodeElement.closest('.chat-scrollable-area__message-container');

                if (point_summary) {
                    let point_button = point_summary.children[1].getElementsByTagName('button')[0];

                    if (point_button) {
                        point_button.click();
                        console.log('TBC - points claimed, time : %o, channel_name : %o', new Date().toTimeString(), currunt_url);
                    }
                }

                if (is_chat) {
                    let room_clone_parent = <Element>nodeElement.closest('.scrollable-area.origin')?.parentNode;
                    if (!room_clone_parent) return false; // nodeElement 가 .scrollable-area.origin 의 자식 요소가 아니면 return.
                    room_clone = room_clone_parent.getElementsByClassName('scrollable-area clone')[0];
                    if (!room_clone) return false;

                    message_container = room_clone.getElementsByClassName('chat-scrollable-area__message-container')[0];
                    scroll_area = room_clone.getElementsByClassName('simplebar-scroll-content')[0];

                    chat_clone = <Element>nodeElement.cloneNode(true);

                    let display_name = chat_clone.getElementsByClassName('chat-author__display-name')[0];
                    let chatter_name = chat_clone.getElementsByClassName('intl-login')[0];

                    if(!display_name && !chatter_name) return;
                    
                    let login_name: string = '';
                    let nickname: string = '';
                    let sub_login_name: string = '';
                    let sub_nickname: string = '';

                    if(display_name){
                        login_name = <string>display_name.getAttribute('data-a-user')?.toLowerCase();
                        nickname = <string>display_name.textContent?.toLowerCase();
                    }
                    if(chatter_name){
                        sub_login_name = <string>chatter_name.textContent;
                        sub_login_name = sub_login_name.substring(1, sub_login_name.length - 1);
                        sub_nickname = <string>chatter_name.parentNode?.childNodes[0].textContent;
                    }

                    login_name = login_name ? login_name : sub_login_name;
                    nickname = nickname ? nickname : sub_nickname;

                    text_contents = chat_clone.getElementsByClassName('text-fragment');

                    badges = chat_clone.getElementsByClassName('chat-badge');

                    let badge_priority = new Map();
                    let bp_res: string[] = [];
                    // badge_priority.set('login_name', false);
                    // badge_priority.set('nickname', false);
                    // badge_priority.set('badge_uuid', false);
                    // badge_priority.set('keyword', false);

                    // TODO :: 제외 필터를 우선으로 함. 
                    // 카테고리가 같은 필터가 [포함, 제외] 두가지로 존재하는 경우 제외 필터를 최우선으로 적용함.
                    
                    // Check with Nickname Filter.
                    let login_res = checkFilter('login_name', login_name, true);
                    let nick_res = checkFilter('login_name', nickname, true);
                    badge_priority.set('login_name', login_res);
                    badge_priority.set('nickname', nick_res);
                    
                    // Check with Badge Filter.
                    Array.from(badges).some((badge, index) => {
                        let badge_uuid = new URL(badge.getAttribute('src')!).pathname.split('/')[3];

                        let res = checkFilter('badge_uuid', badge_uuid, true);
                        bp_res.push(res);
                    });

                    badge_priority.set('badge_uuid', select_cf_result(bp_res));

                    // Check with Keyword Filter.
                    bp_res = [];
                    Array.from(text_contents).some((text, index)=>{

                        let keyword = text.textContent;
                        if(!keyword) return true;

                        let res = checkFilter('keyword', keyword, false);
                        bp_res.push(res);
                    });
                    badge_priority.set('keyword', select_cf_result(bp_res));

                    for(const[k, v] of badge_priority){
                        if(v === 'FILTER_NOT_FOUND') continue;
                        if(v === 'FILTER_INCLUDE'){
                            add_chat(nodeElement, chat_clone, scroll_area, message_container, k);
                        }
                        break;
                    }
                }
                if (nodeElement.classList.contains('chat-line__status') && nodeElement.getAttribute('data-a-target') === 'chat-welcome-message') {
                    //채팅방 재접속. (when re-connected to chat room)
                    Mirror_of_Erised();
                }
            });
        })
    }

    /**
     * 
     * @param category 필터 카테고리.
     * @param value 필터에서 찾고자 하는 값.
     * @returns 필터의 Category 와 Value 에 맞는 필터 중 filter_type 이 include 이면서 동시에 exclude 인 경우가 없으면 true 반환.
     */
    function checkFilter(category: string, value: string, match: boolean){
        let _filter = Array.from(filter.values());
        let filter_arr = Object.keys(_filter).map(el => _filter[el]).filter(f => f.category === category && f.filter_type != 'sleep');
    
        let include, exclude;

        if(match){
            include = filter_arr.filter(el => (el.value === value) && (el.filter_type === 'include'));
            exclude = filter_arr.filter(el => (el.value === value) && (el.filter_type === 'exclude'));
        }else{
            include = filter_arr.filter(el => value.toLowerCase().includes(el.value.toLowerCase()) && el.filter_type === 'include');
            exclude = filter_arr.filter(el => value.toLowerCase().includes(el.value.toLowerCase()) && el.filter_type === 'exclude');
        }

        let i_len = include.length;
        let e_len = exclude.length;

        if(i_len === 0 && e_len === 0){
            return 'FILTER_NOT_FOUND'
        }else if(i_len != 0 && e_len === 0){
            return 'FILTER_INCLUDE';
        }else{
            return 'FILTER_EXCLUDE';
        }
    }

    function select_cf_result(bp_res: string[]) {

        if(bp_res.length === 0) return 'FILTER_NOT_FOUND';

        let f_ex_inc = bp_res.includes('FILTER_EXCLUDE');
        let f_in_inc = bp_res.includes('FILTER_INCLUDE');
        let f_nf_inc = bp_res.includes('FILTER_NOT_FOUND');

        if (f_ex_inc) {
            return 'FILTER_EXCLUDE';
        } else if (!f_ex_inc && f_in_inc) {
            return 'FILTER_INCLUDE';
        } else if (!f_ex_inc && !f_in_inc && f_nf_inc) {
            return 'FILTER_NOT_FOUND';
        }
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
            chat_room_observer.observe(target, default_config);
        } else {
            chat_room_observer = observeDOM(target, default_config, newChatCallback);
        }
    }

    /**
     * 
     * @param ratio 0 부터 100 사이의 값, 복제된 채팅창의 크기 비율입니다.
     * @returns 
     */
    let change_container_ratio = function (ratio: number) {
        if (ratio != 0) ratio = ratio ? ratio : 30;
        container_ratio = ratio;

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

        const chat_room = get_chat_room();
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

    // setTimeout(e=>{
    //     observeStreamPage();
    // }, 10000);
    observeStreamPage();

    chrome.storage.onChanged.addListener(function (changes) {
        for (var key in changes) {
            let newValue = changes[key].newValue;

            if (key === 'filter') {
                filter = new Map(newValue);
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