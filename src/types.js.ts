export interface Filter {
    filter_id: string;
    category: string;
    filter_type: string;
    note: string;
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
    Badge_UUID = 'badge_uuid',
    Login_name = 'login_name',
    Keyword = 'keyword'
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
