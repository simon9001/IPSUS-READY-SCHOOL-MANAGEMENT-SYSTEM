import { seedSchoolData } from './seed/school.js'

seedSchoolData({ reset: process.argv.includes('--reset') })
  .then(({ balanced }) => process.exit(balanced ? 0 : 1))
  .catch((err) => {
    console.error('\nSeeding failed:', err)
    process.exit(1)
  })
