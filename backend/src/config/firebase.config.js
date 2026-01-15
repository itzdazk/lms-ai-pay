import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
                    /\\n/g,
                    '\n'
                ),
            }),
        })
        console.log('Firebase Admin initialized successfully')
    } catch (error) {
        console.error('Firebase Admin initialization failed:', error)
    }
} else {
    console.warn(
        'Firebase credentials not found in environment variables. Google Login will not work.'
    )
}

export default admin
