import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setupTests.ts',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['src/test/**', 'src/features/notes/notesSlice.ts', 'src/features/auth/authSlice.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 50,
        statements: 80,
      },
    },
  },
});