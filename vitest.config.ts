import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    // Source files import siblings as './x.js' because the build targets
    // NodeNext ESM. Vite would look for a literal x.js and fail, so strip the
    // extension and let it resolve x.ts.
    alias: [{ find: /^(\.{1,2}\/.*)\.js$/, replacement: '$1' }],
  },
})
