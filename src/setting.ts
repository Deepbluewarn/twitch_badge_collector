import {Filter, filter_category, filter_type} from './types.js';
(function () {
    let add_btn = <HTMLButtonElement>document.getElementById('add_condition');

    let checkbox_head = <HTMLInputElement>document.getElementById('checkbox_head');
    let condition_value = <HTMLInputElement>document.getElementById('condition_value');
    let category_select = <HTMLSelectElement>document.getElementById('category-select');
    let condition_select = <HTMLSelectElement>document.getElementById('condition-select');
    let remove_btn = <HTMLButtonElement>document.getElementById('remove_btn');

    let search_input = <HTMLInputElement>document.getElementById('search_input');
    let page_links = <HTMLDivElement>document.getElementById('page_links');

    let current_page_num = <HTMLSpanElement>document.getElementById('current_page_num');

    const PAGE_FILTER_COUNT: number = 10;

    let global_filter: Array<Filter>;

    chrome.storage.sync.get('filter', result => {
        global_filter = (result.filter);
        console.debug(global_filter);
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
        if(filter) filter_ = filter;

        current_page_num.setAttribute('cur_pg_num', String(page_num));

        let list_container = <HTMLDivElement>document.getElementById('list_container');

        remove_filter_list(list_container);

        let filter_len = filter_.length;

        let link_count = calc_page_num(filter_len, PAGE_FILTER_COUNT);
        set_page_links(page_links, link_count);

        let start_num = (PAGE_FILTER_COUNT * page_num) - (PAGE_FILTER_COUNT);
        let end_num = start_num + PAGE_FILTER_COUNT;

        console.debug('start_num : %o, end_num : %o, filter_len : %o', start_num, end_num, filter_len);

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

    

    add_btn.addEventListener('click', e => {

        let new_filter: any = {};
        let f_type = condition_select.value;
        let category = category_select.value;
        let val = condition_value.value;
        let key = global_filter.length;

        let searched_filter = global_filter.filter(f => {
            let f_value = <string>f.value;
            let f_category = <string>f.category;

            if(f_category === category && f_value === val){
                return true;
            }

        });

        if(Array.isArray(searched_filter) && searched_filter.length != 0){
            console.debug('중복이 있습니다. : %o', searched_filter);
            return;
        }
        
        if(condition_value.value === ''){
            console.debug('내용을 입력하세요.');
            return;
        }

        if(f_type === filter_category.Badge_UUID){
            // 링크 유효성 확인
        }
        
        new_filter.category = category_select.value;
        new_filter.filter_type = f_type;
        new_filter.value = condition_value.value;
        new_filter.filter_id = String(key);

        global_filter.push(new_filter);

        chrome.storage.sync.set({ filter: global_filter }, function () {
            let page_num = calc_page_num(global_filter.length, PAGE_FILTER_COUNT);
            //console.debug('새로운 필터링 조건이 추가되었습니다. filter : %o, page_num : %o', global_filter, page_num);
            condition_value.value = '';
            display_filter_list(page_num);
        });
        
        
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
            let value = <string>f.value;
            if(value.includes(search_input.value)){
                console.debug('검색 결과 : %o', f);
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
                if (!isNaN(Number(filter_id))) { // filter_id 는 숫자만 가능
                    for(let i = 0; i < global_filter.length; i++){
                        if(global_filter[i].filter_id === filter_id){
                            global_filter.splice(i, 1);
                            return;
                        }
                    }
                } else {
                    console.debug('기본 배지는 삭제할 수 없습니다.');
                }


            }
        });

        chrome.storage.sync.set({ filter : global_filter }, () => {
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
    page_links?.addEventListener('click', e => {
        let target = (e.target as HTMLSpanElement)
        let page_num = <string>target.getAttribute('page_num');

        current_page_num.setAttribute('cur_pg_num', page_num);

        display_filter_list(parseInt(page_num));
    });

})();