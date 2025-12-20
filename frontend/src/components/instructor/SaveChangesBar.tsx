import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { Loader2, RotateCcw, AlertCircle } from 'lucide-react'

interface SaveChangesBarProps {
    hasUnsavedChanges: boolean
    submitting: boolean
    onSave: () => void
    onReset: () => void
}

export function SaveChangesBar({ hasUnsavedChanges, submitting, onSave, onReset }: SaveChangesBarProps) {
    return (
        <div className="sticky bottom-0 bg-[#1A1A1A]/95 backdrop-blur-sm border-t border-[#2D2D2D] mt-6 -mb-6 -mx-6 px-6 py-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
                {/* Change indicator - Left aligned (only when has changes) */}
                {hasUnsavedChanges && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg mr-auto">
                        <AlertCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-green-500 font-medium whitespace-nowrap">Có thay đổi chưa lưu</span>
                    </div>
                )}
                
                {/* Action Buttons - Right aligned */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                    <DarkOutlineButton
                        onClick={onReset}
                        disabled={submitting || !hasUnsavedChanges}
                        className="flex items-center gap-2 flex-shrink-0"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Hủy bỏ
                    </DarkOutlineButton>
                    <Button
                        onClick={onSave}
                        disabled={submitting || !hasUnsavedChanges}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                Lưu thay đổi
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

