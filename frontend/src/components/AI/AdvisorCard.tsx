// src/components/AI/AdvisorCard.tsx
import { useState } from 'react';
import { Minimize2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { CourseAdvisor } from './CourseAdvisor';

export function AdvisorCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  return (
    <>
      {/* Floating Button - Fixed position at bottom right */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40">
          {/* Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" style={{ width: '64px', height: '64px' }}></div>
         
          
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="relative h-14 w-14 md:h-16 md:w-16 rounded-full md:shadow-2xl md:shadow-blue-500/50 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-110 md:hover:shadow-blue-400/70 border-3 border-white/40 shadow-inner"
          >
            <span className="text-xl md:text-2xl">🤖</span>
          </Button>
        </div>
      )}

      {/* Floating Window - Bottom Right */}
      {isOpen && (
        <div className={`fixed z-50 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-blue-500/30 transition-all duration-300 ${
          isMinimized ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'
        } ${
          // Mobile: full width với margin nhỏ, height phù hợp
          'bottom-0 left-0 right-0 w-full h-[85vh] max-h-[600px] rounded-t-xl rounded-b-none md:bottom-6 md:left-auto md:right-6 md:w-96 md:h-[600px] md:rounded-xl'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-3 md:p-4 flex items-center justify-between flex-shrink-0 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">Trợ lý AI</h3>
                <p className="text-blue-100 text-xs hidden md:block">Luôn sẵn sàng hỗ trợ</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20 hover:text-white hidden md:inline-flex"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20 hover:text-white"
                onClick={() => setShowCloseDialog(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <CourseAdvisor onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}

      {/* Minimized Circle Button */}
      {isOpen && isMinimized && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
          {/* Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" style={{ width: '64px', height: '64px' }}></div>
          
          <Button
            size="lg"
            className="relative h-14 w-14 md:h-16 md:w-16 rounded-full md:shadow-2xl md:shadow-blue-500/50 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-110 md:hover:shadow-blue-400/70 border-3 border-white/40 shadow-inner"
            onClick={() => setIsMinimized(false)}
            title="Trợ lý AI"
          >
            <span className="text-xl md:text-2xl">🤖</span>
          </Button>
        </div>
      )}

      {/* Close Confirmation Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Đóng cuộc trò chuyện?</CardTitle>
              <CardDescription>
                Bạn chắc chắn muốn đóng cuộc trò chuyện này? Lịch sử chat sẽ được xóa.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowCloseDialog(false)}
                className="w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button 
                className="bg-red-500 hover:bg-red-600 w-full sm:w-auto"
                onClick={() => {
                  setIsOpen(false);
                  setShowCloseDialog(false);
                }}
              >
                Xóa
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
