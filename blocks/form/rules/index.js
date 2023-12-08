export async function applyRuleEngine(htmlForm, worker) {
  htmlForm.addEventListener('input', (e) => {
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
}

function handleRuleEngineEvent(e) {
  const { data: { name, id, payload } } = e;
  if (name === 'fieldChanged') {
    const { changes } = payload;
    changes.forEach((change) => {
      const { propertyName, currentValue } = change;
      const field = document.getElementById(id);
      switch (propertyName) {
        case 'required':
          if (currentValue === true) {
            field.closest('.field-wrapper').dataset.required = '';
          } else {
            field.closest('.field-wrapper').removeAttribute('data-required');
          }
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
      }
    });
  }
}

export async function enableRuleEngine(formDef, renderHTMLForm) {
  console.time('enableRuleEngine');
  const myWorker = new Worker('/blocks/form/rules/RuleEngineWorker.js', { type: 'module' });

  myWorker.postMessage({
    name: 'init',
    payload: formDef,
  });

  return new Promise((resolve) => {
    myWorker.addEventListener('message', (e) => {
      console.timeEnd('enableRuleEngine');
      console.log('message received from worker', e);
      if (e.data.name === 'init') {
        const form = renderHTMLForm(e.data.payload);
        applyRuleEngine(form, myWorker);
        resolve(form);
      } else {
        handleRuleEngineEvent(e);
      }
    });
  });
}
