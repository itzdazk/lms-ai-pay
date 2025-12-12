import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotesProps {
  lessonId: number;
  initialNotes?: string;
  onSave?: (notes: string) => Promise<void>;
  className?: string;
}

export function Notes({
  lessonId,
  initialNotes = '',
  onSave,
  className = '',
}: NotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
    setHasChanges(false);
  }, [initialNotes, lessonId]);

  const handleSave = async () => {
    if (!onSave) {
      // If no onSave handler, just save to localStorage
      try {
        localStorage.setItem(`lesson-notes-${lessonId}`, notes);
        toast.success('Ghi chú đã được lưu');
        setHasChanges(false);
      } catch (error) {
        toast.error('Không thể lưu ghi chú');
      }
      return;
    }

    try {
      setIsSaving(true);
      await onSave(notes);
      toast.success('Ghi chú đã được lưu');
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu ghi chú');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (value: string) => {
    setNotes(value);
    setHasChanges(value !== initialNotes);
  };

  // Auto-save to localStorage as backup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes && notes.trim()) {
        try {
          localStorage.setItem(`lesson-notes-${lessonId}`, notes);
        } catch (error) {
          // Ignore localStorage errors
        }
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [notes, lessonId]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(`lesson-notes-${lessonId}`);
      if (savedNotes && !initialNotes) {
        setNotes(savedNotes);
      }
    } catch (error) {
      // Ignore localStorage errors
    }
  }, [lessonId, initialNotes]);

  return (
    <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Ghi chú của bạn
            </label>
            <Textarea
              value={notes}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Viết ghi chú của bạn ở đây..."
              className="min-h-48 p-4 border border-[#2D2D2D] rounded-lg bg-[#1F1F1F] text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Ghi chú sẽ được tự động lưu vào trình duyệt của bạn
            </p>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu ghi chú
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


