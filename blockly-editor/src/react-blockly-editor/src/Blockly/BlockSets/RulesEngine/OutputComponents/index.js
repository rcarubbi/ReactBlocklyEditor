import RulesEngine from './RulesEngine';
import React from 'react';

const OutputComponents = ({componentName, output}) => {
    const componentsMap = {
        RulesEngine,
    }
    return React.createElement(componentsMap[componentName], { output })
}

export default OutputComponents;
