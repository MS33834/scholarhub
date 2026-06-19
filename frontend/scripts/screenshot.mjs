import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const outDir = '/workspace/scholarhub/screenshots'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

const routes = [
  { path: '/', name: 'home' },
  { path: '/resources', name: 'resources' },
  { path: '/resource/attention-is-all-you-need', name: 'detail' },
  { path: '/search?q=learning', name: 'search' },
  { path: '/settings', name: 'settings' },
  { path: '/about', name: 'about' },
]

for (const r of routes) {
  const url = `http://localhost:5174${r.path}`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${outDir}/${r.name}.png`, fullPage: true })
  console.log(`screenshot ${r.name} -> ${outDir}/${r.name}.png`)
}

await browser.close()
