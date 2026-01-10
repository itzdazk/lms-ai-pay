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
    
    // Validation for multiple choice questions
    if (form.type === 'multiple_choice') {
      // Filter out empty options for validation
      const filledOptions = form.options.filter(opt => opt.trim() !== '')
      
      if (filledOptions.length < 2) {
        toast.error('Câu hỏi trắc nghiệm cần ít nhất 2 phương án trả lời')
        return
      }
      
      // Update form with only filled options
      const validOptions = filledOptions
      let validCorrectAnswer = form.correctAnswer
      
      // Adjust correct answer if needed (in case it was pointing to an empty option)
      if (typeof validCorrectAnswer === 'number') {
        const originalIndex = form.options.findIndex(opt => opt === form.options[validCorrectAnswer as number])
        // Recalculate correct answer index after filtering
        let newIndex = 0
        for (let i = 0; i <= (validCorrectAnswer as number); i++) {
          if (form.options[i]?.trim()) {
            if (i === (validCorrectAnswer as number)) {
              break
            }
            newIndex++
          }
        }
        validCorrectAnswer = newIndex
      }
      
      // Update form with cleaned options
      setForm(prev => ({ ...prev, options: validOptions, correctAnswer: validCorrectAnswer }))
      
      // Use cleaned options for submission
      form.options = validOptions
      form.correctAnswer = validCorrectAnswer
    }
    
    // Validation for true/false
    if (form.type === 'true_false' && (form.correctAnswer !== 0 && form.correctAnswer !== 1)) {
      toast.error('Vui lòng chọn đáp án đúng')
      return
    }
    
    // Validation for short answer
    if (form.type === 'short_answer') {
      if (!form.correctAnswer || (typeof form.correctAnswer === 'string' && !form.correctAnswer.trim())) {
        toast.error('Vui lòng nhập đáp án đúng')
        return
      }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-[#1A1A1A] border-[#2D2D2D]">
        <DialogHeader className="pb-4 border-b border-[#2D2D2D]">
          <DialogTitle className="text-xl font-semibold text-white">
            {isEdit ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-6 px-6 py-4">
          <div>
            <Label htmlFor="question" className="text-sm font-medium text-gray-300 mb-2 block">
              Nội dung câu hỏi <span className="text-red-500">*</span>
            </Label>
            <Textarea 
              id="question"
              value={form.question} 
              onChange={(e) => setForm({ ...form, question: e.target.value })} 
              placeholder="Nhập nội dung câu hỏi" 
              rows={4}
              className="bg-[#2D2D2D] border-[#3D3D3D] text-white placeholder:text-gray-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-3 block">
              Loại câu hỏi <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
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
                  className="w-4 h-4 text-blue-600 bg-[#2D2D2D] border-[#3D3D3D] focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Trắc nghiệm</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="qtype"
                  checked={form.type === 'true_false'}
                  onChange={() => setForm({ ...form, type: 'true_false', options: ['Đúng', 'Sai'], correctAnswer: 1 })}
                  className="w-4 h-4 text-blue-600 bg-[#2D2D2D] border-[#3D3D3D] focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Đúng/Sai</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="qtype"
                  checked={form.type === 'short_answer'}
                  onChange={() => setForm({ ...form, type: 'short_answer', options: [], correctAnswer: '' })}
                  className="w-4 h-4 text-blue-600 bg-[#2D2D2D] border-[#3D3D3D] focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Tự luận ngắn</span>
              </label>
            </div>
          </div>

          {form.type === 'multiple_choice' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-300">
                  Phương án trả lời <span className="text-red-500">*</span>
                </Label>
                <Button 
                  size="sm" 
                  type="button" 
                  onClick={addOption}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                >
                  + Thêm phương án
                </Button>
              </div>
              <div className="mt-3 space-y-3">
                <RadioGroup value={String(form.correctAnswer ?? 0)} onValueChange={(v) => setForm({ ...form, correctAnswer: Number(v) })}>
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#252525] border border-[#2D2D2D] rounded-lg hover:border-blue-500/50 transition-colors">
                      <RadioGroupItem 
                        id={`opt-${idx}`} 
                        value={String(idx)} 
                        className="border-[#3D3D3D] text-blue-600"
                      />
                      <Input 
                        value={opt} 
                        onChange={(e) => setOption(idx, e.target.value)} 
                        placeholder={`Phương án #${idx + 1}`}
                        className="flex-1 bg-[#2D2D2D] border-[#3D3D3D] text-white placeholder:text-gray-500 focus:border-blue-500"
                      />
                      {form.options.length > 2 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => removeOption(idx)}
                          size="sm"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8 px-3"
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                  ))}
                </RadioGroup>
                {form.options.length === 0 && (
                  <div className="text-sm text-gray-400 p-3 bg-[#252525] border border-[#2D2D2D] rounded-lg text-center">
                    Chưa có phương án nào. Nhấn "Thêm phương án" để bắt đầu.
                  </div>
                )}
                {form.options.length > 0 && form.options.length < 2 && (
                  <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                    Cần ít nhất 2 phương án cho câu hỏi trắc nghiệm.
                  </div>
                )}
              </div>
            </div>
          )}

          {form.type === 'true_false' && (
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-3 block">
                Đáp án đúng <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2 space-y-2">
                {/* Store 1 for Đúng, 0 for Sai to avoid inverted grading */}
                <RadioGroup value={String(form.correctAnswer ?? 1)} onValueChange={(v) => setForm({ ...form, correctAnswer: Number(v) })}>
                  <div className="flex items-center gap-3 p-3 bg-[#252525] border border-[#2D2D2D] rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer">
                    <RadioGroupItem id="tf-true" value="1" className="border-[#3D3D3D] text-blue-600" />
                    <Label htmlFor="tf-true" className="text-gray-300 cursor-pointer font-normal">Đúng</Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#252525] border border-[#2D2D2D] rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer">
                    <RadioGroupItem id="tf-false" value="0" className="border-[#3D3D3D] text-blue-600" />
                    <Label htmlFor="tf-false" className="text-gray-300 cursor-pointer font-normal">Sai</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {form.type === 'short_answer' && (
            <div>
              <Label htmlFor="short-answer" className="text-sm font-medium text-gray-300 mb-2 block">
                Đáp án đúng (so khớp chính xác) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="short-answer"
                value={typeof form.correctAnswer === 'string' ? form.correctAnswer : ''}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                placeholder="Nhập đáp án tham chiếu"
                className="bg-[#2D2D2D] border-[#3D3D3D] text-white placeholder:text-gray-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-2 p-2 bg-[#252525] border border-[#2D2D2D] rounded">
                💡 So sánh không phân biệt hoa/thường, tự động bỏ khoảng trắng đầu/cuối.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="explanation" className="text-sm font-medium text-gray-300 mb-2 block">
              Giải thích (tùy chọn)
            </Label>
            <Textarea 
              id="explanation"
              value={form.explanation || ''} 
              onChange={(e) => setForm({ ...form, explanation: e.target.value })} 
              placeholder="Giải thích cho đáp án (nếu có)" 
              rows={3}
              className="bg-[#2D2D2D] border-[#3D3D3D] text-white placeholder:text-gray-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>
        
        {/* Footer with action buttons */}
        <div className="px-6 pb-6 pt-4 border-t border-[#2D2D2D] flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={saving}
            className="min-w-[100px] border-[#3D3D3D] text-gray-300 hover:bg-[#2D2D2D] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm câu hỏi')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
