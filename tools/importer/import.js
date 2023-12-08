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

/* global WebImporter */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import DomBuilder from './dom-builder.js';

// helix-importer-ui <-> node compatibility:
if (window) window.decodeHtmlEntities = (text) => text; // not-needed in browser

const TRANSFORMERS = [
  {
    pattern: /.*/,
    transformers: [
      'transform-forms.js',
    ],
  },
];

let count = 0;

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transformDOM: async ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const { pathname } = new URL(url);
    const main = document.body;
    const topLevelGrid = main;
    const dom = new DomBuilder(document);

    const moduleUrl = new URL(import.meta.url);
    const moduleSearch = moduleUrl.search ? `?${count += 1}` : '';

    for (const def of TRANSFORMERS) {
      const { pattern, transformers } = def;
      if (pathname.match(pattern)) {
        for (const file of transformers) {
          let transformFn;
          if (typeof file === 'function') {
            transformFn = file;
          } else {
            const transformerModule = await import(`./transformers/${file}${moduleSearch}`);
            transformFn = transformerModule.default;
          }
          await transformFn({
            main,
            pathname,
            document,
            dom,
            params,
            url,
            topLevelGrid,
          });
        }
      }
    }

    return main;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '')),
};
