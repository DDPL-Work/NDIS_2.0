import puppeteer from 'puppeteer-core'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const BASE = 'http://localhost:5173'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
page.on('console', (msg) => { const t = msg.text(); if (/STEP|RESULT|REJECT/.test(t)) console.log(t.slice(0, 300)) })
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
await page.goto(`${BASE}/admin/department/general`, { waitUntil: 'domcontentloaded' })
await wait(4000)
console.log('--- phased health load ---')
const result = await page.evaluate(async () => {
  const step = (label, ms) => console.log(`STEP ${label} ${ms}ms`)
  const T = () => Date.now()
  try {
    const spa = await import('/src/api/spatialAnalysisApi.js')
    const fac = await import('/src/api/facilityCache.js')
    const cfg = await import('/src/features/departmentsupport/departmentConfigs.js')
    const config = cfg.getDepartmentConfig('health')
    let t = T()
    const catalog = await Promise.race([spa.loadCatalog(), new Promise((r) => setTimeout(() => r('HANG'), 12000))])
    step('catalog', T() - t)
    if (catalog === 'HANG') return { done: false, reason: 'catalog hang' }
    t = T()
    const facilities = await Promise.race([fac.cachedFacilities(), new Promise((r) => setTimeout(() => r('HANG'), 15000))])
    step('facilities', T() - t)
    if (facilities === 'HANG') return { done: false, reason: 'facilities hang' }
    const layerNames = [...new Set([...(config.contextLayers || []).map((l) => l.layerName), ...(config.hazardLayers || [])])]
    const outcomes = {}
    for (const name of layerNames) {
      t = T()
      const data = await Promise.race([spa.loadLayerFeatures(name), new Promise((r) => setTimeout(() => r('HANG'), 12000))])
      outcomes[name] = data === 'HANG' ? 'HANG' : `${data.features?.length ?? '?'}feat`
      step(`layer ${name}`, T() - t)
    }
    return { done: true, layers: outcomes }
  } catch (error) {
    console.log('REJECT', (error.stack || error.message).split('\n').slice(0, 4).join(' | '))
    return { done: false, reason: error.message }
  }
})
console.log('RESULT', JSON.stringify(result))
await browser.close()