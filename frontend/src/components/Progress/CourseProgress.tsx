"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "./ProgressBar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, BookOpen, Trophy } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { CourseProgress } from "@/lib/progressTypes";

interface CourseProgressProps {
  courseId: string;
  courseTitle?: string;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export function CourseProgress({
  courseId,
  courseTitle,
  className,
  showDetails = true,
  compact = false,
}: CourseProgressProps) {
  const [progress, setProgress] = React.useState<CourseProgress | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchCourseProgress();
  }, [courseId]);

  const fetchCourseProgress = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call
      // const response = await progressApi.getCourseProgress(courseId);
      // setProgress(response.data);

      // Mock data for now
      setProgress({
        courseId,
        userId: "user-1",
        totalLessons: 24,
        completedLessons: 12,
        inProgressLessons: 3,
        progress: 50,
        estimatedTimeRemaining: 240, // 4 hours
        lastActivityAt: new Date(),
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err) {
      setError("Không thể tải tiến độ khóa học");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !progress) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            {error || "Không có dữ liệu tiến độ"}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{courseTitle || "Khóa học"}</span>
          <span className="text-muted-foreground">{progress.progress}%</span>
        </div>
        <ProgressBar value={progress.progress} size="sm" />
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Tiến độ khóa học
          {progress.progress === 100 && (
            <Badge variant="secondary" className="ml-auto">
              <Trophy className="h-3 w-3 mr-1" />
              Hoàn thành
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {courseTitle && (
          <h3 className="font-semibold text-base">{courseTitle}</h3>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tiến độ tổng thể</span>
            <span className="font-medium">{progress.progress}%</span>
          </div>
          <ProgressBar value={progress.progress} showPercentage />
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">{progress.completedLessons}</div>
                <div className="text-xs text-muted-foreground">Hoàn thành</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">{progress.inProgressLessons}</div>
                <div className="text-xs text-muted-foreground">Đang học</div>
              </div>
            </div>

            <div className="flex items-center gap-2 col-span-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-sm font-medium">
                  {formatTime(progress.estimatedTimeRemaining)}
                </div>
                <div className="text-xs text-muted-foreground">Thời gian còn lại</div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Cập nhật lần cuối: {progress.lastActivityAt.toLocaleDateString('vi-VN')}
        </div>
      </CardContent>
    </Card>
  );
}
