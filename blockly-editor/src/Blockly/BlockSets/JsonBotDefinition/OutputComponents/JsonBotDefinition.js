import ReactJson from 'react-json-view'
import "../../OutputComponents.css"
function JsonBotDefinition({output}) {
    
    return (
        <div className='outputContainer'>
        <ReactJson src={JSON.parse(output)} theme={'monokai'}></ReactJson>
        </div>
    )
} 

export default JsonBotDefinition;