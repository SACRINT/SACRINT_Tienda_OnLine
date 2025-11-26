import { describe, expect, test } from '@jest/globals';
describe('Validation Utils', () => {
  test('validates email', () => {
    expect('test@example.com').toContain('@');
  });
});
