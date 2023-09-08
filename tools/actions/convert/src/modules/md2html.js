/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { toHast as mdast2hast, defaultHandlers } from 'mdast-util-to-hast';
import { raw } from 'hast-util-raw';
import remarkGridTable from '@adobe/remark-gridtables';
import {
  mdast2hastGridTablesHandler,
  TYPE_TABLE,
} from '@adobe/mdast-util-gridtables';
import { toHtml } from 'hast-util-to-html';
import rehypeFormat from 'rehype-format';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import createPageBlocks from '@adobe/helix-html-pipeline/src/steps/create-page-blocks.js';
import { h } from 'hastscript';
import fixSections from '@adobe/helix-html-pipeline/src/steps/fix-sections.js';
import rewriteUrls from './utils/rewrite-urls.js';
import converterCfg from '../../converter.yaml';

export default function md2html(md, cfg = converterCfg) {
  // note: we could use the entire unified chain, but it would need to be async -
  // which would require too much of a change
  const mdast = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkGridTable)
    .parse(md.md.trim());

  const main = mdast2hast(mdast, {
    handlers: {
      ...defaultHandlers,
      [TYPE_TABLE]: mdast2hastGridTablesHandler(),
    },
    allowDangerousHtml: true,
  });

  const content = {
    hast: main,
    aemURL: cfg.env.aemURL,
    publicURL: cfg.env.publicURL,
  };

  rewriteUrls({ content });
  fixSections({ content });
  createPageBlocks({ content });

  const hast = h('html', [
    h('body', [
      h('header', []),
      h('main', content.hast),
      h('footer', [])]),
  ]);

  raw(hast);
  rehypeFormat()(hast);

  return toHtml(hast, {
    upperDoctype: true,
  });
}
