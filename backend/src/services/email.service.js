// src/services/email.service.js
import nodemailer from 'nodemailer'
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            secure: config.SMTP_SECURE, // true for 465, false for other ports
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASSWORD,
            },
        })
    }

    /**
     * Send email
     */
    async sendEmail({ to, subject, html, text }) {
        try {
            const mailOptions = {
                from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM}>`,
                to,
                subject,
                html,
                text,
            }

            const info = await this.transporter.sendMail(mailOptions)
            logger.info(`Email sent: ${info.messageId}`)
            return info
        } catch (error) {
            // Log detailed error information
            logger.error('Error sending email:', {
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode,
                stack: error.stack,
                to,
                subject,
            })
            throw new Error('Failed to send email')
        }
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(email, username, token) {
        const verificationUrl = `${config.EMAIL_VERIFICATION_URL}?token=${token}`

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Email Verification</h1>
                    </div>
                    <div class="content">
                        <p>Hi <strong>${username}</strong>,</p>
                        <p>Thank you for registering with LMS AI Pay! Please verify your email address by clicking the button below:</p>
                        <div style="text-align: center;">
                            <a href="${verificationUrl}" class="button">Verify Email</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
                        <p><strong>This link will expire in 24 hours.</strong></p>
                        <p>If you didn't create an account, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} LMS AI Pay. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `

        const text = `Hi ${username},\n\nThank you for registering! Please verify your email by visiting: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`

        return this.sendEmail({
            to: email,
            subject: 'Verify Your Email - LMS AI Pay',
            html,
            text,
        })
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, username, token) {
        const resetUrl = `${config.PASSWORD_RESET_URL}?token=${token}`

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .button { display: inline-block; padding: 12px 30px; background: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hi <strong>${username}</strong>,</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">Reset Password</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
                        <div class="warning">
                            <p><strong>⚠️ Important:</strong></p>
                            <ul>
                                <li>This link will expire in 1 hour</li>
                                <li>If you didn't request this, please ignore this email</li>
                                <li>Your password won't change until you access the link above</li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} LMS AI Pay. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `

        const text = `Hi ${username},\n\nWe received a request to reset your password. Visit this link to create a new password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`

        return this.sendEmail({
            to: email,
            subject: 'Reset Your Password - LMS AI Pay',
            html,
            text,
        })
    }

    /**
     * Send welcome email after verification
     */
    async sendWelcomeEmail(email, username) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .button { display: inline-block; padding: 12px 30px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to LMS AI Pay!</h1>
                    </div>
                    <div class="content">
                        <p>Hi <strong>${username}</strong>,</p>
                        <p>Your email has been successfully verified! Welcome to our learning platform.</p>
                        <p>You can now:</p>
                        <ul>
                            <li>Browse thousands of courses</li>
                            <li>Enroll in courses that interest you</li>
                            <li>Track your learning progress</li>
                            <li>Get AI-powered recommendations</li>
                        </ul>
                        <div style="text-align: center;">
                            <a href="${config.CLIENT_URL}/courses" class="button">Browse Courses</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} LMS AI Pay. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `

        const text = `Hi ${username},\n\nYour email has been successfully verified! Welcome to LMS AI Pay.\n\nVisit ${config.CLIENT_URL}/courses to browse our courses.`

        return this.sendEmail({
            to: email,
            subject: 'Welcome to LMS AI Pay! 🎉',
            html,
            text,
        })
    }

    /**
     * Send password change confirmation email
     */
    async sendPasswordChangeConfirmation(email, username) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Changed Successfully</h1>
                    </div>
                    <div class="content">
                        <p>Hi <strong>${username}</strong>,</p>
                        <p>Your password has been successfully changed.</p>
                        <div class="warning">
                            <p><strong>⚠️ Security Notice:</strong></p>
                            <p>If you didn't make this change, please contact our support team immediately at <a href="mailto:${config.EMAIL_FROM}">${config.EMAIL_FROM}</a></p>
                        </div>
                        <p>Changed at: <strong>${new Date().toLocaleString()}</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} LMS AI Pay. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `

        const text = `Hi ${username},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact us immediately.\n\nChanged at: ${new Date().toLocaleString()}`

        return this.sendEmail({
            to: email,
            subject: 'Password Changed - LMS AI Pay',
            html,
            text,
        })
    }
}

export default new EmailService()
