import { base_url } from "./const";

const { fetch: origFetch } = window;
window.fetch = async (...args) => {
    const response = await origFetch(...args);
    const regex = /^(https:\/\/api\.twitch\.tv\/v5\/videos\/)[0-9]*\/comments/;

    if (regex.test(response.url)) {
        const url = new URL(response.url);

        url.searchParams.get('content_offset_seconds'); // 채팅창 리셋 후 추가.
        url.searchParams.get('cursor'); // 저장된 cursor 와 같으면 채팅 추가.

        response.clone().json().then(body => {
            const frame = <HTMLIFrameElement>document.getElementById('wtbc-replay');
            
            if (frame) {
                frame.contentWindow?.postMessage({
                    sender: 'tbc', body: [{
                        tbc_messageId: 'omitted',
                        type: 'wtbc-replay',
                        body: body,
                        url: response.url
                    }]
                }, base_url);
            }
        })
        .catch(err => console.error(err));
    }
    
    return response;
};