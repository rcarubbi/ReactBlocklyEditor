import ReactJson from 'react-json-view'

function RulesEngine({output}) {
    
    return (
        <ReactJson src={JSON.parse(output)}></ReactJson>
    )
} 

export default RulesEngine;