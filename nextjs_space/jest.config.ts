import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  // tests/e2e dùng Playwright (runner riêng), không chạy bằng Jest.
  // Chạy E2E qua Playwright: `npx playwright test` sau khi cài @playwright/test.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Bỏ strict để tránh lỗi từ code app không dùng strict mode
        strict: false,
        // Không emit — chỉ type-check khi cần
        noEmit: true,
      },
    }],
  },
  // Bỏ qua Prisma và các module phụ thuộc environment
  modulePathIgnorePatterns: ['<rootDir>/.next'],
  collectCoverageFrom: [
    'lib/workflow.ts',
    'lib/rbac.ts',
    'lib/file-security.ts',
    'lib/sla-manager.ts',
  ],
  coverageReporters: ['text', 'lcov'],
}

export default config
