import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const outDir = '/workspace/scholarhub/screenshots'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

const routes = [
  { path: '/', name: 'home-remote' },
  { path: '/resources', name: 'resources-remote' },
  { path: '/resource/attention-is-all-you-need-2017', name: 'detail-remote' },
  { path: '/search?q=learning', name: 'search-remote' },
  { path: '/settings', name: 'settings-remote' },
  { path: '/about', name: 'about-remote' },
]

for (const r of routes) {
  const url = `http://localhost:5173${r.path}`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${outDir}/${r.name}.png`, fullPage: true })
  console.log(`screenshot ${r.name} -> ${outDir}/${r.name}.png`)
}

await browser.close()
