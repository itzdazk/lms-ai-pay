// src/services/auth.service.js
import { prisma } from '../config/database.config.js'
import BcryptUtil from '../utils/bcrypt.util.js'
import JWTUtil from '../utils/jwt.util.js'
import DeviceUtil from '../utils/device.util.js'
import { USER_STATUS, USER_ROLES, HTTP_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'
import emailService from './email.service.js'
import admin from '../config/firebase.config.js'

class AuthService {
    /**
     * Login with Google
     */
    // async loginWithGoogle(idToken, req) {
    //     try {
    //         // Verify Firebase ID Token
    //         const decodedToken = await admin.auth().verifyIdToken(idToken)
    //         const { uid, email, name, picture } = decodedToken

    //         if (!email) {
    //             const error = new Error('Google account must have an email')
    //             error.statusCode = HTTP_STATUS.BAD_REQUEST
    //             throw error
    //         }

    //         // Find user by Google ID
    //         let user = await prisma.user.findUnique({
    //             where: { googleId: uid },
    //         })

    //         if (!user) {
    //             // Check if email already exists
    //             const existingUser = await prisma.user.findUnique({
    //                 where: { email },
    //             })

    //             if (existingUser) {
    //                 const error = new Error(
    //                     'Email này đã được sử dụng bởi tài khoản khác. Vui lòng đăng nhập bằng phương thức cũ.'
    //                 )
    //                 error.statusCode = HTTP_STATUS.CONFLICT
    //                 throw error
    //             }

    //             // Create new user
    //             // Generate a unique username based on email or name
    //             let baseUserName = email.split('@')[0]
    //             let userName = baseUserName
    //             let counter = 1
    //             while (await prisma.user.findUnique({ where: { userName } })) {
    //                 userName = `${baseUserName}${counter}`
    //                 counter++
    //             }

    //             user = await prisma.user.create({
    //                 data: {
    //                     email,
    //                     userName,
    //                     fullName: name || 'Google User',
    //                     googleId: uid,
    //                     avatarUrl: picture,
    //                     role: USER_ROLES.STUDENT,
    //                     status: USER_STATUS.ACTIVE,
    //                     emailVerified: true,
    //                     passwordHash: null, // Optional
    //                 },
    //             })
    //         }

    //         // Check if user is active
    //         if (user.status !== USER_STATUS.ACTIVE) {
    //             const error = new Error('Tài khoản của bạn không hoạt động')
    //             error.statusCode = HTTP_STATUS.UNAUTHORIZED
    //             throw error
    //         }

    //         // Single session: Delete all existing active sessions for this user
    //         await prisma.userSession.deleteMany({
    //             where: {
    //                 userId: user.id,
    //                 isActive: true,
    //             },
    //         })

    //         // Increment tokenVersion
    //         await prisma.user.update({
    //             where: { id: user.id },
    //             data: {
    //                 lastLoginAt: new Date(),
    //                 tokenVersion: {
    //                     increment: 1,
    //                 },
    //             },
    //         })

    //         // Get updated user
    //         const updatedUser = await prisma.user.findUnique({
    //             where: { id: user.id },
    //             select: { tokenVersion: true },
    //         })

    //         // Create new session
    //         const deviceInfo = req ? DeviceUtil.getDeviceInfo(req) : null
    //         const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    //         const session = await prisma.userSession.create({
    //             data: {
    //                 userId: user.id,
    //                 deviceId: deviceInfo?.deviceId || null,
    //                 deviceName: deviceInfo?.deviceName || 'Unknown Device',
    //                 ipAddress: deviceInfo?.ipAddress || null,
    //                 userAgent: deviceInfo?.userAgent || null,
    //                 expiresAt,
    //             },
    //         })

    //         // Generate tokens
    //         const tokens = JWTUtil.generateTokens({
    //             userId: user.id,
    //             role: user.role,
    //             tokenVersion: updatedUser.tokenVersion,
    //             sessionId: session.id,
    //         })

    //         logger.info(
    //             `User logged in via Google: ${user.email} (Session: ${session.id})`
    //         )

    //         return {
    //             user: {
    //                 id: user.id,
    //                 userName: user.userName,
    //                 email: user.email,
    //                 fullName: user.fullName,
    //                 role: user.role,
    //                 status: user.status,
    //                 avatarUrl: user.avatarUrl,
    //                 emailVerified: user.emailVerified,
    //             },
    //             tokens,
    //         }
    //     } catch (error) {
    //         logger.error('Google login error:', error)
    //         if (error.code && error.code.startsWith('auth/')) {
    //              const authError = new Error('Token Google không hợp lệ')
    //              authError.statusCode = HTTP_STATUS.UNAUTHORIZED
    //              throw authError
    //         }
    //         throw error
    //     }
    // }

    async loginWithGoogle(idToken, req) {
        try {
            // Verify Firebase ID Token
            const decodedToken = await admin.auth().verifyIdToken(idToken)
            const { uid, email, name, picture } = decodedToken

            if (!email) {
                const error = new Error('Tài khoản Google phải có email')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }

            // Find user by Google ID
            let user = await prisma.user.findUnique({
                where: { googleId: uid },
            })

            if (!user) {
                // ✅ Check if email already exists with different provider
                const existingUser = await prisma.user.findUnique({
                    where: { email },
                })

                if (existingUser) {
                    // ✅ Xác định provider nào đã dùng email này
                    let usedProvider = 'email/password'

                    if (existingUser.googleId) {
                        usedProvider = 'Google'
                    } else if (existingUser.githubId) {
                        usedProvider = 'GitHub'
                    }

                    const error = new Error(
                        `Email "${email}" đã được đăng ký bằng ${usedProvider}. Vui lòng đăng nhập bằng ${usedProvider}.`
                    )
                    error.statusCode = HTTP_STATUS.CONFLICT
                    error.code = 'EMAIL_ALREADY_EXISTS'
                    error.data = {
                        email,
                        provider: usedProvider,
                    }
                    throw error
                }

                // Create new user
                let baseUserName = email.split('@')[0]
                let userName = baseUserName
                let counter = 1

                while (await prisma.user.findUnique({ where: { userName } })) {
                    userName = `${baseUserName}${counter}`
                    counter++
                }

                user = await prisma.user.create({
                    data: {
                        email,
                        userName,
                        fullName: name || 'Google User',
                        googleId: uid,
                        avatarUrl: picture,
                        role: USER_ROLES.STUDENT,
                        status: USER_STATUS.ACTIVE,
                        emailVerified: true,
                        passwordHash: null,
                    },
                })
            }

            // Check if user is active
            if (user.status !== USER_STATUS.ACTIVE) {
                const error = new Error('Tài khoản của bạn đã bị vô hiệu hóa')
                error.statusCode = HTTP_STATUS.FORBIDDEN
                throw error
            }

            // Single session: Delete all existing active sessions
            await prisma.userSession.deleteMany({
                where: {
                    userId: user.id,
                    isActive: true,
                },
            })

            // Increment tokenVersion
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    tokenVersion: {
                        increment: 1,
                    },
                },
            })

            // Get updated user
            const updatedUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { tokenVersion: true },
            })

            // Create new session
            const deviceInfo = req ? DeviceUtil.getDeviceInfo(req) : null
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

            const session = await prisma.userSession.create({
                data: {
                    userId: user.id,
                    deviceId: deviceInfo?.deviceId || null,
                    deviceName: deviceInfo?.deviceName || 'Unknown Device',
                    ipAddress: deviceInfo?.ipAddress || null,
                    userAgent: deviceInfo?.userAgent || null,
                    expiresAt,
                },
            })

            // Generate tokens
            const tokens = JWTUtil.generateTokens({
                userId: user.id,
                role: user.role,
                tokenVersion: updatedUser.tokenVersion,
                sessionId: session.id,
            })

            logger.info(
                `User logged in via Google: ${user.email} (Session: ${session.id})`
            )

            return {
                user: {
                    id: user.id,
                    userName: user.userName,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    status: user.status,
                    avatarUrl: user.avatarUrl,
                    emailVerified: user.emailVerified,
                },
                tokens,
            }
        } catch (error) {
            logger.error('Google login error:', error)

            // ✅ Xử lý lỗi Firebase
            if (error.code && error.code.startsWith('auth/')) {
                const authError = new Error(
                    'Token Google không hợp lệ hoặc đã hết hạn'
                )
                authError.statusCode = HTTP_STATUS.UNAUTHORIZED
                authError.code = 'INVALID_FIREBASE_TOKEN'
                throw authError
            }

            // ✅ Re-throw lỗi đã được format
            throw error
        }
    }

    /**
     * Login with GitHub
     */
    async loginWithGithub(idToken, req) {
        try {
            // Verify Firebase ID Token
            const decodedToken = await admin.auth().verifyIdToken(idToken)
            const { uid, email, name, picture, firebase } = decodedToken

            // Allow GitHub login even without email (rare, but possible if user set email to private)
            // But ideally we want an email. If email is missing, we might need to handle it or throw error.
            // For now, let's assume we need an email or at least a stable UID.

            // Find user by GitHub ID
            let user = await prisma.user.findUnique({
                where: { githubId: uid },
            })

            if (!user) {
                if (!email) {
                    throw new Error(
                        'GitHub account must have an email to create a new account.'
                    )
                }

                // Check if email already exists
                const existingUser = await prisma.user.findUnique({
                    where: { email },
                })

                if (existingUser) {
                    const error = new Error(
                        'Email này đã được sử dụng bởi tài khoản khác. Vui lòng đăng nhập bằng phương thức cũ.'
                    )
                    error.statusCode = HTTP_STATUS.CONFLICT
                    throw error
                }

                // Create new user
                let baseUserName = email.split('@')[0]
                let userName = baseUserName
                let counter = 1
                while (await prisma.user.findUnique({ where: { userName } })) {
                    userName = `${baseUserName}${counter}`
                    counter++
                }

                user = await prisma.user.create({
                    data: {
                        email,
                        userName,
                        fullName: name || 'GitHub User',
                        githubId: uid,
                        avatarUrl: picture,
                        role: USER_ROLES.STUDENT,
                        status: USER_STATUS.ACTIVE,
                        emailVerified: true,
                        passwordHash: null,
                    },
                })
            }

            // Check if user is active
            if (user.status !== USER_STATUS.ACTIVE) {
                const error = new Error('Tài khoản của bạn không hoạt động')
                error.statusCode = HTTP_STATUS.UNAUTHORIZED
                throw error
            }

            // Single session: Delete all existing active sessions
            await prisma.userSession.deleteMany({
                where: { userId: user.id, isActive: true },
            })

            // Increment tokenVersion
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    tokenVersion: { increment: 1 },
                },
            })

            // Get updated user's token version
            const updatedUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { tokenVersion: true },
            })

            // Create new session
            const deviceInfo = req ? DeviceUtil.getDeviceInfo(req) : null
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

            const session = await prisma.userSession.create({
                data: {
                    userId: user.id,
                    deviceId: deviceInfo?.deviceId || null,
                    deviceName: deviceInfo?.deviceName || 'Unknown Device',
                    ipAddress: deviceInfo?.ipAddress || null,
                    userAgent: deviceInfo?.userAgent || null,
                    expiresAt,
                },
            })

            // Generate tokens
            const tokens = JWTUtil.generateTokens({
                userId: user.id,
                role: user.role,
                tokenVersion: updatedUser.tokenVersion,
                sessionId: session.id,
            })

            logger.info(
                `User logged in via GitHub: ${user.email} (Session: ${session.id})`
            )

            return {
                user: {
                    id: user.id,
                    userName: user.userName,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    status: user.status,
                    avatarUrl: user.avatarUrl,
                    emailVerified: user.emailVerified,
                },
                tokens,
            }
        } catch (error) {
            logger.error('GitHub login error:', error)
            if (error.code && error.code.startsWith('auth/')) {
                const authError = new Error('Token GitHub không hợp lệ')
                authError.statusCode = HTTP_STATUS.UNAUTHORIZED
                throw authError
            }
            throw error
        }
    }

    // TODO: Xử lý lỗi khi user không có email
    // async loginWithGithub(idToken, req) {
    //     try {
    //         const decodedToken = await admin.auth().verifyIdToken(idToken)
    //         const { uid, email, name, picture } = decodedToken

    //         // Find user by GitHub ID
    //         let user = await prisma.user.findUnique({
    //             where: { githubId: uid },
    //         })

    //         if (!user) {
    //             if (!email) {
    //                 const error = new Error(
    //                     'Tài khoản GitHub phải có email công khai để tạo tài khoản mới.'
    //                 )
    //                 error.statusCode = HTTP_STATUS.BAD_REQUEST
    //                 throw error
    //             }

    //             // ✅ Check if email already exists
    //             const existingUser = await prisma.user.findUnique({
    //                 where: { email },
    //             })

    //             if (existingUser) {
    //                 let usedProvider = 'email/password'

    //                 if (existingUser.googleId) {
    //                     usedProvider = 'Google'
    //                 } else if (existingUser.githubId) {
    //                     usedProvider = 'GitHub'
    //                 }

    //                 const error = new Error(
    //                     `Email "${email}" đã được đăng ký bằng ${usedProvider}. Vui lòng đăng nhập bằng ${usedProvider}.`
    //                 )
    //                 error.statusCode = HTTP_STATUS.CONFLICT
    //                 error.code = 'EMAIL_ALREADY_EXISTS'
    //                 error.data = {
    //                     email,
    //                     provider: usedProvider,
    //                 }
    //                 throw error
    //             }

    //             // Create new user
    //             let baseUserName = email.split('@')[0]
    //             let userName = baseUserName
    //             let counter = 1

    //             while (await prisma.user.findUnique({ where: { userName } })) {
    //                 userName = `${baseUserName}${counter}`
    //                 counter++
    //             }

    //             user = await prisma.user.create({
    //                 data: {
    //                     email,
    //                     userName,
    //                     fullName: name || 'GitHub User',
    //                     githubId: uid,
    //                     avatarUrl: picture,
    //                     role: USER_ROLES.STUDENT,
    //                     status: USER_STATUS.ACTIVE,
    //                     emailVerified: true,
    //                     passwordHash: null,
    //                 },
    //             })
    //         }

    //         if (user.status !== USER_STATUS.ACTIVE) {
    //             const error = new Error('Tài khoản của bạn đã bị vô hiệu hóa')
    //             error.statusCode = HTTP_STATUS.FORBIDDEN
    //             throw error
    //         }

    //         // Single session logic (same as Google)
    //         await prisma.userSession.deleteMany({
    //             where: { userId: user.id, isActive: true },
    //         })

    //         await prisma.user.update({
    //             where: { id: user.id },
    //             data: {
    //                 lastLoginAt: new Date(),
    //                 tokenVersion: { increment: 1 },
    //             },
    //         })

    //         const updatedUser = await prisma.user.findUnique({
    //             where: { id: user.id },
    //             select: { tokenVersion: true },
    //         })

    //         const deviceInfo = req ? DeviceUtil.getDeviceInfo(req) : null
    //         const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    //         const session = await prisma.userSession.create({
    //             data: {
    //                 userId: user.id,
    //                 deviceId: deviceInfo?.deviceId || null,
    //                 deviceName: deviceInfo?.deviceName || 'Unknown Device',
    //                 ipAddress: deviceInfo?.ipAddress || null,
    //                 userAgent: deviceInfo?.userAgent || null,
    //                 expiresAt,
    //             },
    //         })

    //         const tokens = JWTUtil.generateTokens({
    //             userId: user.id,
    //             role: user.role,
    //             tokenVersion: updatedUser.tokenVersion,
    //             sessionId: session.id,
    //         })

    //         logger.info(
    //             `User logged in via GitHub: ${user.email} (Session: ${session.id})`
    //         )

    //         return {
    //             user: {
    //                 id: user.id,
    //                 userName: user.userName,
    //                 email: user.email,
    //                 fullName: user.fullName,
    //                 role: user.role,
    //                 status: user.status,
    //                 avatarUrl: user.avatarUrl,
    //                 emailVerified: user.emailVerified,
    //             },
    //             tokens,
    //         }
    //     } catch (error) {
    //         logger.error('GitHub login error:', error)

    //         if (error.code && error.code.startsWith('auth/')) {
    //             const authError = new Error(
    //                 'Token GitHub không hợp lệ hoặc đã hết hạn'
    //             )
    //             authError.statusCode = HTTP_STATUS.UNAUTHORIZED
    //             authError.code = 'INVALID_FIREBASE_TOKEN'
    //             throw authError
    //         }

    //         throw error
    //     }
    // }

    /**
     * Register new user
     */
    async register(data, req) {
        const {
            userName,
            email,
            password,
            fullName,
            // role is ignored - always set to STUDENT for security
        } = data

        // Always set role to STUDENT to prevent unauthorized role assignment
        const role = USER_ROLES.STUDENT

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { userName }],
            },
        })

        if (existingUser) {
            if (existingUser.email === email) {
                const error = new Error('Email đã tồn tại')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }
            if (existingUser.userName === userName) {
                const error = new Error('Tên người dùng đã tồn tại')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }
        }

        // Hash password
        const passwordHash = await BcryptUtil.hash(password)

        // Generate email verification token
        const emailVerificationToken =
            JWTUtil.generateEmailVerificationToken(email)

        // Create user
        const user = await prisma.user.create({
            data: {
                userName,
                email,
                passwordHash,
                fullName,
                role,
                status: USER_STATUS.ACTIVE,
                emailVerificationToken,
                tokenVersion: 0,
            },
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                role: true,
                status: true,
                emailVerified: true,
                tokenVersion: true,
                createdAt: true,
            },
        })

        // Create session for new user
        const deviceInfo = req ? DeviceUtil.getDeviceInfo(req) : null
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        const session = await prisma.userSession.create({
            data: {
                userId: user.id,
                deviceId: deviceInfo?.deviceId || null,
                deviceName: deviceInfo?.deviceName || 'Unknown Device',
                ipAddress: deviceInfo?.ipAddress || null,
                userAgent: deviceInfo?.userAgent || null,
                expiresAt,
            },
        })

        // Generate tokens with sessionId
        const tokens = JWTUtil.generateTokens({
            userId: user.id,
            role: user.role,
            tokenVersion: user.tokenVersion,
            sessionId: session.id,
        })

        // Notify admins about new user registration
        try {
            const { default: notificationsService } =
                await import('./notifications.service.js')
            await notificationsService.notifyAdminsUserRegistered(
                user.id,
                user.userName,
                user.fullName,
                user.email,
                user.role
            )
        } catch (error) {
            // Don't fail registration if notification fails
        }

        // Send verification email
        try {
            await emailService.sendVerificationEmail(
                user.email,
                user.userName,
                emailVerificationToken
            )
        } catch (error) {
            // Don't fail registration if email fails
        }

        return {
            user,
            tokens,
        }
    }

    /**
     * Login user
     * @param {string} identifier - Email or username
     * @param {string} password - User password
     * @param {object} req - Express request object
     */
    async login(identifier, password, req) {
        // Check if identifier is email or username
        const isEmail = identifier.includes('@')

        // Find user by email or username
        const user = await prisma.user.findFirst({
            where: isEmail
                ? { email: identifier.toLowerCase() }
                : { userName: identifier },
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                role: true,
                status: true,
                avatarUrl: true,
                emailVerified: true,
                passwordHash: true,
                tokenVersion: true,
                lastLoginAt: true,
            },
        })

        if (!user) {
            const error = new Error(
                'Email/tên đăng nhập hoặc mật khẩu không hợp lệ.'
            )
            error.statusCode = HTTP_STATUS.UNAUTHORIZED
            throw error
        }

        // Check if user is active
        if (user.status !== USER_STATUS.ACTIVE) {
            const error = new Error('Tài khoản của bạn không hoạt động')
            error.statusCode = HTTP_STATUS.UNAUTHORIZED
            throw error
        }

        // Verify password
        const isPasswordValid = await BcryptUtil.compare(
            password,
            user.passwordHash
        )

        if (!isPasswordValid) {
            const error = new Error(
                'Email/tên đăng nhập hoặc mật khẩu không hợp lệ.'
            )
            error.statusCode = HTTP_STATUS.UNAUTHORIZED
            throw error
        }

        // Single session: Delete all existing active sessions for this user
        await prisma.userSession.deleteMany({
            where: {
                userId: user.id,
                isActive: true,
            },
        })

        // Increment tokenVersion to invalidate all old tokens
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                tokenVersion: {
                    increment: 1,
                },
            },
        })

        // Get updated user with new tokenVersion
        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                tokenVersion: true,
            },
        })

        // Create new session
        const deviceInfo = req ? DeviceUtil.getDeviceInfo(req) : null
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        const session = await prisma.userSession.create({
            data: {
                userId: user.id,
                deviceId: deviceInfo?.deviceId || null,
                deviceName: deviceInfo?.deviceName || 'Unknown Device',
                ipAddress: deviceInfo?.ipAddress || null,
                userAgent: deviceInfo?.userAgent || null,
                expiresAt,
            },
        })

        // Generate tokens with sessionId
        const tokens = JWTUtil.generateTokens({
            userId: user.id,
            role: user.role,
            tokenVersion: updatedUser.tokenVersion,
            sessionId: session.id,
        })

        logger.info(`User logged in: ${user.email} (Session: ${session.id})`)

        return {
            user: {
                id: user.id,
                userName: user.userName,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status,
                avatarUrl: user.avatarUrl,
                emailVerified: user.emailVerified,
            },
            tokens,
        }
    }

    // async logout() {

    // }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = JWTUtil.verifyRefreshToken(refreshToken)

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    role: true,
                    status: true,
                    tokenVersion: true,
                },
            })

            if (!user) {
                throw new Error('Không tìm thấy người dùng')
            }

            if (user.status !== USER_STATUS.ACTIVE) {
                throw new Error('Tài khoản của bạn không hoạt động')
            }

            if (decoded.tokenVersion !== user.tokenVersion) {
                throw new Error('Token đã bị hết hạn')
            }

            // Check if session exists and is active
            if (decoded.sessionId) {
                const session = await prisma.userSession.findUnique({
                    where: { id: decoded.sessionId },
                    select: {
                        id: true,
                        isActive: true,
                        expiresAt: true,
                    },
                })

                if (!session || !session.isActive) {
                    throw new Error('Phiên đăng nhập đã bị hết hạn')
                }

                if (session.expiresAt < new Date()) {
                    throw new Error('Phiên đăng nhập đã hết hạn')
                }

                // Update last activity
                await prisma.userSession.update({
                    where: { id: session.id },
                    data: { lastActivityAt: new Date() },
                })
            }

            const tokens = JWTUtil.generateTokens({
                userId: user.id,
                role: user.role,
                tokenVersion: user.tokenVersion,
                sessionId: decoded.sessionId,
            })

            return tokens
        } catch (error) {
            throw new Error('Token làm mới không hợp lệ')
        }
    }

    /**
     * Verify email
     */
    async verifyEmail(token) {
        try {
            const decoded = JWTUtil.verifyEmailVerificationToken(token)

            const user = await prisma.user.findFirst({
                where: {
                    emailVerificationToken: token,
                },
                select: {
                    id: true,
                    email: true,
                    userName: true,
                    emailVerified: true,
                },
            })

            if (!user) {
                throw new Error('Token xác thực không hợp lệ')
            }

            if (user.emailVerified) {
                throw new Error('Email đã được xác thực')
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                    emailVerificationToken: null,
                },
            })

            // Send welcome email
            try {
                await emailService.sendWelcomeEmail(user.email, user.userName)
            } catch (error) {}

            return true
        } catch (error) {
            if (error.message === 'Email already verified') {
                throw error
            }
            throw new Error('Xác minh email thất bại')
        }
    }

    /**
     * Resend email verification
     */
    async resendVerification(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                userName: true,
                emailVerified: true,
            },
        })

        if (!user) {
            throw new Error('Không tìm thấy người dùng')
        }

        if (user.emailVerified) {
            throw new Error('Email đã được xác thực')
        }

        // Generate new verification token
        const emailVerificationToken = JWTUtil.generateEmailVerificationToken(
            user.email
        )

        // Update user with new token
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerificationToken },
        })

        // Send verification email
        await emailService.sendVerificationEmail(
            user.email,
            user.userName,
            emailVerificationToken
        )

        return { message: 'Email xác minh đã được gửi thành công' }
    }

    /**
     * Request password reset
     */
    async forgotPassword(email) {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                userName: true,
            },
        })

        if (!user) {
            return {
                message:
                    'Nếu email tồn tại, một liên kết đặt lại mật khẩu sẽ được gửi',
            }
        }

        const resetToken = JWTUtil.generatePasswordResetToken(user.id)
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpires: resetExpires,
            },
        })

        // Send password reset email
        try {
            await emailService.sendPasswordResetEmail(
                user.email,
                user.userName,
                resetToken
            )
        } catch (error) {
            throw new Error('Không thể gửi email đặt lại mật khẩu')
        }

        return { message: 'Email đặt lại mật khẩu đã được gửi thành công' }
    }

    /**
     * Reset password
     */
    async resetPassword(token, newPassword) {
        try {
            const decoded = JWTUtil.verifyPasswordResetToken(token)

            const user = await prisma.user.findFirst({
                where: {
                    id: decoded.userId,
                    passwordResetToken: token,
                    passwordResetExpires: {
                        gt: new Date(),
                    },
                },
                select: {
                    id: true,
                    email: true,
                    userName: true,
                },
            })

            if (!user) {
                throw new Error(
                    'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
                )
            }

            const passwordHash = await BcryptUtil.hash(newPassword)

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    passwordResetToken: null,
                    passwordResetExpires: null,
                },
            })

            // Send confirmation email
            try {
                await emailService.sendPasswordChangeConfirmation(
                    user.email,
                    user.userName
                )
            } catch (error) {
                // Don't fail password reset if email fails
            }

            return true
        } catch (error) {
            if (error.message === 'Invalid or expired reset token') {
                throw error
            }
            throw new Error('Đặt lại mật khẩu thất bại')
        }
    }

    /**
     * Invalidate all tokens for a user (logout all sessions)
     * @param {number} userId - User ID
     * @returns {Promise<boolean>}
     */
    async invalidateAllTokens(userId) {
        try {
            // Deactivate all sessions
            await prisma.userSession.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false },
            })

            // Increment tokenVersion
            await prisma.user.update({
                where: { id: userId },
                data: {
                    tokenVersion: {
                        increment: 1,
                    },
                },
            })

            return true
        } catch (error) {
            throw new Error('Không thể vô hiệu hóa tất cả tokens.')
        }
    }

    /**
     * Logout current session
     * @param {string} sessionId - Session ID
     * @param {number} userId - User ID
     * @returns {Promise<boolean>}
     */
    async logoutSession(sessionId, userId) {
        try {
            const session = await prisma.userSession.findFirst({
                where: {
                    id: sessionId,
                    userId: userId,
                    isActive: true,
                },
            })

            if (!session) {
                throw new Error('Không tìm thấy phiên đăng nhập')
            }

            // Deactivate session
            await prisma.userSession.update({
                where: { id: sessionId },
                data: { isActive: false },
            })

            return true
        } catch (error) {
            throw new Error('Không thể đăng xuất phiên đăng nhập')
        }
    }

    /**
     * Get all active sessions for a user
     * @param {number} userId - User ID
     * @returns {Promise<Array>}
     */
    async getSessions(userId) {
        try {
            const sessions = await prisma.userSession.findMany({
                where: {
                    userId,
                    isActive: true,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                select: {
                    id: true,
                    deviceId: true,
                    deviceName: true,
                    ipAddress: true,
                    userAgent: true,
                    lastActivityAt: true,
                    createdAt: true,
                    expiresAt: true,
                },
                orderBy: {
                    lastActivityAt: 'desc',
                },
            })

            return sessions
        } catch (error) {
            throw new Error('Không thể lấy phiên đăng nhập')
        }
    }

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            throw new Error('Không tìm thấy người dùng')
        }

        const isPasswordValid = await BcryptUtil.compare(
            currentPassword,
            user.passwordHash
        )

        if (!isPasswordValid) {
            throw new Error('Mật khẩu hiện tại không chính xác')
        }

        const passwordHash = await BcryptUtil.hash(newPassword)

        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                tokenVersion: {
                    increment: 1,
                },
            },
        })

        return true
    }
}

export default new AuthService()
