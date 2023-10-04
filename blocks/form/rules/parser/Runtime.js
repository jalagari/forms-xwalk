import dataTypes from './dataTypes.js';
import { matchType, getTypeName, getTypeNames } from './matchType.js';
import openFormulaFunctions from './openFormulaFunctions.js';
import functions from './functions.js';
import {
  isArray, isObject, strictDeepEqual, getValueOf,
} from './utils.js';

// Type constants used to define functions.
const {
  TYPE_ANY,
} = dataTypes;


export default class Runtime {
  constructor(debug, toNumber, customFunctions = {}) {
    this.strictDeepEqual = strictDeepEqual;
    this.toNumber = toNumber;
    this.functionTable = functions(
      this,
      isObject,
      isArray,
      toNumber,
      getTypeName,
      getValueOf,
      toString,
      debug,
    );

    Object.entries(
      openFormulaFunctions(getValueOf, toString, toNumber, debug),
    ).forEach(([fname, func]) => {
      this.functionTable[fname] = func;
    });

    Object.entries(customFunctions).forEach(([fname, func]) => {
      this.functionTable[fname] = func;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  _validateArgs(argName, args, signature, bResolved) {
    // Validating the args requires validating
    // the correct arity and the correct type of each arg.
    // If the last argument is declared as variadic, then we need
    // a minimum number of args to be required.  Otherwise it has to
    // be an exact amount.
    if (signature.length === 0) {
      return;
    }
    let pluralized;
    const argsNeeded = signature.filter(arg => !arg.optional).length;
    if (signature[signature.length - 1].variadic) {
      if (args.length < signature.length) {
        pluralized = signature.length === 1 ? ' argument' : ' arguments';
        throw new Error(`ArgumentError: ${argName}() `
        + `takes at least${signature.length}${pluralized
        } but received ${args.length}`);
      }
    } else if (args.length < argsNeeded || args.length > signature.length) {
      pluralized = signature.length === 1 ? ' argument' : ' arguments';
      throw new Error(`ArgumentError: ${argName}() `
      + `takes ${signature.length}${pluralized
      } but received ${args.length}`);
    }
    // if the arguments are unresolved, there's no point in validating types
    if (!bResolved) return;
    let currentSpec;
    let actualType;
    const limit = Math.min(signature.length, args.length);
    for (let i = 0; i < limit; i += 1) {
      currentSpec = signature[i].types;
      // Try to avoid checks that will introspect the object and generate dependencies
      if (!matchClass(args[i], currentSpec) && !currentSpec.includes(TYPE_ANY)) {
        actualType = getTypeNames(args[i]);
        // eslint-disable-next-line no-param-reassign
        args[i] = matchType(actualType, currentSpec, args[i], argName, this.toNumber, toString);
      }
    }
  }

  callFunction(name, resolvedArgs, data, interpreter, bResolved = true) {
    // this check will weed out 'valueOf', 'toString' etc
    if (!Object.prototype.hasOwnProperty.call(this.functionTable, name)) throw new Error(`Unknown function: ${name}()`);

    const functionEntry = this.functionTable[name];
    this._validateArgs(name, resolvedArgs, functionEntry._signature, bResolved);
    return functionEntry._func.call(this, resolvedArgs, data, interpreter);
  }
}
