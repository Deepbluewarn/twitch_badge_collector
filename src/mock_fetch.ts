import { base_url } from "./const";

const { fetch: origFetch } = window;

let bodyBuffer: any[] = [];
let onFrameLoaded = false;

window.fetch = async (...args) => {
    const response = await origFetch(...args);

    if(response.url === 'https://gql.twitch.tv/gql'){
        response.clone().json().then(body => {
            if(!Array.isArray(body)) return;
            for(let b of body){
                if(b.extensions.operationName === 'VideoCommentsByOffsetOrCursor'){
                    bodyBuffer.push(b);
                }
            }
            
            postBodyMessage(bodyBuffer);
        });
    }
    
    return response;
};

window.onmessage = (e) => {
    if(e.origin !== 'https://wtbc.bluewarn.dev') return;
    if(onFrameLoaded) return;
    if(e.data.sender !== 'wtbc') return;
    if(e.data.body !== 'READY') return;

    onFrameLoaded = true;

    if(bodyBuffer.length > 0){
        postBodyMessage(bodyBuffer);
    }
}

const postBodyMessage = (body: any) => {
    const frame = <HTMLIFrameElement>document.getElementById('wtbc-replay');

    if(!frame) return;

    for(let b of body){
        if(b.extensions.operationName === 'VideoCommentsByOffsetOrCursor'){
            if(!onFrameLoaded) return;

            frame.contentWindow?.postMessage({
                sender: 'tbc', body: [{
                    tbc_messageId: 'omitted',
                    type: 'wtbc-replay',
                    value: b,
                }]
            }, base_url);

            bodyBuffer = [];
        }
    }
}