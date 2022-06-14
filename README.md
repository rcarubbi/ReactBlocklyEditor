# A Blockly Editor built with React 

This Editor is designed to load a custom block set very easily.

### What is a block set?

I call as "Block Set" all the required files to build a blockly environment + React components to render the output generated by the blocks:

### Adding a new Block set

The 3 main files can be generated and exported from [Blockly Developer Tools](https://blockly-demo.appspot.com/static/demos/blockfactory/index.html) or be manually created.

They are:
* blocks.json -> This file is originally exported with the .js extensions but it contains a json object. It's used to declare the blocks definition;
* Toolbox.xml -> This is the file that defines the available blocks in the toolbox and the categories where they are organized;
* Workspace.xml -> This file defines the initial blocks that are pre-loaded in the workspace area

This 3 files should be copied to a folder insisde blockly-editor/src/Blockly/BlockSets/<name_of_your_blockset>/

---

### Configuring Code Generators and Output Components

#### Code Generators 

In blockly, Code generator classes are defined to implement how to parse the blocks and define what is the expected output for each of them.

There are some built-in generators that are used to parse the standard blocks to known languages such as:

* Javascript
* Python
* PHP
* Lua
* Dart

The custom generators are javascript files and contain one function per block.  

There are some extra functions that are usually called and/or overriden:

such as: 
* fromWorkspace 
* generalBlockToObj
* valueToCode  
* blockToCode
* statementToCode
* scrub_

The [full reference for generators](https://developers.google.com/blockly/reference/js/Blockly.Generator) can be found in the [oficial blockly documentation](https://developers.google.com/blockly) 

If you think it's too complicated, don't worry! You can try starting by follow the examples in the sample block sets I added.

#### Output Components

Output components are regular react components to indicates how to render the coded generated in the editor's right panel.

They have to expect a parameter called "output" and render it as you want.

Output components name must match with code generators once the work in pairs, however you can have as many code generators as you want for the same block set as long as they have an output component to match.

#### index.js files

both folder CodeGenerators and OutputComponents must have a root file to expose the other files following the respective patterns below:

  ```javascript
  import componentA from "./componentA.js";
  import componentB from "./componentB.js";

  const codeGenerators = [componentA, componentB];
  export default codeGenerators;
  ```
---
  ```javascript
  import React from 'react';
  import componentA from './componentA';
  import componentB from './componentB';
 
  const OutputComponents = ({componentName, output}) => {
      const componentsMap = {
            componentA,
            componentB
      }
      return React.createElement(componentsMap[componentName], { output })
  }

  export default OutputComponents;
  ```
  
  so finally, this is the file structure expected for a Block Set:
 
 ```folder
  blockSetName
  │   blocks.json
  │   toolbox.xml
  │   workspace.xml
  │   
  ┡───CodeGenerators
  │   │   index.js
  │   │   componentA.js
  │   │   componentB.js
  │   │
  │   
  └───OutputComponents
      │   index.js
      │   componentA.js
      │   componentA.js
      │
```
  
