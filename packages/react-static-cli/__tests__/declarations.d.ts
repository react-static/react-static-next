declare module "ink-testing-library" {
  import { Unmount } from "ink"

  export interface RenderResponse {
    rerender: <Props>(tree: React.ReactElement<Props>) => void
    unmount: () => void
    stdin: {
      write: (data: unknown) => boolean
    }
    frames: ReadonlyArray<string>
    lastFrame: () => string
  }
  export function cleanup(): void
  export function render<Props>(tree: React.ReactElement<Props>): RenderResponse
}
