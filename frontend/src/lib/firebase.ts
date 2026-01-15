// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyA8ik1DewNVhKQzaOFAHp1SLH_y1HssPFA',
    authDomain: 'lms-authentication-24606.firebaseapp.com',
    projectId: 'lms-authentication-24606',
    storageBucket: 'lms-authentication-24606.firebasestorage.app',
    messagingSenderId: '704632524698',
    appId: '1:704632524698:web:98fe88a0b1c0d58f2f7423',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export default app
