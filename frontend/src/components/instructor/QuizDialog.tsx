import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { toast } from 'sonner'
import { QuizForm } from './QuizForm'
import type { Quiz, CreateQuizRequest, UpdateQuizRequest } from '../../lib/api/types'
import { instructorQuizzesApi } from '../../lib/api/instructor-quizzes'

interface QuizDialogProps {
  open: boolean
  quiz?: Quiz | null
  lessonId: number
  onClose: () => void
  onSaved: (quiz: Quiz) => void
}

export function QuizDialog({ open, quiz, lessonId, onClose, onSaved }: QuizDialogProps) {
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (data: CreateQuizRequest | UpdateQuizRequest) => {
    setSaving(true)
    try {
      let saved: Quiz
      if (quiz) {
        saved = await instructorQuizzesApi.updateQuiz(quiz.id, data as UpdateQuizRequest)
      } else {
        saved = await instructorQuizzesApi.createLessonQuiz(lessonId, data as CreateQuizRequest)
      }
      toast.success(quiz ? 'Cập nhật quiz thành công' : 'Tạo quiz thành công')
      onSaved(saved)
    } catch (e) {
      toast.error('Không thể lưu quiz')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-[#1A1A1A] border-[#2D2D2D]">
        <DialogHeader className="pb-4 border-b border-[#2D2D2D]">
          <DialogTitle className="text-xl font-semibold text-white">
            {quiz ? 'Chỉnh sửa câu hỏi ôn tập' : 'Tạo câu hỏi ôn tập mới'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <QuizForm
            quiz={quiz || null}
            courseId={0}
            lessonId={lessonId}
            onSubmit={handleSubmit}
            onCancel={onClose}
            loading={saving}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
