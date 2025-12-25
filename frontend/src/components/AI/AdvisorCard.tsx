// src/components/AI/AdvisorCard.tsx
import { useState } from 'react';
import { Minimize2, X, Bot } from 'lucide-react';
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
        <div className="fixed bottom-6 right-6 z-40">
          {/* Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" style={{ width: '64px', height: '64px' }}></div>
         
          
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="relative h-16 w-16 rounded-full shadow-2xl shadow-blue-500/50 bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 transition-all duration-300 hover:scale-110 hover:shadow-blue-400/70 border-2 border-purple-400/30"
          >
            <span className="text-2xl">🤖</span>
          </Button>
        </div>
      )}

      {/* Floating Window - Bottom Right */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-blue-500/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 flex items-center justify-between flex-shrink-0 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">Trợ lý AI</h3>
                <p className="text-blue-100 text-xs">Luôn sẵn sàng hỗ trợ</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20 hover:text-white"
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
        <div className="fixed bottom-6 right-6 z-50">
          {/* Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" style={{ width: '64px', height: '64px' }}></div>
          
          <Button
            size="lg"
            className="relative h-16 w-16 rounded-full shadow-2xl shadow-blue-500/50 bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 transition-all duration-300 hover:scale-110 hover:shadow-blue-400/70 border-2 border-purple-400/30"
            onClick={() => setIsMinimized(false)}
            title="Trợ lý AI"
          >
            <span className="text-2xl">🤖</span>
          </Button>
        </div>
      )}

      {/* Close Confirmation Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Đóng cuộc trò chuyện?</CardTitle>
              <CardDescription>
                Bạn chắc chắn muốn đóng cuộc trò chuyện này? Lịch sử chat sẽ được xóa.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowCloseDialog(false)}
              >
                Hủy
              </Button>
              <Button 
                className="bg-red-500 hover:bg-red-600"
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
