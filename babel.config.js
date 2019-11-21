module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          // We don't care about newer node, because react-static has this
          // explicitly defined as minimum and we won't be babel-ing on the fly.
          // Therefore, we must transpile for this exact version.
          node: '10.16.3',
        },
        useBuiltIns: 'usage',
        corejs: { version: 3.4 },
      },
    ],
    [
      '@babel/preset-react',
      {
        development: process.env.BABEL_ENV !== 'build',
      },
    ],
    '@babel/preset-typescript',
  ],
  env: {
    build: {
      ignore: [
        '**/*.test.tsx',
        '**/*.test.ts',
        '**/*.story.tsx',
        '__snapshots__',
        '__tests__',
        '__stories__',
      ],
    },
  },
  ignore: [
    'node_modules',
    'dist',
    'packages/*/node_modules',
    'packages/*/dist',
    '*.d.ts',
    'packages/*/**/*.d.ts',
  ],
}
