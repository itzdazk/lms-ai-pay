// src/config/multer.config.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import config from './app.config.js';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

[uploadsDir, avatarsDir].forEach((dir) => {
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
});

export { uploadAvatar };



