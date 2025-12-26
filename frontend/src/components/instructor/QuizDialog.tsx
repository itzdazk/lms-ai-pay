import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{quiz ? 'Chỉnh sửa Quiz' : 'Tạo Quiz mới'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <QuizForm
            quiz={quiz || null}
            courseId={0}
            lessonId={lessonId}
            onSubmit={handleSubmit}
            onCancel={onClose}
            loading={saving}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
