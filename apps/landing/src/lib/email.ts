const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(input: string): boolean {
  return EMAIL.test(input.trim());
}
