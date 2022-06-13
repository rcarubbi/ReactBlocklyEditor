import Blockly from "blockly/core";
import Javascript from 'blockly/javascript';

const RulesEngine = new Blockly.Generator('RulesEngine');
 

RulesEngine['rule_expression'] = function (block) {
  var value_rule_expression_output = RulesEngine.valueToCode(block, 'rule_expression_output', Javascript.ORDER_ATOMIC);
  return value_rule_expression_output;
};

RulesEngine['rule_expression_group'] = function (block) {

  var value_rule_expression_group_output = RulesEngine.valueToCode(block, 'rule_expression_group_output', Javascript.ORDER_ATOMIC);
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
  const property_name = block.getFieldValue('property_name');
  const entity_name = block.getFieldValue('entity_name');
  // TODO: Assemble JavaScript into code variable.
  const code = `RFL('${entity_name}.${property_name}')`
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Javascript.ORDER_NONE];
};

RulesEngine['rfl_instrument'] = function (block) {
  const property_name = block.getFieldValue('property_name');

  // TODO: Assemble JavaScript into code variable.
  const code = `RFL('Instrument.${property_name}')`
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Javascript.ORDER_NONE];
};

RulesEngine['rfl_business_date'] = function (block) {
  // TODO: Assemble JavaScript into code variable.
  const code = `RFL('BusinessDate')`
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Javascript.ORDER_NONE];
};

RulesEngine['rfl_issuer'] = function (block) {
  const property_name = block.getFieldValue('property_name');

  // TODO: Assemble JavaScript into code variable.
  const code = `RFL('Issuer.${property_name}')`
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Javascript.ORDER_NONE];
};

RulesEngine['rfl_portfolio'] = function (block) {
  const property_name = block.getFieldValue('property_name');

  // TODO: Assemble JavaScript into code variable.
  const code = `RFL('Portfolio.${property_name}')`
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Javascript.ORDER_NONE];
};

RulesEngine['rfl_position_definition'] = function (block) {
  const property_name = block.getFieldValue('property_name');

  // TODO: Assemble JavaScript into code variable.
  const code = `FL('PositionDefinition.${property_name}')`
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Javascript.ORDER_NONE];
};

RulesEngine['with_safe_check'] = function (block) {
  var children = block.getChildren();
  const getValueInput = RulesEngine.valueToCode(block, "get_value_input", Javascript.ORDER_NONE);
  if (children && children.length > 0) {
    const nextBlock = children[0];
    switch (nextBlock.type) {
      case "rfl":
        const entity_name = nextBlock.getFieldValue("entity_name");
        return [`(RFL('${entity_name}') != null && ${getValueInput})`, Javascript.ORDER_NONE];
      case "rfl_instrument":
        return [`(RFL('Instrument') != null && ${getValueInput})`, Javascript.ORDER_NONE];
      case "rfl_portfolio":
        return [`(RFL('Portfolio') != null && ${getValueInput})`, Javascript.ORDER_NONE];
      case "rfl_position_definition":
        return [`(RFL('PositionDefinition') != null && ${getValueInput})`, Javascript.ORDER_NONE];
      case "rfl_issuer":
        return [`(RFL('Issuer') != null && ${getValueInput})`, Javascript.ORDER_NONE];
      default:
        return [getValueInput, Javascript.ORDER_NONE];
    }
    
  }
  else {
    return ["", Javascript.ORDER_NONE]
  }

};


RulesEngine["text"] = function (block) {
  return Javascript.text.call(RulesEngine, block);  
};
 
RulesEngine["logic_ternary"] = function (block) {
  const ifExpression = RulesEngine.valueToCode(block, "IF", Javascript.ORDER_CONDITIONAL) || "false",
    thenExpression = RulesEngine.valueToCode(block, "THEN", Javascript.ORDER_CONDITIONAL) || "null",
    elseExpression = RulesEngine.valueToCode(block, "ELSE", Javascript.ORDER_CONDITIONAL) || "null";
  return [`if(${ifExpression},${thenExpression},${elseExpression})`, Javascript.ORDER_CONDITIONAL];
}

RulesEngine["logic_boolean"] = function (block) {
  return Javascript.logic_boolean.call(RulesEngine, block);  
};

 
RulesEngine["logic_compare"] = function (block) {
  return Javascript.logic_compare.call(RulesEngine, block);  
};

RulesEngine["logic_operation"] = function (block) {
  return Javascript.logic_operation.call(RulesEngine, block);  
};

const originalValueToCode = RulesEngine.valueToCode;
 

RulesEngine["logic_negate"] = function (block) {
  return Javascript.logic_negate.call(RulesEngine, block);  
};

RulesEngine["logic_null"] = function (a) {
  return ["\"null\"", Javascript.ORDER_ATOMIC];
};

RulesEngine["math_number"] = function (block) {
  return Javascript.math_number.call(RulesEngine, block);  
};

RulesEngine["math_arithmetic"] = function (block) {
  return Javascript.math_arithmetic.call(RulesEngine, block);  
};

RulesEngine.valueToCode = function (a, b, c) {
  return parseValue(originalValueToCode.call(RulesEngine, a, b, c));
}

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
export default RulesEngine;