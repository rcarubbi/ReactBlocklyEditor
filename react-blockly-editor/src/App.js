import './App.css';
import BlocklyEditor from './Blockly/BlocklyEditor.js';
import { useState } from 'react';

function App() {
  const [blockSet, setBlockSet] = useState("RulesEngine");
  return (
    <div id="app" onChange={e => setBlockSet(e.target.value)}>
      <div id="filter">
        <label className="label" htmlFor="blockSetDropdown">Block Set:</label>
        <select className="dropdown" id="blockSetDropdown">
          <option value="RulesEngine">Rules Engine</option>
          <option value="JsonBotDefinition">Json bot definition</option>
        </select>
      </div>
      <BlocklyEditor blockSet={blockSet} zoom={
        {
          controls: true,
          wheel: false,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2,
          pinch: true
        }}></BlocklyEditor>
    </div>
  );
}

export default App;
