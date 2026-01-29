# Testing Guide

## Overview

This project uses Vitest for testing with comprehensive coverage of authentication, database queries, and business logic.

## Quick Start

```bash
# Run all tests
npm test -- --run

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Setup

### 1. Create Test Database

```bash
createdb building_status_test
```

### 2. Configure Test Environment

Create `.env.test.local`:

```env
DATABASE_URL=postgresql://pete@localhost:5432/building_status_test
EDITOR_PASSWORD_HASH=$2a$10$mzX.KgEBhm1ItC7u9k9FdeGEDRr7xwgtukiZWtEcccKaU4exfPFp2
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=test
```

**Note:** The test password hash is for `"testpassword123"`.

### 3. Run Migrations on Test Database

```bash
DATABASE_URL="postgresql://pete@localhost:5432/building_status_test" npm run db:migrate
```

### 4. Run Tests

```bash
npm test -- --run
```

## Test Configuration

### Sequential Test Execution

Tests are configured to run **sequentially** (not in parallel) to avoid database state conflicts:

```typescript
// vitest.config.ts
test: {
  fileParallelism: false  // Critical for database test isolation
}
```

**Why sequential?** Since all tests share the same test database, running them in parallel can cause:
- Race conditions when cleaning/seeding database
- Foreign key constraint violations
- Inconsistent test results (pass individually, fail together)

**Trade-off:** Sequential execution is slower (~7s vs ~3s) but ensures reliable test results.

## Test Structure

### Test Files

```
src/lib/__tests__/
├── auth.test.ts              # Authentication functions (22 tests)
├── queries-simple.test.ts    # Simple CRUD operations (28 tests)
├── queries-medium.test.ts    # Medium complexity queries (33 tests)
├── queries-complex.test.ts   # Complex business logic (26 tests)
└── qr-code.test.ts          # QR code generation (26 tests)
```

### Test Utilities

```
test/
├── setup.ts       # Global test configuration
└── db-utils.ts    # Database test utilities
```

#### Key Test Utilities

- `getTestDb()` - Get test database connection
- `cleanDatabase()` - Clean all tables and reset sequences
- `createTestProperty()` - Create a test property with unique IDs
- `closeTestDb()` - Close database connection

## Coverage Goals

| Area | Target | Current |
|------|--------|---------|
| Auth Functions | 100% | 100% ✅ |
| Query Functions | 80%+ | 80%+ ✅ |
| API Routes | 70%+ | Pending |
| Overall | 70%+ | 52.6% 🚧 |

### Viewing Coverage

```bash
npm run test:coverage
open coverage/index.html
```

## Git Hooks

Git hooks automatically run tests to prevent broken code from being committed.

### Pre-Commit Hook

Runs before every commit:
- ✅ Full test suite (`npm test -- --run`)

### Pre-Push Hook

Runs before every push:
- ✅ Full test suite (`npm test -- --run`)
- ✅ Linting (`npm run lint`)

### Skipping Hooks

**Not recommended**, but if you need to skip hooks:

```bash
git commit --no-verify
git push --no-verify
```

## Writing Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanDatabase, createTestProperty, closeTestDb } from '@/../test/db-utils';
import { yourFunction } from '@/lib/queries';

describe('Your Function Tests', () => {
  let testProperty: any;

  beforeEach(async () => {
    await cleanDatabase();
    testProperty = await createTestProperty();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('should do something', async () => {
    const result = await yourFunction(testProperty.id);
    expect(result).toBeDefined();
  });
});
```

### Testing Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` to clean database
3. **Close connections**: Use `afterAll` to close DB connections
4. **Descriptive names**: Test names should explain what they test
5. **Arrange-Act-Assert**: Follow AAA pattern

## Continuous Integration

### GitHub Actions (Future)

When CI/CD is set up, tests will run automatically on:
- Every push
- Every pull request
- Before merging to main

See [.github/workflows/test.yml](.github/workflows/test.yml) for CI configuration.

## Troubleshooting

### Tests Fail with "database does not exist"

Create the test database:
```bash
createdb building_status_test
```

### Tests Fail with Foreign Key Violations

Run migrations on test database:
```bash
DATABASE_URL="postgresql://pete@localhost:5432/building_status_test" npm run db:migrate
```

### Git Hooks Don't Run

Reinstall hooks:
```bash
npm run prepare
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### Coverage Not Generated

Install coverage package:
```bash
npm install -D @vitest/coverage-v8
```

## Next Steps

- [ ] Add API route integration tests
- [ ] Add database migration tests
- [ ] Set up GitHub Actions CI/CD
- [ ] Add coverage enforcement (fail below 70%)
- [ ] Add E2E tests with Playwright

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Drizzle ORM Testing](https://orm.drizzle.team/docs/overview)
