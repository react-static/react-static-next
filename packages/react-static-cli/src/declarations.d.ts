declare namespace ReactStatic {
  interface State {
    stage: "dev"
    config?: PlatformConfig
    subscription?: Subscription
  }

  interface Subscription {
    (): void
  }

  interface PlatformConfig {
    paths: {
      root: string
      src: string
      dist: string
      temp: string
      buildArtifacts: string
      devDist: string
      public: string
      plugins: string
      pages: string
      nodeModules: string
      assets: string
    }
  }

  interface AppConfig {
    paths: Partial<PlatformConfig["paths"]>
  }

  type ConfigCallback = (state: State) => void
}

declare module "wordwrap" {
  interface Options {
    mode: "soft" | "hard"
  }

  export default function wordwrap(
    start: number,
    stop: number,
    options?: Options
  ): (input: string) => string
  export default function wordwrap(stop: number): (input: string) => string
}

declare module "lodash.padend" {
  export default function padEnd(
    input?: string,
    length?: number,
    chars?: string
  ): string
}

declare module "lodash.trimstart" {
  export default function trimStart(input?: string, chars?: string): string
}

declare module "ink-spinner" {
  import { Component } from "react"
  import { Chalk } from "chalk"

  type SpinnerName =
    | "dots"
    | "dots2"
    | "dots3"
    | "dots4"
    | "dots5"
    | "dots6"
    | "dots7"
    | "dots8"
    | "dots9"
    | "dots10"
    | "dots11"
    | "dots12"
    | "line"
    | "line2"
    | "pipe"
    | "simpleDots"
    | "simpleDotsScrolling"
    | "star"
    | "star2"
    | "flip"
    | "hamburger"
    | "growVertical"
    | "growHorizontal"
    | "balloon"
    | "balloon2"
    | "noise"
    | "bounce"
    | "boxBounce"
    | "boxBounce2"
    | "triangle"
    | "arc"
    | "circle"
    | "squareCorners"
    | "circleQuarters"
    | "circleHalves"
    | "squish"
    | "toggle"
    | "toggle2"
    | "toggle3"
    | "toggle4"
    | "toggle5"
    | "toggle6"
    | "toggle7"
    | "toggle8"
    | "toggle9"
    | "toggle10"
    | "toggle11"
    | "toggle12"
    | "toggle13"
    | "arrow"
    | "arrow2"
    | "arrow3"
    | "bouncingBar"
    | "bouncingBall"
    | "smiley"
    | "monkey"
    | "hearts"
    | "clock"
    | "earth"
    | "moon"
    | "runner"
    | "pong"
    | "shark"
    | "dqpb"
    | "weather"
    | "christmas"
    | "grenade"
    | "point"
    | "layer"

  interface SpinnerProps {
    type?: SpinnerName
  }

  type StringifyPartial<T> = {
    [P in keyof T]?: string
  }

  type BooleansPartial<T> = {
    [P in keyof T]?: boolean
  }

  type TupleOfNumbersPartial<T> = {
    [P in keyof T]?: [number, number, number]
  }

  type ChalkColorModels = Pick<
    Chalk,
    "rgb" | "hsl" | "hsv" | "hwb" | "bgRgb" | "bgHsl" | "bgHsv" | "bgHwb"
  >
  type ChalkKeywordsAndHexes = Pick<
    Chalk,
    "keyword" | "hex" | "bgKeyword" | "bgHex"
  >
  type ChalkCommons = Omit<
    Chalk,
    | keyof ChalkColorModels
    | keyof ChalkKeywordsAndHexes
    | "constructor"
    | "level"
    | "enabled"
  >

  type ChalkProps = BooleansPartial<ChalkCommons> &
    StringifyPartial<ChalkKeywordsAndHexes> &
    TupleOfNumbersPartial<ChalkColorModels>

  class Spinner extends Component<SpinnerProps & ChalkProps> {}

  export = Spinner
}

declare module "ink-confirm-input" {
  import { Component } from "react"

  export interface ConfirmInputProps {
    onSubmit(value: boolean): void
  }

  export default class ConfirmInput extends Component<ConfirmInputProps> {}
}

declare module "ink-select-input" {
  import { Component } from "react"

  export interface ItemOfSelectInput {
    label: string
    value: any
    key?: string | number
  }

  export interface SelectInputProps<
    T extends ItemOfSelectInput = ItemOfSelectInput
  > {
    focus?: boolean
    indicatorComponent?: Component
    itemComponent?: Component
    items?: ReadonlyArray<T>
    limit?: number
    initialIndex?: number
    onSelect?: (item: T) => void
  }

  export default class SelectInput extends Component<SelectInputProps> {}
}

declare module "ink-box" {
  import { Component } from "react"

  export default class Box extends Component<any> {}
}
