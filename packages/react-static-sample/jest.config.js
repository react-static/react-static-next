// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defaults } = require("jest-config")

module.exports = {
  ...defaults,
  transform: {
    "^.+\\.[t|j]sx?$": ["babel-jest", { rootMode: "upward" }]
  },
  testPathIgnorePatterns: [...defaults.testPathIgnorePatterns, ".*?.d.ts$"]
}
