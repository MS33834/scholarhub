import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://localhost:5173'
const outDir = resolve(process.env.SCREENSHOT_OUT_DIR || '/workspace/scholarhub/screenshots')
const executablePath = process.env.PLAYWRIGHT_CHROME_EXECUTABLE || '/usr/bin/google-chrome'

mkdirSync(outDir, { recursive: true })

const routes = [
  { path: '/', name: 'home' },
  { path: '/resources', name: 'resources' },
  { path: '/resource/attention-is-all-you-need', name: 'detail' },
  { path: '/search?q=learning', name: 'search' },
  { path: '/settings', name: 'settings' },
  { path: '/about', name: 'about' },
]

const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

let exitCode = 0

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  for (const r of routes) {
    const url = `${baseUrl}${r.path}`
    try {
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.waitForTimeout(800)
      const outPath = resolve(outDir, `${r.name}.png`)
      await page.screenshot({ path: outPath, fullPage: true })
      console.log(`screenshot ${r.name} -> ${outPath}`)
    } catch (err) {
      console.error(`failed to screenshot ${r.name} (${url}): ${err.message}`)
      exitCode = 1
    }
  }

  await context.close()
} finally {
  await browser.close()
}

process.exit(exitCode)
