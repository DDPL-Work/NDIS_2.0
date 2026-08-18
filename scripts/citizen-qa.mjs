// Citizen Portal browser QA — runs against the Vite dev server (http://localhost:5173).
// Usage:  npm run dev   (separate terminal)   then:  node scripts/citizen-qa.mjs
// Launches headless Edge, signs in with the demo citizen persona, walks the
// citizen portal, records console/page errors and failed requests, saves
// screenshots to the QA output folder, and prints a PASS/FAIL summary.
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const BASE = 'http://localhost:5173'
const OUT = path.join(process.env.TEMP || 'C:/Users/ASHISH~1/AppData/Local/Temp', 'opencode', 'citizen-qa')
mkdirSync(OUT, { recursive: true })

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

const failures = []
const consoleErrors = []
const pageErrors = []
const failedRequests = []
let step = 0

function log(message) { console.log(message) }

function check(name, ok, detail = '') {
  step += 1
  log(`${ok ? 'PASS' : 'FAIL'}  [${step}] ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(`${name}${detail ? ` (${detail})` : ''}`)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function goto(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await wait(1200)
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 },
  })

  let page
  try {
    page = await browser.newPage()
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
    page.on('pageerror', (err) => pageErrors.push(String(err)))
    page.on('requestfailed', (req) => failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText || 'failed'}`))
    page.on('requestfinished', async (req) => {
      const response = req.response()
      if (response && response.status() >= 500) failedRequests.push(`HTTP ${response.status()} ${req.method()} ${req.url()}`)
    })

    // ── Sign in as the demo citizen ────────────────────────────────────────
    await goto(page, `${BASE}/login`)
    check('login page loads', true)
    // Pre-mark every citizen tour as completed so the welcome modal and tour
    // overlays (which intentionally block the page) never interfere with the
    // automated walk-through.  Storage key/version mirror citizenTourConfig.
    await page.evaluate(() => {
      const tourIds = ['main', 'map', 'complaint', 'my-complaints', 'track', 'schemes', 'profile', 'notifications']
      localStorage.setItem('ndisp-citizen-tour-v1', JSON.stringify({ version: 1, completed: tourIds, skipped: [] }))
    })
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const target = buttons.find((b) => b.textContent.includes('Citizen (Nalanda)'))
      if (target) target.click()
    })
    await page.waitForFunction(() => window.location.pathname.startsWith('/citizen'), { timeout: 15000 })
    check('citizen sign-in lands on /citizen', page.url().includes('/citizen'))
    await wait(2000)

    // ── Dashboard ──────────────────────────────────────────────────────────
    await page.waitForSelector('[data-tour="citizen-dashboard-main"]', { timeout: 15000 })
    check('dashboard renders', true)
    const quickActions = await page.$$eval('section[aria-label="Quick actions"] a', (els) => els.length)
    check('dashboard shows 6 quick actions', quickActions === 6, `found ${quickActions}`)
    const statCards = await page.$$eval('[data-tour="citizen-complaints-stats"] > div', (els) => els.length)
    check('dashboard shows 4 stat cards', statCards === 4, `found ${statCards}`)
    await page.screenshot({ path: path.join(OUT, '1-dashboard.png') })

    // Demo sessions must survive a full page reload (no gateway tokens; the
    // persisted persona is kept during restore).  If this regresses, every
    // subsequent page.goto below lands back on /login.
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForSelector('[data-tour="citizen-dashboard-main"]', { timeout: 15000 })
    check('demo session survives page reload', page.url().includes('/citizen'))

    // ── Explore Map ────────────────────────────────────────────────────────
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('a'))
      const nearby = cards.find((a) => a.textContent.includes('Find Nearby'))
      if (nearby) nearby.click()
    })
    await page.waitForFunction(() => window.location.pathname.includes('/citizen/map'), { timeout: 15000 })
    await wait(3000)
    const mode1 = await page.$eval('aside[data-tour-sidebar]', (el) => el.getAttribute('data-tour-sidebar'))
    check('map sidebar opens (open mode)', mode1 === 'open', `mode=${mode1}`)

    // Collapse → rail (target the explore panel header, not the app sidebar)
    await page.evaluate(() => {
      const aside = document.querySelector('aside[data-tour-sidebar]')
      const button = Array.from(aside.querySelectorAll('button')).find((b) => b.textContent.includes('Collapse'))
      if (button) button.click()
    })
    await wait(900)
    const mode2 = await page.$eval('aside[data-tour-sidebar]', (el) => el.getAttribute('data-tour-sidebar'))
    check('collapse moves to rail', mode2 === 'rail', `mode=${mode2}`)

    // Expand back
    await page.evaluate(() => {
      const aside = document.querySelector('aside[data-tour-sidebar]')
      const button = Array.from(aside.querySelectorAll('button')).find((b) => b.title === 'Expand explore panel')
      if (button) button.click()
    })
    await wait(900)
    const mode3 = await page.$eval('aside[data-tour-sidebar]', (el) => el.getAttribute('data-tour-sidebar'))
    check('expand returns to open', mode3 === 'open', `mode=${mode3}`)

    // Search suggestions dropdown
    await page.click('[data-tour="citizen-map-search"]')
    await wait(500)
    const focusInfo = await page.evaluate(() => {
      const active = document.activeElement
      return { tag: active?.tagName, isInput: active?.dataset?.tour === 'citizen-map-search', suggestions: document.querySelectorAll('.ndisp-suggest').length }
    })
    const suggestionsShown = focusInfo.isInput && focusInfo.suggestions > 0
    check('focused empty search shows category suggestions', suggestionsShown, JSON.stringify(focusInfo))

    // Run a real search
    await page.type('[data-tour="citizen-map-search"]', 'hospital')
    await wait(300)
    const suggestionsGone = (await page.evaluate(() => document.querySelectorAll('.ndisp-suggest').length)) === 0
    check('suggestions close while typing', suggestionsGone)
    await page.keyboard.press('Enter')
    await wait(4000)
    const resultsHeader = await page.evaluate(() => {
      const panel = document.querySelector('[data-tour="citizen-map-results"]')
      return panel ? panel.textContent.trim().slice(0, 100) : ''
    })
    check('search runs and returns real results', resultsHeader.includes('result'), resultsHeader)
    await page.screenshot({ path: path.join(OUT, '2-map-search.png') })

    // Category pills
    const pillCount = await page.$$eval('aside[data-tour-sidebar] [role="group"] button', (els) => els.length)
    check('category pills include All + departments', pillCount >= 2, `found ${pillCount} pills`)

    // Near me → location banner (headless denies geolocation)
    await page.evaluate(() => {
      const aside = document.querySelector('aside[data-tour-sidebar]')
      const button = Array.from(aside.querySelectorAll('button')).find((b) => b.textContent.includes('Near me'))
      if (button) button.click()
    })
    await wait(3000)
    const banner = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('[role="alert"]')).find((b) => b.textContent.includes('Location access is off'))
      return Boolean(el)
    })
    check('denied geolocation shows "Location access is off" banner', banner)
    await page.screenshot({ path: path.join(OUT, '3-location-banner.png') })

    // Facility sheet — click the first facility card in the sidebar list
    const facilityClicked = await page.evaluate(() => {
      const aside = document.querySelector('aside[data-tour-sidebar]')
      const items = Array.from(aside.querySelectorAll('[class*="hover:bg-ink-50"]'))
      const card = items.find((c) => c.textContent.includes('km away') || c.textContent.includes('min walk'))
      if (card) { card.click(); return true }
      return false
    })
    if (facilityClicked) {
      await wait(1200)
      const sheetText = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]')
        return dialog ? dialog.textContent.slice(0, 120) : ''
      })
      check('facility click opens in-map facility sheet', sheetText.includes('Show Route') && sheetText.includes('Directions'), sheetText.slice(0, 80))
      await page.screenshot({ path: path.join(OUT, '4-facility-sheet.png') })
      // Close the sheet
      await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]')
        const close = Array.from(dialog.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Close facility details')
        if (close) close.click()
      })
      await wait(600)
    } else {
      log('INFO  no facility cards available to click — sheet interaction skipped')
    }

    // ── Track ──────────────────────────────────────────────────────────────
    await goto(page, `${BASE}/citizen/track`)
    const trackInputVisible = await page.waitForSelector('[data-tour="citizen-track-input"]', { timeout: 15000 }).then(() => true).catch(() => false)
    if (trackInputVisible) {
      check('track page renders', true)
      await page.type('[data-tour="citizen-track-input"]', 'NONEXISTENT')
      await page.click('[data-tour="citizen-track-button"]')
      await wait(3500)
      const bodyText = await page.evaluate(() => document.body.textContent)
      const honest = bodyText.includes('No complaint found') || bodyText.includes('Try Again') || bodyText.includes('Status ·')
      check('track flow returns honest result/error', honest)
      await page.screenshot({ path: path.join(OUT, '5-track.png') })
    } else {
      const bodyText = await page.evaluate(() => document.body.textContent.slice(0, 300))
      check('track page renders', false, `input missing — body: ${bodyText}`)
    }

    // ── Schemes (backend has no schemes API) ───────────────────────────────
    await goto(page, `${BASE}/citizen/schemes`)
    await wait(1500)
    const schemesState = await page.evaluate(() => document.body.textContent.includes('coming soon'))
    check('schemes shows honest "coming soon" state', schemesState)
    const checkerDisabled = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Run Eligibility Check'))
      return button ? button.disabled : null
    })
    check('eligibility checker disabled without data', checkerDisabled === true, `disabled=${checkerDisabled}`)
    await page.screenshot({ path: path.join(OUT, '6-schemes.png') })

    // ── Notifications ──────────────────────────────────────────────────────
    await goto(page, `${BASE}/citizen/notifications`)
    await page.waitForSelector('[data-tour="citizen-notifications-page"]', { timeout: 15000 })
    await wait(2000)
    const notifBody = await page.evaluate(() => document.body.textContent)
    const notifRendered = notifBody.includes('Notifications') && (notifBody.includes('No notifications yet') || notifBody.includes('Today') || notifBody.includes('Earlier'))
    check('notifications page renders (list or empty state)', notifRendered)
    await page.screenshot({ path: path.join(OUT, '7-notifications.png') })

    // ── Profile ────────────────────────────────────────────────────────────
    await goto(page, `${BASE}/citizen/profile`)
    await page.waitForSelector('[data-tour="citizen-profile-page"]', { timeout: 15000 })
    const profileOk = await page.evaluate(() => {
      const text = document.body.textContent
      return text.includes('Nalanda') && text.includes('Language') && text.includes('Logout')
    })
    check('profile shows identity, language and logout', profileOk)
    await page.screenshot({ path: path.join(OUT, '8-profile.png') })

    // ── Mobile viewport: bottom nav + sheets ───────────────────────────────
    await page.setViewport({ width: 390, height: 844 })
    await goto(page, `${BASE}/citizen`)
    const navItems = await page.$$eval('nav[aria-label="Mobile navigation"] a, nav[aria-label="Mobile navigation"] button', (els) => els.length)
    check('mobile bottom nav has 5 items', navItems === 5, `found ${navItems}`)
    await page.screenshot({ path: path.join(OUT, '9-mobile-dashboard.png') })

    await goto(page, `${BASE}/citizen/map`)
    const searchPill = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Search places, services or facilities'))
      return Boolean(button)
    })
    check('mobile map shows search pill', searchPill)
    await page.screenshot({ path: path.join(OUT, '10-mobile-map.png') })

    // Mobile: open the drawer via the search pill, then the facility sheet
    const drawerOpened = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Search places, services or facilities'))
      if (button) { button.click(); return true }
      return false
    })
    await wait(900)
    const drawerOpen = await page.$eval('aside[data-tour-sidebar]', (el) => getComputedStyle(el).transform !== 'matrix(1, 0, 0, 1, 0, 0)' || el.getBoundingClientRect().left === 0)
    check('mobile drawer opens from search pill', drawerOpen)
  } finally {
    // ── Summary ────────────────────────────────────────────────────────────
    log('')
    log('=== CONSOLE ERRORS ===')
    const unexpectedConsole = consoleErrors.filter((e) => !/Failed to load resource|net::ERR_|TypeError: Failed to fetch|404/i.test(e))
    unexpectedConsole.forEach((e) => log(`  ${e}`))
    check('no unexpected console errors', unexpectedConsole.length === 0, unexpectedConsole.length ? unexpectedConsole[0] : '')
    log('=== PAGE ERRORS ===')
    pageErrors.forEach((e) => log(`  ${e}`))
    check('no uncaught page errors', pageErrors.length === 0, pageErrors[0] || '')
    log('=== FAILED REQUESTS (HTTP 5xx / network) ===')
    failedRequests.slice(0, 15).forEach((r) => log(`  ${r}`))

    log('')
    log(failures.length === 0 ? 'ALL CHECKS PASSED' : `${failures.length} CHECK(S) FAILED`)
    if (page) await page.close().catch(() => {})
    if (browser) await browser.close().catch(() => {})
    process.exitCode = failures.length > 0 ? 1 : 0
  }
}

main().catch((error) => {
  console.error('QA RUNNER ERROR:', error)
  process.exitCode = 2
})