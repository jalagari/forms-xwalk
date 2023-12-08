/**
 * Sanitizes a string for use as class name.
 * @param {string} name The unsanitized string
 * @returns {string} The class name
 */
function toClassName(name) {
  return typeof name === 'string'
    ? name
      .toLowerCase()
      .replace(/[^0-9a-z]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    : '';
}

export const getId = (function getId() {
  const ids = {};
  return (name) => {
    const slug = toClassName(name);
    ids[slug] = ids[slug] || 0;
    const idSuffix = ids[slug] ? `-${ids[slug]}` : '';
    ids[slug] += 1;
    return `${slug}${idSuffix}`;
  };
}());

export function createLabel(fd, tagName = 'label') {
  const label = document.createElement(tagName);
  label.setAttribute('for', fd.id);
  label.className = 'field-label';
  label.textContent = fd?.label?.visible === false ? '' : fd?.label?.value;
  if (fd.Tooltip) {
    label.title = fd.Tooltip;
  }
  return label;
}

export function createFieldWrapper(fd, tagName = 'div') {
  const fieldWrapper = document.createElement(tagName);
  const nameStyle = fd.name ? ` form-${toClassName(fd.name)}` : '';
  const fieldId = `form-${fd.renderType}-wrapper${nameStyle}`;
  fieldWrapper.className = fieldId;
  if (fd.visible === false) {
    fieldWrapper.dataset.hidden = 'true';
  }
  fieldWrapper.classList.add('field-wrapper');
  fieldWrapper.append(createLabel(fd));
  return fieldWrapper;
}

export function createButton(fd) {
  const wrapper = createFieldWrapper(fd);
  const button = document.createElement('button');
  button.textContent = fd?.label?.value || '';
  button.type = fd.buttonType;
  button.classList.add('button');
  button.id = fd.id;
  button.name = fd.name;
  wrapper.replaceChildren(button);
  return wrapper;
}
