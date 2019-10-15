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
