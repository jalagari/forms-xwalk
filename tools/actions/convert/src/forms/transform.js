class TransformAFToFranklinJSON {
  ADAPTIVEFORM = 'adaptiveform';

  ITEMS = ':items';

  SOURCE = 'sheet';

  PLAIN_TEXT = 'plaintext';

  PANEL = 'panel';

  CAPITAL_LETTER_REGX = /(?=[A-Z])/

  MUTLI_SELECTION_FIELDS = ['radio-group', 'checkbox-group'];

  errors = [];

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

  fieldMapping = new Map([
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

  reversedFieldMapping;

  constructor() {
    const map = new Map();
    this.fieldMapping.forEach((value, key) => {
      map.set(value, key);
    });
    this.reversedFieldMapping = map;
  }

  #isAF(def) {
    // eslint-disable-next-line no-prototype-builtins
    return def && def.hasOwnProperty(this.ADAPTIVEFORM) && def.hasOwnProperty(this.ITEMS);
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
         this.#copyProperties(item, field);
         this.data.push(field);
         if (this.#isPanel(item)) {
           this.#transform(item[this.ITEMS], item.name);
         } else {
           this.#handleOptions(field);
           this.#handlePlainTextField(field, item);
         }
      }
    }
  }

  #copyProperties(source, target) {
    this.supportedFields.forEach((field) => {
      if (source[field]) {
        const key = this.fieldPropertyMapping[field] || this.#camelCaseToWords(field);
        target[key] = source[field];
      }
    });
    target.Label = source?.label?.value;
    target.Type = this.#getFieldType(source.fieldType);
  }

  #handleOptions(field) {
    if (field.Options) {
      field.Options = field.Options.join(',');
    }

    if (field["Option Names"]) {
      field["Option Names"] = field["Option Names"].join(',');
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