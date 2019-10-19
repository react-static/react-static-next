import { spawnSync } from 'child_process'

const lint = spawnSync('eslint', ['.'], { stdio: 'inherit' })

if (lint.status && lint.status !== 0) {
  process.exit(lint.status)
}

const compile = spawnSync('yarn', ['tsc'], { stdio: 'inherit' })

if (compile.status && compile.status !== 0) {
  process.exit(compile.status)
}

process.exit(0)
