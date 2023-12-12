import {
  createButton, createFieldWrapper, createLabel, getHTMLRenderType,
} from './util.js';
import { enableRuleEngine } from './rules/index.js';
import env from '../../converter.js';

function generateUnique() {
  return new Date().valueOf() + Math.random();
}

export function constructPayload(form) {
  const payload = { __id__: generateUnique() };
  [...form.elements].forEach((fe) => {
    if (fe.name) {
      if (fe.type === 'radio') {
        if (fe.checked) payload[fe.name] = fe.value;
      } else if (fe.type === 'checkbox') {
        if (fe.checked) payload[fe.name] = payload[fe.name] ? `${payload[fe.name]},${fe.value}` : fe.value;
      } else if (fe.type !== 'file') {
        payload[fe.name] = fe.value;
      }
    }
  });
  return { payload };
}

async function submissionFailure(error, form) {
  // eslint-disable-next-line no-alert
  alert(error); // TODO define error mechansim
  form.setAttribute('data-submitting', 'false');
  form.querySelector('button[type="submit"]').disabled = false;
}

async function prepareRequest(form, transformer) {
  const { payload } = constructPayload(form);
  const headers = {
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({ data: payload });
  const url = form.dataset.action;
  if (typeof transformer === 'function') {
    return transformer({ headers, body, url }, form);
  }
  return { headers, body, url };
}

async function submitForm(form, transformer) {
  try {
    const { headers, body, url } = await prepareRequest(form, transformer);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });
    if (response.ok) {
      window.location.href = form.dataset?.redirect || 'thankyou';
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (error) {
    submissionFailure(error, form);
  }
}

async function handleSubmit(form, transformer) {
  if (form.getAttribute('data-submitting') !== 'true') {
    form.setAttribute('data-submitting', 'true');
    await submitForm(form, transformer);
  }
}

function setPlaceholder(element, fd) {
  if (fd.placeHolder) {
    element.setAttribute('placeholder', fd.placeHolder);
  }
}

const constraintsDef = Object.entries({
  'password|tel|email|text': [['maxLength', 'maxlength'], ['minLength', 'minlength'], 'pattern'],
  'number|range|date': [['maximum', 'Max'], ['minimum', 'Min'], 'step'],
  file: ['accept', 'Multiple'],
  fieldset: [['maxOccur', 'data-max'], ['minOccur', 'data-min']],
}).flatMap(([types, constraintDef]) => types.split('|')
  .map((type) => [type, constraintDef.map((cd) => (Array.isArray(cd) ? cd : [cd, cd]))]));

const constraintsObject = Object.fromEntries(constraintsDef);

function setConstraints(element, fd) {
  const renderType = getHTMLRenderType(fd);
  const constraints = constraintsObject[renderType];
  if (constraints) {
    constraints
      .filter(([nm]) => fd[nm])
      .forEach(([nm, htmlNm]) => {
        element.setAttribute(htmlNm, fd[nm]);
      });
  }
}

function createHelpText(fd) {
  const div = document.createElement('div');
  div.className = 'field-description';
  div.setAttribute('aria-live', 'polite');
  div.innerHTML = fd.description;
  div.id = `${fd.id}-description`;
  return div;
}

function createSubmit(fd) {
  const wrapper = createButton(fd);
  const button = wrapper.querySelector('button');
  button.id = '';
  button.name = ''; // removing id and name from button otherwise form.submit() will not work
  return wrapper;
}

function createInput(fd) {
  const input = document.createElement('input');
  input.type = getHTMLRenderType(fd);
  setPlaceholder(input, fd);
  setConstraints(input, fd);
  return input;
}

const withFieldWrapper = (element) => (fd) => {
  const wrapper = createFieldWrapper(fd);
  wrapper.append(element(fd));
  return wrapper;
};

const createTextArea = withFieldWrapper((fd) => {
  const input = document.createElement('textarea');
  setPlaceholder(input, fd);
  return input;
});

const createSelect = withFieldWrapper((fd) => {
  const select = document.createElement('select');
  select.required = fd.required;
  select.title = fd.tooltip ?? '';
  select.readOnly = fd.readOnly;
  select.multiple = fd.type === 'string[]' || fd.type === 'boolean[]' || fd.type === 'number[]';
  if (fd.placeHolder) {
    const ph = document.createElement('option');
    ph.textContent = fd.placeHolder;
    ph.setAttribute('selected', '');
    ph.setAttribute('disabled', '');
    ph.setAttribute('value', '');
    select.append(ph);
  }

  const addOption = (label, value) => {
    const option = document.createElement('option');
    option.textContent = label?.trim();
    option.value = value?.trim() || label?.trim();
    if (fd.value === option.value) {
      option.setAttribute('selected', '');
    }
    select.append(option);
    return option;
  };

  const options = fd?.enum || [];
  const optionNames = fd?.enumNames ?? options;
  options.forEach((value, index) => addOption(optionNames?.[index], value));
  return select;
});

function createRadio(fd) {
  const wrapper = createFieldWrapper(fd);
  wrapper.insertAdjacentElement('afterbegin', createInput(fd));
  return wrapper;
}

const createOutput = withFieldWrapper((fd) => {
  const output = document.createElement('output');
  output.name = fd.name;
  output.id = fd.id;
  const displayFormat = fd['Display Format'];
  if (displayFormat) {
    output.dataset.displayFormat = displayFormat;
  }
  output.innerText = fd.value;
  return output;
});

function createHidden(fd) {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.id = fd.id;
  input.name = fd.name;
  input.value = fd.value;
  return input;
}

function createLegend(fd) {
  return createLabel(fd, 'legend');
}

function createFieldSet(fd) {
  const wrapper = createFieldWrapper(fd, 'fieldset');
  wrapper.id = fd.id;
  wrapper.name = fd.name;
  if (fd.id.startsWith('panel-')) {
    wrapper.classList.add('form-panel-wrapper');
  }
  wrapper.replaceChildren(createLegend(fd));
  if (fd.Repeatable && fd.Repeatable.toLowerCase() === 'true') {
    setConstraints(wrapper, fd);
    wrapper.dataset.repeatable = '';
  }
  return wrapper;
}

function createPlainText(fd) {
  const paragraph = document.createElement('p');
  paragraph.textContent = fd.Label;
  const wrapper = createFieldWrapper(fd);
  wrapper.id = fd.id;
  wrapper.replaceChildren(paragraph);
  return wrapper;
}

const fieldRenderers = {
  'drop-down': createSelect,
  'plain-text': createPlainText,
  checkbox: createRadio,
  button: createButton,
  multiline: createTextArea,
  panel: createFieldSet,
  radio: createRadio,
  submit: createSubmit,
  output: createOutput,
  hidden: createHidden,
};

function renderField(fd) {
  const fieldType = fd?.fieldType?.replace('-input', '') ?? 'text';
  const renderer = fieldRenderers[fieldType];
  let field;
  if (typeof renderer === 'function') {
    field = renderer(fd);
  } else {
    field = createFieldWrapper(fd);
    field.append(createInput(fd));
  }
  if (fd.description) {
    field.append(createHelpText(fd));
    field.dataset.description = fd.description; // In case overriden by error message
  }
  return field;
}

async function fetchForm(pathname) {
  // get the main form
  const resp = await fetch(pathname);
  const json = await resp.json();
  return json;
}

function colSpanDecorator(field, element) {
  const colSpan = field['Column Span'];
  if (colSpan && element) {
    element.classList.add(`col-${colSpan}`);
  }
}

function inputDecorator(field, element) {
  const input = element?.querySelector('input,textarea,select');
  if (input) {
    input.id = field.id;
    input.name = field.name;
    input.tooltip = field.tooltip;
    input.readOnly = field.readOnly;
    input.autocomplete = field.autoComplete ?? 'off';
    input.disabled = field.enabled === false;
    if (input.type !== 'file') {
      input.value = field.default ?? '';
      if (input.type === 'radio' || input.type === 'checkbox') {
        input.value = field?.enum?.[0] ?? 'on';
        input.checked = field.default === input.value;
      }
    } else {
      input.multiple = field.type === 'file[]';
    }
    if (field.required) {
      input.setAttribute('required', 'required');
    }
    if (field.description) {
      input.setAttribute('aria-describedby', `${field.id}-description`);
    }
  }
}

const layoutDecorators = {
  'formsninja/components/adaptiveForm/wizard': 'wizard',
};

async function applyLayout(panel, element) {
  const { ':type': type = '' } = panel;
  if (type && layoutDecorators[type]) {
    const layout = layoutDecorators[type];
    const module = await import(`./layout/${layout}.js`);
    if (module && module.default) {
      const layoutFn = module.default;
      layoutFn(element);
    }
  }
}

export async function generateFormRendition(panel, container) {
  const { ':items': items = [] } = panel;
  // eslint-disable-next-line no-unused-vars
  Object.entries(items).forEach(([key, field]) => {
    field.value = field.value ?? '';
    const element = renderField(field);
    inputDecorator(field, element);
    colSpanDecorator(field, element);
    container.append(element);
    if (field?.fieldType === 'panel') {
      generateFormRendition(field, element);
    }
  });
  await applyLayout(panel, container);
}

function getFieldContainer(fieldElement) {
  const wrapper = fieldElement?.closest('.field-wrapper');
  let container = wrapper;
  if ((fieldElement.type === 'radio' || fieldElement.type === 'checkbox') && wrapper.dataset.fieldset) {
    container = fieldElement?.closest(`fieldset[name=${wrapper.dataset.fieldset}]`);
  }
  return container;
}

function updateorCreateInvalidMsg(fieldElement) {
  const container = getFieldContainer(fieldElement);
  let element = container.querySelector(':scope > .field-description');
  if (!element) {
    element = createHelpText({ Id: fieldElement.id });
    container.append(element);
  }
  if (fieldElement.validationMessage) {
    element.classList.add('field-invalid');
    element.textContent = fieldElement.validationMessage;
  } else if (container.dataset.description) {
    element.classList.remove('field-invalid');
    element.textContent = container.dataset.description;
  } else if (element) {
    element.remove();
  }
  return element;
}

export async function createForm(formDef) {
  const { action: formPath } = formDef;
  const form = document.createElement('form');
  form.dataset.action = formPath;
  form.noValidate = true;
  await generateFormRendition(formDef, form);
  form.querySelectorAll('input,textarea,select').forEach((el) => {
    el.addEventListener('invalid', () => updateorCreateInvalidMsg(el));
    el.addEventListener('change', () => updateorCreateInvalidMsg(el));
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const valid = form.checkValidity();
    if (valid) {
      e.submitter.setAttribute('disabled', '');
      handleSubmit(form);
    } else {
      const firstInvalidEl = form.querySelector(':invalid:not(fieldset)');
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
  return form;
}

export default async function decorate(block) {
  let container = block.querySelector('a[href$=".json"]');
  let formDef;
  if (container) {
    const { pathname } = new URL(container.href);
    formDef = await fetchForm(pathname);
  } else {
    container = block.querySelector('pre');
    const codeEl = container?.querySelector('code');
    const content = codeEl?.textContent;
    if (content) {
      formDef = JSON.parse(content?.replace(/\n|\s\s+/g, ''));
    }
  }
  if (formDef) {
    formDef.action = env.publish + formDef.action;
    const form = await enableRuleEngine(formDef, createForm);
    container.replaceWith(form);
  }
}
