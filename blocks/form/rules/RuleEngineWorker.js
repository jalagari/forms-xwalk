/* eslint-disable max-classes-per-file */
import { createFormInstance } from './model/afb-runtime.js';

function stripTags(input, allowd) {
  const allowed = ((`${allowd || ''}`)
    .toLowerCase()
    .match(/<[a-z][a-z0-9]*>/g) || [])
    .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
  const tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  const comments = /<!--[\s\S]*?-->/gi;
  return input.replace(comments, '')
    .replace(tags, ($0, $1) => (allowed.indexOf(`<${$1.toLowerCase()}>`) > -1 ? $0 : ''));
}

export function sanitizeHTML(input) {
  return stripTags(input, '<a>');
}

export function getItems(container) {
  return container[':itemsOrder'].map((x) => container[':items'][x]);
}

export default class RuleEngine {
  rulesOrder = {};

  constructor(formDef) {
    console.time('createFormInstance');
    this.form = createFormInstance(formDef);
    this.form.subscribe((e) => {
      postMessage({
        name: e.type,
        id: e.payload.field.id,
        payload: {
          changes: e.payload.changes,
        }
      });
    }, 'fieldChanged')
    this.form.subscribe((e) => {
      postMessage(({
        name: e.type
      }))
    }, 'submitSuccess');
    this.form.subscribe((e) => {
      postMessage(({
        name: e.type
      }))
    }, 'submitFailure');
    console.timeEnd('createFormInstance');
  }

  getState() {
    return this.form.getState();
  }

  // eslint-disable-next-line class-methods-use-this
  dispatch() { }
}

let ruleEngine;
let field;
onmessage = (e) => {
  switch (e.data.name) {
    case 'init':
      ruleEngine = new RuleEngine(e.data.payload);
      // eslint-disable-next-line no-case-declarations
      console.time('getState');
      const state = ruleEngine.getState();
      console.timeEnd('getState');
      postMessage({
        name: 'init',
        payload: state,
      });
      ruleEngine.dispatch = (e) => {
        postMessage(e);
      };
      break;
    case 'change':
      field = ruleEngine.form.getElement(e.data.payload.id);
      if (field.fieldType === 'checkbox') {
        field.value = e.data.payload.checked ? field.enum[0] : field.enum[1];
      } else {
        field.value = e.data.payload.value;
      }
      break;
    case 'click':
      field = ruleEngine.form.getElement(e.data.payload.id);
      if (field) {
        field.dispatch({
          type: 'click'
        });
      }
    default:
      break;
  }
};
