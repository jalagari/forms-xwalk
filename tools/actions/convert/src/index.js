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

function handleFormPath(path) {
  if (path.startsWith('/content/forms/af') && path.endsWith(".json")) {
    path = path.replace(".json", "/jcr:content/guideContainer.model.json");
  }
  return path;
}

export async function render(path, params, cfg = converterCfg) {
  let mappedPath = mapInbound(path);
  mappedPath = handleFormPath(mappedPath);

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
    return { error: { code: resp.status, message: resp.statusText } };
  }

  if(path.endsWith('.json')) {
    let json = await resp.json();
    if(model !== 'true') {
      json = transformAFToFranklinJSON(json);
    }
    return { json };
  } else {
    const text = await resp.text();
    const { document } = new jsdom.JSDOM(text, { url }).window;
    const md = await WebImporter.html2md(url, document, transformCfg);
    const html = md2html(md);
    return { md, html };
  }
}

export async function main(params) {
  const path = params.__ow_path ? params.__ow_path : '';
  const authorization = params.__ow_headers ? params.__ow_headers.authorization : '';

  const { json, html, error } = await render(path, { ...params, authorization });

  if (!error) {
    return {
      headers: {
        'x-html2md-img-src': converterCfg.env.aemURL,
        'x-aem-resource-src': path,
      },
      statusCode: 200,
      body: html || json,
    };
  }

  return { statusCode: 200, body: error };
}
