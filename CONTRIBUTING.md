# Contributing to SACRINT Tienda Online

Thank you for your interest in contributing to SACRINT Tienda Online! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/SACRINT_Tienda_OnLine.git
   cd SACRINT_Tienda_OnLine
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Set up environment:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

5. Set up database:
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

6. Start development server:
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branches

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Examples:
```
feat(cart): add coupon code support
fix(checkout): resolve payment race condition
docs(api): update authentication docs
```

### Pull Requests

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes

3. Run tests and linting:
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

4. Commit your changes

5. Push to your fork:
   ```bash
   git push origin feature/my-feature
   ```

6. Open a Pull Request

### PR Requirements

- [ ] Tests pass
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Documentation updated (if applicable)
- [ ] Follows code style guidelines
- [ ] PR description explains changes

## Code Style

### TypeScript

- Use strict mode
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Use Zod for runtime validation

### React

- Use functional components
- Use hooks
- Co-locate related code
- Keep components focused

### Naming

- Components: PascalCase
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case

### File Structure

```
src/
├── app/              # Next.js app router
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── features/    # Feature-specific components
├── lib/             # Utilities and services
├── hooks/           # Custom React hooks
└── types/           # TypeScript types
```

## Testing

### Running Tests

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# All tests
pnpm test
```

### Writing Tests

- Place tests next to the code they test
- Use descriptive test names
- Test behavior, not implementation
- Aim for good coverage of critical paths

Example:
```typescript
describe('CartService', () => {
  it('should add item to empty cart', async () => {
    const cart = await cartService.addItem(productId, 1);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(1);
  });
});
```

## Documentation

- Update README for significant changes
- Add JSDoc comments for public APIs
- Keep API documentation current
- Include examples where helpful

## Security

- Never commit secrets
- Validate all inputs
- Escape user content
- Use parameterized queries
- Follow OWASP guidelines

Report security issues to: security@example.com

## Review Process

1. Automated checks run
2. Code review by maintainer
3. Address feedback
4. Merge when approved

## Getting Help

- Check existing issues
- Read the documentation
- Ask in discussions
- Join our Discord

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md
- Release notes
- Project website

Thank you for contributing!
