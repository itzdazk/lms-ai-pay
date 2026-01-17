// src/services/chapters.service.js
import { prisma } from '../config/database.config.js'
import { HTTP_STATUS } from '../config/constants.js'
import slugify from '../utils/slugify.util.js'

class ChaptersService {
    /**
     * Generate slug from title
     */
    generateSlug(title) {
        return slugify(title)
    }

    /**
     * Get all chapters by course ID
     */
    async getChaptersByCourse(courseId, includeLessons = false) {
        try {
            const parsedCourseId = parseInt(courseId)
            if (isNaN(parsedCourseId)) {
                const error = new Error('ID khóa học không hợp lệ')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }

            const chapters = await prisma.chapter.findMany({
                where: {
                    courseId: parsedCourseId,
                },
                orderBy: {
                    chapterOrder: 'asc',
                },
                include: includeLessons
                    ? {
                          lessons: {
                              orderBy: {
                                  lessonOrder: 'asc',
                              },
                              select: {
                                  id: true,
                                  courseId: true,
                                  chapterId: true,
                                  title: true,
                                  slug: true,
                                  description: true,
                                  videoUrl: true,
                                  videoDuration: true,
                                  lessonOrder: true,
                                  completionThreshold: true,
                                  isPreview: true,
                                  isPublished: true,
                                  transcriptUrl: true,
                                  transcriptJsonUrl: true,
                                  transcriptStatus: true,
                              },
                          },
                      }
                    : undefined,
            })

            // Get lesson counts separately to avoid conflicts
            const chaptersWithCounts = await Promise.all(
                chapters.map(async (chapter) => {
                    let lessonsCount = 0
                    if (includeLessons) {
                        lessonsCount = chapter.lessons?.length || 0
                    } else {
                        lessonsCount = await prisma.lesson.count({
                            where: {
                                chapterId: chapter.id,
                            },
                        })
                    }

                    return {
                        ...chapter,
                        lessonsCount,
                    }
                })
            )

            return chaptersWithCounts
        } catch (error) {
            throw error
        }
    }

    /**
     * Get chapter by ID
     */
    async getChapterById(chapterId, includeLessons = false) {
        const chapter = await prisma.chapter.findUnique({
            where: { id: parseInt(chapterId) },
            include: includeLessons
                ? {
                      lessons: {
                          orderBy: {
                              lessonOrder: 'asc',
                          },
                      },
                      course: {
                          select: {
                              id: true,
                              title: true,
                              slug: true,
                              instructorId: true,
                          },
                      },
                  }
                : {
                      course: {
                          select: {
                              id: true,
                              title: true,
                              slug: true,
                              instructorId: true,
                          },
                      },
                  },
        })

        if (!chapter) {
            const error = new Error('Không tìm thấy chương học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        return chapter
    }

    /**
     * Create new chapter
     */
    async createChapter(courseId, data, userId) {
        const { title, slug, description, chapterOrder, isPublished } = data

        // Check if course exists and user is instructor
        const course = await prisma.course.findUnique({
            where: { id: parseInt(courseId) },
            select: {
                id: true,
                instructorId: true,
                title: true,
            },
        })

        if (!course) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (course.instructorId !== userId) {
            const error = new Error(
                'Truy cập không hợp lệ: Bạn không phải là giảng viên của khóa học này'
            )
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Generate slug from title if not provided
        let chapterSlug = slug
        if (!chapterSlug) {
            chapterSlug = this.generateSlug(title)
        }

        // Check if slug already exists in this course
        const existingChapter = await prisma.chapter.findUnique({
            where: {
                courseId_slug: {
                    courseId: parseInt(courseId),
                    slug: chapterSlug,
                },
            },
        })

        if (existingChapter) {
            // Append number if slug exists
            let counter = 1
            let uniqueSlug = `${chapterSlug}-${counter}`
            while (
                await prisma.chapter.findUnique({
                    where: {
                        courseId_slug: {
                            courseId: parseInt(courseId),
                            slug: uniqueSlug,
                        },
                    },
                })
            ) {
                counter++
                uniqueSlug = `${chapterSlug}-${counter}`
            }
            chapterSlug = uniqueSlug
        }

        // Get max chapterOrder if not provided
        let finalChapterOrder = chapterOrder
        if (!finalChapterOrder) {
            const maxOrder = await prisma.chapter.aggregate({
                where: { courseId: parseInt(courseId) },
                _max: { chapterOrder: true },
            })
            finalChapterOrder = (maxOrder._max.chapterOrder || 0) + 1
        } else {
            // If order is provided, shift other chapters
            await prisma.chapter.updateMany({
                where: {
                    courseId: parseInt(courseId),
                    chapterOrder: { gte: finalChapterOrder },
                },
                data: {
                    chapterOrder: {
                        increment: 1,
                    },
                },
            })
        }

        const chapter = await prisma.chapter.create({
            data: {
                courseId: parseInt(courseId),
                title,
                slug: chapterSlug,
                description,
                chapterOrder: finalChapterOrder,
                isPublished: isPublished !== undefined ? isPublished : true,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                _count: {
                    select: {
                        lessons: true,
                    },
                },
            },
        })

        return {
            ...chapter,
            lessonsCount: chapter._count.lessons,
            _count: undefined,
        }
    }

    /**
     * Update chapter
     */
    async updateChapter(chapterId, data, userId) {
        const { title, slug, description, chapterOrder, isPublished } = data

        // Get chapter and verify ownership
        const chapter = await prisma.chapter.findUnique({
            where: { id: parseInt(chapterId) },
            include: {
                course: {
                    select: {
                        id: true,
                        instructorId: true,
                    },
                },
            },
        })

        if (!chapter) {
            const error = new Error('Không tìm thấy chương học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (chapter.course.instructorId !== userId) {
            const error = new Error(
                'Truy cập không hợp lệ: Bạn không phải là giảng viên của khóa học này'
            )
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Prepare update data
        const updateData = {}

        if (title !== undefined) {
            updateData.title = title
        }

        if (description !== undefined) {
            updateData.description = description
        }

        if (isPublished !== undefined) {
            updateData.isPublished = isPublished
        }

        // Handle slug update
        if (slug !== undefined || title !== undefined) {
            let chapterSlug = slug
            if (!chapterSlug && title) {
                chapterSlug = this.generateSlug(title)
            } else if (!chapterSlug) {
                chapterSlug = chapter.slug
            }

            // Check if new slug conflicts with existing chapter (excluding current)
            const existingChapter = await prisma.chapter.findFirst({
                where: {
                    courseId: chapter.courseId,
                    slug: chapterSlug,
                    id: { not: parseInt(chapterId) },
                },
            })

            if (existingChapter) {
                // Append number if slug exists
                let counter = 1
                let uniqueSlug = `${chapterSlug}-${counter}`
                while (
                    await prisma.chapter.findFirst({
                        where: {
                            courseId: chapter.courseId,
                            slug: uniqueSlug,
                            id: { not: parseInt(chapterId) },
                        },
                    })
                ) {
                    counter++
                    uniqueSlug = `${chapterSlug}-${counter}`
                }
                chapterSlug = uniqueSlug
            }

            updateData.slug = chapterSlug
        }

        // Handle chapter order update
        if (
            chapterOrder !== undefined &&
            chapterOrder !== chapter.chapterOrder
        ) {
            const oldOrder = chapter.chapterOrder
            const newOrder = chapterOrder

            if (newOrder > oldOrder) {
                // Moving down: shift chapters between old and new position up
                await prisma.chapter.updateMany({
                    where: {
                        courseId: chapter.courseId,
                        chapterOrder: {
                            gt: oldOrder,
                            lte: newOrder,
                        },
                        id: { not: parseInt(chapterId) },
                    },
                    data: {
                        chapterOrder: {
                            decrement: 1,
                        },
                    },
                })
            } else {
                // Moving up: shift chapters between new and old position down
                await prisma.chapter.updateMany({
                    where: {
                        courseId: chapter.courseId,
                        chapterOrder: {
                            gte: newOrder,
                            lt: oldOrder,
                        },
                        id: { not: parseInt(chapterId) },
                    },
                    data: {
                        chapterOrder: {
                            increment: 1,
                        },
                    },
                })
            }

            updateData.chapterOrder = newOrder
        }

        const updatedChapter = await prisma.chapter.update({
            where: { id: parseInt(chapterId) },
            data: updateData,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                _count: {
                    select: {
                        lessons: true,
                    },
                },
            },
        })

        return {
            ...updatedChapter,
            lessonsCount: updatedChapter._count.lessons,
            _count: undefined,
        }
    }

    /**
     * Delete chapter
     */
    async deleteChapter(chapterId, userId) {
        // Get chapter and verify ownership
        const chapter = await prisma.chapter.findUnique({
            where: { id: parseInt(chapterId) },
            include: {
                course: {
                    select: {
                        id: true,
                        instructorId: true,
                    },
                },
                _count: {
                    select: {
                        lessons: true,
                    },
                },
            },
        })

        if (!chapter) {
            const error = new Error('Không tìm thấy chương học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (chapter.course.instructorId !== userId) {
            const error = new Error(
                'Truy cập không hợp lệ: Bạn không phải là giảng viên của khóa học này'
            )
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Check if chapter has lessons
        if (chapter._count.lessons > 0) {
            const error = new Error(
                'Không thể xóa chương mục có chứa bài học. Vui lòng xóa hoặc di chuyển các bài học trước.'
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Get the order of the chapter being deleted
        const deletedOrder = chapter.chapterOrder

        // Delete the chapter
        await prisma.chapter.delete({
            where: { id: parseInt(chapterId) },
        })

        // Shift remaining chapters up
        await prisma.chapter.updateMany({
            where: {
                courseId: chapter.courseId,
                chapterOrder: {
                    gt: deletedOrder,
                },
            },
            data: {
                chapterOrder: {
                    decrement: 1,
                },
            },
        })

        return { message: 'Xóa chương thành công' }
    }

    /**
     * Reorder chapters
     */
    async reorderChapters(courseId, chapterIds, userId) {
        // Verify course ownership
        const course = await prisma.course.findUnique({
            where: { id: parseInt(courseId) },
            select: {
                id: true,
                instructorId: true,
            },
        })

        if (!course) {
            const error = new Error('Khóa học không tồn tại')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (course.instructorId !== userId) {
            const error = new Error(
                'Truy cập không hợp lệ: Bạn không phải là giảng viên của khóa học này'
            )
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Verify all chapters belong to this course
        const chapters = await prisma.chapter.findMany({
            where: {
                id: { in: chapterIds.map((id) => parseInt(id)) },
            },
            select: {
                id: true,
                courseId: true,
            },
        })

        if (chapters.length !== chapterIds.length) {
            const error = new Error('Một số chương không tìm thấy')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        const invalidChapters = chapters.filter(
            (ch) => ch.courseId !== parseInt(courseId)
        )
        if (invalidChapters.length > 0) {
            const error = new Error('Một số chương không thuộc về khóa học này')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Update chapter orders
        const updatePromises = chapterIds.map((chapterId, index) => {
            return prisma.chapter.update({
                where: { id: parseInt(chapterId) },
                data: { chapterOrder: index + 1 },
            })
        })

        await Promise.all(updatePromises)

        return { message: 'Sắp xếp lại chương thành công' }
    }
}

export default new ChaptersService()
