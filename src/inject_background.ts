import browser from "webextension-polyfill";
import { base_url } from "./const";

(function () {
    type displayMethod = 'method-twitchui' | 'method-mini';
    let stream_page_observer: MutationObserver | undefined;
    let chat_room_observer: MutationObserver | undefined;
    let pointBoxObserver: MutationObserver | undefined;
    let replayChatObserver: MutationObserver | undefined;
    let themeObserver: MutationObserver | undefined;

    let default_config: MutationObserverInit = { childList: true, subtree: true, attributeFilter: ["class"] };

    let original_container: HTMLDivElement;
    let clone_container: HTMLDivElement;

    let replayChatClone: HTMLDivElement;
    let replayChatOrig: HTMLDivElement;
    
    let container_ratio: number;
    let reversed = false;
    let dev = false;
    
    let filter = new Map();
    let chatIsAtBottom = true;
    let chatDisplayMethod: displayMethod = 'method-twitchui';

    let streamChatFound = false;
    let pointSummaryFound = false;
    let pointBox_auto = true;
    let mock_loaded = false;

    let StreamPagetimer: number;

    const CLONE_CHAT_COUNT = 144;

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

    browser.storage.local.get(['filter', 'pointBox_auto', 'dev']).then(res => {
        if(res.filter){
            filter = new Map(res.filter);
        }
        if(res.pointBox_auto){
            pointBox_auto = res.pointBox_auto === 'pointBox-method-on' ? true : false;
        }
        if(res.dev){
            dev = res.dev;
        }
    });
    let tbc_messageId = Math.random().toString(36).substring(2, 12);

    function injectMockFetch(){
        if(isReplayPage() && !mock_loaded){
            mock_loaded = true;
            var s = document.createElement('script');
            s.src = browser.runtime.getURL('dist/js/mock_fetch.js');
            s.onload = function () {
                s.remove();
            };
            (document.head || document.documentElement).appendChild(s);
        }
    }
    injectMockFetch();
    

    function get_chat_room(){
        const chat_room_default: Element | null = document.querySelector('.chat-room__content .chat-list--default');
        const chat_room_other: Element | null = document.querySelector('.chat-room__content .chat-list--other');
        return chat_room_default ? chat_room_default : chat_room_other;
    }

    type position = 'position-up' | 'position-down';

    function reverseChatContainer(position: position){
        reversed = position === 'position-up';

        const handle_container = document.getElementsByClassName('handle_container')[0];

        if(reversed){
            original_container.classList.add('orig_reverse');
            handle_container.classList.add('handle_reverse');
            clone_container.classList.add('clone_reverse');
        }else{
            original_container.classList.remove('orig_reverse');
            handle_container.classList.remove('handle_reverse');
            clone_container.classList.remove('clone_reverse');
        }
    }

    function createContainerHandler(){
        const handle_container = document.createElement('div');
        const resize_handle = document.createElement('div');
        handle_container.classList.add('handle_container');
        resize_handle.classList.add('tbc_resize_handle');
        handle_container.addEventListener('mousedown', startDrag);
        handle_container.addEventListener('touchstart', startDrag);
        handle_container.appendChild(resize_handle);

        return handle_container;
    }

    function isReplayPage(){
        const replay_regex = /\/videos\/[0-9]*/g;
        const url = new URL(location.href);

        if(replay_regex.test(url.pathname)){
            return 'replay';
        }else if(url.pathname.split('/')[2] === 'clip'){
            return 'clip';
        }
        return false;
    }

    async function createCloneContainer(){
        const chat_room = get_chat_room();
        if (!chat_room) return false;

        original_container = <HTMLDivElement>chat_room.getElementsByClassName('scrollable-area')[0];
        clone_container = document.createElement('div');

        original_container.classList.add('tbc-origin');
        clone_container.id = 'tbc-clone';

        chat_room.firstChild?.appendChild(createContainerHandler());
        chat_room.firstChild?.appendChild(clone_container);

        const ps_res = await browser.storage.local.get('position');
        const cr_res = await (browser.storage.local.get('container_ratio'));

        container_ratio = cr_res.container_ratio;

        reverseChatContainer(ps_res.position);
        change_container_ratio(container_ratio);
    }

    function sendMessageReplayFrame(msg_type: string, value: any) {
        const wtbcReplayFrame = getReplayFrame();

        if (wtbcReplayFrame) {
            wtbcReplayFrame.contentWindow?.postMessage({
                sender: 'tbc', body: [{
                    tbc_messageId: 'omitted',
                    type: msg_type,
                    value: value
                }]
            }, base_url);
        }
    }

    function getVideoInfo(video_player: HTMLVideoElement){
        return {
            time: video_player.currentTime
        }
    }

    async function createReplayContainer(video_chat: HTMLDivElement, video_player: HTMLVideoElement){
        if (document.getElementById('tbc-replay')) return false;

        const replayContainer = document.createElement('div');
        replayContainer.id = 'tbc-replay';

        const frame = createFrame('Twitch Badge Collector :: Replay', 'wtbc-replay', getChannelFromPath(), 'replay');
    
        replayContainer.appendChild(frame);

        video_chat.parentElement?.appendChild(replayContainer);
        replayChatClone = replayContainer;
        replayChatOrig = video_chat;
        video_chat.style.height = '50%';

        const res = await (browser.storage.local.get('replayChatSize'));
        change_container_ratio(res.replayChatSize);

        video_player.ontimeupdate =  e => {
            sendMessageReplayFrame('wtbc-player-time', getVideoInfo(video_player));
        };

        frame.onload = () => {
            const msgObj = [];
            const msgLists = [
                ['tbc_messageId', tbc_messageId],
                ['wtbc-replay-init', { type : isReplayPage(), time : video_player.currentTime }]
            ]
            for(let msg of msgLists){
                msgObj.push({
                    tbc_messageId: tbc_messageId,
                    type: msg[0],
                    url: location.href,
                    value: msg[1]
                });
            }
            frame.contentWindow?.postMessage({sender: 'tbc', body: msgObj}, base_url);

            browser.storage.local.get('filter').then(res => {
                const filter = res.filter;
                const filterMessageObj = [{
                    tbc_messageId : tbc_messageId,
                    type : 'filter',
                    value : filter
                }]
                frame.contentWindow?.postMessage({sender: 'tbc', body: filterMessageObj}, base_url);
            });
        }
    }

    function cloneChatByTwitchUi() {
        const twitchClone = <HTMLDivElement>original_container.cloneNode(true);
        twitchClone.setAttribute('style', '');
        twitchClone.classList.remove('tbc-origin');
        twitchClone.id = 'tbc-clone__twitchui';

        let scroll_area = twitchClone.getElementsByClassName('simplebar-scroll-content')[0];

        scroll_area.addEventListener("scroll", function () {
            chatIsAtBottom = scroll_area.scrollTop + scroll_area.clientHeight >= scroll_area.scrollHeight - 40;
        }, false);

        let message_container = twitchClone.getElementsByClassName('chat-scrollable-area__message-container')[0];
        message_container.textContent = '';//remove all chat lines.

        const extVersion = browser.runtime.getManifest().version;
        clone_container.appendChild(twitchClone);

        addSystemMessage(`Twitch Badge Collector v${extVersion}`);

        observeChatRoom(document.getElementsByClassName('stream-chat')[0]);
    }

    function createFrame(title: string, id: string, channel: string, path: string){
        const params = new URLSearchParams();
        params.set('channel', channel);
        params.set('ext_version', browser.runtime.getManifest().version);
        if(dev){
            params.set('dev', 'true');
        }

        const src = `${base_url}${path}?${params}`;

        const _frame = document.createElement('iframe');
        _frame.id = id;
        _frame.title = title;
        _frame.src = src;

        return _frame;
    }
    function cloneChatByMini(channel: string){

        browser.storage.local.get(['position', 'theme', 'font_size', 'language']).then(res => {
            const frame = createFrame('Twitch Badge Collector :: Mini', 'wtbc-mini', channel, 'mini');
            clone_container.appendChild(frame);
            let theme = res.theme;
            if(theme === 'auto'){
                theme = getTwitchTheme();
            }

            frame.onload = () => {
                const msgObj = [];
                const msgLists = [
                    ['tbc_messageId', tbc_messageId],
                    ['language', res.lenguage],
                    ['font_size', res.font_size],
                    ['theme', theme],
                ]
                for(let msg of msgLists){
                    msgObj.push({
                        tbc_messageId: tbc_messageId,
                        type: msg[0],
                        value: msg[1]
                    });
                }
                frame.contentWindow?.postMessage({sender: 'tbc', body: msgObj}, base_url);

                browser.storage.local.get('filter').then(res => {
                    const filter = res.filter;
                    const filterMessageObj = [{
                        tbc_messageId : tbc_messageId,
                        type : 'filter',
                        value : filter
                    }]
                    frame.contentWindow?.postMessage({sender: 'tbc', body: filterMessageObj}, base_url);
                });
            }
        });
    }
    function getTwitchTheme() {
        return document.documentElement.classList.contains('tw-root--theme-light') ? 'light' : 'dark';
    }

    function getMiniFrame(){
        return <HTMLIFrameElement>document.getElementById('wtbc-mini');
    }
    function getReplayFrame(){
        return <HTMLIFrameElement>document.getElementById('wtbc-replay');
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
    function addSystemMessage(message: string){
        const room_clone = <HTMLDivElement>document.getElementById('tbc-clone__twitchui');
        if(!room_clone) return;

        const message_container = room_clone.getElementsByClassName('chat-scrollable-area__message-container')[0];
        const scroll_area = room_clone.getElementsByClassName('simplebar-scroll-content')[0];

        const msg_container = document.createElement('div');
        const msg = document.createElement('span');
        msg_container.classList.add('tbc_info__container');
        msg.classList.add('tbc_info', 'chat-line__status');

        msg.textContent = message;
        msg_container.appendChild(msg);
        message_container.appendChild(msg_container);

        if (chatIsAtBottom) scroll_area.scrollTop = scroll_area.scrollHeight;
    }

    function replayCloneAvailable(){
        return document.getElementById('tbc-replay');
    }

    let StreamPageCallback: MutationCallback = async function (mutationRecord: MutationRecord[]) {
        if(isReplayPage()){
            const video_chat: HTMLDivElement = <HTMLDivElement>document.getElementsByClassName('channel-root__right-column')[0];
            const video_player: HTMLVideoElement | undefined = document.getElementsByClassName('video-ref')[0].getElementsByTagName('video')[0];
            
            if(video_chat && video_player && !replayCloneAvailable()){
                observeReplayChatContainer(video_chat);
                createReplayContainer(video_chat, video_player);
            }
            if(replayCloneAvailable() && stream_page_observer){
                stream_page_observer.disconnect();
            }
            return;
        }

        const replayClone = document.getElementById('tbc-replay');
        const replayOrig = <HTMLDivElement>document.getElementsByClassName('channel-root__right-column')[0];

        if (replayClone) replayClone.remove();
        if (replayOrig) replayOrig.style.removeProperty('height');

        let stream_chat: Element | undefined = document.getElementsByClassName('stream-chat')[0];
        let pointSummary: Element = document.getElementsByClassName('community-points-summary')[0];

        if (stream_chat && !streamChatFound) {
            streamChatFound = true;

            const res = await (browser.storage.local.get('chatDisplayMethod'));
            chatDisplayMethod = res.chatDisplayMethod;

            if (document.getElementById('tbc-clone')) return false;

            createCloneContainer();

            const child = clone_container.firstChild;

            if (child) {
                if ((child as HTMLIFrameElement).id === 'wtbc-mini') return;
                if ((child as HTMLDivElement).id === 'tbc-clone__twitchui') return;
            }
            const channel = getChannelFromPath();

            if (res.chatDisplayMethod === 'method-mini') {
                cloneChatByMini(channel);
            } else {
                cloneChatByTwitchUi();
            }
        }
        if(pointSummary && !pointSummaryFound){
            pointSummaryFound = true;

            let point_button = pointSummary.children[1].getElementsByTagName('button')[0];

            if (point_button) {
                point_button.click();
            }

            observePointBox(pointSummary);
        }
        if(streamChatFound && pointSummaryFound && stream_page_observer){
            stream_page_observer.disconnect();
        }
    }

    function getChannelFromPath() {
        const paths = window.location.pathname.split('/');
        const regex = /\/videos\/[0-9]*/g;
        let channel = paths[1];

        if(regex.test(location.pathname)){
            return paths[2];
        }

        if (paths.length > 2) {
            if (channel === 'popout') {
                channel = paths[2];
            } else if (channel === 'moderator') {
                channel = paths[2];
            } else if (channel === 'embed') {
                channel = paths[2];
            }
        }
        return channel;
    }

    let pointBoxCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {
        if(!pointBox_auto) return;

        const point_summary_className = 'community-points-summary';

        for(let mr of Array.from(mutationRecord)){
            let addedNodes = mr.addedNodes;
            if (!addedNodes) return;

            for(let node of addedNodes){
                let nodeElement = <HTMLElement>node;
                if (!nodeElement || nodeElement.nodeType !== 1) return;

                let point_summary = <HTMLDivElement>(nodeElement.getElementsByClassName(point_summary_className)[0] || nodeElement.closest('.' + point_summary_className));

                if (point_summary) {
                    let point_button = point_summary.children[1].getElementsByTagName('button')[0];
        
                    if (point_button) {
                        point_button.click();
                    }
                }
            }
        }
    }

    let replayChatContainerCallback = function (MutationRecord: MutationRecord[]){
        const record = MutationRecord[0];

        if(record.attributeName !== 'class') return;

        if((record.target as HTMLDivElement).classList.contains('channel-root__right-column--expanded')){
            // 극장 모드 아님.
            replayChatClone.classList.remove('chat-player-theater');
        }else{
            // 극장 모드.
            replayChatClone.classList.add('chat-player-theater');
        }
    }

    let themeCallback: MutationCallback = function (mutationRecord: MutationRecord[]){
        const record = mutationRecord[0];
        if(record.attributeName !== 'class' && (record.target as HTMLElement).tagName !== 'HTML') return;

        postMessageToFrame('theme', getTwitchTheme());
    }

    let newChatCallback: MutationCallback = function (mutationRecord: MutationRecord[]) {
        let room_clone: Element;
        let chat_clone: Element;
        let badges: HTMLCollection;
        let text_contents: HTMLCollection;
        let scroll_area: Element;
        let message_container: Element;

        Array.from(mutationRecord).forEach(mr => {
            let addedNodes = mr.addedNodes;
            if (!addedNodes) return;

            addedNodes.forEach(node => {
                let nodeElement = <HTMLElement>node;
                if (!nodeElement || nodeElement.nodeType !== 1) return;

                const is_chat = nodeElement.closest('.chat-scrollable-area__message-container');

                if (is_chat) {
                    let room_clone_parent = <HTMLDivElement>nodeElement.closest('.scrollable-area.tbc-origin')?.parentNode;
                    if (!room_clone_parent) return false; // nodeElement 가 .scrollable-area.origin 의 자식 요소가 아니면 return.
                    
                    room_clone = <HTMLDivElement>document.getElementById('tbc-clone__twitchui');
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
                    // Mirror_of_Erised();
                }
            });
        });
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
            include = filter_arr.filter(el => (el.value.toLowerCase() === value.toLowerCase()) && (el.filter_type === 'include'));
            exclude = filter_arr.filter(el => (el.value.toLowerCase() === value.toLowerCase()) && (el.filter_type === 'exclude'));
        }else{
            include = filter_arr.filter(el => value.includes(el.value) && el.filter_type === 'include');
            exclude = filter_arr.filter(el => value.includes(el.value) && el.filter_type === 'exclude');
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
        streamChatFound = false;
        pointSummaryFound = false;

        if (stream_page_observer) {
            stream_page_observer.observe(target, default_config);
        } else {
            stream_page_observer = observeDOM(target, default_config, StreamPageCallback);
        }

        clearTimeout(StreamPagetimer);
        StreamPagetimer = window.setTimeout(() => {
            if(stream_page_observer){
                stream_page_observer.disconnect();
            }
        }, 60 * 1000);
    }

    let observeChatRoom = function (target: Element) {
        //observer 가 중복 할당 되는것을 방지. 두번 할당되면 채팅이 두번씩 올라오는 끔찍한 일이 벌어진다.
        if (chat_room_observer) {
            chat_room_observer.observe(target, default_config);
        } else {
            chat_room_observer = observeDOM(target, default_config, newChatCallback);
        }
    }

    let observePointBox = function (target: Element) {
        if (pointBoxObserver) {
            pointBoxObserver.observe(target, default_config);
        } else {
            pointBoxObserver = observeDOM(target, default_config, pointBoxCallback);
        }
    }

    let observeReplayChatContainer = function(target: Element){
        const option = {attributes: true};

        if(replayChatObserver){
            replayChatObserver.observe(target, option);
        } else {
            replayChatObserver = observeDOM(target, option, replayChatContainerCallback);
        }
    }

    let observeTheme = function (){
        const option = {attributes: true};
        if(themeObserver){
            themeObserver.observe(document.documentElement, option);
        } else {
            themeObserver = observeDOM(document.documentElement, option, themeCallback);
        }
    }

    /**
     * 
     * @param ratio 0 부터 100 사이의 값, 복제된 채팅창의 크기 비율입니다.
     * @returns 
     */
    let change_container_ratio = function (ratio: number) {
        if(!isReplayPage()){
            if (!original_container || !clone_container) return;
        }else{
            if(!replayChatOrig || !replayChatClone) return;
        }
        
        if (ratio != 0) ratio = ratio ? ratio : 30;
        container_ratio = ratio;

        let orig_size = ratio === 0 ? 1 : (ratio === 10 ? 0 : 1);
        let clone_size = ratio === 0 ? 0 : (ratio === 10 ? 1 : 0);

        if (1 <= ratio && ratio <= 100) {
            clone_size = parseFloat((ratio * 0.01).toFixed(2));
            orig_size = parseFloat((1 - clone_size).toFixed(2));
        }

        let orig, clone;

        if(isReplayPage()){
            orig = replayChatOrig;
            clone = replayChatClone;

            clone.style.top = `${orig_size * 100}%`;
        }else{
            if(reversed){
                [orig_size, clone_size] = [clone_size, orig_size];
            }
            orig = original_container;
            clone = clone_container;
        }

        orig.style.height = `${orig_size * 100}%`;
        clone.style.height = `${clone_size * 100}%`;
    }

    let startDrag = function (e: MouseEvent | TouchEvent) {
        e.preventDefault();

        if(!isReplayPage()){
            const miniFrame = getMiniFrame();
            if(chatDisplayMethod === 'method-mini' && miniFrame){
                miniFrame.classList.add('freeze');
            }
        }
        
        window.addEventListener('mousemove', doDrag);
        window.addEventListener('touchmove', doDrag);
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);
    }

    let doDrag = function (e: MouseEvent | TouchEvent) {
        let chat_room;

        if(isReplayPage()){
            chat_room = replayChatOrig;
        }else{
            chat_room = get_chat_room();
        }
        
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        if (chat_room) {
            const rect = chat_room.getBoundingClientRect();
            let container_ratio = (1 - (clientY - rect.y) / rect.height) * 100;
            container_ratio = Math.max(0, Math.min(100, Math.round(container_ratio)));
            change_container_ratio(container_ratio);
        }
    }

    let endDrag = function () {
        if (!isReplayPage()) {
            const miniFrame = getMiniFrame();
            if (chatDisplayMethod === 'method-mini' && miniFrame) {
                miniFrame.classList.remove('freeze');
            }
        }
       
        browser.storage.local.set({container_ratio});
        window.removeEventListener('mousemove', doDrag);
        window.removeEventListener('touchmove', doDrag);
        window.removeEventListener('mouseup', endDrag);
        window.removeEventListener('touchend', endDrag);
    }
    observeStreamPage();
    observeTheme();

    function postMessageToFrame(key: string, value: any) {
        let frame: HTMLIFrameElement | undefined = undefined;

        if(chatDisplayMethod === 'method-mini'){
            frame = getMiniFrame();
        }else if(isReplayPage()){
            frame = getReplayFrame();
        }

        if(!frame) return;

        frame.contentWindow?.postMessage({
            sender: 'tbc', body: [{
                tbc_messageId: tbc_messageId,
                type: key,
                value: value
            }]
        }, base_url);
    }

    browser.storage.onChanged.addListener(function (changes) {
        for (var key in changes) {
            let newValue = changes[key].newValue;

            if(key === 'position'){
                reverseChatContainer(newValue);
                return;
            }else if(key === 'filter'){
                filter = new Map(newValue);
                addSystemMessage(`필터가 업데이트 되었습니다.`);
                return;
            }else if(key === 'chatDisplayMethod'){
                chatDisplayMethod = newValue;
                return;
            }else if(key === 'replayChatSize'){
                change_container_ratio(newValue);
                return;
            }else if(key === 'theme'){
                if(newValue === 'auto'){
                    newValue = getTwitchTheme();
                }
            }

            postMessageToFrame(key, newValue);
        }
    });

    browser.runtime.onMessage.addListener((message, sender) => {
        if (message.action === "onHistoryStateUpdated") {
            injectMockFetch();
            observeStreamPage();
        }
    });
})();