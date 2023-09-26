

export async function transformToMultipart(request, form) {
    const { headers, body, url } = request;
    const newHeaders = {
    };
    const newbody = new FormData();
    newbody.append('submitMetadata', JSON.stringify({lang : "en-US"}));
    const data = JSON.parse(body);
    for(const key in data) {
        newbody.append(key, JSON.stringify(data[key]));
    }
    return {
        body: newbody,
        headers: newHeaders,
        url,
      };
}