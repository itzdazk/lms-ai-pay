// src/config/multer.config.js
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import config from './app.config.js'
import {
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    ALLOWED_DOCUMENT_TYPES,
    MAX_IMAGE_SIZE,
    MAX_VIDEO_SIZE,
    MAX_FILE_SIZE,
    UPLOAD_TYPES,
} from './constants.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sanitizeFilename = (value) => {
    if (!value) return 'file'
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
}

// === ĐƯỜNG DẪN THƯ MỤC ===
const uploadsDir = path.join(__dirname, '../../uploads')
const avatarsDir = path.join(uploadsDir, 'avatars')
const videosDir = path.join(uploadsDir, 'videos')
const transcriptsDir = path.join(uploadsDir, 'transcripts')
const thumbnailsDir = path.join(uploadsDir, 'thumbnails') // MỚI
const videoPreviewsDir = path.join(uploadsDir, 'video-previews') // MỚI

// === TỰ ĐỘNG TẠO THƯ MỤC ===
;[
    uploadsDir,
    avatarsDir,
    videosDir,
    transcriptsDir,
    thumbnailsDir,
    videoPreviewsDir,
].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`Created upload directory: ${dir}`)
    }
})

// ========================
// 1. AVATAR UPLOAD
// ========================
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarsDir),
    filename: (req, file, cb) => {
        const userId = req.user?.id || 'anonymous'
        const timestamp = Date.now()
        const ext = path.extname(file.originalname)
        const name = path.basename(file.originalname, ext).replace(/\s+/g, '-')
        const filename = `${timestamp}-${userId}-${name}${ext}`
        cb(null, filename)
    },
})

const avatarFileFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(
            new Error(
                `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`
            ),
            false
        )
    }
}

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: { fileSize: MAX_IMAGE_SIZE },
})

// ========================
// 2. VIDEO LESSON UPLOAD
// ========================
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, videosDir),
    filename: (req, file, cb) => {
        const lessonId = req.params.id || 'temp'
        const timestamp = Date.now()
        const ext = path.extname(file.originalname)
        const name = sanitizeFilename(path.basename(file.originalname, ext))
        const filename = `${timestamp}-lesson-${lessonId}-${name}${ext}`
        cb(null, filename)
    },
})

const videoFileFilter = (req, file, cb) => {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(
            new Error(
                `Invalid file type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`
            ),
            false
        )
    }
}

const uploadVideo = multer({
    storage: videoStorage,
    fileFilter: videoFileFilter,
    limits: { fileSize: MAX_VIDEO_SIZE },
})

// ========================
// 3. TRANSCRIPT UPLOAD
// ========================
const transcriptStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, transcriptsDir),
    filename: (req, file, cb) => {
        const lessonId = req.params.id || 'temp'
        const timestamp = Date.now()
        const ext = path.extname(file.originalname)
        const name = sanitizeFilename(path.basename(file.originalname, ext))
        const filename = `${timestamp}-lesson-${lessonId}-transcript${ext}`
        cb(null, filename)
    },
})

const transcriptFileFilter = (req, file, cb) => {
    if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(
            new Error(
                `Invalid file type. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`
            ),
            false
        )
    }
}

const uploadTranscript = multer({
    storage: transcriptStorage,
    fileFilter: transcriptFileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
})

// ========================
// 4. THUMBNAIL UPLOAD (MỚI)
// ========================
const thumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, thumbnailsDir),
    filename: (req, file, cb) => {
        const courseId = req.params.id || 'temp'
        const timestamp = Date.now()
        const ext = path.extname(file.originalname)
        const name = sanitizeFilename(path.basename(file.originalname, ext))
        const filename = `${timestamp}-course-${courseId}-thumb${ext}`
        cb(null, filename)
    },
})

const thumbnailFileFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(
            new Error(
                `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`
            ),
            false
        )
    }
}

const uploadThumbnail = multer({
    storage: thumbnailStorage,
    fileFilter: thumbnailFileFilter,
    limits: { fileSize: MAX_IMAGE_SIZE },
}).single('thumbnail')

// ========================
// 5. VIDEO PREVIEW UPLOAD (MỚI)
// ========================
const videoPreviewStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, videoPreviewsDir),
    filename: (req, file, cb) => {
        const courseId = req.params.id || 'temp'
        const timestamp = Date.now()
        const ext = path.extname(file.originalname)
        const name = sanitizeFilename(path.basename(file.originalname, ext))
        const filename = `${timestamp}-course-${courseId}-preview${ext}`
        cb(null, filename)
    },
})

const videoPreviewFileFilter = (req, file, cb) => {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(
            new Error(
                `Invalid file type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`
            ),
            false
        )
    }
}

const uploadVideoPreview = multer({
    storage: videoPreviewStorage,
    fileFilter: videoPreviewFileFilter,
    limits: { fileSize: MAX_VIDEO_SIZE }, // Có thể giảm xuống 100MB nếu cần
}).single('videoPreview')

// ========================
// EXPORT
// ========================
export {
    uploadAvatar,
    uploadVideo,
    uploadTranscript,
    uploadThumbnail,
    uploadVideoPreview,
    uploadsDir,
    avatarsDir,
    videosDir,
    transcriptsDir,
    thumbnailsDir,
    videoPreviewsDir,
}
