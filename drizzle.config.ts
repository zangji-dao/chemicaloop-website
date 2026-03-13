import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.PGDATABASE_URL || process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
