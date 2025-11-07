// src/config/multer.config.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import config from './app.config.js';
import {
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    ALLOWED_DOCUMENT_TYPES,
    MAX_IMAGE_SIZE,
    MAX_VIDEO_SIZE,
    MAX_FILE_SIZE,
} from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const videosDir = path.join(uploadsDir, 'videos');
const transcriptsDir = path.join(uploadsDir, 'transcripts');

[uploadsDir, avatarsDir, videosDir, transcriptsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Storage configuration for avatar
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-userId-originalname
        const userId = req.user?.id || 'anonymous';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
        const filename = `${timestamp}-${userId}-${name}${ext}`;
        cb(null, filename);
    },
});

// File filter for avatar
const avatarFileFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
            ),
            false
        );
    }
};

// Multer instance for avatar upload
const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE, // 5MB
    },
})

// Storage configuration for video
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, videosDir)
    },
    filename: (req, file, cb) => {
        const lessonId = req.params.id || 'temp'
        const timestamp = Date.now()
        const ext = path.extname(file.originalname)
        const name = path.basename(file.originalname, ext).replace(/\s+/g, '-')
        const filename = `${timestamp}-lesson-${lessonId}-${name}${ext}`
        cb(null, filename)
    },
})

// File filter for video
const videoFileFilter = (req, file, cb) => {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(
            new Error(
                `Invalid file type. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`
            ),
            false
        )
    }
}

// Multer instance for video upload
const uploadVideo = multer({
    storage: videoStorage,
    fileFilter: videoFileFilter,
    limits: {
        fileSize: MAX_VIDEO_SIZE, // 500MB
    },
})

// Storage configuration for transcript
const transcriptStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, transcriptsDir)
    },
    filename: (req, file, cb) => {
        const lessonId = req.params.id || 'temp'
        const timestamp = Date.now()
        const ext = path.extname(file.originalname)
        const name = path.basename(file.originalname, ext).replace(/\s+/g, '-')
        const filename = `${timestamp}-lesson-${lessonId}-transcript${ext}`
        cb(null, filename)
    },
})

// File filter for transcript
const transcriptFileFilter = (req, file, cb) => {
    if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(
            new Error(
                `Invalid file type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`
            ),
            false
        )
    }
}

// Multer instance for transcript upload
const uploadTranscript = multer({
    storage: transcriptStorage,
    fileFilter: transcriptFileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE, // 10MB
    },
})

export { 
    uploadAvatar, 
    uploadVideo, 
    uploadTranscript,
    videosDir,
    transcriptsDir,
    avatarsDir,
    uploadsDir
}



