import { seedDemoUsers } from './seed/demo-users.js'

seedDemoUsers(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!')
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
