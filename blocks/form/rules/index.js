import { submitSuccess, submitFailure } from '../submit.js';

export async function applyRuleEngine(htmlForm, worker) {
  htmlForm.addEventListener('change', (e) => {
    const field = e.target;
    const { id, value } = field;
    const payload = { id };
    if (field.type === 'checkbox') {
      payload.checked = field.checked;
    } else {
      payload.value = value;
    }
    worker.postMessage({
      name: 'change',
      payload,
    });
  });

  htmlForm.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const payload = { id: e.target.id };
      worker.postMessage({
        name: 'click',
        payload,
      });
    }
  });
}

function handleRuleEngineEvent(e, form) {
  const { data: { name, id, payload } } = e;
  if (name === 'fieldChanged') {
    const { changes } = payload;
    changes.forEach((change) => {
      const { propertyName, currentValue } = change;
      const field = form.querySelector(`#${id}`);
      switch (propertyName) {
        case 'required':
          if (currentValue === true) {
            field.closest('.field-wrapper').dataset.required = '';
          } else {
            field.closest('.field-wrapper').removeAttribute('data-required');
          }
          break;
        case 'value':
          field.value = currentValue;
          break;
        case 'visible':
          if (currentValue === true) {
            field.closest('.field-wrapper').dataset.hidden = 'false';
          } else {
            field.closest('.field-wrapper').dataset.hidden = 'true';
          }
          break;
        case 'enabled':
          field.disabled = !currentValue;
          break;
        default:
          break;
      }
    });
  } else if (name === 'submitSuccess') {
    submitSuccess(e, form);
  } else if (name === 'submitFailure') {
    // eslint-disable-next-line no-alert
    alert('submit failed');
  }
}

export async function enableRuleEngine(formDef, renderHTMLForm) {
  const myWorker = new Worker('/blocks/form/rules/RuleEngineWorker.js', { type: 'module' });

  myWorker.postMessage({
    name: 'init',
    payload: formDef,
  });

  return new Promise((resolve) => {
    let form;
    myWorker.addEventListener('message', async (e) => {
      if (e.data.name === 'init') {
        form = await renderHTMLForm(e.data.payload);
        applyRuleEngine(form, myWorker);
        resolve(form);
      } else {
        handleRuleEngineEvent(e, form);
      }
    });
  });
}
