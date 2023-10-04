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
/* eslint-disable no-console, class-methods-use-this */

// helix-importer-ui <-> node compatibility:
if (window) window.decodeHtmlEntities = (text) => text; // not-needed in browser

const aemURL = `https://publish-p10652-e192853-cmstg.adobeaemcloud.com`;
const submitEndpoint = `/adobe/forms/af/submit/`;

const getFormBlock = (document, formPath, formId) => {
  const formLink = formPath.replace('jcr:content', 'jcrcontent').replace('guideContainer','guidecontainer') + '.json';
  const cells = [
    ['Form'],
    [ `<a href="${formLink}">${formLink}</a>`],
    ['submit', `${aemURL}${submitEndpoint}${formId}`]
  ]; 
 
  return WebImporter.DOMUtils.createTable(cells, document);
}

const transformForm = (main, document) => {

  const aemforms = document.querySelectorAll("form.cmp-adaptiveform-container")
  aemforms?.forEach((aemform) => {
    const {id, dataset: { cmpPath : formPath }} = aemform;
    if (formPath) {
      const table = getFormBlock(document, formPath, id);
      aemform.replaceWith(table);
    }
  });

  const siteForms = document.querySelectorAll(".cmp-form");
  siteForms?.forEach((siteForm) => {
    if (siteForm && siteForm.tagName === 'FORM') {
      const path = siteForm.elements[':formstart']?.value;
      const table = getFormBlock(document, path);
      siteForm.replaceWith(table);
    }
  });
}

const createMetadata = (main, document) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const img = document.querySelector('[property="og:image"]');
  if (img && img.content) {
    const el = document.createElement('img');
    el.src = img.content;
    meta.Image = el;
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

const createCarousel = (main, document) => {
  const carouselItems = [];

  const carousel = document.querySelector('.carousel');
  if (carousel) {
    const items = carousel.querySelectorAll('.cmp-carousel__item');
    items.forEach((item) => {
      const img = item.querySelector('img');
      const text = item.querySelector('.cmp-teaser__content');
      if (img && text) {
        carouselItems.push([img, text]);
      }
    });
    const cells = [
      ['Carousel'],
      ...carouselItems
    ];
    const block = WebImporter.DOMUtils.createTable(cells, document);
    main.prepend(block);
  }
};

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
    const main = document.body;
    transformForm(main, document);
    createCarousel(main, document);

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
    ]);

    // create the metadata block and append it to the main element
    createMetadata(main, document);

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
