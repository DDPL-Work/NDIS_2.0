import puppeteer from 'puppeteer-core'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const BASE = 'http://localhost:5173'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
page.on('response', (resp) => {
  const url = resp.url()
  if (url.includes('/gis/layers/') || url.includes('/facilities') || url.includes('/catalog')) {
    console.log(`RESP ${resp.status()} ${url.replace(BASE, '')} ${(Date.now() - resp.request().timestamp * 1000).toFixed(0)}ms`)
  }
})
page.on('requestfailed', (req) => console.log('FAILED', req.url().replace(BASE, ''), req.failure()?.errorText))
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
await wait(2000)
await page.goto(`${BASE}/admin/department/health`, { waitUntil: 'domcontentloaded' })
await wait(20000)
const body = await page.evaluate(() => document.body.innerText)
console.log('=== BODY (first 1200) ===')
console.log(body.slice(0, 1200))
console.log('=== URL ===', page.url())
await browser.close()