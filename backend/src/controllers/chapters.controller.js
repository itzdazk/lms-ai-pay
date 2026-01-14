// src/controllers/chapters.controller.js
import chaptersService from '../services/chapters.service.js'
import { HTTP_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class ChaptersController {
    /**
     * @route   GET /api/v1/courses/:courseId/chapters
     * @desc    Get all chapters by course ID (Public)
     */
    getChaptersByCourse = asyncHandler(async (req, res) => {
        const { courseId } = req.params
        const includeLessons = req.query.includeLessons === 'true'

        const chapters = await chaptersService.getChaptersByCourse(
            courseId,
            includeLessons
        )

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Truy xuất danh sách chương học thành công',
            data: chapters,
        })
    })

    /**
     * @route   GET /api/v1/chapters/:id
     * @desc    Get chapter by ID (Public)
     */
    getChapterById = asyncHandler(async (req, res) => {
        const { id } = req.params
        const includeLessons = req.query.includeLessons === 'true'

        const chapter = await chaptersService.getChapterById(id, includeLessons)

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Truy xuất danh sách chương học thành công',
            data: chapter,
        })
    })

    /**
     * @route   POST /api/v1/instructor/courses/:courseId/chapters
     * @desc    Create a new chapter
     * @access  Private (Instructor/Admin)
     */
    createChapter = asyncHandler(async (req, res) => {
        const { courseId } = req.params
        const userId = req.user.id

        const chapter = await chaptersService.createChapter(
            courseId,
            req.body,
            userId
        )

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Đã tạo chương học thành công',
            data: chapter,
        })
    })

    /**
     * @route   PUT /api/v1/instructor/chapters/:id
     * @desc    Update a chapter
     * @access  Private (Instructor/Admin)
     */
    updateChapter = asyncHandler(async (req, res) => {
        const { id } = req.params
        const userId = req.user.id

        const chapter = await chaptersService.updateChapter(
            id,
            req.body,
            userId
        )

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Đã cập nhật chương học thành công',
            data: chapter,
        })
    })

    /**
     * @route   DELETE /api/v1/instructor/chapters/:id
     * @desc    Delete a chapter
     * @access  Private (Instructor/Admin)
     */
    deleteChapter = asyncHandler(async (req, res) => {
        const { id } = req.params
        const userId = req.user.id

        await chaptersService.deleteChapter(id, userId)

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Đã xóa chương học thành công',
        })
    })

    /**
     * @route   PUT /api/v1/instructor/courses/:courseId/chapters/reorder
     * @desc    Reorder chapters
     * @access  Private (Instructor/Admin)
     */
    reorderChapters = asyncHandler(async (req, res) => {
        const { courseId } = req.params
        const { chapterIds } = req.body
        const userId = req.user.id

        await chaptersService.reorderChapters(courseId, chapterIds, userId)

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Đã sắp xếp lại chương học thành công',
        })
    })
}

export default new ChaptersController()
