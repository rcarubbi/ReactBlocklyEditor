import './BlocklyEditor.css';
import Blockly from 'blockly/core';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';



import locale from 'blockly/msg/en';
 


Blockly.setLocale(locale);

function BlocklyEditor({ blockSet, ...rest }) {

    const [blocksArray, setBlocksArray] = useState();
    const [toolboxXml, setToolboxXml] = useState();
    const [workspaceXml, setWorkspaceXml] = useState();
    const codeGenerators = useRef();
    const OutputComponents = useRef();
    const [output, setOutput] = useState(<></>);

     const importBlockSetModules = useCallback(async () => {
        setBlocksArray(await import(`./BlockSets/${blockSet}/blocks.json`));
        setToolboxXml(await import(`./BlockSets/${blockSet}/toolbox.xml`));
        setWorkspaceXml(await import(`./BlockSets/${blockSet}/workspace.xml`));
        codeGenerators.current = await import(`./BlockSets/${blockSet}/CodeGenerators`);
        OutputComponents.current = await import(`./BlockSets/${blockSet}/OutputComponents`);
    }, [blockSet, setBlocksArray, setToolboxXml, setWorkspaceXml, codeGenerators, OutputComponents]);

    const setBlockId = useCallback((block) => {
        const max = items => {
            return items.reduce((acc, val) => {
                acc = acc === undefined || val > acc ? val : acc;
                return acc;
            }, 0);
        };

        const getStepBlocks = () => {
            const { current: ws } = workspaceRef;
            const blocks = Object.values(ws.blockDB_);
            const stepBlocks = blocks.filter(x => x.getFieldValue("Id"));
            return stepBlocks;
        };

        const getNextStepBlockId = () => {
            const blockIds = getStepBlocks().map(x =>
                parseInt(x.getFieldValue("Id"))
            );
            return (max(blockIds) || 0) + 1;
        };


        if (block === null) return;
        if (block.type === "goto") return;

        const id = block.getField("Id");
        if (id) {
            block.setFieldValue(getNextStepBlockId(), "Id");
        }

        for (let i = 0; i < block.childBlocks_.length; i++) {
            setBlockId(block.childBlocks_[i]);
        }
    }, []);

    const udpateOutputs = useCallback(async () => {

        if (codeGenerators.current && OutputComponents.current) {
            const OutputComponent = OutputComponents.current.default;
            const outputs = codeGenerators.current.default.map((codeGenerator, index) =>
                <OutputComponent key={index} componentName={codeGenerator.name_} output={codeGenerator.fromWorkspace(workspaceRef.current)} />
            );
            setOutput(outputs);
        }
    }, []);

    const onBlockChange = useCallback(async (e) => {
        const { current: ws } = workspaceRef;
        if (e.type === Blockly.Events.BLOCK_CREATE) {
            const block = ws.getBlockById(e.blockId || e.newValue);
            setBlockId(block);
        }

        if (e.newParentId !== e.oldParentId || e.newValue !== e.oldValue) {
            await udpateOutputs();
        }

    }, [setBlockId, udpateOutputs]);

    const initWorkspace = useCallback(async () => {
        if (!toolboxXml || !workspaceXml)
            return;

        const toolBoxResponse = await axios.get(toolboxXml.default, {
            "Content-Type": "application/xml; charset=utf-8"
        });
        const workspaceResponse = await axios.get(workspaceXml.default, {
            "Content-Type": "application/xml; charset=utf-8"
        });

        blocklyDiv.current.innerHTML = null;
        workspaceRef.current = Blockly.inject(blocklyDiv.current,
            {
                toolbox: toolBoxResponse.data,
                ...rest
            }
        );


        if (workspaceResponse.data) {
            workspaceRef.current.addChangeListener(onBlockChange);
            workspaceRef.current.clear();
            Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(workspaceResponse.data), workspaceRef.current);
            await udpateOutputs();
        }
    }, [onBlockChange, rest, toolboxXml, workspaceXml, udpateOutputs]);

    useEffect(() => {

        if (!blocksArray && !toolboxXml && !workspaceXml && !codeGenerators.current && !OutputComponents.current)
            importBlockSetModules();
        else {

            if (blocksArray) {
                blocksArray.default.forEach((item) => {

                    Blockly.Blocks[item.type] = {
                        init: function () {
                            this.jsonInit(item);
                            if (item.deletable === false) this.setDeletable(false);
                        }
                    };
                });
            }

            if (!workspaceRef.current) {
                initWorkspace();
            }

          
        }


    }, [blocksArray, toolboxXml, workspaceXml, codeGenerators, OutputComponents, importBlockSetModules, initWorkspace]);

    useEffect(() => {
        setBlocksArray(null);
        setToolboxXml(null);
        setWorkspaceXml(null);
        codeGenerators.current = null;
        OutputComponents.current = null;
        workspaceRef.current = null;
    }, [blockSet])

    const blocklyDiv = useRef();
    const workspaceRef = useRef();

    return (
        <div id="blocklyContainer">
            <div ref={blocklyDiv} id="blocklyDiv" />

            <div id="outputDiv">
                {output}
            </div>
        </div>
    )


}


export default BlocklyEditor;