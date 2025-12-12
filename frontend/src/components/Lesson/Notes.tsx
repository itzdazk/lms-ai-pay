import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { lessonNotesApi } from '../../lib/api';

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setNotes(initialNotes);
    setHasChanges(false);
  }, [initialNotes, lessonId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('saving');
      
      if (onSave) {
        // Use custom onSave handler if provided
        await onSave(notes);
      } else {
        // Use API to save notes
        await lessonNotesApi.upsertLessonNote(lessonId, notes);
      }
      
      // Also save to localStorage as backup
      try {
        localStorage.setItem(`lesson-notes-${lessonId}`, notes);
      } catch (error) {
        // Ignore localStorage errors
      }
      
      setHasChanges(false);
      setSaveStatus('saved');
      
      // Hide "saved" message after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu ghi chú');
      setSaveStatus('idle');
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
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">
                Ghi chú sẽ được lưu vào tài khoản của bạn và đồng bộ trên mọi thiết bị
              </p>
              {saveStatus === 'saved' && (
                <span className="text-xs text-green-500 font-medium">
                  ✓ Lưu thành công
                </span>
              )}
            </div>
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


