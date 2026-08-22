import puppeteer from 'puppeteer-core'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const BASE = 'http://localhost:5173'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE-ERR:', msg.text().slice(0, 500)) })
page.on('pageerror', (err) => console.log('PAGE-ERR:', String(err).slice(0, 700)))
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
await wait(1200)
await page.evaluate(() => { localStorage.removeItem('ndisp-auth-profile'); localStorage.removeItem('ndisp.demo.session') })
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
await wait(1200)
await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'))
  const target = buttons.find((b) => b.textContent.includes('DM (Nalanda)'))
  if (target) target.click()
})
await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 })
await wait(2500)
console.log('--- navigating to general ---')
await page.goto(`${BASE}/admin/department/general`, { waitUntil: 'domcontentloaded' })
await wait(30000)
const state = await page.evaluate(() => ({
  url: window.location.pathname,
  rootChildren: document.getElementById('root')?.children.length ?? -1,
  bodyText: document.body.innerText.slice(0, 2500),
}))
console.log('URL:', state.url)
console.log('ROOT CHILDREN:', state.rootChildren)
console.log('=== BODY ===')
console.log(state.bodyText)
await browser.close()