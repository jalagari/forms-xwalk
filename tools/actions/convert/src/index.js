/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable import/no-relative-packages */
/* eslint-disable no-underscore-dangle */

import fetch from 'node-fetch';
import jsdom from 'jsdom';
import * as WebImporter from '@adobe/helix-importer';
import md2html from './modules/md2html.js';
import transformCfg from '../../../importer/import.js';
import { mapInbound } from './modules/mapping.js';
import converterCfg from '../converter.yaml';
import transformAFToFranklinJSON from './forms/transform.js';
import { generateAFJSONResource, getFormModelPath } from './forms/util.js';
import isBinary from './modules/utils/media-utils.js';


export async function render(path, params, cfg = converterCfg) {
  let mappedPath = mapInbound(path);
  mappedPath = getFormModelPath(mappedPath);

  const { authorization, wcmmode, model = false } = params;
  const url = new URL(mappedPath, cfg.env.aemURL);
  if (wcmmode) {
    url.searchParams.set('wcmmode', wcmmode);
  }

  console.log('Received request for', url.toString());
  console.log('Authorization', authorization);
  const headers = { 'cache-control': 'no-cache' };
  if (authorization) {
    headers.authorization = authorization;
  }

  const resp = await fetch(url, { headers });

  if (!resp.ok) {
    console.log('Request failed for', url, `with status ${resp.status}`, resp.headers);
    return { error: { code: resp.status, message: resp.statusText } };
  }
 let contentType = resp.headers.get('content-type') || 'text/html';
  [contentType] = contentType.split(';');

  const respHeaders = {
    'content-type': contentType,
  };

  if (isBinary(contentType)) {
    const data = Buffer.from(await resp.arrayBuffer());
    return { data, respHeaders };
  }
  let json, md, html, formUrls;

  if(path.endsWith('.json')) {
    json = await resp.json();
    if(model !== 'true') {
      json = transformAFToFranklinJSON(json);
    }
  } else {
    const text = await resp.text();
    const { document } = new jsdom.JSDOM(text, { url }).window;
    md = await WebImporter.html2md(url, document, transformCfg);
    ({html, formUrls} = md2html(md));
    console.log('Form URLs', formUrls);
    for (const formUrl of formUrls) {
      console.log('Generating form JSON for', formUrl);
      await generateAFJSONResource(formUrl, headers);
    }
  }
  console.log('Request succeeded for', url.toString(), `with status ${resp.status}`);
  return { md, html, json, respHeaders };

}

export async function main(params) {
  const path = params.__ow_path ? params.__ow_path : '';
  const authorization = params.__ow_headers ? params.__ow_headers.authorization : '';

  console.log('Received request for', path);
  const { data, json, html, error, respHeaders } = await render(path, { ...params, authorization });
  const body = isBinary(respHeaders['content-type']) ? data.toString('base64') : html;

  if (!error) {
    return {
      headers: {
        ...respHeaders,
        ...(!isBinary(respHeaders['content-type']) && { 'x-html2md-img-src': converterCfg.env.aemURL }),
        'x-aem-resource-src': path,
      },
      statusCode: 200,
      body: body || json,
    };
  }

  return { statusCode: 200, body: error };
}
