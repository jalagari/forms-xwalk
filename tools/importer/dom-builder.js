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

/* eslint-disable no-param-reassign */
/* eslint-disable lines-between-class-members */

/**
 * Example Usage:
 *
 * domEl('main',
 *  div({ class: 'card' },
 *  a({ href: item.path },
 *    div({ class: 'card-thumb' },
 *     createOptimizedPicture(item.image, item.title, 'lazy', [{ width: '800' }]),
 *    ),
 *   div({ class: 'card-caption' },
 *      h3(item.title),
 *      p({ class: 'card-description' }, item.description),
 *      p({ class: 'button-container' },
 *       a({ href: item.path, 'aria-label': 'Read More', class: 'button primary' }, 'Read More'),
 *     ),
 *   ),
 *  ),
 * )
 */

export default class DomBuilder {
  constructor(document) {
    this.document = document;
  }

  /**
     * Helper for more concisely generating DOM Elements with attributes and children
     * @param {string} tag HTML tag of the desired element
     * @param  {[Object?, ...Element]} items: First item can optionally be an object of attributes,
     *  everything else is a child element
     * @returns {Element} The constructred DOM Element
     */
  elem(tag, ...items) {
    const element = this.document.createElement(tag);

    if (!items || items.length === 0) return element;

    const firstItemConstructorName = items[0].constructor.name;

    if (!(firstItemConstructorName === 'Element' || firstItemConstructorName.match(/HTML.*Element/)) && typeof items[0] === 'object') {
      const [attributes, ...rest] = items;
      items = rest;

      Object.entries(attributes).forEach(([key, value]) => {
        if (!key.startsWith('on')) {
          element.setAttribute(key, Array.isArray(value) ? value.join(' ') : value);
        } else {
          element.addEventListener(key.substring(2).toLowerCase(), value);
        }
      });
    }

    items.forEach((item) => {
      const itemConstructorName = items[0].constructor.name;
      item = itemConstructorName === 'Element' || itemConstructorName.match(/HTML.*Element/)
        ? item
        : this.document.createTextNode(item);
      element.appendChild(item);
    });

    return element;
  }

  /*
      More short hand functions can be added for very common DOM elements below.
      domEl function from above can be used for one off DOM element occurrences.
    */
  div(...items) { return this.elem('div', ...items); }
  p(...items) { return this.elem('p', ...items); }
  a(...items) { return this.elem('a', ...items); }
  h1(...items) { return this.elem('h1', ...items); }
  h2(...items) { return this.elem('h2', ...items); }
  h3(...items) { return this.elem('h3', ...items); }
  h4(...items) { return this.elem('h4', ...items); }
  h5(...items) { return this.elem('h5', ...items); }
  h6(...items) { return this.elem('h6', ...items); }
  ul(...items) { return this.elem('ul', ...items); }
  ol(...items) { return this.elem('ol', ...items); }
  li(...items) { return this.elem('li', ...items); }
  i(...items) { return this.elem('i', ...items); }
  img(...items) { return this.elem('img', ...items); }
  span(...items) { return this.elem('span', ...items); }
  form(...items) { return this.elem('form', ...items); }
  input(...items) { return this.elem('input', ...items); }
  label(...items) { return this.elem('label', ...items); }
  button(...items) { return this.elem('button', ...items); }
  iframe(...items) { return this.elem('iframe', ...items); }
  nav(...items) { return this.elem('nav', ...items); }
  fieldset(...items) { return this.elem('fieldset', ...items); }
  article(...items) { return this.elem('article', ...items); }
  strong(...items) { return this.elem('strong', ...items); }
  select(...items) { return this.elem('select', ...items); }
  option(...items) { return this.elem('option', ...items); }
  table(...items) { return this.elem('table', ...items); }
  tbody(...items) { return this.elem('tbody', ...items); }
  thead(...items) { return this.elem('thead', ...items); }
  tr(...items) { return this.elem('tr', ...items); }
  td(...items) { return this.elem('td', ...items); }
  th(...items) { return this.elem('th', ...items); }
  time(...items) { return this.elem('time', ...items); }
  dl(...items) { return this.elem('dl', ...items); }
  dt(...items) { return this.elem('dt', ...items); }
  dd(...items) { return this.elem('dd', ...items); }
  hr(...items) { return this.elem('hr', ...items); }
  br(...items) { return this.elem('br', ...items); }
}
