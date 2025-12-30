import { useState, useEffect } from 'react'
import { EnrollmentCard } from '../Enrollments/EnrollmentCard'
import { coursesApi } from '../../lib/api/courses'
import type { EnrollmentWithCourse } from '../../lib/api/enrollments'

interface MyCoursesSectionProps {
    enrollments: any[] // Accept flexible enrollment data
}

export function MyCoursesSection({ enrollments }: MyCoursesSectionProps) {
    const [enrichedEnrollments, setEnrichedEnrollments] = useState<
        EnrollmentWithCourse[]
    >([])

    useEffect(() => {
        const enrichEnrollments = async () => {
            // First, map basic enrollment data
            const mapped: EnrollmentWithCourse[] = enrollments.map(
                (enrollment) => {
                    // Convert progressPercentage to number if it's a string
                    const progressPercentage =
                        typeof enrollment.progressPercentage === 'string'
                            ? parseFloat(enrollment.progressPercentage) || 0
                            : enrollment.progressPercentage || 0

                    // Determine status based on progress
                    let status: 'ACTIVE' | 'COMPLETED' | 'DROPPED' = 'ACTIVE'
                    if (enrollment.status) {
                        status = enrollment.status as
                            | 'ACTIVE'
                            | 'COMPLETED'
                            | 'DROPPED'
                    } else if (progressPercentage === 100) {
                        status = 'COMPLETED'
                    }

                    const enrolledAt =
                        enrollment.enrolledAt || new Date().toISOString()

                    // Extract durationHours from various possible locations
                    const durationHours =
                        enrollment.course?.durationHours ??
                        enrollment.durationHours ??
                        0

                    return {
                        id: enrollment.id,
                        userId: enrollment.userId || 0,
                        courseId:
                            enrollment.courseId || enrollment.course?.id || 0,
                        enrolledAt,
                        lastAccessedAt: enrollment.lastAccessedAt || null,
                        completedAt: enrollment.completedAt || null,
                        status,
                        progressPercentage,
                        createdAt: enrollment.createdAt || enrolledAt,
                        updatedAt:
                            enrollment.updatedAt || new Date().toISOString(),
                        course: {
                            id: enrollment.course?.id || 0,
                            title: enrollment.course?.title || '',
                            slug: enrollment.course?.slug || '',
                            thumbnailUrl: enrollment.course?.thumbnailUrl,
                            shortDescription:
                                enrollment.course?.shortDescription,
                            instructor: enrollment.course?.instructor || {
                                id: 0,
                                fullName: 'N/A',
                                avatarUrl: undefined,
                            },
                            totalLessons:
                                enrollment.course?.totalLessons ??
                                enrollment.totalLessons ??
                                0,
                            durationHours: Number(durationHours) || 0,
                            level: enrollment.course?.level || 'BEGINNER',
                            ratingAvg: enrollment.course?.ratingAvg,
                        },
                    }
                }
            )

            // Fetch course details for courses missing durationHours
            const enriched = await Promise.all(
                mapped.map(async (enrollment) => {
                    // If durationHours is missing and we have course slug, fetch course details
                    if (
                        enrollment.course.durationHours === 0 &&
                        enrollment.course.slug
                    ) {
                        try {
                            const courseDetails =
                                await coursesApi.getCourseBySlug(
                                    enrollment.course.slug
                                )
                            return {
                                ...enrollment,
                                course: {
                                    ...enrollment.course,
                                    durationHours:
                                        courseDetails.durationHours ||
                                        enrollment.course.durationHours,
                                    // Also update other fields if missing
                                    totalLessons:
                                        courseDetails.totalLessons ||
                                        enrollment.course.totalLessons,
                                    instructor:
                                        courseDetails.instructor ||
                                        enrollment.course.instructor,
                                    ratingAvg:
                                        courseDetails.ratingAvg ||
                                        enrollment.course.ratingAvg,
                                },
                            }
                        } catch (error) {
                            console.warn(
                                `Failed to fetch course details for ${enrollment.course.slug}:`,
                                error
                            )
                            return enrollment
                        }
                    }
                    return enrollment
                })
            )

            setEnrichedEnrollments(enriched)
        }

        if (enrollments.length > 0) {
            enrichEnrollments()
        } else {
            setEnrichedEnrollments([])
        }
    }, [enrollments])

    return (
        <div className='mb-8'>
            <div className='flex items-center justify-between mb-4'>
                <h2 className='text-2xl font-bold text-black dark:text-white'>
                    Khóa học của tôi
                </h2>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {enrichedEnrollments.map((enrollment) => (
                    <EnrollmentCard
                        key={enrollment.id}
                        enrollment={enrollment}
                    />
                ))}
            </div>
        </div>
    )
}
