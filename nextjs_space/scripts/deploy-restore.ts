import 'dotenv/config'
import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('▶ Restoring database issue statuses...')
  
  const tempFilePath = path.join(__dirname, '../.deploy_temp_issues.json')
  if (!fs.existsSync(tempFilePath)) {
    console.log('No temporary status backup found. Nothing to restore.')
    return
  }

  try {
    const changedIds = JSON.parse(fs.readFileSync(tempFilePath, 'utf-8')) as string[]
    console.log(`Found ${changedIds.length} issues to restore to PUBLISHED status.`)

    if (changedIds.length > 0) {
      await prisma.issue.updateMany({
        where: {
          id: {
            in: changedIds
          }
        },
        data: {
          status: 'PUBLISHED'
        }
      })
      console.log('✓ Successfully restored other issues to PUBLISHED status.')
    }

    // Clean up temporary file
    fs.unlinkSync(tempFilePath)
    console.log('✓ Removed temporary backup file.')
  } catch (err) {
    console.error('Error reading or parsing backup file:', err)
  }
}

main()
  .catch(err => {
    console.error('❌ Error in deploy-restore:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
