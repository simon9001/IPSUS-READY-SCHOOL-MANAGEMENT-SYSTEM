import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Importing any service pulls in src/db/client.ts and auth.service.ts,
    // which refuse to load without these. postgres.js connects lazily, so a
    // placeholder URL is never dialled by unit tests that mock repositories —
    // this just lets a fresh clone run `pnpm test` with no .env at all.
    env: {
      DATABASE_URL: 'postgres://test:test@127.0.0.1:5432/test',
      JWT_SECRET: 'test-only-secret-not-used-outside-vitest',
      CORS_ORIGIN: 'http://localhost:5173',
      LOG_LEVEL: 'silent',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/db/seed*.ts', 'src/db/sync-rbac.ts', 'src/db/schema/**'],
      reporter: ['text-summary', 'html', 'lcov'],
    },
  },
  resolve: {
    // Source files import siblings as './x.js' because the build targets
    // NodeNext ESM. Vite would look for a literal x.js and fail, so strip the
    // extension and let it resolve x.ts.
    alias: [{ find: /^(\.{1,2}\/.*)\.js$/, replacement: '$1' }],
  },
})
