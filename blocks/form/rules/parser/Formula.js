import Parser from './Parser.js';
import TreeInterpreter from './TreeInterpreter.js';
import Runtime from './Runtime.js';
import dataTypes from './dataTypes.js';

// Type constants used to define functions.
const {
  TYPE_CLASS,
} = dataTypes;


function getToNumber(stringToNumber, debug = []) {
  return value => {
    const n = getValueOf(value); // in case it's an object that implements valueOf()
    if (n === null) return null;
    if (n instanceof Array) {
      debug.push('Converted array to zero');
      return 0;
    }
    const type = typeof n;
    if (type === 'number') return n;
    if (type === 'string') return stringToNumber(n, debug);
    if (type === 'boolean') return n ? 1 : 0;
    debug.push('Converted object to zero');
    return 0;
  };
}
function toString(a) {
  if (a === null || a === undefined) return '';
  // don't call a 'toString' method, since we could have a child named 'toString()'
  return a.toString();
}

const defaultStringToNumber = (str => {
  const n = +str;
  return Number.isNaN(n) ? 0 : n;
});

function isClass(obj) {
  if (obj === null) return false;
  if (Array.isArray(obj)) return false;
  return obj.constructor.name !== 'Object';
}

function matchClass(arg, expectedList) {
  // checking isClass() generates a dependency -- so call it only if necessary
  return expectedList.includes(TYPE_CLASS) && isClass(arg);
}

export default class Formula {
  constructor(debug, customFunctions, stringToNumberFn) {
    this.debug = debug;
    this.toNumber = getToNumber(stringToNumberFn || defaultStringToNumber, debug);
    this.runtime = new Runtime(debug, this.toNumber, customFunctions);
  }

  compile(stream, allowedGlobalNames = []) {
    let ast;
    try {
      const parser = new Parser(allowedGlobalNames);
      ast = parser.parse(stream, this.debug);
    } catch (e) {
      this.debug.push(e.toString());
      throw e;
    }
    return ast;
  }

  search(node, data, globals = {}, language = 'en-US') {
    // This needs to be improved.  Both the interpreter and runtime depend on
    // each other.  The runtime needs the interpreter to support exprefs.
    // There's likely a clean way to avoid the cyclic dependency.
    this.runtime.interpreter = new TreeInterpreter(
      this.runtime,
      globals,
      this.toNumber,
      toString,
      this.debug,
      language,
    );

    try {
      return this.runtime.interpreter.search(node, data);
    } catch (e) {
      this.debug.push(e.message || e.toString());
      throw e;
    }
  }
}
