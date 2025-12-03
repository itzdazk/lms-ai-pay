// Unit tests for BcryptUtil
import BcryptUtil from '../../utils/bcrypt.util.js';

describe('BcryptUtil', () => {
    describe('hash', () => {
        it('should hash a password', async () => {
            const password = 'Test@123456';
            const hash = await BcryptUtil.hash(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(50);
        });

        it('should produce different hashes for the same password', async () => {
            const password = 'Test@123456';
            const hash1 = await BcryptUtil.hash(password);
            const hash2 = await BcryptUtil.hash(password);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('compare', () => {
        it('should return true for matching password and hash', async () => {
            const password = 'Test@123456';
            const hash = await BcryptUtil.hash(password);
            const result = await BcryptUtil.compare(password, hash);

            expect(result).toBe(true);
        });

        it('should return false for non-matching password and hash', async () => {
            const password = 'Test@123456';
            const wrongPassword = 'Wrong@123456';
            const hash = await BcryptUtil.hash(password);
            const result = await BcryptUtil.compare(wrongPassword, hash);

            expect(result).toBe(false);
        });
    });

    describe('validatePasswordStrength', () => {
        it('should validate a strong password', () => {
            const password = 'Strong@Pass123';
            const result = BcryptUtil.validatePasswordStrength(password);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject password that is too short', () => {
            const password = 'Short1!';
            const result = BcryptUtil.validatePasswordStrength(password);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.includes('at least 8 characters'))).toBe(true);
        });

        it('should reject password without uppercase', () => {
            const password = 'lowercase123!';
            const result = BcryptUtil.validatePasswordStrength(password);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
        });

        it('should reject password without lowercase', () => {
            const password = 'UPPERCASE123!';
            const result = BcryptUtil.validatePasswordStrength(password);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('lowercase'))).toBe(true);
        });

        it('should reject password without number', () => {
            const password = 'NoNumber!';
            const result = BcryptUtil.validatePasswordStrength(password);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('number'))).toBe(true);
        });

        it('should reject password without special character', () => {
            const password = 'NoSpecial123';
            const result = BcryptUtil.validatePasswordStrength(password);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('special'))).toBe(true);
        });
    });
});


