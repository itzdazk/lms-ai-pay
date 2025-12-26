import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { QuestionForm } from './QuestionForm'
import type { QuizQuestion } from '../../lib/api/types'

interface QuestionsManagerProps {
  questions: QuizQuestion[]
  onAdd: () => void
  onUpdate: (index: number, question: QuizQuestion) => void
  onDelete: (index: number) => void
  onMove: (from: number, to: number) => void
}

export function QuestionsManager({ questions, onAdd, onUpdate, onDelete, onMove }: QuestionsManagerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Câu hỏi ({questions.length})</h3>
        <Button size="sm" onClick={onAdd}>Thêm câu hỏi</Button>
      </div>
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <Card key={idx}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Câu hỏi #{idx + 1}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={idx === 0} onClick={() => onMove(idx, idx - 1)}>Lên</Button>
                  <Button variant="outline" size="sm" disabled={idx === questions.length - 1} onClick={() => onMove(idx, idx + 1)}>Xuống</Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(idx)}>Xóa</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <QuestionForm value={q} onChange={(next) => onUpdate(idx, next)} />
            </CardContent>
          </Card>
        ))}
        {questions.length === 0 && (
          <div className="text-sm text-muted-foreground">Chưa có câu hỏi nào.</div>
        )}
      </div>
    </div>
  )
}
