import Blockly from "blockly/core";

const RulesEngine = new Blockly.Generator('RulesEngine');
RulesEngine.ORDER_NONE = 99;
RulesEngine.ORDER_ATOMIC = 0;
RulesEngine.ORDER_STRING = 1;

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


RulesEngine.fromWorkspace = (workspace) => {
  const top_blocks = workspace.getTopBlocks(false);
  const top_block = top_blocks[0];
  return RulesEngine.generalBlockToObj(top_block, workspace);
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

export default RulesEngine;