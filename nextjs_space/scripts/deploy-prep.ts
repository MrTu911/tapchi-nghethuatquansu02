import 'dotenv/config'
import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('▶ Preparing database for single-issue Netlify build...')
  
  // Find all PUBLISHED issues except so-7-2026
  const targetSlug = 'so-7-2026'
  const publishedIssues = await prisma.issue.findMany({
    where: {
      status: 'PUBLISHED',
      NOT: {
        slug: targetSlug
      }
    }
  })

  const changedIds = publishedIssues.map(issue => issue.id)
  console.log(`Found ${changedIds.length} other published issues to temporarily set to DRAFT.`)

  // Save the list of changed IDs to a temporary file
  const tempFilePath = path.join(__dirname, '../.deploy_temp_issues.json')
  fs.writeFileSync(tempFilePath, JSON.stringify(changedIds, null, 2))
  console.log(`Saved temporary status backup to: ${tempFilePath}`)

  // Update these issues to DRAFT status
  if (changedIds.length > 0) {
    await prisma.issue.updateMany({
      where: {
        id: {
          in: changedIds
        }
      },
      data: {
        status: 'DRAFT'
      }
    })
    console.log('✓ Successfully set other issues to DRAFT status.')
  } else {
    console.log('No other published issues found.')
  }
}

main()
  .catch(err => {
    console.error('❌ Error in deploy-prep:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
