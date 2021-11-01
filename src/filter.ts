import { Filter, filter_metadata, filter_category, filter_type, filter_cond_list, default_badge } from './types.js.js';
(function () {

    let DEBUG_FILTER_ALL = <HTMLButtonElement>document.getElementById('DEBUG_FILTER_ALL');
    let backup_filter = <HTMLButtonElement>document.getElementById('backup_filter');
    let import_filter = <HTMLInputElement>document.getElementById('import_filter');
    let add_btn = <HTMLButtonElement>document.getElementById('add_condition');

    let checkbox_head = <HTMLInputElement>document.getElementById('checkbox_head');
    let condition_value = <HTMLInputElement>document.getElementById('condition_value');
    let condition_note = <HTMLInputElement>document.getElementById('condition_note');
    let category_select = <HTMLSelectElement>document.getElementById('category-select');
    let condition_select = <HTMLSelectElement>document.getElementById('condition-select');
    let remove_btn = <HTMLButtonElement>document.getElementById('remove_btn');
    let remove_all_btn = <HTMLButtonElement>document.getElementById('remove_all_btn');

    let search_input = <HTMLInputElement>document.getElementById('search_input');
    let list_container = <HTMLDivElement>document.getElementById('list_container');
    let page_links = <HTMLDivElement>document.getElementById('page_links');

    let current_page_num = <HTMLSpanElement>document.getElementById('current_page_num');

    const PAGE_FILTER_COUNT: number = 10; // 한 페이지에 표시할 필터 개수.
    const ALERT_DELAY_TIME = 3000; // 알람 창 표시 시간.

    let global_filter: Map<string, Filter> = new Map();
    let searched_filter: Map<string, Filter> = new Map();

    let search_mode = false;

    chrome.storage.sync.get('filter', result => {
        global_filter = new Map(result.filter);

        chrome.storage.local.get('default_filter', result=>{
            let default_filter: Map<string, Filter> = new Map(result.default_filter);
            
            for(const [k, v] of default_filter){
                if(!global_filter.has(k)){
                    add_filter_object(filter_type.Include, v.note, filter_category.Badge_UUID, v.value, k);
                }
            }
        });
        
        display_filter_list(1);
    });

    function translateHTML(){

        document.getElementsByTagName('title')[0].textContent = 'TBC - ' + chrome.i18n.getMessage('f_title');
        document.getElementById('f_title')!.textContent = chrome.i18n.getMessage('f_title');
        document.getElementById('add_title')!.textContent = chrome.i18n.getMessage('f_add_desc');

        let doc_link = document.createElement('a');
        doc_link.setAttribute('href', chrome.i18n.getMessage('filter_desc_link'));
        doc_link.setAttribute('target', '_blank');
        doc_link!.textContent = chrome.i18n.getMessage('f_desc_link');

        let add_desc = document.getElementById('add_title');
        add_desc!.textContent = chrome.i18n.getMessage('f_add_desc');
        add_desc!.appendChild(doc_link);

        document.getElementById('cat_option_login')!.textContent = chrome.i18n.getMessage('f_nickname');
        document.getElementById('cat_option_badge')!.textContent = chrome.i18n.getMessage('f_badge_link');
        document.getElementById('cat_option_keyword')!.textContent = chrome.i18n.getMessage('f_keyword');
        document.getElementById('cond_option_include')!.textContent = chrome.i18n.getMessage('f_include');
        document.getElementById('cond_option_exclude')!.textContent = chrome.i18n.getMessage('f_exclude');

        document.getElementById('add_condition')!.textContent = chrome.i18n.getMessage('f_add');

        let search_input = <HTMLInputElement>document.getElementById('search_input');
        let cond_value_input = <HTMLInputElement>document.getElementById('condition_value');
        let cond_note_input = <HTMLInputElement>document.getElementById('condition_note');

        search_input.placeholder = chrome.i18n.getMessage('f_search_ph');
        cond_value_input.placeholder = chrome.i18n.getMessage('f_nickname_ph');
        cond_note_input.placeholder = chrome.i18n.getMessage('f_note_ph');

        document.getElementById('search_input')!.textContent = chrome.i18n.getMessage('f_search_ph');

        document.getElementById('remove_btn')!.textContent = chrome.i18n.getMessage('f_btn_rm_sel');
        document.getElementById('remove_all_btn')!.textContent = chrome.i18n.getMessage('f_btn_rm_all');
        document.getElementById('backup_filter')!.textContent = chrome.i18n.getMessage('f_btn_bk');
        document.getElementById('upload_label')!.textContent = chrome.i18n.getMessage('f_btn_up');

        document.getElementById('category_head')!.textContent = chrome.i18n.getMessage('f_category');
        document.getElementById('badge_icon_head')!.textContent = chrome.i18n.getMessage('f_badge');
        document.getElementById('value_head')!.textContent = chrome.i18n.getMessage('f_contents');
        document.getElementById('condition_head')!.textContent = chrome.i18n.getMessage('f_cond');
    }

    function alert(type: string, msg: string){
        const msg_id = getRandomString();
        const alert_container = document.getElementById('alert_container');
        const latest_msg_container = document.getElementsByClassName('message_container')[0];
        

        if(latest_msg_container){
            const l_type = latest_msg_container.getAttribute('type');
            const l_msg = latest_msg_container.getElementsByTagName('span')[0].textContent;
            if(type === l_type && msg === l_msg) return;
        }
        
        const msg_container = document.createElement('div');
        const msg_span = document.createElement('span');

        msg_container.classList.add('message_container');
        msg_span.classList.add('msg_span');
        msg_span.textContent = msg;
        msg_container.setAttribute('type', type);
        msg_container.setAttribute('id', msg_id);
        msg_container.appendChild(msg_span);
        alert_container!.appendChild(msg_container);

        setTimeout(()=>{
            let msg_cont = <HTMLDivElement>document.getElementById(msg_id);
            msg_cont!.style.opacity = '0';
            setTimeout(()=>{
                msg_cont?.parentNode?.removeChild(msg_cont!);
            }, 200);
        }, ALERT_DELAY_TIME);
    }

    window.addEventListener('load', e => {
        translateHTML();
    });

    function get_empty_filter(){
        let filter: Filter = {
            'filter_id' : '',
            'category' : '',
            'filter_type' : '',
            'note' : '',
            'value' : ''
        }
        return filter;
    }

    function getRandomString() {
        return Math.random().toString(36).substr(2,11);
    }

    function uuid_from_url(url:string){

        let badge_uuid:string = '';

        try{
            badge_uuid = new URL(url).pathname.split('/')[3];
        }catch(e){
            return badge_uuid;
        }
        return badge_uuid;
    }

    function init_filter_input(){
        category_select.value = filter_category.Login_name;
        condition_value.value = '';
        condition_note.value = '';
        condition_note.classList.add('hide');
        condition_value.placeholder = chrome.i18n.getMessage('f_nickname_ph');
        condition_select.value = filter_type.Include;
    }

    /**
     * 
     * @param filter_len filter 객체 수
     * @param page_filter_count 한 페이지에 표시할 필터 수
     * @returns page_num 필터 목록을 표시하는데 필요한 페이지 수
     */
    function calc_page_num(filter_len: number, page_filter_count: number) {
        let page_num = Math.ceil(filter_len / page_filter_count);
        if (filter_len < page_filter_count) page_num = 1;
        return page_num;
    }

    /**
     * 필터 목록을 새로고침 합니다.
     * @param page_num 표시하고자 하는 페이지 번호
     */
    function display_filter_list(page_num: number/*, filter?: Array<Filter>*/) {

        if (page_num <= 0 || !page_num) return false;
        let filter_ = global_filter;
        if(search_mode) filter_ = searched_filter;
        //if (filter) filter_ = filter;

        current_page_num.setAttribute('cur_pg_num', String(page_num));

        remove_filter_list(list_container);

        let filter_len = filter_.size;

        let link_count = calc_page_num(filter_len, PAGE_FILTER_COUNT);
        set_page_links(page_links, page_num, link_count);

        let start_num = (PAGE_FILTER_COUNT * page_num) - (PAGE_FILTER_COUNT);
        let end_num = start_num + PAGE_FILTER_COUNT;

        // 필터 개수가 end_num 보다 작으면, end_num 의 값을 end_num 과 filter_len 의 차이만큼 감소.
        if (end_num > filter_len) {
            end_num = end_num - (end_num - filter_len);
        }

        let filter_keys = Array.from(filter_.keys());
        for (let i = start_num; i < end_num; i++) {
            let key = filter_keys[i];
            let value = filter_.get(key);
            if(value) add_filter_list(key, value);
        }
    }

    function add_filter_list(id: string, filter: Filter) {
        if (!list_container) {
            list_container = <HTMLDivElement>document.getElementById('list_container');
        }
        let f_filter_id = id;
        let f_category = filter.category;
        let f_filter_type = filter.filter_type;
        let f_note = filter.note;
        let f_value = filter.value;

        let list = <HTMLDivElement>document.createElement('div');
        let component = <HTMLDivElement>document.createElement('div');
        let input = <HTMLInputElement>document.createElement('input');
        let category = <HTMLSpanElement>document.createElement('span');
        let badge_icon = <HTMLImageElement>document.createElement('img');
        let note = <HTMLSpanElement>document.createElement('span');
        let condition = <HTMLSpanElement>document.createElement('span');

        list.classList.add('list');
        component.classList.add('component');
        component.setAttribute('filter_id', f_filter_id);
        input.setAttribute('type', 'checkbox');
        input.classList.add('checkbox');

        category.classList.add('category');
        badge_icon.classList.add('badge_icon')
        note.classList.add('value');
        condition.classList.add('condition');

        category.setAttribute('name', f_category);
        note.setAttribute('name', f_value);
        condition.setAttribute('name', f_filter_type);

        if (f_category === filter_category.Badge_UUID) {
            category.innerText = chrome.i18n.getMessage('f_badge');
            badge_icon.setAttribute('src', 'https://static-cdn.jtvnw.net/badges/v1/' + f_value + '/1');
        } else if (f_category === filter_category.Login_name) {
            category.innerText = chrome.i18n.getMessage('f_nickname');
        } else if (f_category === filter_category.Keyword){
            category.innerText = chrome.i18n.getMessage('f_keyword');
        }
        note.innerText = f_note;

        update_cond_elem(condition, f_filter_type);

        component.appendChild(input);
        component.appendChild(category);
        component.appendChild(badge_icon);
        component.appendChild(note);
        component.appendChild(condition);
        list.appendChild(component);
        list_container.appendChild(list);
    }

    function update_searched_filter(){
        const input_val = search_input.value.toLowerCase();
        searched_filter.clear();
        
        for(const [key, value] of global_filter){
            let note = <string>value.note.toLowerCase();
            if (note.includes(input_val)) {
                searched_filter.set(key, value);
            }
        }
        display_search_result(input_val, searched_filter.size);
    }

    function display_search_result(search_text: string, f_len: number){

        let se_res_container = <HTMLDivElement>document.getElementById('search_result_container');
        let se_result = <HTMLSpanElement>document.getElementById('se_result');

        if(search_text === ''){
            se_res_container.classList.add('hide');
            se_result.classList.add('hide');
        }else{
            se_res_container.classList.remove('hide');
            se_result.classList.remove('hide');
            let lang = <string>chrome.i18n.getUILanguage();
            if(lang.includes('ko')){
                se_result!.textContent = '\"' + search_text +'\" ' + '검색 결과 ' + f_len + ' 개의 필터가 있습니다.';
            }else if(lang.includes('ru')){
                // Поиск "Test", найдено 1 фильтр.
                se_result!.textContent = 'Поиск \"' + search_text + '\", найдено ' + f_len + ' фильтр'
            }else{
                se_result!.textContent = 'search for \"' + search_text +'\", ' + f_len + ' Filter found.'
            }
        }
    }

    function remove_filter_list(list_container?: HTMLDivElement) {

        if (!list_container) {
            list_container = <HTMLDivElement>document.getElementById('list_container');
        }

        let lists = list_container.getElementsByClassName('list');

        Array.from(lists).forEach((e, i) => {
            // 첫번째 list 는 타이틀
            if (i != 0) e.remove();
        });
    }

    function add_filter_object(f_type:string, f_note:string, f_category:string, f_val:string, f_key: string){

        //console.debug('f_type?: %o, f_note?: %o, f_category?: %o, f_val?: %o, f_key?:  %o', f_type, f_note, f_category, f_val, f_key);
        if(!global_filter) return;

        let new_filter: Filter = get_empty_filter();
        f_val = f_val.toLowerCase();

        for(const [key, val] of global_filter){
            let v = <string>val.value;
            let c = <string>val.category;
            if (f_category === c && f_val === v){
                alert('warning', chrome.i18n.getMessage('f_msg_already'));
                init_filter_input();
                return;
            } 
        }

        while(global_filter.has(f_key)){
            f_key = getRandomString();
        }

        if (f_val === '') {
            alert('warning', chrome.i18n.getMessage('f_no_value'));
            return;
        }

        new_filter.filter_id = f_key;
        new_filter.category = f_category;
        new_filter.filter_type = f_type;
        new_filter.value = f_val.toLowerCase();

        if(!f_note || f_note === ''){
            f_note = f_val;
        }

        new_filter.note = f_note;

        global_filter.set(f_key, new_filter);

        chrome.storage.sync.set({ filter: Array.from(global_filter) }, function () {
            let page_num = calc_page_num(global_filter.size, PAGE_FILTER_COUNT);
            alert('success', chrome.i18n.getMessage('f_added'));
            init_filter_input();
            condition_value.value = '';
            display_filter_list(page_num);
        });
    }

    /**
     * 
     * @param filter_id 변경하고자 하는 필터 id
     */
    function change_filter_cond(cond_elem: HTMLSpanElement, filter_id: string){

        let filter = global_filter.get(filter_id);

        if(!filter) return;

        let filter_type = filter?.filter_type;
        const current_index = filter_cond_list.indexOf(filter_type!);
        const nextIndex = (current_index + 1) % filter_cond_list.length;
        const new_type = filter_cond_list[nextIndex];
        filter.filter_type = new_type;
        global_filter.set(filter_id, filter);

        cond_elem.setAttribute('name', new_type);
        cond_elem.textContent = chrome.i18n.getMessage('f_' + new_type);

        chrome.storage.sync.set({filter : Array.from(global_filter)});
    }

    function set_page_links(page_links: HTMLDivElement, page_num: number, count: number) {
        Array.from(page_links.getElementsByClassName('page_link')).forEach(e => {
            e.remove();
        });
        for (let i = 1; i <= count; i++) {
            let page_link = document.createElement('span');
            page_link.classList.add('page_link');

            if(i === page_num){
                page_link.classList.add('curr');
            }
            
            page_link.setAttribute('page_num', String(i));
            page_link.textContent = String(i);
            page_links.appendChild(page_link);
        }
    }

    function update_cond_elem(cond_elem: HTMLSpanElement, f_type: string){
        cond_elem.textContent = chrome.i18n.getMessage('f_' + f_type);
        // if (f_type === filter_type.Include) {
        //     cond_elem.textContent = chrome.i18n.getMessage('f_include');
        // } else if (f_type === filter_type.Exclude) {
        //     cond_elem.textContent = chrome.i18n.getMessage('f_exclude');
        // } else if (f_type === filter_type.Sleep){
        //     cond_elem.textContent = chrome.i18n.getMessage('f_sleep');
        // }
    }

    function validate_badge_url(badge_url: string){

        let uuid_regex = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/g
        let badge_uuid: string = '';

        try{
            badge_uuid = new URL(badge_url).pathname.split('/')[3];
        }catch(e){
            return false;
        }

        if(uuid_regex.exec(badge_uuid)){
            return true;
        }
        return false;
    }

    function onReaderLoad(event:ProgressEvent){

        let proceed = confirm(chrome.i18n.getMessage('f_rm_proceed'));
        if(!proceed) return proceed;

        let target = <FileReader>event.target;
        let filter: Array<Filter | filter_metadata> = JSON.parse(String(target.result));
        let meta_avail = filter.some((f, i)=>{
            let fm = f as filter_metadata;
            if(fm.date && fm.version){
                filter.splice(i, 1);
                return true;
            }
        });
        if(!meta_avail){
            alert('error', chrome.i18n.getMessage('f_upload_error'));
            return false;
        }

        global_filter.clear();
        filter.forEach(e=>{
            let f = e as Filter;
            if(!f.note) f.note = f.value;
            global_filter.set(f.filter_id, f);
        });

        chrome.storage.sync.set({filter : Array.from(global_filter)}, ()=>{
            alert('success', chrome.i18n.getMessage('f_upload_done'));
            display_filter_list(1);
        });
    }

    add_btn.addEventListener('click', e => {
        let f_type = condition_select.value;
        let f_note = condition_note.value;
        let f_category = category_select.value;
        let f_val = condition_value.value;

        let valid = validate_badge_url(f_val);

        if (f_category === filter_category.Badge_UUID) {
            if (valid) {
                f_val = uuid_from_url(f_val);
            } else {
                // 배지 추가인데 링크가 유효하지 않은 경우
                alert('warning', chrome.i18n.getMessage('f_link_invalid'));
                return false;
            }

        }
        add_filter_object(f_type, f_note, f_category, f_val, getRandomString());
    });

    category_select.addEventListener('change', e => {
        let value = category_select.value;

        let input_note = document.getElementById('condition_note');
        input_note?.classList.add('hide');

        if (value === filter_category.Badge_UUID) {
            condition_value.placeholder = chrome.i18n.getMessage('f_badge_ph');
            input_note?.classList.remove('hide');
        } else if (value === filter_category.Login_name) {
            condition_value.placeholder = chrome.i18n.getMessage('f_nickname_ph');
        } else if (value === filter_category.Keyword) {
            condition_value.placeholder = chrome.i18n.getMessage('f_keyword_ph');
        }

    });

    condition_value.addEventListener('keyup', e=>{
        if (e.key === 'Enter') add_btn.click();
    });

    // TODO : Badge URL 을 입력했을때 카테고리가 배지 링크로 변경 안되는 버그 수정.
    condition_value.addEventListener('input', e => {
        let input_val = condition_value.value;
        let input_note = document.getElementById('condition_note');
        if(validate_badge_url(input_val)){
            category_select.value = filter_category.Badge_UUID;
            input_note?.classList.remove('hide');
            condition_value.placeholder = chrome.i18n.getMessage('f_badge_ph');
        }
    });

    checkbox_head.addEventListener('change', e => {
        let checked = checkbox_head.checked;
        let checkboxes = document.getElementsByClassName('checkbox');
        Array.from(checkboxes).forEach(e => {
            let box = <HTMLInputElement>e;
            box.checked = checked;
        });
    });

    search_input.addEventListener('input', e => {
        const input_val = search_input.value.toLowerCase();

        update_searched_filter();
        search_mode = input_val === '' ? false : true;
        display_filter_list(1);
    });

    remove_btn.addEventListener('click', e => {
        if(!confirm(chrome.i18n.getMessage('f_rm_selected'))) return;

        let component = document.getElementsByClassName('component');
        let comp_arr = Array.from(component);

        comp_arr.shift(); // 첫 번째 요소는 타이틀

        comp_arr.forEach(e => {

            let checkbox = <HTMLInputElement>e.getElementsByClassName('checkbox')[0];
            let checked = checkbox.checked;

            if (checked) {
                let filter_id = <string>e.getAttribute('filter_id');
                let is_default = Object.keys(default_badge).includes(filter_id);

                if (!is_default) {
                    global_filter.delete(filter_id);
                } else {
                    alert('warning', chrome.i18n.getMessage('f_rm_default'));
                }
            }
        });

        update_searched_filter();

        chrome.storage.sync.set({ filter: Array.from(global_filter) }, () => {
            alert('success', chrome.i18n.getMessage('f_done'));
            let page_num = <string>current_page_num.getAttribute('cur_pg_num');
            let new_page_num = calc_page_num(global_filter.size, PAGE_FILTER_COUNT);

            if (parseInt(page_num) > new_page_num) {
                page_num = String(new_page_num);
            }

            checkbox_head.checked = false;
            display_filter_list(parseInt(page_num));
        });
    });
    remove_all_btn.addEventListener('click', e => {
        if(!confirm(chrome.i18n.getMessage('f_ask_rm_all'))) return;

        chrome.storage.local.get('default_filter', result=>{
            chrome.storage.sync.set({ filter: Array.from(result.default_filter)}, () => {
                alert('success', chrome.i18n.getMessage('f_all_rm'));
                display_filter_list(1);
            });
        });
    });

    list_container.addEventListener('click', e=>{
        let target = (e.target as HTMLSpanElement);
        let id = <string>target.parentElement?.getAttribute('filter_id');
        if(target.nodeName != 'span' && target.classList.contains('condition')){
            change_filter_cond(target, id);
        };
    });
    page_links.addEventListener('click', function(e){
        let target = <HTMLSpanElement>e.target;
        let page_num = <string>target.getAttribute('page_num');

        target.classList.add('curr');
        display_filter_list(parseInt(page_num));
    });

    backup_filter.addEventListener('click', e => {
        // 확장 버전, 파일 생성 날짜

        let filter: Array<Filter | filter_metadata> = Array.from(global_filter.values());

        let today = new Date();
        let year = today.getFullYear();
        let month = ('0' + (today.getMonth() + 1)).slice(-2);
        let day = ('0' + today.getDate()).slice(-2);
        let dateString = year + '-' + month + '-' + day;
        
        filter.unshift({
            version : chrome.runtime.getManifest().version,
            date : new Date().getTime()
        });
        let serialized = JSON.stringify(filter, null, 4);

        let vLink = document.createElement('a'),
            vBlob = new Blob([serialized], { type: "octet/stream" }),
            vName = dateString + '_filter_backup.tbc',
            vUrl = window.URL.createObjectURL(vBlob);
        vLink.setAttribute('href', vUrl);
        vLink.setAttribute('download', vName);
        vLink.click();
    });

    import_filter.addEventListener('change', e=>{
        
        let files = (<HTMLInputElement>e.target).files;
        let reader = new FileReader();
        reader.onload = onReaderLoad;
        if(files){
            reader.readAsText(files[0]);
        }
        
    });

    DEBUG_FILTER_ALL.addEventListener('click', e=>{
        console.debug('global_filter : %o', global_filter);

        // for(let i = 0; i < 100; i++){
        //     add_filter_object(filter_type.Include, filter_category.Login_name, getRandomString(), getRandomString());
        // }
    });

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (var key in changes) {

            let newValue = changes[key].newValue;
            
            if (key === 'filter') {
                global_filter = new Map(newValue);
            }

        }
    });

})();