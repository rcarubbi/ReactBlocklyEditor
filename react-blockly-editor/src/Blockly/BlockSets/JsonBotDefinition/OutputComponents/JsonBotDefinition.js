import ReactJson from 'react-json-view'

function JsonBotDefinition({output}) {
    
    return (
        <ReactJson src={JSON.parse(output)}></ReactJson>
    )
} 

export default JsonBotDefinition;