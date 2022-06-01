import JsonBotDefinition from './JsonBotDefinition';
import Flowchart from './Flowchart';
import React from 'react';

const OutputComponents = ({componentName, output}) => {
    const componentsMap = {
          JsonBotDefinition,
          Flowchart
    }
    return React.createElement(componentsMap[componentName], { output })
}

export default OutputComponents;
