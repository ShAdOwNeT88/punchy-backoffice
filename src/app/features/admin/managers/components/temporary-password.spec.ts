import { temporaryPassword } from './temporary-password';

describe('temporaryPassword', () => {
  it('is long enough and avoids look-alike characters', () => {
    const passwords = Array.from({ length: 50 }, () => temporaryPassword());
    for (const p of passwords) {
      expect(p).toHaveLength(12);
      expect(p).not.toMatch(/[0O1lI]/);
    }
    expect(new Set(passwords).size).toBe(50);
  });
});
