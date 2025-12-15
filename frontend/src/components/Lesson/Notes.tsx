import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button } from '../ui/button';
import { DarkOutlineButton } from '../ui/buttons';
import { Textarea } from '../ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { lessonNotesApi } from '../../lib/api';

interface NotesProps {
  lessonId: number;
  initialNotes?: string;
  onSave?: (notes: string) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  showActions?: boolean; // Control whether to show action buttons
  onNotesChange?: (notes: string, hasChanges: boolean) => void; // Callback for notes changes
  autoFocus?: boolean; // Auto focus textarea when component mounts
}

export interface NotesRef {
  focus: () => void;
}

export const Notes = forwardRef<NotesRef, NotesProps>(({
  lessonId,
  initialNotes = '',
  onSave,
  onCancel,
  className = '',
  showActions = true,
  onNotesChange,
  autoFocus = false,
}, ref) => {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Expose focus method via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
  }));

  useEffect(() => {
    setNotes(initialNotes);
    setHasChanges(false);
  }, [initialNotes, lessonId]);

  // Auto focus when autoFocus prop is true
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      // Small delay to ensure drawer animation completes
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 350); // Slightly longer than drawer animation (300ms)
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

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
    const hasChanges = value !== initialNotes;
    setHasChanges(hasChanges);
    if (onNotesChange) {
      onNotesChange(value, hasChanges);
    }
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
    <div className={`h-full w-full ${className}`}>
      <Textarea
        ref={textareaRef}
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Viết ghi chú của bạn ở đây..."
        className="w-full h-full p-3 border-0 bg-transparent text-white placeholder:text-gray-500 focus:outline-none resize-none custom-scrollbar"
        style={{ 
          height: '100%',
          overflowY: 'auto'
        }}
      />
      {showActions && (
        <div className="flex items-center justify-between mt-2">
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
          <div className="flex items-center gap-2">
            {onCancel && (
              <DarkOutlineButton
                size="sm"
                onClick={onCancel}
              >
                Hủy
              </DarkOutlineButton>
            )}
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
      )}
    </div>
  );
});

Notes.displayName = 'Notes';


