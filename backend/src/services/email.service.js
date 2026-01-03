// src/services/email.service.js
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const templatesDir = path.join(__dirname, '../templates/email')

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
     * Load and render email template
     * @param {string} templateName - Template file name (without .html)
     * @param {object} data - Data to replace placeholders
     * @returns {string} Rendered HTML
     */
    async loadTemplate(templateName, data = {}) {
        try {
            const templatePath = path.join(templatesDir, `${templateName}.html`)
            let html = fs.readFileSync(templatePath, 'utf-8')

            // Replace placeholders with data
            Object.keys(data).forEach((key) => {
                const regex = new RegExp(`{{${key}}}`, 'g')
                html = html.replace(regex, data[key] || '')
            })

            // Replace year placeholder if not provided
            if (!data.year) {
                html = html.replace(/{{year}}/g, new Date().getFullYear().toString())
            }

            return html
        } catch (error) {
            logger.error(`Failed to load template ${templateName}:`, error)
            throw new Error(`Failed to load email template: ${templateName}`)
        }
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
            logger.error('Error sending email:', error)
            throw new Error('Failed to send email')
        }
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(email, userName, token) {
        const verificationUrl = `${config.EMAIL_VERIFICATION_URL}?token=${token}`

        const html = await this.loadTemplate('verification', {
            userName,
            verificationUrl,
            year: new Date().getFullYear().toString(),
        })

        const text = `Xin chào ${userName},\n\nCảm ơn bạn đã đăng ký! Vui lòng xác thực email của bạn bằng cách truy cập: ${verificationUrl}\n\nLiên kết này sẽ hết hạn sau 24 giờ.\n\nNếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.`

        return this.sendEmail({
            to: email,
            subject: 'Xác thực Email của bạn - LMS AI Pay',
            html,
            text,
        })
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, userName, token) {
        const resetUrl = `${config.PASSWORD_RESET_URL}?token=${token}`

        const html = await this.loadTemplate('password-reset', {
            userName,
            resetUrl,
            year: new Date().getFullYear().toString(),
        })

        const text = `Xin chào ${userName},\n\nChúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn. Truy cập liên kết này để tạo mật khẩu mới: ${resetUrl}\n\nLiên kết này sẽ hết hạn sau 1 giờ.\n\nNếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.`

        return this.sendEmail({
            to: email,
            subject: 'Đặt lại Mật khẩu của bạn - LMS AI Pay',
            html,
            text,
        })
    }

    /**
     * Send welcome email after verification
     */
    async sendWelcomeEmail(email, userName) {
        const html = await this.loadTemplate('welcome', {
            userName,
            clientUrl: config.CLIENT_URL,
            year: new Date().getFullYear().toString(),
        })

        const text = `Xin chào ${userName},\n\nEmail của bạn đã được xác thực thành công! Chào mừng đến với LMS AI Pay.\n\nTruy cập ${config.CLIENT_URL}/courses để duyệt các khóa học của chúng tôi.`

        return this.sendEmail({
            to: email,
            subject: 'Chào mừng đến với LMS AI Pay! 🎉',
            html,
            text,
        })
    }

    /**
     * Send password change confirmation email
     */
    async sendPasswordChangeConfirmation(email, userName) {
        const html = await this.loadTemplate('password-change-confirmation', {
            userName,
            supportEmail: config.EMAIL_FROM,
            changedAt: new Date().toLocaleString('vi-VN'),
            year: new Date().getFullYear().toString(),
        })

        const text = `Xin chào ${userName},\n\nMật khẩu của bạn đã được thay đổi thành công.\n\nNếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức.\n\nThay đổi lúc: ${new Date().toLocaleString('vi-VN')}`

        return this.sendEmail({
            to: email,
            subject: 'Đổi Mật khẩu - LMS AI Pay',
            html,
            text,
        })
    }

    /**
     * Send payment success email
     */
    async sendPaymentSuccessEmail(email, userName, order) {
        const courseUrl = `${config.CLIENT_URL}/courses/${order.course?.slug || order.courseId}`
        const formattedAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(parseFloat(order.finalPrice || 0))

        const html = await this.loadTemplate('payment-success', {
            userName,
            orderCode: order.orderCode || 'N/A',
            courseTitle: order.course?.title || 'N/A',
            amount: formattedAmount,
            paymentGateway: order.paymentGateway || 'N/A',
            transactionId: order.transactionId || 'N/A',
            paymentDate: new Date(order.paidAt || Date.now()).toLocaleString('vi-VN'),
            courseUrl,
            year: new Date().getFullYear().toString(),
        })

        const text = `Xin chào ${userName},\n\nThanh toán của bạn đã được xử lý thành công!\n\nMã đơn hàng: ${order.orderCode}\nKhóa học: ${order.course?.title || 'N/A'}\nSố tiền: ${formattedAmount}\n\nBây giờ bạn có thể truy cập khóa học tại: ${courseUrl}\n\nCảm ơn bạn đã mua hàng!`

        return this.sendEmail({
            to: email,
            subject: 'Thanh toán Thành công - LMS AI Pay',
            html,
            text,
        })
    }

    /**
     * Send enrollment success email
     */
    async sendEnrollmentSuccessEmail(email, userName, course) {
        const courseUrl = `${config.CLIENT_URL}/courses/${course.slug || course.id}`

        const html = await this.loadTemplate('enrollment-success', {
            userName,
            courseTitle: course.title || 'N/A',
            instructorName: course.instructor?.fullName || 'N/A',
            enrollmentDate: new Date().toLocaleString('vi-VN'),
            courseUrl,
            year: new Date().getFullYear().toString(),
        })

        const text = `Xin chào ${userName},\n\nChúc mừng! Bạn đã đăng ký thành công vào khóa học.\n\nKhóa học: ${course.title || 'N/A'}\nGiảng viên: ${course.instructor?.fullName || 'N/A'}\n\nBây giờ bạn có thể truy cập khóa học tại: ${courseUrl}\n\nChúng tôi rất vui mừng được đồng hành cùng bạn trong hành trình học tập này!`

        return this.sendEmail({
            to: email,
            subject: 'Đăng ký Thành công - LMS AI Pay',
            html,
            text,
        })
    }

    /**
     * Send refund request submitted email
     */
    async sendRefundRequestSubmittedEmail(user, refundRequest, order) {
        const formattedAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(parseFloat(refundRequest.suggestedRefundAmount || 0))

        const refundTypeText =
            refundRequest.refundType === 'FULL'
                ? 'toàn bộ'
                : refundRequest.refundType === 'PARTIAL'
                  ? 'một phần'
                  : ''

        const text = `Xin chào ${user.fullName},\n\nYêu cầu hoàn tiền của bạn đã được gửi thành công!\n\nMã đơn hàng: ${order.orderCode}\nKhóa học: ${order.course?.title || 'N/A'}\nLoại hoàn tiền: ${refundTypeText}\nSố tiền đề xuất: ${formattedAmount}\nLý do: ${refundRequest.reason}\n\nYêu cầu của bạn đang được xem xét bởi quản trị viên. Chúng tôi sẽ thông báo cho bạn khi có kết quả.\n\nCảm ơn bạn đã sử dụng dịch vụ của chúng tôi!`

        return this.sendEmail({
            to: user.email,
            subject: 'Yêu cầu Hoàn tiền đã được Gửi - LMS AI Pay',
            html: text.replace(/\n/g, '<br>'),
            text,
        })
    }

    /**
     * Send refund offer email (for partial refunds)
     */
    async sendRefundOfferEmail(user, refundRequest, order) {
        const formattedAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(parseFloat(refundRequest.suggestedRefundAmount || 0))

        const offerExpiresAt = refundRequest.offerExpiresAt
            ? new Date(refundRequest.offerExpiresAt).toLocaleString('vi-VN')
            : 'N/A'

        const offerUrl = `${config.CLIENT_URL}/orders/${order.id}`

        const text = `Xin chào ${user.fullName},\n\nChúng tôi đã xem xét yêu cầu hoàn tiền của bạn và đề xuất hoàn tiền một phần.\n\nMã đơn hàng: ${order.orderCode}\nKhóa học: ${order.course?.title || 'N/A'}\nSố tiền đề xuất: ${formattedAmount}\nThời hạn phản hồi: ${offerExpiresAt}\n\nVui lòng truy cập ${offerUrl} để chấp nhận hoặc từ chối đề xuất này.\n\nLưu ý: Bạn có 48 giờ để phản hồi. Sau thời hạn này, đề xuất sẽ tự động hết hạn.`

        return this.sendEmail({
            to: user.email,
            subject: 'Đề Xuất Hoàn Tiền Một Phần - LMS AI Pay',
            html: text.replace(/\n/g, '<br>'),
            text,
        })
    }

    /**
     * Send refund approved email
     */
    async sendRefundApprovedEmail(user, refundRequest, order, refundAmount) {
        const formattedAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(parseFloat(refundAmount || 0))

        const refundTypeText =
            refundRequest.refundType === 'FULL'
                ? 'toàn bộ'
                : refundRequest.refundType === 'PARTIAL'
                  ? 'một phần'
                  : ''

        const text = `Xin chào ${user.fullName},\n\nYêu cầu hoàn tiền của bạn đã được chấp nhận!\n\nMã đơn hàng: ${order.orderCode}\nKhóa học: ${order.course?.title || 'N/A'}\nLoại hoàn tiền: ${refundTypeText}\nSố tiền hoàn: ${formattedAmount}\n\nSố tiền sẽ được hoàn về tài khoản của bạn trong vòng 5-7 ngày làm việc.\n\nLưu ý: Quyền truy cập khóa học đã bị thu hồi.\n\nCảm ơn bạn đã sử dụng dịch vụ của chúng tôi!`

        return this.sendEmail({
            to: user.email,
            subject: 'Yêu cầu Hoàn tiền đã được Chấp nhận - LMS AI Pay',
            html: text.replace(/\n/g, '<br>'),
            text,
        })
    }

    /**
     * Send refund rejected email
     */
    async sendRefundRejectedEmail(user, refundRequest, order, reason) {
        const text = `Xin chào ${user.fullName},\n\nRất tiếc, yêu cầu hoàn tiền của bạn đã bị từ chối.\n\nMã đơn hàng: ${order.orderCode}\nKhóa học: ${order.course?.title || 'N/A'}\nLý do từ chối: ${reason || refundRequest.adminNotes || 'Không đủ điều kiện hoàn tiền'}\n\nNếu bạn có thắc mắc, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.\n\nCảm ơn bạn đã sử dụng dịch vụ của chúng tôi!`

        return this.sendEmail({
            to: user.email,
            subject: 'Yêu cầu Hoàn tiền đã bị Từ chối - LMS AI Pay',
            html: text.replace(/\n/g, '<br>'),
            text,
        })
    }
}

export default new EmailService()
