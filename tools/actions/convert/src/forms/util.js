

export function isAdaptiveForm(path) {
    return path?.startsWith('/content/forms/af/');
}

/**
 * Since helix fail if path have equal sign and removed at the time of markdown.
 * Use this method to add equal sign back to path.
 * @param {*} base64String 
 * @returns 
 */
function addMissingEqualSigns(base64String) {
    // Calculate the number of missing equal signs needed for padding
    const missingPadding = (4 - (base64String.length % 4)) % 4;

    // Add the missing equal signs
    const paddedBase64 = base64String + '='.repeat(missingPadding);

    return paddedBase64;
}

function isBase64(input) {
    try {
        const decodedData = atob(input);
        const reencodedData = btoa(decodedData);
        return reencodedData === input;
    } catch (error) {
        // An error occurred during decoding, so it's not valid base64
        return false;
    }
}

export function getFormModelPath(path) {
    if (path && path?.endsWith('.json')) {
        path = path.replace('.json', '').replace('/','');
        path = addMissingEqualSigns(path);
        if (isBase64(path)) {
            path = atob(path);
            if (isAdaptiveForm(path)) {
                path = path + '/jcr:content/guideContainer.model.json';
            } else {
                path = path + '.model.json';
            }
        }
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
    
        const url = `https://admin.hlx.page/preview/jalagari/forms-xwalk/main${path}`;
        const resp = await fetch(url, requestOptions)

        if (!resp.ok) {
            console.log('JSON Content generation failed for', url, `with status ${resp.status}`, resp.headers);
            console.log(`Response: ${resp.statusText}`, requestOptions)
        } else {
            console.log('JSON Content generation Response', resp.status, `for ${path}`);
        }
    }
}