import { Filter, filter_metadata, filter_category, filter_type, default_badge } from './types.js';
(function () {

    let DEBUG_CURRENT_FILTER = <HTMLButtonElement>document.getElementById('DEBUG_CURRENT_FILTER');
    let backup_filter = <HTMLButtonElement>document.getElementById('backup_filter');
    let import_filter = <HTMLInputElement>document.getElementById('import_filter');
    let filter_upload = <HTMLDivElement>document.getElementById('filter_upload');
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

    function FilterToArray(filter: Filter) {
        return Object.keys(filter).map(el => filter[el]);
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
        set_page_links(page_links, link_count);

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
            category.innerText = '배지'
            badge_icon.setAttribute('src', 'https://static-cdn.jtvnw.net/badges/v1/' + f_value + '/1');
        } else if (f_category === filter_category.Login_name) {
            category.innerText = '닉네임'
        }
        value.innerText = f_value;
        if (f_filter_type === filter_type.Include) {
            condition.innerText = '포함';
        } else if (f_filter_type === filter_type.Exclude) {
            condition.innerText = '제외';
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
            // f_key = String(global_filter.length);
            f_key = Math.random().toString(36).substr(2,11);
        }

        let searched_filter = global_filter.some(f => {
            let v = <string>f.value;
            let c = <string>f.category;

            if (f_category === c && f_val === v) return true;

        });
        global_filter.some(f => {
            let id = <string>f.filter_id;

            while(f_key === id){
                // f_key 와 id 가 같으면 중복이므로, 조건을 만족하지 않을 때까지 f_key 를 재생성합니다. 
                f_key = Math.random().toString(36).substr(2,11);
            }
            return true;
        });

        if (Array.isArray(searched_filter) && searched_filter.length != 0) {
            console.debug('중복이 있습니다. : %o', searched_filter);
            return;
        }

        if (f_val === '') {
            console.debug('내용을 입력하세요.');
            return;
        }

        if (f_category === filter_category.Badge_UUID) {

            let badge_uuid:string = "";
            
            try{
                badge_uuid = new URL(f_val).pathname.split('/')[3];
            }catch(e){
                if(e instanceof TypeError){
                    console.debug('올바르지 않은 링크입니다.');
                }
            }finally{
                if(badge_uuid === "") return;
                f_val = badge_uuid;
            }
            
        }

        new_filter.category = f_category;
        new_filter.filter_type = f_type;
        new_filter.value = f_val;
        new_filter.filter_id = f_key;

        global_filter.push(new_filter);

        chrome.storage.sync.set({ filter: global_filter }, function () {
            let page_num = calc_page_num(global_filter.length, PAGE_FILTER_COUNT);
            console.debug('새로운 필터링 조건이 추가되었습니다. filter : %o, page_num : %o', global_filter, page_num);
            condition_value.value = '';
            display_filter_list(page_num);
        });
    }

    function set_page_links(page_links: HTMLDivElement, count: number) {
        console.log('set_page_links count %o : ', count);
        Array.from(page_links.getElementsByClassName('page_link')).forEach(e => {
            e.remove();
        })
        for (let i = 1; i <= count; i++) {
            let page_link = document.createElement('span');
            page_link.classList.add('page_link');
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

    function onReaderLoad(event:ProgressEvent){

        let proceed = confirm('기존 데이터는 삭제됩니다. 계속 할까요?');
        if(!proceed) return proceed;

        let target = <FileReader>event.target;
        let filter:Array<Filter | filter_metadata> = JSON.parse(String(target.result));
        //let filter_metadata = filter[0] as filter_metadata;
        // if(!(filter_metadata.date && filter_metadata.version)){
        //     console.debug('파일 업로드 중 에러가 발생하였습니다. (필터 정보를 찾을 수 없음)');
        //     return false;
        // }
        let meta_avail = filter.some((f, i)=>{
            let fm = f as filter_metadata;
            if(fm.date && fm.version){
                console.debug('filter_metadata : %o', filter[i]);
                filter.splice(i, 1);
                return true;
            }
        });
        if(!meta_avail){
            console.debug('파일 업로드 중 에러가 발생하였습니다. (필터 정보를 찾을 수 없음)');
            return false;
        }
        chrome.storage.sync.set({filter}, ()=>{
            global_filter = filter as Array<Filter>;
            console.debug('백업 파일을 성공적으로 적용하였습니다. : %o', global_filter);
            display_filter_list(1);
        });
    }



    add_btn.addEventListener('click', e => {
        let f_type = condition_select.value;
        let f_category = category_select.value;
        let f_val = condition_value.value;

        add_filter_object(f_type, f_category, f_val);
    });

    category_select.addEventListener('change', e => {

        let value = category_select.value;

        if (value === filter_category.Badge_UUID) {
            condition_value.placeholder = '배지 링크 입력'
        } else if (value === filter_category.Login_name) {
            condition_value.placeholder = '로그인 아이디 입력'
        }

    });

    condition_value.addEventListener('keyup', e => {
        if (e.key === 'Enter') add_btn.click();
    });

    checkbox_head.addEventListener('change', e => {
        let checked = checkbox_head.checked;
        let checkboxes = document.getElementsByClassName('checkbox');
        Array.from(checkboxes).forEach(e => {
            let box = <HTMLInputElement>e;
            box.checked = checked;
        });
    });

    search_input.addEventListener('keyup', e => {

        let searched_filter = global_filter.filter(f => {
            let val = <string>f.value.toLowerCase();
            let input_val = search_input.value.toLowerCase();
            if (val.includes(input_val)) {
                return true;
            }
        });
        let page_num = calc_page_num(searched_filter.length, PAGE_FILTER_COUNT);

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
                    console.debug('기본 배지는 삭제할 수 없습니다.');
                }
            }
        });

        chrome.storage.sync.set({ filter: global_filter }, () => {
            console.debug('처리 완료된 Filter : ', global_filter);

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
        if(!confirm('모두 삭제할까요?')) return;
        let default_index: Array<number> = []; // filter 객체에서 default 배지의 인덱스 값을 저장합니다.
        global_filter.forEach((e, i) => {
            if (Object.keys(default_badge).includes(e.filter_id)) {
                default_index.push(i);
            }
        });
        default_index.sort();
        global_filter.splice(default_index[default_index.length - 1] + 1, global_filter.length);

        chrome.storage.sync.set({ filter: global_filter }, () => {
            console.debug('처리 완료된 Filter : ', global_filter);
            display_filter_list(1);
        });

    });
    page_links?.addEventListener('click', e => {
        let target = (e.target as HTMLSpanElement)
        let page_num = <string>target.getAttribute('page_num');

        current_page_num.setAttribute('cur_pg_num', page_num);

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