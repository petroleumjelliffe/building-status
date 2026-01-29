import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars before tests run (needed because db.ts throws at import time)
dotenv.config({ path: '.env.local' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/app/**/*.tsx', // Exclude Next.js routes initially
        'src/types/**',
        '**/*.d.ts',
      ],
    },
    testTimeout: 10000,
    // Run tests sequentially to avoid database state conflicts
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
