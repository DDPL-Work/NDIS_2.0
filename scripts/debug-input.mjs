import puppeteer from 'puppeteer-core'

const BASE = 'http://localhost:5173'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const wait = sleep

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox', '--window-size=1280,800'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text()) })
page.on('pageerror', (e) => console.log('PAGE-ERR:', e.message))

async function login() {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const target = buttons.find((b) => b.textContent.includes('Citizen (Nalanda)'))
    if (target) target.click()
  })
  await page.waitForFunction(() => window.location.pathname.startsWith('/citizen'), { timeout: 15000 })
  await page.waitForSelector('[data-tour="citizen-dashboard-main"]', { timeout: 15000 })
  console.log('LOGIN-OK')
}

await login()
await page.reload({ waitUntil: 'networkidle2', timeout: 30000 })
await sleep(3000)
const afterReload = await page.evaluate(() => ({
  url: location.pathname,
  onLogin: Boolean(document.querySelector('[data-testid="signin"]')) || document.body.textContent.includes('secure access'),
  hasTopbar: Boolean(document.querySelector('header')?.textContent?.includes('Citizen Dashboard')),
  hasMobileNav: Boolean(document.querySelector('nav[aria-label="Mobile navigation"]')),
}))
console.log('AFTER-RELOAD:', JSON.stringify(afterReload))

await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('a'))
  const nearby = cards.find((a) => a.textContent.includes('Find Nearby'))
  if (nearby) nearby.click()
})
await page.waitForFunction(() => window.location.pathname.includes('/citizen/map'), { timeout: 15000 })
await wait(4000)
console.log('MAP-URL:', await page.evaluate(() => location.pathname))

const probe = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll('[data-tour="citizen-map-search"]')].map((el) => {
    const b = el.getBoundingClientRect()
    return { disabled: el.disabled, rect: [b.x, b.y, b.width, b.height], hidden: el.closest('[hidden]') ? true : false, aria: el.getAttribute('aria-label') }
  })
  const aside = document.querySelector('aside[data-tour-sidebar]')
  const elAt = (x, y) => { const el = document.elementFromPoint(x, y); return el ? `${el.tagName}.${String(el.className).slice(0, 60)}` : 'none' }
  const b = inputs[0] ? [inputs[0].rect[0] + inputs[0].rect[2] / 2, inputs[0].rect[1] + inputs[0].rect[3] / 2] : [0, 0]
  const overlay = document.elementFromPoint(b[0], b[1])
  let anc = overlay
  const ancestry = []
  while (anc && ancestry.length < 4) {
    ancestry.push(`${anc.tagName}.${String(anc.className).slice(0, 90)}`)
    anc = anc.parentElement
  }
  const dialogs = [...document.querySelectorAll('[role="dialog"]')].map((d) => d.textContent.trim().slice(0, 80))
  return {
    count: inputs.length,
    inputs,
    asideMode: aside?.getAttribute('data-tour-sidebar'),
    asideRect: aside && aside.getBoundingClientRect().width,
    atInputCenter: elAt(b[0], b[1]),
    overlayAncestry: ancestry,
    overlayZ: overlay ? getComputedStyle(overlay).zIndex : null,
    dialogs,
  }
})
console.log('INPUT-PROBE:', JSON.stringify(probe))

await page.click('[data-tour="citizen-map-search"]')
await sleep(600)
const afterClick = await page.evaluate(() => ({
  tag: document.activeElement?.tagName,
  cls: document.activeElement?.className?.slice(0, 80),
  placeholder: document.activeElement?.getAttribute?.('placeholder'),
  suggestions: document.querySelectorAll('.ndisp-suggest').length,
}))
console.log('AFTER-CLICK:', JSON.stringify(afterClick))

await page.evaluate(() => document.querySelector('[data-tour="citizen-map-search"]')?.focus())
await sleep(600)
const afterFocus = await page.evaluate(() => ({
  tag: document.activeElement?.tagName,
  cls: document.activeElement?.className?.slice(0, 80),
  suggestions: document.querySelectorAll('.ndisp-suggest').length,
  suggestText: [...document.querySelectorAll('.ndisp-suggest')].map((el) => el.textContent.trim()).slice(0, 6),
}))
console.log('AFTER-FOCUS:', JSON.stringify(afterFocus))

await page.type('[data-tour="citizen-map-search"]', 'hospital')
await sleep(300)
const afterType = await page.evaluate(() => ({
  val: document.querySelector('[data-tour="citizen-map-search"]')?.value,
  suggestions: document.querySelectorAll('.ndisp-suggest').length,
}))
console.log('AFTER-TYPE:', JSON.stringify(afterType))

await page.keyboard.press('Enter')
await wait(4000)
const afterSearch = await page.evaluate(() => ({
  resultsHeader: document.querySelector('[data-testid="map-results-header"]')?.textContent?.trim(),
  results: document.querySelectorAll('[data-testid="map-result-card"]').length,
  errorText: document.querySelector('[data-testid="map-search-error"]')?.textContent?.trim(),
  panelText: document.querySelector('[data-tour="citizen-map-results"]')?.textContent?.trim().slice(0, 160),
}))
console.log('AFTER-SEARCH:', JSON.stringify(afterSearch))

await page.screenshot({ path: process.env.TEMP + '/opencode/citizen-qa/debug-final.png', fullPage: false })
await browser.close()
