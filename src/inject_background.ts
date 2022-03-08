(function () {
    let stream_page_observer: MutationObserver | undefined;
    let chat_room_observer: MutationObserver | undefined;
    let default_config: MutationObserverInit = { childList: true, subtree: true, attributeFilter: ["class"] };

    let original_container: HTMLDivElement;
    let handle_container: HTMLDivElement;
    let frame: HTMLIFrameElement;

    let messageId = '';
    let container_ratio: number;
    let reversed = false;

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

    chrome.storage.local.get(['container_ratio'], (result) => {
        container_ratio = parseInt(result.container_ratio);
    });

    function get_chat_room(){
        const chat_room_default: Element | null = document.querySelector('.chat-room__content .chat-list--default');
        const chat_room_other: Element | null = document.querySelector('.chat-room__content .chat-list--other');
        return chat_room_default ? chat_room_default : chat_room_other;
    }

    type position = 'position-up' | 'position-down';

    function reverseChatContainer(position: position){
        reversed = position === 'position-up';

        if(reversed){
            original_container.classList.add('orig_reverse');
            handle_container.classList.add('handle_reverse')
            frame.classList.add('wtbc_reverse');
        }else{
            original_container.classList.remove('orig_reverse');
            handle_container.classList.remove('handle_reverse')
            frame.classList.remove('wtbc_reverse');
        }
    }

    function createChatPage(channel: string, theme: string){
        const chat_room = get_chat_room();
        if (!chat_room) return false;

        const currentFrame = chat_room.getElementsByTagName('iframe');
        if(currentFrame.length !== 0){
            return;
        }
        
        messageId = Math.random().toString(36).substring(2,12);
        chrome.storage.local.get(['position', 'theme', 'font_size', 'language'], (res) => {

            console.log(res);

            const params = new URLSearchParams();
            params.set('channel', channel);
            params.set('theme', res.theme);
            params.set('language', res.language);
            params.set('font_size', res.font_size);
            params.set('messageId', messageId);

            const src = `https://wtbc.bluewarn.dev/mini?${params}`;

            // resize handle (drag bar)
            const _handle_container = document.createElement('div');
            const resize_handle = document.createElement('div');
            _handle_container.id = 'handle_container';
            resize_handle.classList.add('tbc_resize_handle');
            _handle_container.addEventListener('mousedown', startDrag);
            _handle_container.addEventListener('touchstart', startDrag);
            _handle_container.appendChild(resize_handle);

            const _frame = document.createElement('iframe');
            _frame.id = 'wtbc-mini';
            _frame.title = 'Twitch Badge Collector :: Mini';
            _frame.src = src;

            chat_room.firstChild?.appendChild(_handle_container);
            chat_room.firstChild?.appendChild(_frame);

            original_container = <HTMLDivElement>chat_room.getElementsByClassName('scrollable-area')[0];
            handle_container = <HTMLDivElement>document.getElementById('handle_container');
            frame = _frame;

            reverseChatContainer(res.position);
        });

        
    }

    let StreamPageCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {

        let stream_chat: Element | undefined = document.getElementsByClassName('stream-chat')[0];

        if (!stream_chat) return;

        observeChatRoom(stream_chat);
        const channel = window.location.pathname.split('/')[1];
        const classls = document.documentElement.classList
        const theme = classls.contains('tw-root--theme-light') ? 'light' : 'dark';
        createChatPage(channel, theme);

        if (stream_page_observer) stream_page_observer.disconnect();
    }

    // function rootClassListChanged(mutationRecord: MutationRecord[]){
    //     const target = <HTMLElement>mutationRecord[0].target;
    //     const lightClassName = 'tw-root--theme-light';
    //     let theme = target.classList.contains(lightClassName) ? 'light' : 'dark';

    //     console.log(frame);
    //     frame.onload = () => {
    //         frame.contentWindow?.postMessage({
    //             id : 'tbc',
    //             theme : theme
    //         }, 'https://wtbc.bluewarn.dev');
    //     }
    // }

    let newChatCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {

        const point_summary_className = 'community-points-summary';

        Array.from(mutationRecord).forEach(mr => {
            let addedNodes = mr.addedNodes;
            if (!addedNodes) return;

            addedNodes.forEach(node => {
                let nodeElement = <HTMLElement>node;
                if (!nodeElement || nodeElement.nodeType !== 1) return;

                let point_summary = <HTMLDivElement>(nodeElement.getElementsByClassName(point_summary_className)[0] || nodeElement.closest('.' + point_summary_className));

                if (point_summary) {
                    let point_button = point_summary.children[1].getElementsByTagName('button')[0];
            
                    if (point_button) {
                        point_button.click();
                    }
                }
            });
        });
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

        if (!original_container || !frame) return;

        let orig_size = ratio === 0 ? 1 : (ratio === 10 ? 0 : 1);
        let clone_size = ratio === 0 ? 0 : (ratio === 10 ? 1 : 0);

        if (1 <= ratio && ratio <= 100) {
            clone_size = parseFloat((ratio * 0.01).toFixed(2));
            orig_size = parseFloat((1 - clone_size).toFixed(2));
        }

        if(reversed){
            [orig_size, clone_size] = [clone_size, orig_size];
        }

        original_container.style.height = `${orig_size * 100}%`;
        frame.style.height = `${clone_size * 100}%`;
    }

    let startDrag = function (e: MouseEvent | TouchEvent) {
        e.preventDefault();
        frame.classList.add('freeze');
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

            change_container_ratio(container_ratio);
        }
    }

    let endDrag = function () {
        frame.classList.remove('freeze');
        window.removeEventListener('mousemove', doDrag);
        window.removeEventListener('touchmove', doDrag);
        window.removeEventListener('mouseup', endDrag);
        window.removeEventListener('touchend', endDrag);
    }
    observeStreamPage();

    chrome.storage.onChanged.addListener(function (changes) {
        for (var key in changes) {
            let newValue = changes[key].newValue;

            if(key === 'container_ratio') {
                change_container_ratio(parseInt(newValue));
                return;
            }else if(key === 'position'){
                reverseChatContainer(newValue);
                return;
            }

            const messageObj = {
                messageId : messageId,
                type : key,
                value : newValue
            }
            frame.contentWindow?.postMessage(messageObj, 'https://wtbc.bluewarn.dev');
        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === "onHistoryStateUpdated") {
            observeStreamPage();
        }
        sendResponse({ status: true })
        return true;
    });
})();