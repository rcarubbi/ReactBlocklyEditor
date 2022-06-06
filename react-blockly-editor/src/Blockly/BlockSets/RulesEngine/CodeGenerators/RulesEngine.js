import Blockly from "blockly/core";
import 'blockly/javascript';

const RulesEngine = new Blockly.Generator('RulesEngine');
RulesEngine.ORDER_NONE = 99;
RulesEngine.ORDER_ATOMIC = 0;
RulesEngine.ORDER_STRING = 1;
RulesEngine.ORDER_CONDITIONAL = 15; 
RulesEngine.ORDER_EQUALITY = 9;
RulesEngine.ORDER_RELATIONAL = 8;
RulesEngine.ORDER_LOGICAL_NOT = 4.4;
RulesEngine.ORDER_LOGICAL_AND = 13;
RulesEngine.ORDER_LOGICAL_OR = 14;

RulesEngine['rule_expression'] = function (block) {
  var value_rule_expression_output = RulesEngine.valueToCode(block, 'rule_expression_output', RulesEngine.ORDER_ATOMIC);
  return value_rule_expression_output;
};

RulesEngine['rule_expression_group'] = function (block) {

  var value_rule_expression_group_output = RulesEngine.valueToCode(block, 'rule_expression_group_output', RulesEngine.ORDER_ATOMIC);
  return value_rule_expression_group_output;
};

RulesEngine['rule_expression_sequence'] = function (block) {

  var statements_expression_statements = statementToArray(RulesEngine.statementToCode(block, 'expression_statements'));

  return `RXL(${statements_expression_statements.map(item => `'${item}'`).join(',')})`;

};

RulesEngine['rule_sequence_item'] = function (block) {
  const text_rule_name = block.getFieldValue('rule_name');

  return text_rule_name;
};

RulesEngine['rfl'] = function (block) {
  const text_field_name = block.getFieldValue('field_name');
  // TODO: Assemble JavaScript into code variable.
  const code = `RFL('${text_field_name}')`
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, RulesEngine.ORDER_NONE];
};



RulesEngine["logic_ternary"] = function(block) {
  const ifExpression = RulesEngine.valueToCode(block, "IF", RulesEngine.ORDER_CONDITIONAL) || "false",
        thenExpression = RulesEngine.valueToCode(block, "THEN", RulesEngine.ORDER_CONDITIONAL) || "null",
        elseExpression = RulesEngine.valueToCode(block, "ELSE", RulesEngine.ORDER_CONDITIONAL) || "null";
  return [`if(${ifExpression},${thenExpression},${elseExpression})`, RulesEngine.ORDER_CONDITIONAL];
}

RulesEngine["logic_boolean"] = function (a) {
  return ["TRUE" === a.getFieldValue("BOOL") ? "true" : "false", RulesEngine.ORDER_ATOMIC];
};


RulesEngine.fromWorkspace = (workspace) => {
  const top_blocks = workspace.getTopBlocks(false);
  const outputs = top_blocks.map(top_block => RulesEngine.generalBlockToObj(top_block, workspace))
  return outputs.join('\n');
};

RulesEngine.generalBlockToObj = (block, workspace) => {

  if (block && !block.isShadow_) {

    // dispatcher:
    var func = RulesEngine[block.type];
    if (func) {
      return func.call(RulesEngine, block, workspace);
    } else {
      console.log("Don't know how to generate code for a '" + block.type + "'");
    }
  } else {
    return null;
  }
};

RulesEngine.scrub_ = (block, code, opt_thisOnly) => {

  let obj = null;
  try {
    obj = JSON.parse(code);
  }
  catch {
    obj = code;
  }
  var nextBlock = block.getNextBlock();
  if (nextBlock) {
    let array = Array.isArray(obj) ? obj : [obj];
    const nextCode = RulesEngine.blockToCode(nextBlock);
    try {
      const nextObj = JSON.parse(nextCode);
      if (Array.isArray(nextObj)) {
        array = [...array, ...nextObj];
      } else {
        array.push(nextObj);
      }
    } catch {
      array.push(nextCode);
    }
    return JSON.stringify(array);
  } else {
    return JSON.stringify(obj);
  }
};

function statementToArray(stringArray) {
  try {
    const obj = JSON.parse(stringArray);
    if (!Array.isArray(obj)) {
      return [obj];
    } else {
      return obj;
    }
  } catch {
    if (stringArray.length === 0) {
      return [];
    } else {
      return [stringArray];
    }
  }
}

RulesEngine["logic_compare"] = function (a) {
  var b = {
    EQ: "==",
    NEQ: "!=",
    LT: "<",
    LTE: "<=",
    GT: ">",
    GTE: ">="
  }[a.getFieldValue("OP")],
      c = "==" === b || "!=" === b ? RulesEngine.ORDER_EQUALITY : RulesEngine.ORDER_RELATIONAL,
      d = RulesEngine.valueToCode(a, "A", c) || "0";
  a = RulesEngine.valueToCode(a, "B", c) || "0";
  return [d + " " + b + " " + a, c];
};

RulesEngine["logic_operation"] = function (a) {
   
  var b = "AND" === a.getFieldValue("OP") ? "&&" : "||",
      c = "&&" === b ? RulesEngine.ORDER_LOGICAL_AND : RulesEngine.ORDER_LOGICAL_OR,
      d =  RulesEngine.valueToCode(a, "A", c);
  a = RulesEngine.valueToCode(a, "B", c);

  if (d || a) {
    var e = "&&" === b ? "true" : "false";
    d || (d = e);
    a || (a = e);
  } else a = d = "false";

  return [d + " " + b + " " + a, c];
};

const originalValueToCode = RulesEngine.valueToCode;

 RulesEngine.valueToCode = function(a,b,c) {
  return parseValue(originalValueToCode.call(RulesEngine, a,b,c));
 }

RulesEngine["logic_negate"] = function (a) {
  var b = RulesEngine.ORDER_LOGICAL_NOT;
  return ["!" + (RulesEngine.valueToCode(a, "BOOL", b) || "true"), b];
};

 

RulesEngine["logic_null"] = function (a) {
   
  return ["\"null\"", RulesEngine.ORDER_ATOMIC];
};

function parseValue(value) {
  if (!value) {
      return value;
  } else {
      const noParenthesesValue = (value[0] === '(') ? value.substring(1, value.length - 1) : value;
      try {
          return JSON.parse(noParenthesesValue);
      } catch {
          return noParenthesesValue;
      }
  }
}

export default RulesEngine;