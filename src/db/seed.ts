import { seedBaseData } from './seed-base.js'

seedBaseData({
  adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@school.local',
  adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!',
  log: console.log,
})
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
