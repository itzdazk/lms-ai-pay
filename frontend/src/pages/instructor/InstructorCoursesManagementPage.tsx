import { CoursesPage } from './CoursesPage'

export function InstructorCoursesManagementPage() {
    return (
        <div className='bg-white dark:bg-black min-h-screen'>
            {/* Header */}
            <div className='bg-[#1A1A1A] border-b border-[#2d2d2d]'>
                <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8 pb-10'>
                    <div className='mb-2'>
                        <h1 className='text-2xl md:text-3xl font-bold mb-2 text-white'>
                            Quản lí khóa học
                        </h1>
                        <p className='text-base text-gray-300 leading-relaxed'>
                            Quản lý và theo dõi các khóa học của bạn
                        </p>
                    </div>
                </div>
            </div>
            <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8'>
                {/* Courses Management Content */}
                <CoursesPage />
            </div>
        </div>
    )
}
