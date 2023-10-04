const cellNameRegex = /^\$?[A-Z]+\$?(\d+)$/;

function visitor(fields) {
  return function visit(n) {
    if (n.type === 'Field') {
      fields.add(n.name);
    } else if (n.type === 'Subexpression') {
      return visit({
        type: 'Field',
        name: n.children[1].name,
      }, n.children[0].name);
    }
    return {
      ...n,
      children: n.children?.map((c) => visit(c)),
    };
  };
}

function getDeps(ast) {
  const fields = new Set();
  const newAst = visitor(fields)(ast);
  return [newAst, Array.from(fields)];
}

export default function transformRule({ prop, expression }, fieldToCellMap, formula) {
  const ast = formula.compile(expression.slice);
  const [newAst, deps] = getDeps(ast);
  return {
    prop,
    deps,
    ast
  };
}
