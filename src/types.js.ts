export interface Filter {
    filter_id: string;
    category: string;
    filter_type: string;
    value: string;
}

export enum filter_type {
    Include = 'include',
    Exclude = 'exclude'
}

export enum filter_category {
    Badge_UUID = 'badge_uuid',
    Login_name = 'login_name'
}

export enum default_badge {
    streamer = 'streamer',
    manager = 'manager',
    vip = 'vip',
    verified = 'verified'
}
