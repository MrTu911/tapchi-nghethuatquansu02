import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const issues = await prisma.issue.findMany({
    select: { id: true, slug: true, title: true, number: true, year: true, status: true }
  })
  
  console.log(`\n--- All Issues in Database (${issues.length}) ---`)
  console.log(JSON.stringify(issues, null, 2))
}

main()
  .catch(err => {
    console.error(err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
