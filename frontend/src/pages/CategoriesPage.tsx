import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { CategoryList } from '../components/categories'
import { coursesApi } from '../lib/api'
import type { Category } from '../lib/api/types'
import { toast } from 'sonner'

export function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoading(true)
                const result = await coursesApi.getCategoriesWithFilter({
                    page: 1,
                    limit: 100,
                    isActive: true,
                })
                setCategories(result.categories)
            } catch (error) {
                console.error('Error fetching categories:', error)
                toast.error('Không thể tải danh mục')
            } finally {
                setIsLoading(false)
            }
        }

        fetchCategories()
    }, [])

    return (
        <div className='bg-background min-h-screen'>
            {/* Header */}
            <div className='bg-[#1A1A1A] border-b border-[#2D2D2D]'>
                <div className='container mx-auto px-4 py-12'>
                    <Link
                        to='/'
                        className='text-blue-500 hover:text-blue-600 mb-4 inline-block'
                    >
                        ← Quay lại
                    </Link>
                    <h1 className='text-3xl md:text-4xl font-bold text-white mb-4'>
                        Khám phá danh mục
                    </h1>
                    <p className='text-gray-400 max-w-2xl'>
                        Duyệt qua tất cả các danh mục khóa học của chúng tôi và
                        tìm khóa học phù hợp nhất với bạn.
                    </p>
                </div>
            </div>
            {/* Content */}
            <div className='container mx-auto px-4 py-12'>
                <CategoryList
                    categories={categories}
                    isLoading={isLoading}
                    hierarchical={false}
                />
            </div>
        </div>
    )
}
