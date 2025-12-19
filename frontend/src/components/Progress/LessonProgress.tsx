"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "./ProgressBar";
import { CheckCircle, Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { toast } from "sonner";
import type { LessonProgress, ProgressUpdateRequest } from "@/lib/progressTypes";

interface LessonProgressProps {
  lessonId: string;
  courseId: string;
  videoDuration?: number; // seconds
  onProgressUpdate?: (progress: LessonProgress) => void;
  onComplete?: (lessonId: string) => void;
  className?: string;
  autoSave?: boolean;
  showResumeButton?: boolean;
}

export function LessonProgress({
  lessonId,
  courseId,
  videoDuration = 0,
  onProgressUpdate,
  onComplete,
  className,
  autoSave = true,
  showResumeButton = true,
}: LessonProgressProps) {
  const [progress, setProgress] = React.useState<LessonProgress | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Auto-save timer
  const saveTimerRef = React.useRef<NodeJS.Timeout>();
  const lastSavedTimeRef = React.useRef<number>(0);

  React.useEffect(() => {
    fetchLessonProgress();
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [lessonId]);

  React.useEffect(() => {
    if (autoSave && currentTime > 0 && Math.abs(currentTime - lastSavedTimeRef.current) > 10) {
      // Auto-save every 10 seconds of progress change
      debouncedSaveProgress(currentTime);
    }
  }, [currentTime, autoSave]);

  const fetchLessonProgress = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call
      // const response = await progressApi.getLessonProgress(lessonId);
      // setProgress(response.data);

      // Mock data for now
      setProgress({
        lessonId,
        courseId,
        userId: "user-1",
        status: "in_progress",
        progress: 35,
        currentTime: 210, // 3:30
        duration: videoDuration || 600, // 10 minutes
        lastWatchedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to fetch lesson progress:", error);
      toast.error("Không thể tải tiến độ bài học");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSaveProgress = React.useCallback(
    (time: number) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        saveProgress(time);
      }, 2000); // Save after 2 seconds of inactivity
    },
    []
  );

  const saveProgress = async (time: number) => {
    if (!progress || updating) return;

    try {
      setUpdating(true);
      const progressPercent = videoDuration > 0 ? (time / videoDuration) * 100 : 0;

      const updateData: ProgressUpdateRequest = {
        lessonId,
        currentTime: time,
        duration: videoDuration,
        progress: progressPercent,
      };

      // TODO: Implement API call
      // const response = await progressApi.updateLessonProgress(lessonId, updateData);

      // Mock update
      const updatedProgress: LessonProgress = {
        ...progress,
        currentTime: time,
        progress: progressPercent,
        lastWatchedAt: new Date(),
        updatedAt: new Date(),
      };

      setProgress(updatedProgress);
      lastSavedTimeRef.current = time;
      onProgressUpdate?.(updatedProgress);

      // Auto-complete if progress > 90%
      if (progressPercent >= 90 && progress.status !== 'completed') {
        await completeLesson();
      }
    } catch (error) {
      console.error("Failed to save progress:", error);
      toast.error("Không thể lưu tiến độ");
    } finally {
      setUpdating(false);
    }
  };

  const completeLesson = async () => {
    if (!progress) return;

    try {
      setUpdating(true);
      // TODO: Implement API call
      // const response = await progressApi.completeLesson(lessonId, { completed: true });

      // Mock completion
      const completedProgress: LessonProgress = {
        ...progress,
        status: 'completed',
        progress: 100,
        currentTime: videoDuration,
        completedAt: new Date(),
        updatedAt: new Date(),
      };

      setProgress(completedProgress);
      onProgressUpdate?.(completedProgress);
      onComplete?.(lessonId);

      toast.success("Chúc mừng! Bạn đã hoàn thành bài học này!");
    } catch (error) {
      console.error("Failed to complete lesson:", error);
      toast.error("Không thể đánh dấu hoàn thành");
    } finally {
      setUpdating(false);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlayPause = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const handleResume = () => {
    if (progress?.currentTime) {
      // This would trigger the video player to seek to the saved position
      toast.info(`Tiếp tục từ ${formatTime(progress.currentTime)}`);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            Không có dữ liệu tiến độ
          </div>
        </CardContent>
      </Card>
    );
  }

  const isCompleted = progress.status === 'completed';
  const progressPercent = Math.min(100, Math.max(0, progress.progress));

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4 text-blue-500" />
            ) : (
              <Play className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm font-medium">
              {isCompleted ? "Hoàn thành" :
               isPlaying ? "Đang xem" : "Tạm dừng"}
            </span>
            {updating && (
              <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showResumeButton && progress.currentTime > 0 && !isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResume}
                className="h-7 px-2"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Tiếp tục
              </Button>
            )}

            {!isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={completeLesson}
                disabled={updating}
                className="h-7 px-2"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Hoàn thành
              </Button>
            )}

            {isCompleted && (
              <Badge variant="secondary" className="text-xs">
                ✓ Hoàn thành
              </Badge>
            )}
          </div>
        </div>

        <ProgressBar
          value={progressPercent}
          showPercentage
          size="sm"
          color={isCompleted ? "success" : "primary"}
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime || progress.currentTime)}</span>
          <span>{formatTime(progress.duration)}</span>
        </div>

        {progress.lastWatchedAt && (
          <div className="text-xs text-muted-foreground">
            Lần xem cuối: {progress.lastWatchedAt.toLocaleDateString('vi-VN')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook to use lesson progress
export function useLessonProgress(lessonId: string) {
  const [progress, setProgress] = React.useState<LessonProgress | null>(null);

  const updateProgress = React.useCallback(async (
    currentTime: number,
    duration: number
  ) => {
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    // TODO: Implement API call
    console.log(`Updating progress for lesson ${lessonId}: ${progressPercent}%`);

    setProgress(prev => prev ? {
      ...prev,
      currentTime,
      duration,
      progress: progressPercent,
      updatedAt: new Date(),
    } : null);
  }, [lessonId]);

  return {
    progress,
    updateProgress,
  };
}
