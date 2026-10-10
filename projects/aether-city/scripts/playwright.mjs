import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
for (const path of ['tmp/pw-cli', 'tmp/browser', 'outputs/playwright']) mkdirSync(resolve(root, path), { recursive: true })
const result = spawnSync(process.execPath, [resolve(root, 'node_modules/@playwright/cli/playwright-cli.js'), '-s=aether-city', ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    TMPDIR: resolve(root, 'tmp'),
    PWTEST_DAEMON_SESSION_DIR: resolve(root, 'tmp/pw-cli'),
    PLAYWRIGHT_CLI_INSTALLATION_FOR_TEST: resolve(root, 'tmp/pw-cli'),
    PLAYWRIGHT_BROWSERS_PATH: resolve(root, 'tmp/browser'),
  },
})
process.exit(result.status ?? 1)
