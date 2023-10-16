class TransformAFToFranklinJSON {
  ADAPTIVEFORM = 'adaptiveform';

  ITEMS = ':items';

  SOURCE = 'sheet';

  PLAIN_TEXT = 'plaintext';

  PANEL = 'panel';

  CAPITAL_LETTER_REGX = /(?=[A-Z])/

  MUTLI_SELECTION_FIELDS = ['radio-group', 'checkbox-group'];

  errors = [];

  supportedRules = ['visible', 'value'];
  supportedFields = [ 'name', 'description', 'placeholder' ,
  'default', 'value',
  'displayFormat',
  'enum', 'enumNames',
  'step', 'value', 'emptyValue',
  'enabled', 'visible', 'readOnly',
  'richText', 'repeatable', 'multiple',
  'required', 'pattern','maxLength', 'minLength', 'maximum', 'minimum']

  fieldPropertyMapping = {
    fieldType: 'Type',
    maxLength: 'Max',
    minLength: 'Min',
    maximum: 'Max',
    minimum: 'Min',
    required: 'Mandatory',
    enum: 'Options',
    enumNames: 'Option Names',
  };

  rulesMapping = {
    visible: 'Visible Expression',
    value: 'Value Expression',
  }

  fieldMapping = new Map([
    ['SUBMIT', 'submit'],
    ['text-input', 'text'],
    ['number-input', 'number'],
    ['date-input', 'date'],
    ['file-input', 'file'],
    ['drop-down', 'select'],
    ['radio-group', 'radio'],
    ['checkbox-group', 'checkbox'],
    ['plain-text', 'plaintext'],
    ['multiline-input', 'textarea'],
    ['panel', 'fieldset'],
  ]);

  #isAF(def) {
    // eslint-disable-next-line no-prototype-builtins
    return def && def.hasOwnProperty(this.ITEMS);
  }

  #getInitialData() {
    return {
      total: 0,
      data: [],
      ':type': this.SOURCE,
    };
  }

  /**
     * @param {{ :items: any; adaptiveform: any;}} af
     *
     * @return {{data: Array, total: number}} response
     */
  transform(af) {
    const result = this.#getInitialData();
    this.errors = [];

    if (this.#isAF(af)) {
      this.data = [];
      this.#transform(af[this.ITEMS]);
      result.data = this.data;
      result.total = this.data.length;
      result.limit = this.data.length;
      result.offset = 0;
    }
    return result;
  }

  #transform(items, parentName = undefined) {
    for (const [key, item] of Object.entries(items)) {
      if (this.#isMultiSelectionField(item)) {
        this.#handleMultiSelectionField(item, parentName);
      } else {
        const field = {
          Fieldset: parentName,
         };
         this.#copyProperties(field, item);
         this.#handleRules(field, item);
         this.data.push(field);
         if (this.#isPanel(item)) {
           this.#transform(item[this.ITEMS], item.name);
         } else {
           this.#handleCheckbox(field, item);
           this.#handleOptions(field);
           this.#handlePlainTextField(field, item);
           this.#handleSubmitButton(field, item)
         }
      }
    }
  }

  #copyProperties(field, item) {
    this.supportedFields.forEach((key) => {
      if (item[key] !== undefined) {
        const updateKey = this.fieldPropertyMapping[key] || this.#camelCaseToWords(key);
        field[updateKey] = item[key];
      }
    });
    field.Label = item?.label?.value || item?.title;
    field.Type = this.#getFieldType(item.fieldType || item.type);
  }

  #handleSubmitButton(field, item) {
    if (item.buttonType === 'submit' || field.type === 'submit') {
      field.Type = 'submit';
    }
  }

  #handleOptions(field) {
    if (field.Options) {
      field.Options = field.Options.join(',');
    }

    if (field["Option Names"]) {
      field["Option Names"] = field["Option Names"].join(',');
    }
  }  

  #handleCheckbox(field, item) { 
    if (field.Type === 'checkbox') {
      field.Value = item.value || true;
    }
  }

  #handlePlainTextField(field, item) {
    if (!field.Type || field.Type === this.PLAIN_TEXT) {
      field.Label = item.text;
    }
  }

  #handleMultiSelectionField(item, parentName = '') {
    if (item.options) {
      this.data.push({ Name: `${item.name}FS`, Type: 'fieldset', Fieldset: parentName });
      const options = item.enumNames || item.enum;
      const enumValues = item.enum;
      options?.forEach((option, index) => {
          const field = {
            Fieldset: `${item.name}FS`,
          };
          this.#copyProperties(item, field);
          field.Label = option;
          field.Value = enumValues?.[index] || option;
          this.data.push(field);
      });
    }
  }

  #transformExpression(expression) {
    return expression.replace(/.\$value/g, '');
  }

  #handleRules(field, item) {
    if (item.rules) {
      const rules = item.rules;
      for (const [key, value] of Object.entries(rules)) {
        if (this.supportedRules.includes(key)) {
          field[this.rulesMapping[key]] = this.#transformExpression(value);
        }
      }
    }
  }

  #getFieldType(fieldType) {
    return this.fieldMapping.get(fieldType) || fieldType || this.PLAIN_TEXT;
  }

  #camelCaseToWords(camelCaseString) {
    const words = camelCaseString.split(this.CAPITAL_LETTER_REGX);
    const sentence = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return sentence;
  }

  #isMultiSelectionField(field) {
    return field && this.MUTLI_SELECTION_FIELDS.includes(field.fieldType);
  }

  #isPanel(field) {
    return field && field.fieldType === this.PANEL;
  }
}

export default function transformAFToFranklinJSON(af) {
  const transformer = new TransformAFToFranklinJSON();
  return transformer.transform(af);
}