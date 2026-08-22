// Phase 3 browser smoke test — Department Decision Support workspace.
// Runs against the Vite dev server on :5173.  Signs in as DM (Nalanda) and as
// Dept Head (Health), walks the new routes, records console/page errors and
// failed requests, and prints a PASS/FAIL summary.
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const BASE = 'http://localhost:5173'
const OUT = path.join(process.env.TEMP || 'C:/Users/ASHISH~1/AppData/Local/Temp', 'opencode', 'department-qa')
mkdirSync(OUT, { recursive: true })

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

const failures = []
let consoleErrors = []
let pageErrors = []
const failedRequests = []
let step = 0

function log(message) { console.log(message) }

function check(name, ok, detail = '') {
  step += 1
  log(`${ok ? 'PASS' : 'FAIL'}  [${step}] ${name}${detail ? ` - ${detail}` : ''}`)
  if (!ok) failures.push(`${name}${detail ? ` (${detail})` : ''}`)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function goto(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await wait(1500)
}

// Demo sessions persist across reloads (zustand key + demo marker).  Clearing
// both before sign-in guarantees the requested persona actually signs in.
async function signIn(page, personaLabel) {
  await goto(page, `${BASE}/login`)
  await page.evaluate(() => {
    localStorage.removeItem('ndisp-auth-profile')
    localStorage.removeItem('ndisp.demo.session')
  })
  await goto(page, `${BASE}/login`)
  await page.evaluate((label) => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const target = buttons.find((b) => b.textContent.includes(label))
    if (target) target.click()
  }, personaLabel)
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 })
  await wait(2500)
}

// The workspace deliberately probes telemetry endpoints (401/404/500) to
// disclose "Data not available" honestly.  Those resource-load failures are
// EXPECTED; anything else is unexpected.
function resetErrors() {
  consoleErrors = []
  pageErrors = []
}

function isExpectedProbe(text) {
  return /Failed to load resource/.test(text) && /(401|404|500)/.test(text)
}

async function waitForText(page, pattern, timeoutMs = 45000) {
  try {
    await page.waitForFunction((re) => new RegExp(re, 'i').test(document.body.innerText), { timeout: timeoutMs }, pattern)
  } catch (error) {
    const state = await page.evaluate(() => ({
      body: document.body.innerText,
      hasError: document.body.innerText.includes('Failed to load department data'),
      url: window.location.pathname,
      fetches: window.__qaFetches || [],
      skeletonCount: document.querySelectorAll('.animate-pulse').length,
      tabCount: document.querySelectorAll('[class*="border-b"] button').length,
    })).catch(() => ({ body: '', hasError: false, url: '', fetches: [], skeletonCount: -1, tabCount: -1 }))
    log(`DUMP (waited for /${pattern}/):`)
    log(`URL=${state.url} hasError=${state.hasError} skeletons=${state.skeletonCount} tabButtons=${state.tabCount}`)
    log(state.body.slice(0, 1500))
    log(`FETCHES[${state.fetches.length}] ${state.fetches.slice(-25).join(' | ')}`)
    throw error
  }
}

async function clickButtonByText(page, pattern) {
  return page.evaluate((re) => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const target = buttons.find((b) => new RegExp(re, 'i').test(b.textContent))
    if (target) { target.click(); return true }
    return false
  }, pattern)
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.evaluateOnNewDocument(() => {
    window.__qaFetches = []
    const orig = window.fetch
    window.fetch = (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || ''
      const t0 = Date.now()
      const p = orig(...args)
      p.then((r) => window.__qaFetches.push(`${r.status} ${url} ${Date.now() - t0}ms`)).catch((e) => window.__qaFetches.push(`ERR ${url} ${e.message}`))
      return p
    }
  })
  page.on('console', (msg) => { if (msg.type() === 'error' && !isExpectedProbe(msg.text())) consoleErrors.push(msg.text()) })
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  page.on('requestfailed', (req) => failedRequests.push(`${req.url()} :: ${req.failure()?.errorText || ''}`))

  // ── DM (Nalanda) — admin portal ───────────────────────────────────────
  await signIn(page, 'DM (Nalanda)')
  check('DM sign-in lands on admin portal', page.url().includes('/admin'), page.url())

  resetErrors()
  await goto(page, `${BASE}/admin/department/general`)
  check('admin Department Support route loads', page.url().includes('/admin/department'), page.url())
  await waitForText(page, 'Department KPI summary')
  await waitForText(page, 'coverage|Data not available')
  const tabs = await page.$$eval('button', (els) => els.map((e) => e.textContent.trim()).filter(Boolean))
  check('config-driven tabs render', tabs.some((t) => /situation/i.test(t)) && tabs.some((t) => /priorit/i.test(t)) && tabs.some((t) => /gap/i.test(t)), tabs.join(' | ').slice(0, 160))
  const body1 = await page.evaluate(() => document.body.innerText)
  check('KPI row renders real counts', /coverage/i.test(body1) && /%/.test(body1))
  await page.screenshot({ path: path.join(OUT, '1-admin-general.png') })

  // Department switcher → health
  let swClicked = false
  for (let attempt = 0; attempt < 3 && !swClicked; attempt += 1) {
    swClicked = await page.$eval('[data-testid="dept-switcher-health"]', (el) => { el.click(); return true }).catch(() => false)
    await wait(2500)
    if (page.url().includes('/admin/department/health')) break
  }
  check('switcher button present and clickable', swClicked)
  check('switcher navigates to health URL', page.url().includes('/admin/department/health'), page.url())
  await waitForText(page, 'Department KPI summary', 40000)
  await waitForText(page, 'Health facilities|coverage', 20000)
  const body2 = await page.evaluate(() => document.body.innerText)
  check('switcher navigates to Health workspace', page.url().includes('/admin/department/health'), page.url())
  const kpi2 = body2.match(/Health facilities[^\n]*\n?/)?.[0] || 'NO-KPI-LINE'
  check('health KPIs show real entity counts', /Health facilities/.test(body2) && /\d+/.test(kpi2), `kpiLine=${kpi2} url=${page.url()}`)
  await page.screenshot({ path: path.join(OUT, '2-admin-health.png') })

  // Priority tab
  await clickButtonByText(page, '^Priority')
  await waitForText(page, 'Priority score')
  const body3 = await page.evaluate(() => document.body.innerText)
  check('priority tab renders P1-P4 banded ranking', /P1|P2|P3|P4/.test(body3))
  await page.screenshot({ path: path.join(OUT, '3-admin-health-priority.png') })

  // Spatial analysis handoff (workspace header button, not the sidebar link)
  await clickButtonByText(page, '^Spatial analysis')
  await waitForFunction(page, () => window.location.pathname.includes('/admin/spatial-analysis'), 15000)
  await wait(2500)
  check('Spatial analysis handoff carries department prefill', page.url().includes('department=health'), page.url())
  await page.screenshot({ path: path.join(OUT, '4-spatial-handoff.png') })

  // ── Dept Head (Health) — linedept portal ──────────────────────────────
  resetErrors()
  await signIn(page, 'Dept Head (Health)')
  check('Dept Head sign-in lands on linedept', page.url().includes('/linedept'), page.url())

  await goto(page, `${BASE}/linedept/decision-support`)
  await waitForText(page, 'Department KPI summary')
  await waitForText(page, 'Health facilities', 30000)
  const body4 = await page.evaluate(() => document.body.innerText)
  check('linedept decision-support renders Health workspace', page.url().includes('/linedept/decision-support') && /Health/.test(body4), page.url())
  check('dept officer workspace shows only its own department data', !/School Education/.test(body4))
  await page.screenshot({ path: path.join(OUT, '5-linedept-health.png') })

  await browser.close()

  // ── Summary ───────────────────────────────────────────────────────────
  log('')
  log('=== UNEXPECTED CONSOLE ERRORS ===')
  consoleErrors.forEach((e) => log(`  ${e}`))
  check('no unexpected console errors (probe 401/404/500 excluded)', consoleErrors.length === 0, consoleErrors.join('; ').slice(0, 300))
  log('=== PAGE ERRORS ===')
  pageErrors.forEach((e) => log(`  ${e}`))
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join('; ').slice(0, 300))
  log('=== FAILED REQUESTS ===')
  failedRequests.forEach((r) => log(`  ${r}`))
  check('no failed requests', failedRequests.length === 0, failedRequests.join('; ').slice(0, 300))

  log('')
  if (failures.length) {
    log(`DEPARTMENT QA FAILED: ${failures.length} of ${step} checks`)
    process.exit(1)
  }
  log(`DEPARTMENT QA: ${step} checks passed`)
}

async function waitForFunction(page, fn, timeoutMs = 20000) {
  await page.waitForFunction(fn, { timeout: timeoutMs })
}

main().catch((err) => { console.error(err); process.exit(1) })