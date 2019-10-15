declare module 'react-error-overlay' {
  import { Component } from 'react'

  interface ErrorLocation {
    fileName: string
    lineNumber?: number
    colNumber?: number
  }

  class ErrorOverlay extends Component {
    public static dismissBuildError(): void
    public static reportBuildError(error: string): void
    public static setEditorHandler(handler: (errorLocation: ErrorLocation) => void): void
    public static startReportingRuntimeErrors(params: { onError: Function, filename: string }): void
    public static stopReportingRuntimeErrors(): void
  }

  export default ErrorOverlay
}

declare module 'strip-ansi' {
  function strip(input: string): string
  export default strip
}

declare module 'sockjs-client' {
  class SockJs {
    public set onclose(handler: Function)
    public set onmessage(handler: (e: MessageEvent) => void)
    constructor(url: string)
  }

  export default SockJs
}
