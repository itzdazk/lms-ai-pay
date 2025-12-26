import { Input } from '../ui/input'
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
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    validate,
    getSubmitData,
  } = useQuizForm(quiz)

  const handleSubmit = () => {
    const errs = validate()
    const messages = Object.values(errs).filter(Boolean) as string[]
    if (messages.length) {
      // basic alert to avoid extra UI deps
      window.alert(messages.join('\n'))
      return
    }
    onSubmit(getSubmitData() as CreateQuizRequest)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="title">Tiêu đề</Label>
          <Input id="title" value={formData.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Nhập tiêu đề quiz" />
        </div>
        <div>
          <Label htmlFor="description">Mô tả</Label>
          <Textarea id="description" value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Mô tả ngắn về quiz" />
        </div>
        <div>
          <Label htmlFor="passingScore">Điểm đạt (%)</Label>
          <Input
            id="passingScore"
            type="number"
            min={0}
            max={100}
            value={formData.passingScore}
            onChange={(e) => updateField('passingScore', Number(e.target.value))}
            placeholder="VD: 70"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox checked={!!formData.isPublished} onCheckedChange={(v) => updateField('isPublished', Boolean(v))} />
          <Label>Xuất bản</Label>
        </div>
      </div>

      <QuestionsManager
        questions={formData.questions as QuizQuestion[]}
        onAdd={addQuestion}
        onUpdate={(index, patch) => {
          updateQuestion(index, patch as QuizQuestion)
        }}
        onDelete={deleteQuestion}
        onMove={(from, to) => {
          if (from === to) return
          const arr = [...(formData.questions as QuizQuestion[])]
          const [moved] = arr.splice(from, 1)
          arr.splice(to, 0, moved)
          reorderQuestions(arr)
        }}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>Hủy</Button>
        <Button onClick={handleSubmit} disabled={loading}>{quiz ? 'Lưu thay đổi' : 'Tạo Quiz'}</Button>
      </div>
    </div>
  )
}
