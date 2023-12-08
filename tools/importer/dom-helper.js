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

export function findBlock(el, name) {
  return [...el.querySelectorAll(el.matches('table') ? 'th' : 'table th')]
    .find((th) => th.textContent.toLowerCase() === name.toLowerCase())?.closest('table');
}

export function findValueCellForKey(block, key) {
  return [...block.querySelectorAll('table td:first-child')]
    .find((td) => td.textContent.toLowerCase() === key.toLowerCase())?.nextElementSibling;
}

function findSiblingInSection(el, sel, next) {
  const filter = typeof sel === 'string' ? (e) => e.matches(sel) : (e) => sel(e);
  let nextEl;
  // eslint-disable-next-line no-cond-assign
  while (nextEl = next(el)) {
    if (filter(nextEl)) {
      return nextEl;
    }
    if (nextEl.matches('hr')) {
      // end of section reached
      return null;
    }
    // eslint-disable-next-line no-param-reassign
    el = nextEl;
  }

  return null;
}

export function findNextSiblingInSection(el, sel) {
  return findSiblingInSection(el, sel, (e) => e.nextElementSibling);
}

export function findPrevSiblingInSection(el, sel) {
  return findSiblingInSection(el, sel, (e) => e.previousElementSibling);
}

export function findAncestorWith(el, condition) {
  let ancestor = el;
  while (ancestor && ancestor !== el.ownerDocument && !condition(ancestor)) {
    ancestor = ancestor.parentElement;
  }
  return ancestor;
}

export function findAncestorInContainer(el, container) {
  return findAncestorWith(el, (ancestor) => ancestor?.parentElement === container);
}

export function getAncestorsInContainer(el, container) {
  const ancestors = [];
  let ancestor = el;
  while (ancestor && ancestor !== el.ownerDocument && ancestor?.parentElement !== container) {
    ancestor = ancestor.parentElement;
    ancestors.unshift(ancestor);
  }
  return ancestors;
}
