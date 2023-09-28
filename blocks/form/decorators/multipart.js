

export async function transformToMultipart(request, form) {
    const { headers, body, url } = request;
    let newbody = body;

    if( typeof body === 'string') {
        newbody = new FormData();
        const data = JSON.parse(body);
        for(const key in data) {
            newbody.append(key, JSON.stringify(data[key]));
        }
    }

    newbody.append('submitMetadata', JSON.stringify({lang : "en-US"}));
    return {
        body: newbody,
        headers,
        url,
      };
}