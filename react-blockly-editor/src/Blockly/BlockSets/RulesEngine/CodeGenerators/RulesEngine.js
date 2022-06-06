import Blockly from "blockly/core";

const RulesEngine = new Blockly.Generator('RulesEngine');
RulesEngine.ORDER_NONE = 99;
RulesEngine.ORDER_ATOMIC = 0;
RulesEngine.ORDER_STRING = 1;

RulesEngine['rule_expression'] = function (block) {
  var text_expression_code = block.getFieldValue('expression_code');
  var value_rule_expression_output = RulesEngine.valueToCode(block, 'rule_expression_output', RulesEngine.ORDER_ATOMIC);
  
  var code = {
    expressionCode: text_expression_code,
    expressionText: value_rule_expression_output
  }
  return JSON.stringify(code);
};

RulesEngine['rule_expression_group'] = function (block) {
  var text_group_name = block.getFieldValue('group_name');
  var value_rule_expression_group_output = RulesEngine.valueToCode(block, 'rule_expression_group_output', RulesEngine.ORDER_ATOMIC);
  
  var code = {
    expressionGroupCode: text_group_name,
    expressionGroupText: value_rule_expression_group_output
  }
  return JSON.stringify(code);
};

RulesEngine['rule_expression_sequence'] = function (block) {
  var text_sequence_name = block.getFieldValue('sequence_name');
  var statements_expression_statements = statementToArray(RulesEngine.statementToCode(block, 'expression_statements'));
 
  var code = {
    expressionSequenceCode: text_sequence_name,
    expressionSequenceText: `RXL(${statements_expression_statements.map(item => `'${item}'`).join(',')})`
  }
  return JSON.stringify(code);
};

RulesEngine['rule_sequence_item'] = function (block) {
  var text_rule_name = block.getFieldValue('rule_name');
   
  var code = text_rule_name
  return code;
};

RulesEngine['rfl'] = function (block) {
  var text_field_name = block.getFieldValue('field_name');
  // TODO: Assemble JavaScript into code variable.
  var code = `RFL('${text_field_name}')`
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, RulesEngine.ORDER_NONE];
};


RulesEngine.fromWorkspace = (workspace) => {
  const top_blocks = workspace.getTopBlocks(false);
  const top_block = top_blocks[0];
  return RulesEngine.generalBlockToObj(top_block, workspace);
};

RulesEngine.generalBlockToObj =  (block, workspace) => {

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

  var obj = null;
  try {
      obj = JSON.parse(code);
  }
  catch {
      obj = code;
  }
  var nextBlock = block.getNextBlock();
  if (nextBlock) {
      var array = Array.isArray(obj) ? obj : [obj];
      var nextCode = RulesEngine.blockToCode(nextBlock);
      try {
          var nextObj = JSON.parse(nextCode);
          if (Array.isArray(nextObj)) {
              array = array.concat(nextObj);
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
      var obj = JSON.parse(stringArray);
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