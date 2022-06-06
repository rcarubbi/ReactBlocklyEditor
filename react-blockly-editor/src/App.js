import './App.css';
import BlocklyEditor from './Blockly/BlocklyEditor.js';
import {useState } from 'react';

function App() {
  const [blockSet, setBlockSet] = useState("JsonBotDefinition");
  return (
    <div id="app" onChange={e => setBlockSet(e.target.value)}>
      <select>
        <option value="JsonBotDefinition">Json bot definition</option>
        <option value="RulesEngine">Rules Engine</option>
      </select>
      <BlocklyEditor blockSet={blockSet}></BlocklyEditor>
    </div>
  );
}

export default App;
