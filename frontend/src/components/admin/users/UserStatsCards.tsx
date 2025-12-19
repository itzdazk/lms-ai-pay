import { Card, CardContent } from '../../../ui/card';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';

interface UserStats {
  total: number;
  students: number;
  instructors: number;
  admins: number;
}

interface UserStatsCardsProps {
  userStats: UserStats;
}

export function UserStatsCards({ userStats }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Tổng người dùng</p>
              <p className="text-2xl font-bold text-white">{userStats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Học viên</p>
              <p className="text-2xl font-bold text-white">{userStats.students}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Giảng viên</p>
              <p className="text-2xl font-bold text-white">{userStats.instructors}</p>
            </div>
            <UserX className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Quản trị viên</p>
              <p className="text-2xl font-bold text-white">{userStats.admins}</p>
            </div>
            <Shield className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
