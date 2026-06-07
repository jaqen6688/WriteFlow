import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const PING_URL = 'https://writeflow-analytics.jaqen6688.workers.dev/ping'
const ID_FILE = join(app.getPath('userData'), '.device_id')

function getDeviceId(): string {
  try {
    if (existsSync(ID_FILE)) return readFileSync(ID_FILE, 'utf-8').trim()
  } catch { /* ignore */ }
  const id = randomUUID()
  try {
    writeFileSync(ID_FILE, id, 'utf-8')
  } catch { /* ignore */ }
  return id
}

export function sendAnalyticsPing(): void {
  try {
    const body = JSON.stringify({
      v: app.getVersion(),
      os: process.platform,
      id: getDeviceId()
    })
    fetch(PING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(5000)
    }).catch(() => {})
  } catch { /* 完全静默 */ }
}
