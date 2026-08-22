import puppeteer from 'puppeteer-core'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const BASE = 'http://localhost:5173'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
page.on('console', (msg) => { const t = msg.text(); if (/PHASE|RESULT|REJECT/.test(t)) console.log(t.slice(0, 400)) })
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
await wait(3000)
console.log('--- building health plan inline ---')
const result = await page.evaluate(async () => {
  const deptId = 'health'
  try {
    const api = await import('/src/api/departmentSupportApi.js')
    const cfg = await import('/src/features/departmentsupport/departmentConfigs.js')
    const model = await import('/src/features/departmentsupport/departmentModel.js')
    const config = cfg.getDepartmentConfig(deptId)
    const t0 = Date.now()
    const outcome = await Promise.race([
      api.loadDepartmentData(config).then((d) => ({ done: true, data: d })),
      new Promise((res) => setTimeout(() => res({ done: false, reason: 'LOAD TIMEOUT 20s' }), 20000)),
    ])
    console.log('PHASE loadDepartmentData', Date.now() - t0, 'ms done=' + outcome.done)
    if (!outcome.done) return outcome
    const t1 = Date.now()
    const plan = await Promise.race([
      Promise.resolve().then(() => model.buildRenderPlan({ config, catalog: outcome.data.catalog, facilities: outcome.data.facilities, layersByName: outcome.data.layersByName, populationLayers: outcome.data.populationLayers, roadLayers: outcome.data.roadLayers, hazardLayerData: outcome.data.hazardLayerData })),
      new Promise((res) => setTimeout(() => res({ hung: true }), 10000)),
    ])
    console.log('PHASE buildRenderPlan', Date.now() - t1, 'ms')
    if (plan.hung) return { done: false, reason: 'BUILD HUNG >10s' }
    const t2 = Date.now()
    await model.kpiValues({ config, entities: plan.entities, coverage: plan.coverage, endpoints: [] })
    console.log('PHASE kpiValues', Date.now() - t2, 'ms')
    return { done: true, kpis: plan.kpis.length, entities: plan.entities.length, gaps: plan.gaps.length, ranked: plan.ranked.length }
  } catch (error) {
    console.log('REJECT', (error.stack || error.message).split('\n').slice(0, 5).join(' | '))
    return { done: false, reason: error.message }
  }
}, 'health')
console.log('RESULT', JSON.stringify(result))
await browser.close()