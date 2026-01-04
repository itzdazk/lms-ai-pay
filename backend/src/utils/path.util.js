// src/utils/path.util.js
import { join } from 'path'

/**
 * Utility functions for file path management
 */

const UPLOAD_BASE = './uploads'

export const pathUtil = {
    /**
     * Get course-specific upload directory
     * @param {number} courseId
     * @returns {string} Path like ./uploads/courses/{courseId}
     */
    getCourseDir(courseId) {
        return join(UPLOAD_BASE, 'courses', String(courseId))
    },

    /**
     * Get course video directory
     * @param {number} courseId
     * @returns {string} Path like ./uploads/courses/{courseId}/videos
     */
    getVideoDir(courseId) {
        return join(this.getCourseDir(courseId), 'videos')
    },

    /**
     * Get course HLS directory
     * @param {number} courseId
     * @returns {string} Path like ./uploads/courses/{courseId}/hls
     */
    getHlsDir(courseId) {
        return join(this.getCourseDir(courseId), 'hls')
    },

    /**
     * Get course transcript directory
     * @param {number} courseId
     * @returns {string} Path like ./uploads/courses/{courseId}/transcripts
     */
    getTranscriptDir(courseId) {
        return join(this.getCourseDir(courseId), 'transcripts')
    },

    /**
     * Get course preview directory
     * @param {number} courseId
     * @returns {string} Path like ./uploads/courses/{courseId}/previews
     */
    getPreviewDir(courseId) {
        return join(this.getCourseDir(courseId), 'previews')
    },

    /**
     * Get course thumbnail directory
     * @param {number} courseId
     * @returns {string} Path like ./uploads/courses/{courseId}/thumbnails
     */
    getThumbnailDir(courseId) {
        return join(this.getCourseDir(courseId), 'thumbnails')
    },

    /**
     * Get shared upload directory (avatars, categories, etc.)
     * @returns {string} Path like ./uploads/shared
     */
    getSharedDir() {
        return join(UPLOAD_BASE, 'shared')
    },

    /**
     * Get avatar directory
     * @returns {string} Path like ./uploads/shared/avatars
     */
    getAvatarDir() {
        return join(this.getSharedDir(), 'avatars')
    },

    /**
     * Get category directory
     * @returns {string} Path like ./uploads/shared/categories
     */
    getCategoryDir() {
        return join(this.getSharedDir(), 'categories')
    },

    /**
     * Get temp directory
     * @returns {string} Path like ./uploads/shared/temp
     */
    getTempDir() {
        return join(this.getSharedDir(), 'temp')
    },

    /**
     * Get HLS playlist path for a lesson
     * @param {number} courseId
     * @param {number} lessonId
     * @returns {string} Path like ./uploads/courses/{courseId}/hls/{lessonId}/master.m3u8
     */
    getHlsPlaylistPath(courseId, lessonId) {
        return join(this.getHlsDir(courseId), `${lessonId}`, 'master.m3u8')
    },

    /**
     * Get HLS playlist URL for frontend
     * @param {number} courseId
     * @param {number} lessonId
     * @returns {string} URL like /uploads/courses/{courseId}/hls/{lessonId}/master.m3u8
     */
    getHlsPlaylistUrl(courseId, lessonId) {
        return `/uploads/courses/${courseId}/hls/${lessonId}/master.m3u8`
    },
}

export default pathUtil
