import { spawnSync } from 'child_process'

const watch = spawnSync('yarn', ['jest', '--watch'], { stdio: 'inherit' })

if (watch.status && watch.status !== 0) {
  process.exit(watch.status)
}

process.exit(0)
