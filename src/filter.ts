import { Filter, filter_metadata, filter_category, filter_type, default_badge } from './types.js.js';
(function () {
    
    let backup_filter = <HTMLButtonElement>document.getElementById('backup_filter');
    let import_filter = <HTMLInputElement>document.getElementById('import_filter');
    let add_btn = <HTMLButtonElement>document.getElementById('add_condition');

    let checkbox_head = <HTMLInputElement>document.getElementById('checkbox_head');
    let condition_value = <HTMLInputElement>document.getElementById('condition_value');
    let category_select = <HTMLSelectElement>document.getElementById('category-select');
    let condition_select = <HTMLSelectElement>document.getElementById('condition-select');
    let remove_btn = <HTMLButtonElement>document.getElementById('remove_btn');
    let remove_all_btn = <HTMLButtonElement>document.getElementById('remove_all_btn');

    let search_input = <HTMLInputElement>document.getElementById('search_input');
    let page_links = <HTMLDivElement>document.getElementById('page_links');

    let current_page_num = <HTMLSpanElement>document.getElementById('current_page_num');

    const PAGE_FILTER_COUNT: number = 10;

    let global_filter: Array<Filter>;

    toastr.options.preventDuplicates = true;
    toastr.options.timeOut = 4000;
    toastr.options.extendedTimeOut = 10000;
    toastr.options.closeButton = true;
    // toastr.options.progressBar = true;
    toastr.options.positionClass = 'toast-top-full-width';

    chrome.storage.sync.get('filter', result => {
        global_filter = result.filter;
        let badge_list: string[] = [];
        let default_list = Object.keys(default_badge);

        global_filter.find(e => {
            let id = e.filter_id;
            if (default_list.includes(id)) {
                badge_list.push(id);
            }
        });
        if(badge_list.length < 4){
            chrome.storage.local.get('default_filter', result=>{

                let default_filter: Array<Filter> = result.default_filter;
                
                default_filter.forEach(df=>{
                    if(default_list.includes(df.filter_id)){
                        add_filter_object(filter_type.Include, filter_category.Badge_UUID, df.value, df.filter_id);
                    }
                });

            });
        }
        display_filter_list(1);
    });

    function translateHTML(){

        document.getElementsByTagName('title')[0].textContent = 'TBC - ' + chrome.i18n.getMessage('f_title');
        document.getElementById('f_title')!.textContent = chrome.i18n.getMessage('f_title');
        document.getElementById('add_title')!.textContent = chrome.i18n.getMessage('f_add_desc');

        let doc_link = document.createElement('a');
        doc_link.setAttribute('href', '');
        doc_link!.textContent = chrome.i18n.getMessage('f_desc_link');

        let add_desc = document.getElementById('add_title');
        add_desc!.textContent = chrome.i18n.getMessage('f_add_desc');
        add_desc!.appendChild(doc_link);

        document.getElementById('cat_option_login')!.textContent = chrome.i18n.getMessage('f_nickname');
        document.getElementById('cat_option_badge')!.textContent = chrome.i18n.getMessage('f_badge_link');
        document.getElementById('cond_option_include')!.textContent = chrome.i18n.getMessage('f_include');
        document.getElementById('cond_option_exclude')!.textContent = chrome.i18n.getMessage('f_exclude');

        document.getElementById('add_condition')!.textContent = chrome.i18n.getMessage('f_add');

        let search_input = <HTMLInputElement>document.getElementById('search_input');
        let cond_input = <HTMLInputElement>document.getElementById('condition_value');

        search_input.placeholder = chrome.i18n.getMessage('f_search_ph');
        cond_input.placeholder = chrome.i18n.getMessage('f_nickname_ph');

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

    window.addEventListener('load', e => {
        translateHTML();
    });

    function FilterToArray(filter: Filter) {
        return Object.keys(filter).map(el => filter[el]);
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
    function display_filter_list(page_num: number, filter?: Array<Filter>) {

        if (page_num <= 0 || !page_num) return false;
        let filter_ = global_filter;
        if (filter) filter_ = filter;

        current_page_num.setAttribute('cur_pg_num', String(page_num));

        let list_container = <HTMLDivElement>document.getElementById('list_container');

        remove_filter_list(list_container);

        let filter_len = filter_.length;

        let link_count = calc_page_num(filter_len, PAGE_FILTER_COUNT);
        set_page_links(page_links, page_num, link_count);

        let start_num = (PAGE_FILTER_COUNT * page_num) - (PAGE_FILTER_COUNT);
        let end_num = start_num + PAGE_FILTER_COUNT;

        // 필터 개수가 end_num 보다 작으면, end_num 의 값을 end_num 과 filter_len 의 차이만큼 감소.
        if (end_num > filter_len) {
            end_num = end_num - (end_num - filter_len);
        }

        for (let i = start_num; i < end_num; i++) {
            add_filter_list(filter_[i], list_container);
        }
    }

    function add_filter_list(filter: Filter, list_container?: HTMLDivElement) {
        if (!list_container) {
            list_container = <HTMLDivElement>document.getElementById('list_container');
        }
        let f_filter_id = filter.filter_id;
        let f_category = filter.category;
        let f_filter_type = filter.filter_type;
        let f_value = filter.value;

        let list = <HTMLDivElement>document.createElement('div');
        let component = <HTMLDivElement>document.createElement('div');
        let input = <HTMLInputElement>document.createElement('input');
        let category = <HTMLSpanElement>document.createElement('span');
        let badge_icon = <HTMLImageElement>document.createElement('img');
        let value = <HTMLSpanElement>document.createElement('span');
        let condition = <HTMLSpanElement>document.createElement('span');

        list.classList.add('list');
        component.classList.add('component');
        component.setAttribute('filter_id', f_filter_id);
        input.setAttribute('type', 'checkbox');
        input.classList.add('checkbox');

        category.classList.add('category');
        badge_icon.classList.add('badge_icon')
        value.classList.add('value');
        condition.classList.add('condition');

        category.setAttribute('name', f_category);
        value.setAttribute('name', f_value);
        condition.setAttribute('name', f_filter_type);

        if (f_category === filter_category.Badge_UUID) {
            category.innerText = chrome.i18n.getMessage('f_badge');
            badge_icon.setAttribute('src', 'https://static-cdn.jtvnw.net/badges/v1/' + f_value + '/1');
        } else if (f_category === filter_category.Login_name) {
            category.innerText = chrome.i18n.getMessage('f_nickname');
        }
        value.innerText = f_value;
        if (f_filter_type === filter_type.Include) {
            condition.innerText = chrome.i18n.getMessage('f_include');
        } else if (f_filter_type === filter_type.Exclude) {
            condition.innerText = chrome.i18n.getMessage('f_exclude');
        }

        component.appendChild(input);
        component.appendChild(category);
        component.appendChild(badge_icon);
        component.appendChild(value);
        component.appendChild(condition);
        list.appendChild(component);
        list_container.appendChild(list);
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

    function add_filter_object(f_type?:string, f_category?:string, f_val?:string, f_key?: string){

        if(!global_filter) return;

        let new_filter: any = {};

        if(!(f_type && f_category && f_val && f_key)){
            // 사용자 입력을 가져와 추가.
            f_type = condition_select.value;
            f_category = category_select.value;
            f_val = condition_value.value;
            f_key = getRandomString();
        }

        //console.debug('f_type : %o, f_category : %o, f_val : %o, f_key : %o', f_type, f_category, f_val, f_key);

        let searched_filter = global_filter.some(f => {
            let v = <string>f.value;
            let c = <string>f.category;
            if (f_category === c && f_val === v) return true;
        });

        if (searched_filter) {
            toastr.warning(chrome.i18n.getMessage('f_msg_already'));
            init_filter_input();
            return;
        }

        global_filter.some(f => {
            let id = <string>f.filter_id;

            while(f_key === id){
                // f_key 와 id 가 같으면 중복이므로, 조건을 만족하지 않을 때까지 f_key 를 재생성합니다. 
                f_key = getRandomString();
            }
            return true;
        });

        if (f_val === '') {
            toastr.warning(chrome.i18n.getMessage('f_no_value'));
            return;
        }

        new_filter.category = f_category;
        new_filter.filter_type = f_type;
        new_filter.value = f_val;
        new_filter.filter_id = f_key;

        global_filter.push(new_filter);

        chrome.storage.sync.set({ filter: global_filter }, function () {
            let page_num = calc_page_num(global_filter.length, PAGE_FILTER_COUNT);
            toastr.success(chrome.i18n.getMessage('f_added'));
            init_filter_input();
            condition_value.value = '';
            display_filter_list(page_num);
        });
    }

    function set_page_links(page_links: HTMLDivElement, page_num: number, count: number) {
        Array.from(page_links.getElementsByClassName('page_link')).forEach(e => {
            e.remove();
        })
        for (let i = 1; i <= count; i++) {
            let page_link = document.createElement('span');
            page_link.classList.add('page_link');
            if(i === page_num){
                page_link.classList.add('curr');
            }
            page_link.setAttribute('page_num', String(i));
            page_link.textContent = "[" + i + "]";
            page_links.appendChild(page_link)
            // if (i >= 10) {
            //     let next = document.createElement('span');
            //     next.classList.add('next');
            //     page_links.appendChild(next);
            //     return;
            // }
            page_links.appendChild(page_link)
        }
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
        let filter:Array<Filter | filter_metadata> = JSON.parse(String(target.result));
        let meta_avail = filter.some((f, i)=>{
            let fm = f as filter_metadata;
            if(fm.date && fm.version){
                filter.splice(i, 1);
                return true;
            }
        });
        if(!meta_avail){
            toastr.error(chrome.i18n.getMessage('f_upload_error'));
            return false;
        }
        chrome.storage.sync.set({filter}, ()=>{
            global_filter = filter as Array<Filter>;
            toastr.success(chrome.i18n.getMessage('f_upload_done'));
            display_filter_list(1);
        });
    }



    add_btn.addEventListener('click', e => {
        let f_type = condition_select.value;
        let f_category = category_select.value;
        let f_val = condition_value.value;

        let valid = validate_badge_url(f_val);

        if (f_category === filter_category.Badge_UUID) {
            if (valid) {
                f_val = uuid_from_url(f_val);
            } else {
                // 배지 추가인데 링크가 유효하지 않은 경우
                toastr.warning(chrome.i18n.getMessage('f_link_invalid'));
                return false;
            }

        }

        add_filter_object(f_type, f_category, f_val, getRandomString());
    });

    category_select.addEventListener('change', e => {

        let value = category_select.value;

        if (value === filter_category.Badge_UUID) {
            condition_value.placeholder = chrome.i18n.getMessage('f_badge_ph');
        } else if (value === filter_category.Login_name) {
            condition_value.placeholder = chrome.i18n.getMessage('f_nickname_ph');
        }

    });

    condition_value.addEventListener('keyup', e=>{
        if (e.key === 'Enter') add_btn.click();
    });

    condition_value.addEventListener('input', e => {

        let input_val = condition_value.value;

        if(validate_badge_url(input_val)){
            category_select.value = filter_category.Badge_UUID;
        }else{
            // 배지 링크가 유효하지 않은 경우
            category_select.value = filter_category.Login_name;
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

        let searched_filter = global_filter.filter(f => {
            let val = <string>f.value.toLowerCase();
            let input_val = search_input.value.toLowerCase();
            if (val.includes(input_val)) return true;
        });
        let page_num = calc_page_num(searched_filter.length, PAGE_FILTER_COUNT);

        if(search_input.value === ''){
            page_num = 1;
        }

        display_filter_list(page_num, searched_filter);
    });

    remove_btn.addEventListener('click', e => {
        // create filter object by elements
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
                    for (let i = 0; i < global_filter.length; i++) {
                        if (global_filter[i].filter_id === filter_id) {
                            global_filter.splice(i, 1);
                            return;
                        }
                    }
                } else {
                    toastr.warning(chrome.i18n.getMessage('f_rm_default'));
                }
            }
        });

        chrome.storage.sync.set({ filter: global_filter }, () => {
            toastr.success(chrome.i18n.getMessage('f_done'));
            let page_num = <string>current_page_num.getAttribute('cur_pg_num');
            let new_page_num = calc_page_num(global_filter.length, PAGE_FILTER_COUNT);

            if (parseInt(page_num) > new_page_num) {
                page_num = String(new_page_num);
            }

            checkbox_head.checked = false;
            display_filter_list(parseInt(page_num));
        });
    });
    remove_all_btn.addEventListener('click', e => {
        if(!confirm(chrome.i18n.getMessage('f_ask_rm_all'))) return;
        let default_index: Array<number> = []; // filter 객체에서 default 배지의 인덱스 값을 저장합니다.
        global_filter.forEach((e, i) => {
            if (Object.keys(default_badge).includes(e.filter_id)) {
                default_index.push(i);
            }
        });
        default_index.sort();
        global_filter.splice(default_index[default_index.length - 1] + 1, global_filter.length);

        chrome.storage.sync.set({ filter: global_filter }, () => {
            toastr.success(chrome.i18n.getMessage('f_all_rm'));
            display_filter_list(1);
        });

    });

    page_links.addEventListener('click', function(e){
        let target = <HTMLSpanElement>e.target;
        let page_num = <string>target.getAttribute('page_num');

        target.classList.add('curr')
        display_filter_list(parseInt(page_num));
    });

    backup_filter.addEventListener('click', e => {
        // 확장 버전, 파일 생성 날짜
        chrome.storage.sync.get('filter', result => {
            let filter: Array<Filter | filter_metadata> = result.filter;

            let today = new Date();
            let year = today.getFullYear();
            let month = ('0' + (today.getMonth() + 1)).slice(-2);
            let day = ('0' + today.getDate()).slice(-2);
            let dateString = year + '-' + month + '-' + day;

            filter.unshift({
                version : chrome.runtime.getManifest().version,
                date : new Date().getTime()
            });

            let FilterArray = JSON.stringify(filter, null, 4);

            let vLink = document.createElement('a'),
                vBlob = new Blob([FilterArray], { type: "octet/stream" }),
                vName = dateString + '_filter_backup.tbc',
                vUrl = window.URL.createObjectURL(vBlob);
            vLink.setAttribute('href', vUrl);
            vLink.setAttribute('download', vName);
            vLink.click();
        });
    });

    import_filter.addEventListener('change', e=>{
        
        let files = (<HTMLInputElement>e.target).files;
        let reader = new FileReader();
        reader.onload = onReaderLoad;
        if(files){
            reader.readAsText(files[0]);
        } 
    });

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (var key in changes) {

            let newValue = changes[key].newValue;

            if (key === 'filter') {
                global_filter = newValue;
            }

        }
    });

})();