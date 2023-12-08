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

import { findBlock, findNextSiblingInSection, findPrevSiblingInSection } from '../dom-helper.js';

export function cleanupEmptySections({ topLevelGrid }) {
  if (topLevelGrid) {
    // remove totally empty sections;
    [...topLevelGrid.children]
      .filter((el, i, a) => {
        if (el.matches('hr')) {
          let nextElements = a.slice(i + 1);
          const nextHr = nextElements.findIndex((s) => s.matches('hr'));
          if (nextHr === 0) {
            // next element is a hr, remove current hr
            return true;
          }
          if (nextHr > 0) {
            // there is a next hr, look only at the content between current and next
            nextElements = nextElements.slice(0, nextHr);
          } // no next hr, look at the remaining content
          const hasContent = nextElements.some((s) => !!s.textContent.trim());
          return !hasContent;
        }
        return false;
      })
      .forEach((hr) => hr.remove());
  }
}

export default function cleanupSections({ topLevelGrid }) {
  if (topLevelGrid) {
    [...topLevelGrid.children]
      // section divider
      .filter((s) => s.matches('hr'))
      .filter((hr, i, a) => {
        if (i === a.length - 1) return true; // always remove the hr if it is the last element
        const prevSectionMeta = findPrevSiblingInSection(hr, (e) => findBlock(e, 'section metadata'));
        const nextSectionMeta = findNextSiblingInSection(hr, (e) => findBlock(e, 'section metadata'));
        return !prevSectionMeta && !nextSectionMeta;
      })
      .forEach((hr) => hr.remove());

    cleanupEmptySections({ topLevelGrid });
  }
}
