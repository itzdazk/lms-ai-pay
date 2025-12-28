import { Input } from '../ui/input'
import { DarkOutlineSelectTrigger, DarkOutlineSelectContent, DarkOutlineSelectItem } from '../ui/dark-outline-select-trigger'
import { Select, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Textarea } from '../ui/textarea'
import type { Quiz, CreateQuizRequest, UpdateQuizRequest, QuizQuestion } from '../../lib/api/types'
import { useQuizForm } from '../../hooks/useQuizForm'
import { QuestionsManager } from './QuestionsManager'

interface QuizFormProps {
  quiz: Quiz | null
  courseId: number
  lessonId?: number
  loading?: boolean
  onSubmit: (data: CreateQuizRequest | UpdateQuizRequest) => void
  onCancel: () => void
}

export function QuizForm({ quiz, loading, onSubmit, onCancel }: QuizFormProps) {
  const {
    formData,
    updateField,
    validate,
    getSubmitData,
    hasChanges,
  } = useQuizForm(quiz)

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      window.alert('Tiêu đề không được để trống')
      return
    }
    if (quiz) {
      // Update mode: chỉ gửi các trường thay đổi cơ bản
      const updateData: Partial<UpdateQuizRequest> = {};
      if (formData.title !== quiz.title) updateData.title = formData.title;
      if (formData.description !== quiz.description) updateData.description = formData.description;
      if (formData.passingScore !== quiz.passingScore) updateData.passingScore = formData.passingScore;
      // Nếu có logic sửa câu hỏi, mới gửi questions
      // if (có sửa câu hỏi) updateData.questions = ...
      onSubmit(updateData as UpdateQuizRequest);
    } else {
      // Create mode: gửi đủ trường
      const submitData = {
        ...getSubmitData(),
        isPublished: false,
        questions: [],
      };
      onSubmit(submitData as CreateQuizRequest);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="title">Tiêu đề</Label>
          <Input id="title" value={formData.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Nhập tiêu câu hỏi ôn tập" />
        </div>
        <div>
          <Label htmlFor="description">Mô tả</Label>
          <Textarea id="description" value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Mô tả ngắn về câu hỏi ôn tập" />
        </div>
        <div>
          <Label htmlFor="passingScore">Điểm đạt (%)</Label>
          <Select
            value={String(formData.passingScore)}
            onValueChange={val => updateField('passingScore', Number(val))}
          >
            <DarkOutlineSelectTrigger id="passingScore">
              <SelectValue placeholder="Chọn điểm đạt" />
            </DarkOutlineSelectTrigger>
            <DarkOutlineSelectContent>
              {[...Array(10)].map((_, i) => {
                const val = (i + 1) * 10;
                return (
                  <DarkOutlineSelectItem key={val} value={String(val)}>
                    {val}
                  </DarkOutlineSelectItem>
                );
              })}
            </DarkOutlineSelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>Hủy</Button>
        <Button onClick={handleSubmit} disabled={loading || (quiz ? !hasChanges() : false)}>{quiz ? 'Lưu thay đổi' : 'Tạo Quiz'}</Button>
      </div>
    </div>
  )
}
