import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { importIssueCorpusBySlug } from '../lib/services/journal-corpus-import.service'

async function main() {
  const slug = 'so-7-2026'
  console.log(`▶ Finding issue with slug "${slug}"...`)
  const issue = await prisma.issue.findUnique({
    where: { slug }
  })

  if (!issue) {
    console.log(`⚠️ Issue with slug "${slug}" not found in database. Proceeding with fresh import...`)
  } else {
    console.log(`▶ Cleaning existing JournalArticle records for issue "${issue.title}" (ID: ${issue.id})...`)
    const { count } = await prisma.journalArticle.deleteMany({
      where: { issueId: issue.id }
    })
    console.log(`✓ Deleted ${count} old JournalArticle records (and cascading authors).`)
  }

  console.log('▶ Re-importing Issue 7 corpus into database...')
  const summary = await importIssueCorpusBySlug(slug)
  console.log('✓ Re-import completed successfully!')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch(err => {
  console.error('❌ Error re-importing corpus:', err)
  process.exit(1)
})
