
export function isAdaptiveForm(path) {
    return path?.startsWith('/content/forms/af/');
}

export function getFormModelPath(path) {
    if (isAdaptiveForm(path) && path.endsWith(".json")) {
      path = path.replace(".json", "/jcr:content/guideContainer.model.json");
    } else if (path.endsWith('container.json')) {
        path = path.replace('.json', '.model.json');
    }
    return path;
}

export async function generateAFJSONResource(path, headers) {
    if (path && headers) {
        if (path.endsWith('.html')) {
            path = path.substring(0, path.length - 5);
        }
        var requestOptions = {
            method: 'POST',
            headers: headers
        };
    
        const resp = await fetch(`https://admin.hlx.page/preview/jalagari/forms-xwalk/main/${path}.json`, requestOptions)
        console.log('JSON Content generation Response', resp.status);
    }
}