import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Category, coursesApi } from '../lib/api'
import { CategoryList } from '../components/categories'

export function CategoryListSection() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoading(true)
                const result = await coursesApi.getCategoriesWithFilter({
                    page: 1,
                    limit: 20,
                    isActive: true,
                })
                console.log(result)

                setCategories(result.categories)

                console.log(categories)
            } catch (error) {
                console.error('Error fetching categories:', error)
                toast.error('Không thể tải danh mục')
            } finally {
                setIsLoading(false)
            }
        }

        fetchCategories()
    }, [])

    return <CategoryList categories={categories} isLoading={isLoading} />
}
