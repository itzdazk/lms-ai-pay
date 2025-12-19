"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Target,
  Flame,
  Star,
  BookOpen,
  CheckCircle,
  Calendar,
  Award
} from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { ProgressBadge } from "@/lib/progressTypes";

interface ProgressBadgesProps {
  badges: ProgressBadge[];
  className?: string;
  compact?: boolean;
}

const badgeIcons = {
  completion: CheckCircle,
  milestone: Target,
  streak: Flame,
  achievement: Trophy,
};

const badgeColors = {
  completion: "bg-green-100 text-green-800 border-green-200",
  milestone: "bg-blue-100 text-blue-800 border-blue-200",
  streak: "bg-orange-100 text-orange-800 border-orange-200",
  achievement: "bg-purple-100 text-purple-800 border-purple-200",
};

export function ProgressBadges({
  badges,
  className,
  compact = false
}: ProgressBadgesProps) {
  if (badges.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Chưa có huy hiệu nào</p>
          <p className="text-sm text-muted-foreground">Hoàn thành các mục tiêu để nhận huy hiệu!</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {badges.slice(0, 6).map((badge) => {
          const IconComponent = badgeIcons[badge.type];
          return (
            <Badge
              key={badge.id}
              variant="outline"
              className={cn(
                "flex items-center gap-1",
                badgeColors[badge.type]
              )}
            >
              <IconComponent className="h-3 w-3" />
              <span className="text-xs">{badge.name}</span>
            </Badge>
          );
        })}
        {badges.length > 6 && (
          <Badge variant="outline" className="text-xs">
            +{badges.length - 6} huy hiệu khác
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Huy hiệu thành tích
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const IconComponent = badgeIcons[badge.type];
            return (
              <div
                key={badge.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  badgeColors[badge.type]
                )}
              >
                <IconComponent className="h-8 w-8" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{badge.name}</h4>
                  <p className="text-xs opacity-80">{badge.description}</p>
                  <p className="text-xs mt-1 opacity-60">
                    {badge.earnedAt.toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Component for individual badge display
interface BadgeDisplayProps {
  badge: ProgressBadge;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export function BadgeDisplay({
  badge,
  size = "md",
  showTooltip = true,
  className
}: BadgeDisplayProps) {
  const IconComponent = badgeIcons[badge.type];

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        className
      )}
      title={showTooltip ? badge.description : undefined}
    >
      <div
        className={cn(
          "rounded-full p-2",
          badgeColors[badge.type]
        )}
      >
        <IconComponent className={sizeClasses[size]} />
      </div>
      <div className="flex-1">
        <div className={cn("font-semibold", textSizeClasses[size])}>
          {badge.name}
        </div>
        {size !== "sm" && (
          <div className="text-xs text-muted-foreground">
            {badge.earnedAt.toLocaleDateString('vi-VN')}
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to manage badges
export function useProgressBadges() {
  const [badges, setBadges] = React.useState<ProgressBadge[]>([]);

  const fetchBadges = React.useCallback(async () => {
    try {
      // TODO: Implement API call
      // const response = await progressApi.getUserBadges();
      // setBadges(response.data);

      // Mock data
      setBadges([
        {
          id: "badge-1",
          name: "Bài học đầu tiên",
          description: "Hoàn thành bài học đầu tiên của bạn",
          icon: "check-circle",
          earnedAt: new Date("2024-12-15"),
          type: "completion",
        },
        {
          id: "badge-2",
          name: "Tuần học đầu tiên",
          description: "Hoàn thành 7 ngày học liên tiếp",
          icon: "flame",
          earnedAt: new Date("2024-12-20"),
          type: "streak",
        },
        {
          id: "badge-3",
          name: "Khóa học đầu tiên",
          description: "Hoàn thành khóa học đầu tiên",
          icon: "trophy",
          earnedAt: new Date("2024-12-25"),
          type: "achievement",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch badges:", error);
    }
  }, []);

  React.useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return {
    badges,
    fetchBadges,
  };
}
