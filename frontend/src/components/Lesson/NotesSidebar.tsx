import { useEffect, useState, useRef } from 'react';
import { Button } from '../ui/button';
import { DarkOutlineButton } from '../ui/buttons';
import { Loader2, X, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { lessonNotesApi } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { CourseNotesResponse } from '../../lib/api/lesson-notes';

interface ChapterInfo {
  id: number;
  title: string;
  lessonIds: number[];
}

interface NotesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  currentChapterId?: number;
  currentChapterTitle?: string;
  currentChapterLessonIds?: number[];
  chapters?: ChapterInfo[];
  currentLessonId?: number;
  onLessonSelect?: (lesson: { id: number; slug: string; courseId: number }) => void;
}

export function NotesSidebar({
  isOpen,
  onClose,
  courseId,
  currentChapterId,
  currentChapterTitle,
  currentChapterLessonIds,
  chapters = [],
  onLessonSelect,
}: NotesSidebarProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [notes, setNotes] = useState<CourseNotesResponse['notes']>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'current-chapter' | 'all-chapters'>('current-chapter');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<string>('');
  const editingTextareaRef = useRef<HTMLTextAreaElement>(null);
  const noteCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Prevent body scroll when sidebar is open
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

  // Load notes when sidebar opens
  useEffect(() => {
    if (isOpen && courseId) {
      loadNotes();
    }
  }, [isOpen, courseId, filter, sortOrder, currentChapterId, currentChapterLessonIds]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await lessonNotesApi.getCourseNotes(courseId);
      
      let filteredNotes = response.notes;
      
      // Apply filters
      if (filter === 'current-chapter' && currentChapterLessonIds && currentChapterLessonIds.length > 0) {
        // Filter by current chapter - only show notes for lessons in current chapter
        filteredNotes = response.notes.filter(note => 
          currentChapterLessonIds.includes(note.lesson.id)
        );
      }
      // Sort by updatedAt
      filteredNotes = [...filteredNotes].sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
      
      setNotes(filteredNotes);
    } catch (error: any) {
      console.error('Error loading notes:', error);
      toast.error('Không thể tải ghi chú');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note: CourseNotesResponse['notes'][0]) => {
    setSelectedNote(note.id);
    setEditingNote(note.content);
    
    // Scroll to the note card and focus textarea after a short delay
    setTimeout(() => {
      const noteCard = noteCardRefs.current.get(note.id);
      if (noteCard) {
        noteCard.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'end' // Scroll to the right side
        });
      }
      // Focus textarea
      if (editingTextareaRef.current) {
        editingTextareaRef.current.focus();
        // Move cursor to end
        editingTextareaRef.current.setSelectionRange(
          editingTextareaRef.current.value.length,
          editingTextareaRef.current.value.length
        );
      }
    }, 100);
  };

  const handleDelete = async (lessonId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) {
      return;
    }
    
    try {
      await lessonNotesApi.deleteLessonNote(lessonId);
      toast.success('Đã xóa ghi chú');
      loadNotes();
    } catch (error: any) {
      toast.error('Không thể xóa ghi chú');
    }
  };

  const handleSaveEdit = async (lessonId: number) => {
    try {
      await lessonNotesApi.upsertLessonNote(lessonId, editingNote);
      toast.success('Đã cập nhật ghi chú');
      setSelectedNote(null);
      loadNotes();
    } catch (error: any) {
      toast.error('Không thể cập nhật ghi chú');
    }
  };

  // Group notes by chapter when filter is "all-chapters"
  const getNotesGroupedByChapter = (): Array<{ chapter: ChapterInfo; notes: CourseNotesResponse['notes'] }> | null => {
    if (filter !== 'all-chapters' || chapters.length === 0) {
      return null;
    }

    // Create a map from lessonId to chapter
    const lessonToChapterMap = new Map<number, ChapterInfo>();
    chapters.forEach(chapter => {
      chapter.lessonIds.forEach(lessonId => {
        lessonToChapterMap.set(lessonId, chapter);
      });
    });

    // Group notes by chapter
    const grouped: Map<number, { chapter: ChapterInfo; notes: CourseNotesResponse['notes'] }> = new Map();
    
    notes.forEach(note => {
      const chapter = lessonToChapterMap.get(note.lesson.id);
      if (chapter) {
        if (!grouped.has(chapter.id)) {
          grouped.set(chapter.id, { chapter, notes: [] });
        }
        grouped.get(chapter.id)!.notes.push(note);
      }
    });

    // Sort chapters by chapterOrder (if available) or by id
    return Array.from(grouped.values()).sort((a, b) => {
      // Try to find chapter order from chapters array
      const aOrder = chapters.findIndex(c => c.id === a.chapter.id);
      const bOrder = chapters.findIndex(c => c.id === b.chapter.id);
      return aOrder - bOrder;
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300"
          onClick={onClose}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          width: '800px',
          maxWidth: '90vw',
        }}
      >
        <div
          className={`h-full flex flex-col ${
            isDark ? 'bg-[#1A1A1A] border-l border-[#2D2D2D]' : 'bg-white border-l border-gray-200'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 flex items-center justify-between border-b ${
              isDark ? 'border-[#2D2D2D]' : 'border-gray-200'
            }`}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <span
              className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Ghi chú của tôi
            </span>
              <div className="flex items-center gap-2" style={{ position: 'relative', zIndex: 10 }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DarkOutlineButton size="sm" className="w-[160px] justify-between">
                    <span className="text-xs">
                      {filter === 'current-chapter' ? 'Chương hiện tại' : 'Tất cả các chương'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </DarkOutlineButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[100]">
                  <DropdownMenuItem
                    onClick={() => setFilter('current-chapter')}
                    className={filter === 'current-chapter' ? 'bg-accent' : ''}
                  >
                    Trong chương hiện tại
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilter('all-chapters')}
                    className={filter === 'all-chapters' ? 'bg-accent' : ''}
                  >
                    Tất cả các chương
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DarkOutlineButton size="sm" className="w-[120px] justify-between">
                    <span className="text-xs">
                      {sortOrder === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </DarkOutlineButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[100]">
                  <DropdownMenuItem
                    onClick={() => setSortOrder('newest')}
                    className={sortOrder === 'newest' ? 'bg-accent' : ''}
                  >
                    Mới nhất
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortOrder('oldest')}
                    className={sortOrder === 'oldest' ? 'bg-accent' : ''}
                  >
                    Cũ nhất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DarkOutlineButton
                size="icon"
                onClick={onClose}
                title="Đóng"
              >
                <X className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </DarkOutlineButton>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
            {filter === 'current-chapter' && currentChapterTitle && (
              <div className={`text-sm font-medium mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {currentChapterTitle}
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : notes.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <p className="text-sm">Chưa có ghi chú nào</p>
              </div>
            ) : filter === 'all-chapters' && chapters.length > 0 ? (
              // Grouped by chapter
              (() => {
                const groupedNotes = getNotesGroupedByChapter();
                if (!groupedNotes || groupedNotes.length === 0) {
                  return (
                    <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p className="text-sm">Chưa có ghi chú nào</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-6">
                    {groupedNotes.map(({ chapter, notes: chapterNotes }: { chapter: ChapterInfo; notes: CourseNotesResponse['notes'] }) => (
                      <div key={chapter.id} className="space-y-3">
                        <div className={`text-sm font-medium text-blue-500 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {chapter.title}
                        </div>
                        {chapterNotes.map((note: CourseNotesResponse['notes'][0]) => (
                          <div key={note.id} className="space-y-2">
                            <div
                              ref={(el) => {
                                if (el) {
                                  noteCardRefs.current.set(note.id, el);
                                } else {
                                  noteCardRefs.current.delete(note.id);
                                }
                              }}
                              className={`p-3 rounded-lg border ${
                                selectedNote === note.id
                                  ? isDark
                                    ? 'bg-[#1F1F1F] border-blue-500'
                                    : 'bg-gray-50 border-blue-500'
                                  : isDark
                                    ? 'bg-[#1F1F1F] border-[#2D2D2D] hover:border-[#3D3D3D]'
                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                              } transition-colors`}
                            >
                              <>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div 
                                    className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80"
                                    onClick={() => {
                                      if (onLessonSelect && !selectedNote) {
                                        onLessonSelect({
                                          id: note.lesson.id,
                                          slug: note.lesson.slug,
                                          courseId: courseId,
                                        });
                                      }
                                    }}
                                  >
                                    <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                                      isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                                    }`}
                                    >
                                      Bài {note.lesson.lessonOrder || 'N/A'}
                                    </span>
                                    <span
                                    className={`text-xs truncate ${
                                      isDark ? 'text-blue-300' : 'text-blue-600'
                                    }`}
                                  >
                                    {note.lesson.title}
                                  </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DarkOutlineButton
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => {
                                        if (selectedNote === note.id) {
                                          // If already editing, cancel edit (like Hủy button)
                                          setSelectedNote(null);
                                          setEditingNote('');
                                        } else {
                                          // Start editing
                                          handleEdit(note);
                                        }
                                      }}
                                      title={selectedNote === note.id ? 'Hủy' : 'Chỉnh sửa'}
                                    >
                                      <Pencil className={`h-3 w-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                    </DarkOutlineButton>
                                    <DarkOutlineButton
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleDelete(note.lesson.id)}
                                      title="Xóa"
                                    >
                                      <Trash2 className={`h-3 w-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                    </DarkOutlineButton>
                                  </div>
                                </div>
                                {selectedNote === note.id ? (
                                  // Edit mode - textarea styled like text
                                  <textarea
                                    ref={selectedNote === note.id ? editingTextareaRef : null}
                                    value={editingNote}
                                    onChange={(e) => setEditingNote(e.target.value)}
                                    spellCheck={false}
                                    className={`w-full text-sm whitespace-pre-wrap resize-none border-none bg-transparent focus:outline-none focus:ring-0 p-0 ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}
                                    rows={Math.max(3, editingNote.split('\n').length)}
                                  />
                                ) : (
                                  // View mode
                                  <p
                                    className={`text-sm whitespace-pre-wrap ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}
                                  >
                                    {note.content}
                                  </p>
                                )}
                              </>
                            </div>
                            {selectedNote === note.id && (
                              // Hủy and Lưu buttons below the note card
                              <div className="flex items-center gap-2">
                                <DarkOutlineButton
                                  size="sm"
                                  onClick={() => {
                                    setSelectedNote(null);
                                    setEditingNote('');
                                  }}
                                >
                                  Hủy
                                </DarkOutlineButton>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(note.lesson.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Lưu
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              // Not grouped (current chapter or no chapters)
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="space-y-2">
                    <div
                      ref={(el) => {
                        if (el) {
                          noteCardRefs.current.set(note.id, el);
                        } else {
                          noteCardRefs.current.delete(note.id);
                        }
                      }}
                      className={`p-3 rounded-lg border ${
                        selectedNote === note.id
                          ? isDark
                            ? 'bg-[#1F1F1F] border-blue-500'
                            : 'bg-gray-50 border-blue-500'
                          : isDark
                            ? 'bg-[#1F1F1F] border-[#2D2D2D] hover:border-[#3D3D3D]'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      } transition-colors`}
                    >
                      <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div 
                            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80"
                            onClick={() => {
                              if (onLessonSelect && !selectedNote) {
                                onLessonSelect({
                                  id: note.lesson.id,
                                  slug: note.lesson.slug,
                                  courseId: courseId,
                                });
                              }
                            }}
                          >
                            <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                                      isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                                    }`}
                            >
                              Bài {note.lesson.lessonOrder || 'N/A'}
                            </span>
                            <span
                                    className={`text-xs truncate ${
                                      isDark ? 'text-blue-300' : 'text-blue-600'
                                    }`}
                                  >
                                    {note.lesson.title}
                                  </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DarkOutlineButton
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                if (selectedNote === note.id) {
                                  // If already editing, cancel edit (like Hủy button)
                                  setSelectedNote(null);
                                  setEditingNote('');
                                } else {
                                  // Start editing
                                  handleEdit(note);
                                }
                              }}
                              title={selectedNote === note.id ? 'Hủy' : 'Chỉnh sửa'}
                            >
                              <Pencil className={`h-3 w-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                            </DarkOutlineButton>
                            <DarkOutlineButton
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDelete(note.lesson.id)}
                              title="Xóa"
                            >
                              <Trash2 className={`h-3 w-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                            </DarkOutlineButton>
                          </div>
                        </div>
                        {selectedNote === note.id ? (
                          // Edit mode - textarea styled like text
                          <textarea
                            ref={selectedNote === note.id ? editingTextareaRef : null}
                            value={editingNote}
                            onChange={(e) => setEditingNote(e.target.value)}
                            spellCheck={false}
                            className={`w-full text-sm whitespace-pre-wrap resize-none border-none bg-transparent focus:outline-none focus:ring-0 p-0 ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}
                            rows={Math.max(3, editingNote.split('\n').length)}
                          />
                        ) : (
                          // View mode
                          <p
                            className={`text-sm whitespace-pre-wrap ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}
                          >
                            {note.content}
                          </p>
                        )}
                      </>
                    </div>
                    {selectedNote === note.id && (
                      // Hủy and Lưu buttons below the note card
                      <div className="flex items-center gap-2">
                        <DarkOutlineButton
                          size="sm"
                          onClick={() => {
                            setSelectedNote(null);
                            setEditingNote('');
                          }}
                        >
                          Hủy
                        </DarkOutlineButton>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(note.lesson.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Lưu
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Hủy and Lưu buttons when editing */}
          {selectedNote !== null && (() => {
            // Find the note being edited (could be in notes or in grouped notes)
            let editingNoteData: CourseNotesResponse['notes'][0] | null = null;
            
            // First try to find in notes array
            editingNoteData = notes.find(n => n.id === selectedNote) || null;
            
            // If not found and filter is all-chapters, search in grouped notes
            if (!editingNoteData && filter === 'all-chapters' && chapters.length > 0) {
              const groupedNotes = getNotesGroupedByChapter();
              if (groupedNotes) {
                for (const { notes: chapterNotes } of groupedNotes) {
                  const found = chapterNotes.find(n => n.id === selectedNote);
                  if (found) {
                    editingNoteData = found;
                    break;
                  }
                }
              }
            }
            
            if (!editingNoteData) return null;
            
            return (
              <div
                className={`px-4 py-3 border-t flex items-center gap-2 ${
                  isDark ? 'border-[#2D2D2D] bg-[#1F1F1F]' : 'border-gray-200 bg-white'
                }`}
              >
                <DarkOutlineButton
                  size="sm"
                  onClick={() => {
                    setSelectedNote(null);
                    setEditingNote('');
                  }}
                >
                  Hủy
                </DarkOutlineButton>
                <Button
                  size="sm"
                  onClick={() => {
                    handleSaveEdit(editingNoteData!.lesson.id);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Lưu
                </Button>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}

