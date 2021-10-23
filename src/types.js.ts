export interface Filter {
    filter_id: string;
    category: string;
    filter_type: string;
    value: string;
}

export interface filter_metadata {
    version: string;
    date : number;
}

export enum filter_type {
    Include = 'include',
    Exclude = 'exclude',
    Sleep = 'sleep'
}

export enum filter_category {
    Badge_UUID = 'badge_uuid', // f_badge
    Login_name = 'login_name', // f_nickname
    Keyword = 'keyword' // f_keyword
}

export enum default_badge {
    streamer = 'streamer',
    manager = 'manager',
    vip = 'vip',
    verified = 'verified'
}

export const filter_cond_list = [
    'include', 'exclude', 'sleep'
]

export const filter = [
    {filter_id : 'streamer', category : 'badge_uuid', filter_type : 'include', value : '5527c58c-fb7d-422d-b71b-f309dcb85cc1'},
    {filter_id : 'manager', category : 'badge_uuid', filter_type : 'include', value : '3267646d-33f0-4b17-b3df-f923a41db1d0'},
    {filter_id : 'vip', category : 'badge_uuid', filter_type : 'include', value : 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec'},
    {filter_id : 'verified', category : 'badge_uuid', filter_type : 'include', value : 'd12a2e27-16f6-41d0-ab77-b780518f00a3'}
]
