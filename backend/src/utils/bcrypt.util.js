// src/utils/bcrypt.util.js
import bcrypt from 'bcryptjs';
import config from '../config/app.config.js';

class BcryptUtil {
    /**
     * Hash a password
     */
    static async hash(password) {
        try {
            const salt = await bcrypt.genSalt(config.BCRYPT_ROUNDS)
            return await bcrypt.hash(password, salt)
        } catch (error) {
            throw new Error('Error hashing password')
        }
    }

    /**
     * Compare password with hash
     */
    static async compare(password, hash) {
        try {
            return await bcrypt.compare(password, hash)
        } catch (error) {
            throw new Error('Error comparing password')
        }
    }

    /**
     * Validate password strength
     */
    static validatePasswordStrength(password) {
        const minLength = 8
        const hasUpperCase = /[A-Z]/.test(password)
        const hasLowerCase = /[a-z]/.test(password)
        const hasNumber = /[0-9]/.test(password)
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

        const errors = []

        if (password.length < minLength) {
            errors.push(
                `Password must be at least ${minLength} characters long`
            )
        }
        if (!hasUpperCase) {
            errors.push('Password must contain at least one uppercase letter')
        }
        if (!hasLowerCase) {
            errors.push('Password must contain at least one lowercase letter')
        }
        if (!hasNumber) {
            errors.push('Password must contain at least one number')
        }
        if (!hasSpecialChar) {
            errors.push('Password must contain at least one special character')
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }
}

export default BcryptUtil;


