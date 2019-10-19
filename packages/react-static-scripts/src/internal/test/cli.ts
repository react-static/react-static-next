import { spawnSync } from 'child_process'

const test = spawnSync(
  'yarn',
  ['jest'].concat(process.argv.includes('--watch') ? ['--watch'] : []),
  { stdio: 'inherit' }
)

if (test.status && test.status !== 0) {
  process.exit(test.status)
}

process.exit(0)
