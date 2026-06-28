import 'dotenv/config'
import { importIssueCorpusBySlug } from '../lib/services/journal-corpus-import.service'

async function main() {
  console.log('▶ Importing Issue 7 (so-7-2026) corpus into database...')
  const summary = await importIssueCorpusBySlug('so-7-2026')
  console.log('✓ Import completed successfully!')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch(err => {
  console.error('❌ Error importing corpus:', err)
  process.exit(1)
})
