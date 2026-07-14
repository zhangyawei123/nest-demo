const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const projectDir = path.resolve(__dirname, '..')
const envPath = path.join(projectDir, '.env')

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const value = line.trim()
    if (!value || value.startsWith('#') || !value.includes('=')) continue
    const separator = value.indexOf('=')
    const key = value.slice(0, separator).trim()
    let content = value.slice(separator + 1).trim()
    if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
      content = content.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = content
  }
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true,
  })
  const sql = fs.readFileSync(
    path.join(__dirname, 'sql', 'create-jd-trend-tables.sql'),
    'utf8',
  )
  await connection.query(sql)
  await connection.end()
  console.log('JD_TREND_MIGRATION_APPLIED')
}

main().catch((error) => {
  console.error(`JD_TREND_MIGRATION_FAILED: ${error.message}`)
  process.exit(1)
})
