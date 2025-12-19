"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Play, Clock } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { ResumePosition } from "@/lib/progressTypes";

interface ResumeIndicatorProps {
  lessonId: string;
  courseTitle?: string;
  lessonTitle?: string;
  onResume?: (position: ResumePosition) => void;
  className?: string;
  compact?: boolean;
}

export function ResumeIndicator({
  lessonId,
  courseTitle,
  lessonTitle,
  onResume,
  className,
  compact = false,
}: ResumeIndicatorProps) {
  const [resumePosition, setResumePosition] = React.useState<ResumePosition | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchResumePosition();
  }, [lessonId]);

  const fetchResumePosition = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call
      // const response = await progressApi.getResumePosition(lessonId);
      // setResumePosition(response.data);

      // Mock data
      setResumePosition({
        lessonId,
        currentTime: 245, // 4:05
        progress: 40.8,
        lastWatchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      });
    } catch (error) {
      console.error("Failed to fetch resume position:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = () => {
    if (resumePosition && onResume) {
      onResume(resumePosition);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  if (!resumePosition) {
    return null; // No resume position available
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <RotateCcw className="h-4 w-4 text-blue-500" />
        <div className="flex-1">
          <div className="text-sm font-medium">
            Tiếp tục từ {formatTime(resumePosition.currentTime)}
          </div>
          <div className="text-xs text-muted-foreground">
            {getTimeAgo(resumePosition.lastWatchedAt)}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResume}
          className="h-8 px-3"
        >
          <Play className="h-3 w-3 mr-1" />
          Tiếp tục
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RotateCcw className="h-5 w-5 text-blue-600" />
            </div>

            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">
                Tiếp tục học
              </h4>

              {courseTitle && (
                <p className="text-sm text-muted-foreground mb-1">
                  {courseTitle}
                </p>
              )}

              {lessonTitle && (
                <p className="text-sm font-medium mb-2">
                  {lessonTitle}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(resumePosition.currentTime)}</span>
                </div>

                <Badge variant="secondary" className="text-xs">
                  {Math.round(resumePosition.progress)}% hoàn thành
                </Badge>

                <span className="text-muted-foreground">
                  {getTimeAgo(resumePosition.lastWatchedAt)}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleResume}
            className="ml-4"
          >
            <Play className="h-4 w-4 mr-2" />
            Tiếp tục học
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for managing resume functionality
export function useResumePosition(lessonId: string) {
  const [resumePosition, setResumePosition] = React.useState<ResumePosition | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchResumePosition = React.useCallback(async () => {
    if (!lessonId) return;

    try {
      setLoading(true);
      // TODO: Implement API call
      // const response = await progressApi.getResumePosition(lessonId);
      // setResumePosition(response.data);

      // Mock data
      setResumePosition({
        lessonId,
        currentTime: Math.floor(Math.random() * 600), // Random time up to 10 minutes
        progress: Math.floor(Math.random() * 100),
        lastWatchedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
      });
    } catch (error) {
      console.error("Failed to fetch resume position:", error);
      setResumePosition(null);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const saveResumePosition = React.useCallback(async (
    currentTime: number,
    duration: number
  ) => {
    if (!lessonId) return;

    try {
      const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

      // TODO: Implement API call to save resume position
      // await progressApi.updateLessonProgress(lessonId, {
      //   currentTime,
      //   duration,
      //   progress,
      // });

      setResumePosition({
        lessonId,
        currentTime,
        progress,
        lastWatchedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to save resume position:", error);
    }
  }, [lessonId]);

  React.useEffect(() => {
    fetchResumePosition();
  }, [fetchResumePosition]);

  return {
    resumePosition,
    loading,
    fetchResumePosition,
    saveResumePosition,
  };
}
