import { CONTINUE, visit } from 'unist-util-visit';

function getAnchorUrl(node) {
    while (node != null && node.tagName !== 'a') {
        node = node.children?.[0];
    }

    if (node && node.tagName === 'a') {
        const { properties } = node;
        if (properties && properties.href) {
            return properties.href;
        }
    }
}
export function extractFormUrls({ content }) {
    const formUrls = [];
    const { hast } = content;
    const els = {
      div: 'className'
    };
  
    visit(hast, (node) => {
      if (node.type !== 'element') {
        return CONTINUE;
      }
      const attr = els[node.tagName];
      if (attr) {
        const className = node.properties[attr];
        if (className instanceof Array && className.includes('form')) {
            const formURL = getAnchorUrl(node);
            formUrls.push(formURL.replace('jcr:content', 'jcrcontent'));
        }
      }
      return CONTINUE;
    });
    return formUrls;
}