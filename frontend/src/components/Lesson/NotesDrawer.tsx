import { useEffect, useState, useRef } from 'react';
import { Notes, NotesRef } from './Notes';
import { Button } from '../ui/button';
import { DarkOutlineButton } from '../ui/buttons';
import { Save, Loader2, PenTool } from 'lucide-react';
import { toast } from 'sonner';
import { lessonNotesApi } from '../../lib/api';

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: number;
  initialNotes?: string;
  showSidebar?: boolean;
  chapterTitle?: string;
  lessonTitle?: string;
}

export function NotesDrawer({
  isOpen,
  onClose,
  lessonId,
  initialNotes,
  showSidebar = true,
  chapterTitle,
  lessonTitle,
}: NotesDrawerProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const notesRef = useRef<NotesRef>(null);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Update notes when initialNotes changes
  useEffect(() => {
    setNotes(initialNotes || '');
    setHasChanges(false);
  }, [initialNotes, lessonId]);

  // Auto focus textarea when drawer opens
  useEffect(() => {
    if (isOpen && notesRef.current) {
      // Delay to ensure drawer animation completes
      const timer = setTimeout(() => {
        notesRef.current?.focus();
      }, 350); // Slightly longer than drawer animation (300ms)
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await lessonNotesApi.upsertLessonNote(lessonId, notes);
      
      // Also save to localStorage as backup
      try {
        localStorage.setItem(`lesson-notes-${lessonId}`, notes);
      } catch (error) {
        // Ignore localStorage errors
      }
      
      setHasChanges(false);
      toast.success('Đã lưu ghi chú');
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu ghi chú');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotesChange = (newNotes: string, hasChangesValue: boolean) => {
    setNotes(newNotes);
    setHasChanges(hasChangesValue);
  };

  return (
    <>
      {/* Drawer */}
      <div
        className={`fixed bottom-0 bg-[#1A1A1A] border-t border-[#2D2D2D] z-[60] transform transition-all duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          height: showSidebar ? '30vh' : '35vh',
          left: '0',
          width: showSidebar ? '75%' : '100%',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div className="flex flex-col" style={{ height: showSidebar ? '30vh' : '35vh' }}>
          {/* Header with indicator */}
          {isOpen && (
            <div className="px-3 py-2 border-b border-[#2D2D2D] bg-[#1F1F1F] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <PenTool className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-400">
                Viết ghi chú của bạn ở đây để lưu lại những điều quan trọng
              </span>
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 overflow-hidden px-4">
            <div className="h-full">
              <Notes
                ref={notesRef}
                lessonId={lessonId}
                initialNotes={notes}
                showActions={false}
                onNotesChange={handleNotesChange}
              />
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex items-center justify-between px-2 py-2 border-t border-[#2D2D2D] bg-[#1A1A1A]">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <DarkOutlineButton
                size="sm"
                onClick={onClose}
              >
                Hủy
              </DarkOutlineButton>
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
                    Lưu
                  </>
                )}
              </Button>
            </div>
            <span className="whitespace-nowrap text-xs text-gray-400">
              <span className="font-semibold"><strong>Ghi chú của bạn</strong></span>
              {chapterTitle && ` • ${chapterTitle}`}
              {lessonTitle && ` • ${lessonTitle}`}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

