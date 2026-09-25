import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      // Seeds JSON, documentação Swagger e scripts utilitários não fazem parte
      // da superfície de runtime exercitada pela suíte.
      exclude: ['src/data/**', 'src/docs/**', 'src/scripts/**'],
      // Margem logo abaixo do patamar atual (≈80% stmts/lines, ≈72% branches)
      // para funcionar como trava de regressão sem ser frágil.
      thresholds: {
        statements: 78,
        branches: 68,
        functions: 78,
        lines: 78,
      },
    },
  },
});
