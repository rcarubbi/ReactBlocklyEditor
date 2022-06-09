import "../../OutputComponents.css"

function RulesEngine({output}) {
    
    return (
        (output && 
        <pre className="outputContainer">{output}</pre>)
    )
} 

export default RulesEngine;