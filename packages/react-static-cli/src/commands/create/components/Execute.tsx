import React, { useReducer, Dispatch, useEffect } from "react"
import { Manifest } from "pacote"
import { Box, Color, Text } from "ink"
import Spinner from "ink-spinner"
import { copyFromTemplate } from "../utils/copyFromTemplate"
import { installDependencies } from "../utils/installDependencies"

interface ExecuteProps {
  opts: {
    template: Manifest
    isLocal: boolean
    localPath: string | undefined
    name: string
    packageManager: "yarn" | "npm"
  }
  onFinish(path: string): void
}

type ExecuteStep = "init" | "copy" | "install" | "finish"

interface ExecuteState {
  step: ExecuteStep
  cwd?: string
  error?: Error
}

interface ActionInitDone {
  type: "init"
}

interface ActionCopyDone {
  type: "copy"
  cwd: string
}

interface ActionInstallDone {
  type: "install"
}

interface ActionError {
  type: "error"
  error: Error
}

type ExecuteAction =
  | ActionInitDone
  | ActionCopyDone
  | ActionInstallDone
  | ActionError

function executeReducer(
  state: Readonly<ExecuteState>,
  action: ExecuteAction
): ExecuteState {
  switch (action.type) {
    case "init": {
      return { ...state, step: "copy" }
    }
    case "copy": {
      return { ...state, step: "install", cwd: action.cwd }
    }
    case "install": {
      return { ...state, step: "finish" }
    }
    case "error": {
      return { ...state, error: action.error }
    }
  }
}

const initalState: Readonly<ExecuteState> = Object.freeze({ step: "init" })
const descriptions: { [K in ExecuteState["step"]]: string } = {
  init: "starting",
  copy: "setting up project",
  install: "installing dependencies",
  finish: "done"
}

const sideEffects: {
  [K in ExecuteState["step"]]: (
    state: ExecuteState,
    dispatch: Dispatch<ExecuteAction>,
    props: ExecuteProps
  ) => null | JSX.Element
} = {
  init: renderExecuteInit,
  copy: renderExecuteCopy,
  install: renderExecuteInstall,
  finish: renderExecuteFinish
}

export function Execute(props: ExecuteProps): JSX.Element {
  const [state, dispatch] = useReducer(executeReducer, initalState)

  const { step } = state

  const rendered = sideEffects[step](state, dispatch, props)

  if (rendered !== null) {
    return <Box>{rendered}</Box>
  }

  return (
    <Box>
      <Color greenBright>
        <Spinner type="dots" />
      </Color>
      {` ${descriptions[state.step]}`}
    </Box>
  )
}

function renderExecuteInit(
  _: Readonly<ExecuteState>,
  dispatch: Dispatch<ExecuteAction>,
  __: ExecuteProps
): null | JSX.Element {
  useEffect(() => {
    dispatch({ type: "init" })
  }, [dispatch])

  return null
}

function renderExecuteCopy(
  _: Readonly<ExecuteState>,
  dispatch: Dispatch<ExecuteAction>,
  { opts }: ExecuteProps
): null | JSX.Element {
  useEffect(() => {
    let active = true
    const promise = copyFromTemplate(
      opts.template,
      opts.isLocal,
      opts.localPath,
      opts.name
    )

    promise.then(outputPath => {
      active && dispatch({ type: "copy", cwd: outputPath })
    })

    return (): void => {
      active = false
    }
  }, [opts])

  return null
}

function renderExecuteInstall(
  state: ExecuteState,
  dispatch: Dispatch<ExecuteAction>,
  { opts: { packageManager } }: ExecuteProps
): null | JSX.Element {
  useEffect(() => {
    let active = true

    process.chdir(state.cwd!)
    const promise = installDependencies(packageManager)

    promise
      .then(() => active && dispatch({ type: "install" }))
      .catch(error => active && dispatch({ type: "error", error }))

    return (): void => {
      active = false
    }
  }, [state.cwd])

  if (!state.error) {
    return null
  }

  return <Text>{state.error.message}</Text>
}

function renderExecuteFinish(
  state: ExecuteState,
  dispatch: Dispatch<ExecuteAction>,
  { onFinish }: ExecuteProps
): null | JSX.Element {
  useEffect(() => {
    onFinish(state.cwd!)
  }, [onFinish])

  return null
}
