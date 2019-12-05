import React, { useReducer, useEffect } from "react";
import { Box, Color, Text } from "ink";
import Spinner from "ink-spinner";
import { copyFromTemplate } from "../utils/copyFromTemplate";
import { installDependencies } from "../utils/installDependencies";
function executeReducer(state, action) {
    switch (action.type) {
        case "init": {
            return { ...state, step: "copy" };
        }
        case "copy": {
            return {
                ...state,
                step: "install",
                cwd: action.cwd,
                messages: [...state.messages, ...action.messages]
            };
        }
        case "install": {
            return {
                ...state,
                step: "finish",
                messages: [...state.messages, ...action.messages]
            };
        }
        case "error": {
            return { ...state, error: action.error, messages: [] };
        }
    }
}
const initalState = Object.freeze({ step: "init", messages: [] });
const descriptions = {
    init: "starting",
    copy: "setting up project",
    install: "installing dependencies",
    finish: "done"
};
const sideEffects = {
    init: renderExecuteInit,
    copy: renderExecuteCopy,
    install: renderExecuteInstall,
    finish: renderExecuteFinish
};
export function Execute(props) {
    const [state, dispatch] = useReducer(executeReducer, initalState);
    const { step } = state;
    const rendered = sideEffects[step](state, dispatch, props);
    if (rendered !== null) {
        return <Box>{rendered}</Box>;
    }
    return (<Box flexDirection="column">
      <Box>
        <Color green>
          <Spinner type="dots"/>
        </Color>
        {` ${descriptions[state.step]}`}
      </Box>
      <Messages messages={state.messages}/>
    </Box>);
}
function renderExecuteInit(_, dispatch, __) {
    useEffect(() => {
        dispatch({ type: "init" });
    }, [dispatch]);
    return null;
}
function renderExecuteCopy(_, dispatch, { opts }) {
    useEffect(() => {
        let active = true;
        const promise = copyFromTemplate(opts.template, opts.isLocal, opts.localPath, opts.name, opts.packageManager);
        promise.then(({ path: outputPath, messages }) => {
            active && dispatch({ type: "copy", cwd: outputPath, messages });
        });
        return () => {
            active = false;
        };
    }, [opts]);
    return null;
}
function renderExecuteInstall(state, dispatch, { opts: { packageManager } }) {
    useEffect(() => {
        let active = true;
        process.chdir(state.cwd);
        const promise = installDependencies(packageManager);
        promise
            .then(({ messages }) => active && dispatch({ type: "install", messages }))
            .catch(error => active && dispatch({ type: "error", error }));
        return () => {
            active = false;
        };
    }, [state.cwd]);
    if (!state.error) {
        return null;
    }
    return <Text>{state.error.message}</Text>;
}
function renderExecuteFinish(state, dispatch, { onFinish }) {
    useEffect(() => {
        onFinish(state.cwd);
    }, [onFinish]);
    return null;
}
function Messages({ messages }) {
    if (messages.length === 0) {
        return null;
    }
    return (<Box flexDirection="column">
      {messages
        .filter(message => message.data && message.data.length > 0)
        .map((message, index) => {
        const value = message.data.toString().trimEnd();
        const isMessage = message.type === "message";
        const isWarning = message.type === "error" && value.startsWith("warning");
        const isError = message.type === "error" && !isWarning;
        return (<Color key={index} gray={isMessage} white={isWarning} red={isError}>
              <Text>{value}</Text>
            </Color>);
    })}
    </Box>);
}
