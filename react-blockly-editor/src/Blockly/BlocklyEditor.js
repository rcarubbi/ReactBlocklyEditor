import './BlocklyEditor.css';
import Blockly from 'blockly/core';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';

import blocksArray from './BlockSets/RulesEngine/blocks.json';
import toolboxXml from './BlockSets/RulesEngine/toolbox.xml';
import workspaceXml from './BlockSets/RulesEngine/workspace.xml';
import codeGenerators from './BlockSets/RulesEngine/CodeGenerators';
import OutputComponents from './BlockSets/RulesEngine/OutputComponents';

import locale from 'blockly/msg/en';


blocksArray.forEach((item) => {

    Blockly.Blocks[item.type] = {
        init: function () {
            this.jsonInit(item);
            if (item.deletable === false) this.setDeletable(false);
        }
    };
});

Blockly.setLocale(locale);



function BlocklyEditor({ workspace, ...rest }) {

    const blocklyDiv = useRef();
    const workspaceRef = useRef();

    const [output, setOutput] = useState(<></>);

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


    const onBlockChange = useCallback((e) => {
        const { current: ws } = workspaceRef;
        if (e.type === Blockly.Events.BLOCK_CREATE) {
            const block = ws.getBlockById(e.blockId || e.newValue);
            setBlockId(block);
        }

        if (e.newParentId !== e.oldParentId || e.newValue !== e.oldValue) {
            udpateOutputs();
        }

    }, [setBlockId]);

    const udpateOutputs = () => {
        const outputs = codeGenerators.map((codeGenerator, index) =>
        <OutputComponents key={index} componentName={codeGenerator.name_} output={codeGenerator.fromWorkspace(workspaceRef.current)} />
        );
        setOutput(outputs)
    }

    const initWorkspace = useCallback(async () => {
        const toolBoxResponse = await axios.get(toolboxXml, {
            "Content-Type": "application/xml; charset=utf-8"
        });
        const workspaceResponse = await axios.get(workspaceXml, {
            "Content-Type": "application/xml; charset=utf-8"
        });


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
            udpateOutputs();
        }
    }, [onBlockChange, rest]);

    useEffect(() => {
        if (!workspaceRef.current) {
            initWorkspace();
        }

    }, [initWorkspace]);



    return (
        <>
            <div ref={blocklyDiv} id="blocklyDiv" />

            <div id="outputDiv">
                {output}
            </div>
        </>
    )
}


export default BlocklyEditor;