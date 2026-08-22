import puppeteer from 'puppeteer-core'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const BASE = 'http://localhost:5173'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
page.on('console', (msg) => { const t = msg.text(); if (/FETCH/i.test(t)) console.log(t.slice(0, 200)) })
await page.evaluateOnNewDocument(() => {
  const orig = window.fetch
  window.fetch = (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || ''
    const t0 = Date.now()
    return orig(...args).then((resp) => {
      console.log(`FETCH ${resp.status} ${url.replace('https://nalanda.drdesigntech.com', '')} ${Date.now() - t0}ms`)
      return resp
    }).catch((err) => {
      console.log(`FETCH ERR ${url.replace('https://nalanda.drdesigntech.com', '')} ${err.message}`)
      throw err
    })
  }
})
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
console.log('--- navigating to general workspace ---')
await page.goto(`${BASE}/admin/department/general`, { waitUntil: 'domcontentloaded' })
await wait(25000)
const body = await page.evaluate(() => document.body.innerText)
console.log('=== BODY (first 1000) ===')
console.log(body.slice(0, 1000))
await browser.close()