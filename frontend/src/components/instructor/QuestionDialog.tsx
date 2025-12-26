import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { toast } from 'sonner'
import { instructorQuizzesApi } from '../../lib/api/instructor-quizzes'

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'

interface QuestionDialogProps {
  open: boolean
  quizId: number
  question?: {
    id?: number
    question: string
    type?: QuestionType
    options?: string[]
    correctAnswer?: number | null
    explanation?: string | null
  } | null
  onClose: () => void
  onSaved: () => void
}

export function QuestionDialog({ open, quizId, question, onClose, onSaved }: QuestionDialogProps) {
  const isEdit = !!(question && question.id)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    question: '',
    type: 'multiple_choice' as QuestionType,
    options: [''] as string[],
    // For true/false, we store 1 for "Đúng" and 0 for "Sai" to align with backend grading
    correctAnswer: 1 as number | string | null,
    explanation: '' as string | null,
  })

  useEffect(() => {
    if (!open) return
    if (question) {
      setForm({
        question: question.question || '',
        type: (question.type as QuestionType) || 'multiple_choice',
        options: Array.isArray(question.options) ? question.options : [],
        correctAnswer: typeof question.correctAnswer === 'number' ? question.correctAnswer : 0,
        explanation: question.explanation ?? '',
      })
    } else {
      setForm({ question: '', type: 'multiple_choice', options: [''], correctAnswer: 0, explanation: '' })
    }
  }, [open, question])

  const setOption = (idx: number, val: string) => {
    const next = [...form.options]
    next[idx] = val
    setForm((f) => ({ ...f, options: next }))
  }

  const addOption = () => setForm((f) => ({ ...f, options: [...f.options, ''] }))
  const removeOption = (idx: number) => {
    const next = form.options.filter((_, i) => i !== idx)
    let ca = form.correctAnswer ?? 0
    if (idx === ca) ca = 0
    else if (idx < ca) ca = ca - 1
    setForm((f) => ({ ...f, options: next, correctAnswer: Math.max(0, Math.min(ca, next.length - 1)) }))
  }

  const handleSave = async () => {
    if (!form.question.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi')
      return
    }
    if (form.type === 'multiple_choice' && form.options.length === 0) {
      toast.error('Cần ít nhất một phương án trả lời')
      return
    }
    setSaving(true)
    try {
      if (isEdit && question?.id) {
        await instructorQuizzesApi.updateQuestion(quizId, question.id, {
          question: form.question,
          type: form.type,
          options: form.options,
          correctAnswer: form.correctAnswer,
          explanation: form.explanation || null,
        })
        toast.success('Đã cập nhật câu hỏi')
      } else {
        await instructorQuizzesApi.createQuestion(quizId, {
          question: form.question,
          type: form.type,
          options: form.options,
          correctAnswer: form.correctAnswer,
          explanation: form.explanation || null,
        })
        toast.success('Đã thêm câu hỏi')
      }
      onSaved()
      onClose()
    } catch (e) {
      toast.error('Không thể lưu câu hỏi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          <div>
            <Label>Nội dung câu hỏi</Label>
            <Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Nhập nội dung câu hỏi" />
          </div>

          <div>
            <Label>Loại câu hỏi</Label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="qtype"
                  checked={form.type === 'multiple_choice'}
                  onChange={() => {
                    const nextOptions = (form.type === 'multiple_choice' && form.options.length > 0)
                      ? form.options
                      : ['', '']
                    setForm({
                      ...form,
                      type: 'multiple_choice',
                      options: nextOptions,
                      correctAnswer: 0,
                    })
                  }}
                /> Trắc nghiệm
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="qtype"
                  checked={form.type === 'true_false'}
                  onChange={() => setForm({ ...form, type: 'true_false', options: ['Đúng', 'Sai'], correctAnswer: 1 })}
                /> Đúng/Sai
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="qtype"
                  checked={form.type === 'short_answer'}
                  onChange={() => setForm({ ...form, type: 'short_answer', options: [], correctAnswer: '' })}
                /> Tự luận ngắn
              </label>
            </div>
          </div>

          {form.type === 'multiple_choice' && (
            <div>
              <div className="flex items-center justify-between">
                <Label>Phương án trả lời</Label>
                <Button size="sm" type="button" onClick={addOption}>Thêm phương án</Button>
              </div>
              <div className="mt-2 space-y-2">
                <RadioGroup value={String(form.correctAnswer ?? 0)} onValueChange={(v) => setForm({ ...form, correctAnswer: Number(v) })}>
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <RadioGroupItem id={`opt-${idx}`} value={String(idx)} />
                      <Input value={opt} onChange={(e) => setOption(idx, e.target.value)} placeholder={`Phương án #${idx + 1}`} />
                      <Button type="button" variant="outline" onClick={() => removeOption(idx)}>Xóa</Button>
                    </div>
                  ))}
                </RadioGroup>
                {form.options.length === 0 && (
                  <div className="text-sm text-muted-foreground">Chưa có phương án nào. Nhấn "Thêm phương án" để bắt đầu.</div>
                )}
              </div>
            </div>
          )}

          {form.type === 'true_false' && (
            <div>
              <Label>Đáp án đúng</Label>
              <div className="mt-2">
                {/* Store 1 for Đúng, 0 for Sai to avoid inverted grading */}
                <RadioGroup value={String(form.correctAnswer ?? 1)} onValueChange={(v) => setForm({ ...form, correctAnswer: Number(v) })}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="tf-true" value="1" />
                    <Label htmlFor="tf-true">Đúng</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="tf-false" value="0" />
                    <Label htmlFor="tf-false">Sai</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {form.type === 'short_answer' && (
            <div>
              <Label>Đáp án đúng (so khớp chính xác)</Label>
              <Input
                value={typeof form.correctAnswer === 'string' ? form.correctAnswer : ''}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                placeholder="Nhập đáp án tham chiếu"
              />
              <p className="text-xs text-muted-foreground mt-1">So sánh không phân biệt hoa/thường, tự động bỏ khoảng trắng đầu/cuối.</p>
            </div>
          )}

          <div>
            <Label>Giải thích (tuỳ chọn)</Label>
            <Textarea value={form.explanation || ''} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="Giải thích cho đáp án (nếu có)" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>{isEdit ? 'Lưu' : 'Thêm'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
