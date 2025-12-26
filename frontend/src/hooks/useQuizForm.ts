import { useState, useCallback, useMemo } from 'react'
import type { Quiz, QuizQuestion } from '../lib/api/types'

/**
 * Form state for quiz creation/editing
 */
export interface QuizFormState {
    title: string
    description: string
    instructions?: string
    passingScore: number
    showAnswerAfterSubmit?: boolean
    questions: QuizQuestion[]
    isPublished?: boolean
}

/**
 * Validation errors type
 */
export interface QuizFormErrors {
    title?: string
    description?: string
    instructions?: string
    passingScore?: string
    questions?: string
    [key: string]: string | undefined // For question-level errors
}

/**
 * Default form state
 */
const DEFAULT_FORM_STATE: QuizFormState = {
    title: '',
    description: '',
    instructions: '',
    passingScore: 70,
    showAnswerAfterSubmit: true,
    questions: [],
    isPublished: false,
}

/**
 * Hook for managing quiz form state
 * Handles form fields, questions, validation, and change detection
 *
 * Usage:
 *   const form = useQuizForm(existingQuiz)
 *   form.updateField('title', 'New Title')
 *   form.addQuestion()
 *   const errors = form.validate()
 */
export function useQuizForm(initialQuiz?: Quiz | null) {
    const [formData, setFormData] = useState<QuizFormState>(() => {
        if (!initialQuiz) return DEFAULT_FORM_STATE

        return {
            title: initialQuiz.title || '',
            description: initialQuiz.description || '',
            instructions: initialQuiz.description || '',
            passingScore: initialQuiz.passingScore || 70,
            showAnswerAfterSubmit: true,
            questions: Array.isArray(initialQuiz.questions)
                ? initialQuiz.questions
                : [],
            isPublished: initialQuiz.isPublished || false,
        }
    })

    const [errors, setErrors] = useState<QuizFormErrors>({})
    const [isDirty, setIsDirty] = useState(false)

    // Store initial state for change detection
    const initialFormData = useMemo(() => {
        if (!initialQuiz) return null

        return {
            title: initialQuiz.title || '',
            description: initialQuiz.description || '',
            instructions: initialQuiz.description || '',
            passingScore: initialQuiz.passingScore || 70,
            showAnswerAfterSubmit: true,
            questions: Array.isArray(initialQuiz.questions)
                ? initialQuiz.questions
                : [],
            isPublished: initialQuiz.isPublished || false,
        }
    }, [initialQuiz?.id])

    /**
     * Update a single form field
     */
    const updateField = useCallback(
        <K extends keyof QuizFormState>(field: K, value: QuizFormState[K]) => {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }))
            setIsDirty(true)
            // Clear error for this field
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[field as string]
                return newErrors
            })
        },
        []
    )

    /**
     * Add a new empty question
     */
    const addQuestion = useCallback(() => {
        const newQuestion: QuizQuestion = {
            id: `q-${Date.now()}`,
            question: '',
            type: 'multiple_choice',
            options: ['', '', '', ''],
            correctAnswer: 0,
            points: 1,
            explanation: '',
        }

        setFormData((prev) => ({
            ...prev,
            questions: [...prev.questions, newQuestion],
        }))
        setIsDirty(true)
    }, [])

    /**
     * Update a question at specific index
     */
    const updateQuestion = useCallback(
        (index: number, question: QuizQuestion) => {
            setFormData((prev) => {
                const newQuestions = [...prev.questions]
                newQuestions[index] = question
                return {
                    ...prev,
                    questions: newQuestions,
                }
            })
            setIsDirty(true)
        },
        []
    )

    /**
     * Delete a question at specific index
     */
    const deleteQuestion = useCallback((index: number) => {
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }))
        setIsDirty(true)
    }, [])

    /**
     * Reorder questions (for drag-drop)
     */
    const reorderQuestions = useCallback((questions: QuizQuestion[]) => {
        setFormData((prev) => ({
            ...prev,
            questions,
        }))
        setIsDirty(true)
    }, [])

    /**
     * Clear all errors
     */
    const clearErrors = useCallback(() => {
        setErrors({})
    }, [])

    /**
     * Validate form
     * Returns errors object - empty if valid
     */
    const validate = useCallback((): QuizFormErrors => {
        const newErrors: QuizFormErrors = {}

        // Title validation
        if (!formData.title.trim()) {
            newErrors.title = 'Tiêu đề không được để trống'
        }

        // Questions validation
        if (formData.questions.length === 0) {
            newErrors.questions = 'Phải có ít nhất 1 câu hỏi'
        }

        // Validate each question
        formData.questions.forEach((q, index) => {
            if (!q.question.trim()) {
                newErrors[`question_${index}_text`] =
                    'Văn bản câu hỏi không được để trống'
            }

            // Check if has correct answer
            const hasCorrectAnswer = q.options?.some(
                (_opt, i) => i === q.correctAnswer
            )
            if (!hasCorrectAnswer) {
                newErrors[`question_${index}_answer`] =
                    'Phải chọn 1 đáp án đúng'
            }

            // Check if has options
            if (!q.options || q.options.length < 2) {
                newErrors[`question_${index}_options`] =
                    'Phải có ít nhất 2 lựa chọn'
            }

            // Check if all options have text
            q.options?.forEach((opt, optIndex) => {
                if (!opt.trim()) {
                    newErrors[`question_${index}_option_${optIndex}`] =
                        'Lựa chọn không được để trống'
                }
            })

            // Points validation
            if (q.points <= 0) {
                newErrors[`question_${index}_points`] = 'Điểm phải lớn hơn 0'
            }
        })

        // Passing score validation
        if (formData.passingScore < 0 || formData.passingScore > 100) {
            newErrors.passingScore = 'Điểm đạt phải từ 0-100'
        }

        setErrors(newErrors)
        return newErrors
    }, [formData])

    /**
     * Check if form has changes
     */
    const hasChanges = useCallback((): boolean => {
        if (!initialFormData) {
            // Create mode - check if any data entered
            return (
                formData.title.trim() !== '' ||
                formData.description.trim() !== '' ||
                formData.questions.length > 0
            )
        }

        // Edit mode - check if any field changed
        return (
            JSON.stringify(formData) !== JSON.stringify(initialFormData)
        )
    }, [formData, initialFormData])

    /**
     * Reset form to initial state
     */
    const reset = useCallback(() => {
        if (initialFormData) {
            setFormData(initialFormData)
        } else {
            setFormData(DEFAULT_FORM_STATE)
        }
        setErrors({})
        setIsDirty(false)
    }, [initialFormData])

    /**
     * Get clean data for API submission
     */
    const getSubmitData = useCallback(() => {
        return {
            title: formData.title,
            description: formData.description,
            instructions: formData.instructions,
            passingScore: formData.passingScore,
            questions: formData.questions,
            isPublished: formData.isPublished,
        }
    }, [formData])

    return {
        // State
        formData,
        errors,
        isDirty,

        // Field updates
        updateField,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        reorderQuestions,

        // Validation & errors
        validate,
        clearErrors,
        hasChanges,

        // Utilities
        reset,
        getSubmitData,
    }
}
