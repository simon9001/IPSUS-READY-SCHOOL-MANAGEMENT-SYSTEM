import { defineConfig } from 'drizzle-kit';
export default defineConfig({
    schema: './src/db/schema/index.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL ?? 'postgres://accounts:accounts_dev_password@localhost:5432/school_accounts',
    },
});
