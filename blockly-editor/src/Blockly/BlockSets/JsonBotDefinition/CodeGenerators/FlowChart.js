import Blockly from "blockly/core";

const Flowchart = new Blockly.Generator("Flowchart");
Flowchart.ORDER_NONE = 99;
Flowchart.ORDER_ATOMIC = 0;
Flowchart.ORDER_STRING = 1;

let stepsToAddLater = {};

let currentScope = "botconfig";

const relationalOperators = {
  Equals: "=",
  Greater: ">",
  Less: "<",
  GreaterOrEquals: ">=",
  LessOrEquals: "<=",
  NotEquals: "<>"
};

const logicalOperators = {
  And: "&",
  Or: "|"
};

function getRelationalOperator(operatorDisplay) {
  return relationalOperators[operatorDisplay];
}

function getLogicalOperator(operatorDisplay) {
  return logicalOperators[operatorDisplay];
}

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

function parseValue(value) {
  if (!value) {
    return value;
  } else {
    var noParenthesesValue = value.substring(1, value.length - 1);
    try {
      return JSON.parse(noParenthesesValue);
    } catch {
      return noParenthesesValue;
    }
  }
}

function addStepsToLater(steps) {
  stepsToAddLater[currentScope] = stepsToAddLater[currentScope] || {};
  stepsToAddLater[currentScope].steps =
    (Array.isArray(stepsToAddLater[currentScope].steps) &&
      stepsToAddLater[currentScope].steps.concat(steps)) ||
    steps;
}

Flowchart.fromWorkspace = function(workspace) {
  currentScope = "botconfig";
  stepsToAddLater = {};

  var top_blocks = workspace.getTopBlocks(false);
  for (var i in top_blocks) {
    var top_block = top_blocks[i];
    if (top_block.type === "botconfig")
      return this.generalBlockToObj(top_block, workspace);
  }
};

Flowchart.generalBlockToObj = function(block, workspace) {
  if (block && !block.isShadow_) {
    // dispatcher:
    var func = this[block.type];
    if (func) {
      return func.call(this, block, workspace);
    } else {
      console.log(
        "Don't know how to generate Flowchart code for a '" + block.type + "'"
      );
    }
  } else {
    return null;
  }
};

Flowchart.scrub_ = function(block, code, opt_thisOnly) {
  var obj = null;
  try {
    obj = JSON.parse(code);
  } catch {
    obj = code;
  }
  var nextBlock = block.getNextBlock();
  if (nextBlock) {
    var array = Array.isArray(obj) ? obj : [obj];
    var nextCode = Flowchart.blockToCode(nextBlock);
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

Flowchart["botconfig"] = function(block, workspace) {
  var text_name = block.getFieldValue("Name");
  var statements_steps = statementToArray(
    Flowchart.statementToCode(block, "Steps")
  );

  var steps = statements_steps;
  if (stepsToAddLater["botconfig"]) {
    steps = statements_steps.concat(stepsToAddLater["botconfig"].steps);
  }

  var flowchartDeclarations = [];
  var flowchartConnections = [];

  for (var i = 0; i < steps.length; i++) {
    flowchartConnections = flowchartConnections.concat(
      steps[i].flowchartConnections
    );
    flowchartDeclarations = flowchartDeclarations.concat(
      steps[i].flowchartDeclarations
    );
  }

  flowchartDeclarations.push(`root=>start: ${text_name || "Bot"}`);

  if (statements_steps[0]) {
    flowchartConnections.push(`root->step${statements_steps[0].id}`);
  } else {
    flowchartConnections.push("root->e");
    flowchartDeclarations.push("e=>end: Fim");
  }
  var code =
    flowchartDeclarations.reverse().join("\r\n") +
    "\r\n\r\n" +
    flowchartConnections.reverse().join("\r\n");
  return code;
};

Flowchart["messagestep"] = function(block) {
  const label_id = block.getFieldValue("Id");
  const nextBlock = block.getNextBlock();

  const flowchartConnections = [];
  const flowchartDeclarations = [];

  if (!nextBlock) {
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}->e${label_id}`);
  } else {
    var nextBlockId = nextBlock.getFieldValue("Id");
    flowchartConnections.push(`step${label_id}->step${nextBlockId}`);
  }

  const selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>operation: Mensagem ${label_id}|messagestep${selected}`
  );

  const messageStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  const code = JSON.stringify(messageStep);

  return code;
};

Flowchart["inputstep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var nextBlock = block.getNextBlock();

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  if (!nextBlock) {
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}->e${label_id}`);
  } else {
    var nextBlockId = nextBlock.getFieldValue("Id");
    flowchartConnections.push(`step${label_id}->step${nextBlockId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>operation: Pergunta ${label_id}|inputstep${selected}`
  );

  var inputStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(inputStep);

  return code;
};

Flowchart["string"] = function(block) {
  return null;
};

Flowchart["nlpsettings"] = function(block) {
  return null;
};

Flowchart["textanalysissettings"] = function(block) {
  return null;
};

Flowchart["nlpmodel"] = function(block) {
  return null;
};

Flowchart["confirmstep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var statements_truestep = statementToArray(
    Flowchart.statementToCode(block, "TrueStep")
  );
  var statements_falsestep = statementToArray(
    Flowchart.statementToCode(block, "FalseStep")
  );

  addStepsToLater(statements_truestep.concat(statements_falsestep));

  var trueStepId =
    (statements_truestep.length > 0 && statements_truestep[0].id) || null;
  var falseStepId =
    (statements_falsestep.length > 0 && statements_falsestep[0].id) || null;

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  if (!trueStepId) {
    flowchartDeclarations.push(`eYes${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}(yes)->eYes${label_id}`);
  } else {
    flowchartConnections.push(`step${label_id}(yes)->step${trueStepId}`);
  }

  if (!falseStepId) {
    flowchartDeclarations.push(`eNo${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}(no)->eNo${label_id}`);
  } else {
    flowchartConnections.push(`step${label_id}(no)->step${falseStepId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>condition: Confirmação ${label_id}|confirmstep${selected}`
  );

  var confirmStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(confirmStep);
  return code;
};

Flowchart["messageinteractions"] = function(block) {
  return null;
};

Flowchart["liststep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var listItems = statementToArray(
    Flowchart.statementToCode(block, "Input")
  ).filter(
    x => x.targetStepId || x.action === "OpenURL" || x.action === "DownloadFile"
  );

  // var nextBlock = block.getNextBlock();

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  for (var i = 0; i < listItems.length; i++) {
    if (i > 0) {
      flowchartDeclarations.push(
        `step${label_id}i${i + 1}=>parallel: Lista ${label_id} \r\n[${
          listItems[i].title
        }]|liststep${selected}`
      );
      if (i > 1) {
        flowchartConnections.push(
          `step${label_id}i${i}(path2, right)->step${label_id}i${i + 1}`
        );
        flowchartConnections.push(
          `step${label_id}i${i}@>step${label_id}i${i + 1}({"stroke": "${
            selected ? "yellow" : "#a5935b"
          }", "arrow-end": "none"})`
        );
      } else {
        flowchartConnections.push(
          `step${label_id}(path2, right)->step${label_id}i${i + 1}`
        );
        flowchartConnections.push(
          `step${label_id}@>step${label_id}i${i + 1}({"stroke": "${
            selected ? "yellow" : "#a5935b"
          }", "arrow-end": "none"})`
        );
      }
    } else {
      flowchartDeclarations.push(
        `step${label_id}=>parallel: Lista ${label_id} \r\n [${listItems[i].title}]|liststep${selected}`
      );
    }

    switch (listItems[i].action) {
      case "OpenURL":
      case "DownloadFile":
        var description =
          listItems[i].action === "OpenURL" ? `Abrir página` : `Baixar arquivo`;
        if (i > 0) {
          flowchartDeclarations.push(
            `end${label_id}i${i + 1}=>end: ${description}`
          );
          flowchartConnections.push(
            `step${label_id}i${i + 1}(path1, bottom)->end${label_id}i${i + 1}`
          );
        } else {
          flowchartDeclarations.push(`end${label_id}=>end: ${description}`);
          flowchartConnections.push(
            `step${label_id}(path1, bottom)->end${label_id}`
          );
        }
        break;
      default:
        if (i > 0) {
          flowchartConnections.push(
            `step${label_id}i${i + 1}(path1, bottom)->step${
              listItems[i].targetStepId
            }`
          );
        } else {
          flowchartConnections.push(
            `step${label_id}(path1, bottom)->step${listItems[i].targetStepId}`
          );
        }
        break;
    }
  }

  //if (nextBlock) {
  //    var nextBlockId = nextBlock.getFieldValue("Id");
  //    if (listItems.length === 0) {
  //        flowchartDeclarations.push(`step${label_id}=>parallel: Lista ${label_id}|liststep${selected}`);
  //        flowchartConnections.push(`step${label_id}(path1, bottom)->step${nextBlockId}`)
  //    } else {
  //        flowchartDeclarations.push(`step${label_id}i${listItems.length + 1}=>parallel: Lista ${label_id}|liststep${selected}`);
  //        if (listItems.length > 1) {
  //            flowchartConnections.push(`step${label_id}i${listItems.length}(path2, right)->step${label_id}i${listItems.length + 1}`)
  //            flowchartConnections.push(`step${label_id}i${listItems.length}@>step${label_id}i${listItems.length + 1}({"stroke": "${selected ? "yellow" : "#a5935b"}"})`);
  //        } else {
  //            flowchartConnections.push(`step${label_id}(path2, right)->step${label_id}i${listItems.length + 1}`);
  //            flowchartConnections.push(`step${label_id}@>step${label_id}i${listItems.length + 1}({"stroke": "${selected ? "yellow" : "#a5935b"}"})`);
  //        }
  //        flowchartConnections.push(`step${label_id}i${listItems.length + 1}(path1, bottom)->step${nextBlockId}`)

  //    }
  //} else
  if (listItems.length === 0) {
    flowchartDeclarations.push(
      `step${label_id}=>parallel: Lista ${label_id}|liststep${selected}`
    );
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}(path1)->e${label_id}`);
  }

  var listStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(listStep);
  return code;
};

Flowchart["customcommandconfig"] = function(block) {
  return null;
};

Flowchart["speechsettings"] = function(block) {
  return null;
};

Flowchart["appcredentials"] = function(block) {
  return null;
};

Flowchart["storesettings"] = function(block) {
  return null;
};

Flowchart["formstep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var nextBlock = block.getNextBlock();
  var flowchartConnections = [];
  var flowchartDeclarations = [];

  if (!nextBlock) {
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}->e${label_id}`);
  } else {
    var nextBlockId = nextBlock.getFieldValue("Id");
    flowchartConnections.push(`step${label_id}->step${nextBlockId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>operation: Questionário ${label_id}|formstep${selected}`
  );

  var formStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(formStep);
  return code;
};

Flowchart["formfield"] = function(block) {
  return null;
};

Flowchart["optionsformfield"] = function(block) {
  return null;
};

Flowchart["fieldoption"] = function(block) {
  return null;
};

Flowchart["fieldoptionsource"] = function(block) {
  return null;
};

Flowchart["restoreformfield"] = function(block) {
  return null;
};

Flowchart["summary"] = function(block) {
  return null;
};

Flowchart["formcustommessage"] = function(block) {
  return null;
};

Flowchart["formcustomcommand"] = function(block) {
  return null;
};

Flowchart["datasource"] = function(block) {
  return null;
};

Flowchart["conditionstep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var statements_truestep = statementToArray(
    Flowchart.statementToCode(block, "TrueStep")
  );
  var statements_falsestep = statementToArray(
    Flowchart.statementToCode(block, "FalseStep")
  );

  addStepsToLater(statements_truestep.concat(statements_falsestep));

  var trueStepId =
    (statements_truestep.length > 0 && statements_truestep[0].id) || null;
  var falseStepId =
    (statements_falsestep.length > 0 && statements_falsestep[0].id) || null;
  var flowchartConnections = [];
  var flowchartDeclarations = [];

  if (!trueStepId) {
    flowchartDeclarations.push(`eYes${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}(yes)->eYes${label_id}`);
  } else {
    flowchartConnections.push(`step${label_id}(yes)->step${trueStepId}`);
  }

  if (!falseStepId) {
    flowchartDeclarations.push(`eNo${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}(no)->eNo${label_id}`);
  } else {
    flowchartConnections.push(`step${label_id}(no)->step${falseStepId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>condition: Condição ${label_id}|conditionstep${selected}`
  );

  var conditionStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(conditionStep);

  return code;
};

Flowchart["relationalexpression"] = function(block) {
  if (block.isShadow_) return null;

  var value_left = parseValue(
    Flowchart.valueToCode(block, "Left", Flowchart.ORDER_ATOMIC)
  );
  var dropdown_operator = block.getFieldValue("Operator");
  var value_right = parseValue(
    Flowchart.valueToCode(
      block,
      "Right",
      Flowchart.ORDER_ATOMIC
    )
  );

  var code = `(${value_left} ${getRelationalOperator(
    dropdown_operator
  )} ${value_right})`;
  return [code, Flowchart.ORDER_NONE];
};

Flowchart["binarylogicalexpression"] = function(block) {
  if (block.isShadow_) return null;

  var value_left = parseValue(
    Flowchart.valueToCode(block, "Left", Flowchart.ORDER_ATOMIC)
  );
  var dropdown_operator = block.getFieldValue("Operator");
  var value_right = parseValue(
    Flowchart.valueToCode(
      block,
      "Right",
      Flowchart.ORDER_ATOMIC
    )
  );

  var code = `(${value_left} ${getLogicalOperator(
    dropdown_operator
  )} ${value_right})`;

  return [code, Flowchart.ORDER_NONE];
};

Flowchart["unarylogicalexpression"] = function(block) {
  if (block.isShadow_) return null;

  var value_left = parseValue(
    Flowchart.valueToCode(block, "Left", Flowchart.ORDER_ATOMIC)
  );
  var code = `(!${value_left})`;
  return [code, Flowchart.ORDER_NONE];
};

Flowchart["stepexpression"] = function(block) {
  if (block.isShadow_) return null;

  var text_expression = block.getFieldValue("Expression");
  var number_stepid = block.getFieldValue("StepId");

  var code = `@${number_stepid}.${text_expression}`;

  return [code, Flowchart.ORDER_NONE];
};

Flowchart["literal"] = function(block) {
  if (block.isShadow_) return null;

  var text_value = block.getFieldValue("Value");
  var code = text_value;
  return [code, Flowchart.ORDER_NONE];
};

Flowchart["navigatelistitem"] = function(block) {
  if (block.isShadow_) return null;
  var text_title = block.getFieldValue("Title");
  var statements_targetstep = statementToArray(
    Flowchart.statementToCode(block, "TargetStep")
  );

  addStepsToLater(statements_targetstep);

  var listItem = {
    title: text_title,
    action: "NavigateStep",
    targetStepId:
      statements_targetstep.length > 0 ? statements_targetstep[0].id : null
  };

  var code = JSON.stringify(listItem);
  return code;
};

Flowchart["openurllistitem"] = function(block) {
  if (block.isShadow_) return null;
  var text_title = block.getFieldValue("Title");

  var listItem = {
    title: text_title,
    action: "OpenURL"
  };

  var code = JSON.stringify(listItem);
  return code;
};

Flowchart["downloadfilelistitem"] = function(block) {
  if (block.isShadow_) return null;
  var text_title = block.getFieldValue("Title");

  var listItem = {
    title: text_title,
    action: "DownloadFile"
  };

  var code = JSON.stringify(listItem);
  return code;
};

Flowchart["apistep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var nextBlock = block.getNextBlock();

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  if (!nextBlock) {
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}->e${label_id}`);
  } else {
    var nextBlockId = nextBlock.getFieldValue("Id");
    flowchartConnections.push(`step${label_id}->step${nextBlockId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>operation: API ${label_id}|apistep${selected}`
  );

  var apiStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(apiStep);
  return code;
};

Flowchart["apiparameter"] = function(block) {
  return null;
};

Flowchart["goto"] = function(block) {
  var number_id = block.getFieldValue("Id");
  var code = JSON.stringify({ id: number_id });
  return code;
};

Flowchart["compositestep"] = function(block) {
  var parentScope = currentScope;
  var nextBlock = block.getNextBlock();

  var label_id = block.getFieldValue("Id");
  var text_name = block.getFieldValue("Name");
  currentScope = text_name;

  var statements_steps = statementToArray(
    Flowchart.statementToCode(block, "Steps")
  );

  var steps = statements_steps;
  if (stepsToAddLater[currentScope]) {
    steps = statements_steps.concat(stepsToAddLater[currentScope].steps);
  }

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  let compositeStep = {
    id: label_id,
    name: text_name,
    steps: steps,
    rootStepId: (statements_steps.length > 0 && statements_steps[0].id) || null
  };

  currentScope = parentScope;

  if (!nextBlock) {
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}->e${label_id}`);
  } else {
    var nextBlockId = nextBlock.getFieldValue("Id");
    flowchartConnections.push(`step${label_id}->step${nextBlockId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>subroutine: ${label_id} ${text_name}|compositestep${selected}`
  );

  compositeStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(compositeStep);
  return code;
};

Flowchart["faqstep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var nextBlock = block.getNextBlock();

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  if (!nextBlock) {
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}->e${label_id}`);
  } else {
    var nextBlockId = nextBlock.getFieldValue("Id");
    flowchartConnections.push(`step${label_id}->step${nextBlockId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>operation: FAQ ${label_id}|faqstep${selected}`
  );

  var faqStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(faqStep);
  return code;
};

Flowchart["faqsettings"] = function(block) {
  return null;
};

Flowchart["mapsstep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var nextBlock = block.getNextBlock();

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  if (!nextBlock) {
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}->e${label_id}`);
  } else {
    var nextBlockId = nextBlock.getFieldValue("Id");
    flowchartConnections.push(`step${label_id}->step${nextBlockId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>operation: Mapas ${label_id}|mapsstep${selected}`
  );

  var apiStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(apiStep);
  return code;
};

Flowchart["locationsource"] = function(block) {
  var text_name = block.getFieldValue("Name");
  var text_latitude = block.getFieldValue("Latitude");
  var text_longitude = block.getFieldValue("Longitude");
  var text_zipcode = block.getFieldValue("ZipCode");
  var text_address = block.getFieldValue("Address");
  var text_state = block.getFieldValue("State");
  var text_city = block.getFieldValue("City");

  var locationSource = {
    name: text_name,
    latitude: text_latitude,
    longitude: text_longitude,
    zipCode: text_zipcode,
    address: text_address,
    state: text_state,
    city: text_city
  };

  var code = JSON.stringify(locationSource);
  return code;
};

Flowchart["switchstep"] = function(block) {
  var text_input = block.getFieldValue("Input");
  var statements_cases = statementToArray(
    Flowchart.statementToCode(block, "Cases")
  );
  var label_id = block.getFieldValue("Id");

  var nextBlock = block.getNextBlock();

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  for (var i = 0; i < statements_cases.length; i++) {
    if (i > 0) {
      flowchartDeclarations.push(
        `step${label_id}i${i +
          1}=>parallel: Escolha ${text_input} ${label_id} \r\n Caso ${
          statements_cases[i].value
        }|switchstep${selected}`
      );
      if (i > 1) {
        flowchartConnections.push(
          `step${label_id}i${i}(path2, right)->step${label_id}i${i + 1}`
        );
        flowchartConnections.push(
          `step${label_id}i${i}@>step${label_id}i${i + 1}({"stroke": "${
            selected ? "yellow" : "#a5935b"
          }", "arrow-end": "none"})`
        );
        flowchartConnections.push(
          `step${label_id}i${i + 1}(path1, bottom)->step${
            statements_cases[i].targetStepId
          }`
        );
      } else {
        flowchartConnections.push(
          `step${label_id}(path2, right)->step${label_id}i${i + 1}`
        );
        flowchartConnections.push(
          `step${label_id}@>step${label_id}i${i + 1}({"stroke": "${
            selected ? "yellow" : "#a5935b"
          }", "arrow-end": "none"})`
        );
        flowchartConnections.push(
          `step${label_id}i${i + 1}(path1, bottom)->step${
            statements_cases[i].targetStepId
          }`
        );
      }
    } else {
      flowchartDeclarations.push(
        `step${label_id}=>parallel: Escolha ${text_input} ${label_id} \r\n Caso ${statements_cases[i].value}|switchstep${selected}`
      );
      flowchartConnections.push(
        `step${label_id}(path1, bottom)->step${statements_cases[i].targetStepId}`
      );
    }
  }

  if (nextBlock) {
    var nextBlockId = nextBlock.getFieldValue("Id");
    if (statements_cases.length === 0) {
      flowchartDeclarations.push(
        `step${label_id}=>parallel: Escolha ${text_input} ${label_id} \r\n Outro caso|switchstep${selected}`
      );
      flowchartConnections.push(
        `step${label_id}(path1, bottom)->step${nextBlockId}`
      );
    } else {
      flowchartDeclarations.push(
        `step${label_id}i${statements_cases.length +
          1}=>parallel: Escolha ${text_input} ${label_id} \r\n Outro caso|switchstep${selected}`
      );
      if (statements_cases.length > 1) {
        flowchartConnections.push(
          `step${label_id}i${
            statements_cases.length
          }(path2, right)->step${label_id}i${statements_cases.length + 1}`
        );
        flowchartConnections.push(
          `step${label_id}i${
            statements_cases.length
          }@>step${label_id}i${statements_cases.length + 1}({"stroke": "${
            selected ? "yellow" : "#a5935b"
          }"})`
        );
      } else {
        flowchartConnections.push(
          `step${label_id}(path2, right)->step${label_id}i${statements_cases.length +
            1}`
        );
        flowchartConnections.push(
          `step${label_id}@>step${label_id}i${statements_cases.length +
            1}({"stroke": "${selected ? "yellow" : "#a5935b"}"})`
        );
      }
      flowchartConnections.push(
        `step${label_id}i${statements_cases.length +
          1}(path1, bottom)->step${nextBlockId}`
      );
    }
  } else if (statements_cases.length === 0) {
    flowchartDeclarations.push(
      `step${label_id}=>parallel: Escolha ${text_input} ${label_id}|switchstep${selected}`
    );
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}(path1)->e${label_id}`);
  }

  var switchStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(switchStep);
  return code;
};

Flowchart["case"] = function(block) {
  var text_value = block.getFieldValue("Value");
  var statements_targetstep = statementToArray(
    Flowchart.statementToCode(block, "TargetStep")
  );

  addStepsToLater(statements_targetstep);

  var $case = {
    value: text_value,
    targetStepId:
      statements_targetstep.length > 0 ? statements_targetstep[0].id : null
  };

  var code = JSON.stringify($case);
  return code;
};

Flowchart["imageclassificationstep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var nextBlock = block.getNextBlock();

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  if (!nextBlock) {
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}->e${label_id}`);
  } else {
    var nextBlockId = nextBlock.getFieldValue("Id");
    flowchartConnections.push(`step${label_id}->step${nextBlockId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>operation: Classificação de Imagem ${label_id}|imageclassificationstep${selected}`
  );

  var imageClassificationStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(imageClassificationStep);
  return code;
};

Flowchart["imageclassificationsettings"] = function(block) {
  return null;
};

Flowchart["readgpslocationstep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var nextBlock = block.getNextBlock();

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  if (!nextBlock) {
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}->e${label_id}`);
  } else {
    var nextBlockId = nextBlock.getFieldValue("Id");
    flowchartConnections.push(`step${label_id}->step${nextBlockId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>operation: Leitura de localização ${label_id}|readgpslocationstep${selected}`
  );

  var readGpsLocationStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(readGpsLocationStep);
  return code;
};

Flowchart["transformstep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var nextBlock = block.getNextBlock();

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  if (!nextBlock) {
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}->e${label_id}`);
  } else {
    var nextBlockId = nextBlock.getFieldValue("Id");
    flowchartConnections.push(`step${label_id}->step${nextBlockId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>operation: Transformação ${label_id}|transformstep${selected}`
  );

  var transformStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(transformStep);
  return code;
};

Flowchart["handoffstep"] = function(block) {
  var label_id = block.getFieldValue("Id");
  var nextBlock = block.getNextBlock();

  var flowchartConnections = [];
  var flowchartDeclarations = [];

  if (!nextBlock) {
    flowchartDeclarations.push(`e${label_id}=>end: Fim`);
    flowchartConnections.push(`step${label_id}->e${label_id}`);
  } else {
    var nextBlockId = nextBlock.getFieldValue("Id");
    flowchartConnections.push(`step${label_id}->step${nextBlockId}`);
  }

  var selected = Flowchart.SelectedId === label_id ? "selected" : "";

  flowchartDeclarations.push(
    `step${label_id}=>operation: Derivar ${label_id}|handoffstep${selected}`
  );

  var transformStep = {
    id: label_id,
    flowchartDeclarations,
    flowchartConnections
  };

  var code = JSON.stringify(transformStep);
  return code;
};

Flowchart["simplemessagestep"] = function(block) {
  return Flowchart["messagestep"](block);
};

Flowchart["simpleinputstep"] = function(block) {
  return Flowchart["inputstep"](block);
};

Flowchart["simpleconfirmstep"] = function(block) {
  return Flowchart["confirmstep"](block);
};

Flowchart["simpleliststep"] = function(block) {
  return Flowchart["liststep"](block);
};

Flowchart["simplelistitem"] = function(block) {
  if (block.isShadow_) return null;
  var text_title = block.getFieldValue("Title");
  var statements_targetstep = statementToArray(
    Flowchart.statementToCode(block, "TargetStep")
  );

  addStepsToLater(statements_targetstep);

  var listItem = {
    title: text_title,
    action: "NavigateStep",
    targetStepId:
      statements_targetstep.length > 0 ? statements_targetstep[0].id : null
  };

  var code = JSON.stringify(listItem);
  return code;
};

Flowchart["transformation"] = function(block) {
  return null;
};

export default Flowchart;