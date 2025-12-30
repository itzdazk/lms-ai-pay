import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Textarea } from '../ui/textarea'
import type { QuizQuestion } from '../../lib/api/types'

interface QuestionFormProps {
  value: QuizQuestion
  onChange: (next: QuizQuestion) => void
}

export function QuestionForm({ value, onChange }: QuestionFormProps) {
  const updateOption = (i: number, val: string) => {
    const options = [...(value.options || [])]
    options[i] = val
    onChange({ ...value, options })
  }

  const addOption = () => {
    onChange({ ...value, options: [...(value.options || []), ''] })
  }

  const removeOption = (i: number) => {
    const options = (value.options || []).filter((_, idx) => idx !== i)
    let correct = value.correctAnswer ?? 0
    if (i === correct) correct = 0
    else if (i < correct) correct = correct - 1
    onChange({ ...value, options, correctAnswer: Math.max(0, Math.min(correct, options.length - 1)) })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="qtext">Nội dung câu hỏi</Label>
        <Textarea id="qtext" value={value.question} onChange={(e) => onChange({ ...value, question: e.target.value })} placeholder="Nhập nội dung câu hỏi" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label>Phương án trả lời</Label>
          <Button size="sm" type="button" onClick={addOption}>Thêm phương án</Button>
        </div>
        <div className="mt-2 space-y-2">
          <RadioGroup value={String(value.correctAnswer ?? 0)} onValueChange={(v) => onChange({ ...value, correctAnswer: Number(v) })}>
            {(value.options || []).map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <RadioGroupItem id={`opt-${idx}`} value={String(idx)} />
                <Input value={opt} onChange={(e) => updateOption(idx, e.target.value)} placeholder={`Phương án #${idx + 1}`} />
                <Button type="button" variant="outline" onClick={() => removeOption(idx)}>Xóa</Button>
              </div>
            ))}
          </RadioGroup>
          {(value.options || []).length === 0 && (
            <div className="text-sm text-muted-foreground">Chưa có phương án nào. Nhấn "Thêm phương án" để bắt đầu.</div>
          )}
        </div>
      </div>
      <div className="w-40">
        <Label htmlFor="points">Điểm</Label>
        <Input id="points" type="number" value={value.points} onChange={(e) => onChange({ ...value, points: Number(e.target.value || 1) })} />
      </div>
    </div>
  )
}
