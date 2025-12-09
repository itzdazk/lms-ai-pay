import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  DarkOutlineTable,
  DarkOutlineTableBody,
  DarkOutlineTableCell,
  DarkOutlineTableHead,
  DarkOutlineTableHeader,
  DarkOutlineTableRow,
} from '../ui/dark-outline-table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { MoreVertical, Edit, Trash2, Shield, UserCheck, UserX } from 'lucide-react';
import type { User } from '../../lib/api/types';
import { formatDate } from '../../lib/utils';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onChangeRole: (user: User) => void;
  onChangeStatus: (user: User) => void;
  loading?: boolean;
  selectedRowId?: string | null;
  onRowSelect?: (userId: string) => void;
}

// Component for each user row with dropdown menu
function UserRow({
  user,
  onEdit,
  onDelete,
  onChangeRole,
  onChangeStatus,
  isSelected,
  onSelect,
}: {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onChangeRole: (user: User) => void;
  onChangeStatus: (user: User) => void;
  isSelected: boolean;
  onSelect: (userId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0, transform: 'translate(-100%, 0)' });
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleToggle = (isCurrentlySelected: boolean, e: React.MouseEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    if (isCurrentlySelected) {
      onSelect('');
    } else {
      onSelect(user.id);
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
    }
  };

  // Adjust menu position to stay within viewport
  useEffect(() => {
    if (!menuOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = menuPosition.x;
    let top = menuPosition.y;
    let transform = 'translate(-100%, 0)';
    
    if (left - menuRect.width < 0) {
      transform = 'translate(0, 0)';
      left = menuPosition.x;
    }
    
    if (left + menuRect.width > viewportWidth) {
      transform = 'translate(-100%, 0)';
      left = menuPosition.x;
      if (left - menuRect.width < 0) {
        left = viewportWidth - menuRect.width - 8;
      }
    }
    
    if (top + menuRect.height > viewportHeight) {
      top = menuPosition.y - menuRect.height;
      if (top < 0) {
        top = viewportHeight - menuRect.height - 8;
      }
    }
    
    if (top < 0) {
      top = 8;
    }
    
    setAdjustedPosition({ x: left, y: top, transform });
  }, [menuOpen, menuPosition]);

  // Close menu when clicking outside and disable scroll when menu is open
  useEffect(() => {
    if (!menuOpen) return;

    const scrollContainer = document.querySelector('main') || window;
    const savedScrollPosition = scrollContainer === window 
      ? window.scrollY || document.documentElement.scrollTop
      : (scrollContainer as HTMLElement).scrollTop;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (scrollContainer === window) {
        window.scrollTo(0, savedScrollPosition);
      } else {
        (scrollContainer as HTMLElement).scrollTop = savedScrollPosition;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Home' || e.key === 'End' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('scroll', handleScroll, { passive: false, capture: true });
    document.addEventListener('keydown', handleKeyDown, { passive: false });
    
    if (scrollContainer !== window) {
      (scrollContainer as HTMLElement).addEventListener('scroll', handleScroll, { passive: false, capture: true });
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
      if (scrollContainer !== window) {
        (scrollContainer as HTMLElement).removeEventListener('scroll', handleScroll, { capture: true });
      }
    };
  }, [menuOpen]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'INSTRUCTOR':
        return 'default';
      case 'STUDENT':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'BANNED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'INSTRUCTOR':
        return 'Giảng viên';
      case 'STUDENT':
        return 'Học viên';
      default:
        return role;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Hoạt động';
      case 'INACTIVE':
        return 'Không hoạt động';
      case 'BANNED':
        return 'Đã khóa';
      default:
        return status;
    }
  };

  return (
    <>
      <DarkOutlineTableRow 
        className="cursor-pointer"
        selected={isSelected}
        onRowToggle={handleToggle}
      >
        <DarkOutlineTableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl || user.avatar} alt={user.fullName} />
              <AvatarFallback className="bg-blue-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{user.userName}</p>
            </div>
          </div>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <span className="text-gray-900 dark:text-gray-300">{user.email}</span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <Badge variant={getRoleBadgeVariant(user.role)}>
            {getRoleLabel(user.role)}
          </Badge>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <Badge variant={getStatusBadgeVariant(user.status)}>
            {getStatusLabel(user.status)}
          </Badge>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <span className="text-gray-900 dark:text-gray-300">{formatDate(user.createdAt)}</span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <span className="text-gray-900 dark:text-gray-300">{formatDate(user.updatedAt)}</span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell className="text-right">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1F1F1F]" onClick={(e) => {
            e.stopPropagation();
            if (!isSelected) {
              onSelect(user.id);
            }
            setMenuPosition({ x: e.clientX, y: e.clientY });
            setMenuOpen(true);
          }}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DarkOutlineTableCell>
      </DarkOutlineTableRow>
      
      {menuOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[8rem] rounded-md border bg-[#1A1A1A] border-[#2D2D2D] p-1 shadow-md"
          style={{
            left: `${adjustedPosition.x}px`,
            top: `${adjustedPosition.y}px`,
            transform: adjustedPosition.transform,
          }}
        >
          <div 
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer"
            onClick={() => {
              onEdit(user);
              setMenuOpen(false);
            }}
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa
          </div>
          <div 
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer"
            onClick={() => {
              onChangeRole(user);
              setMenuOpen(false);
            }}
          >
            <Shield className="h-4 w-4" />
            Đổi vai trò
          </div>
          <div 
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer"
            onClick={() => {
              onChangeStatus(user);
              setMenuOpen(false);
            }}
          >
            {user.status === 'ACTIVE' ? (
              <UserX className="h-4 w-4" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
            {user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
          </div>
          <div
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-400 hover:bg-[#1F1F1F] cursor-pointer"
            onClick={() => {
              onDelete(user);
              setMenuOpen(false);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export function UserTable({
  users,
  onEdit,
  onDelete,
  onChangeRole,
  onChangeStatus,
  loading = false,
  selectedRowId = null,
  onRowSelect,
}: UserTableProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không có người dùng nào
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-300 dark:border-[#2D2D2D]">
      <DarkOutlineTable>
        <DarkOutlineTableHeader>
          <DarkOutlineTableRow>
            <DarkOutlineTableHead>Người dùng</DarkOutlineTableHead>
            <DarkOutlineTableHead>Email</DarkOutlineTableHead>
            <DarkOutlineTableHead>Vai trò</DarkOutlineTableHead>
            <DarkOutlineTableHead>Trạng thái</DarkOutlineTableHead>
            <DarkOutlineTableHead>Ngày tạo</DarkOutlineTableHead>
            <DarkOutlineTableHead>Cập nhật</DarkOutlineTableHead>
            <DarkOutlineTableHead className="text-right">Thao tác</DarkOutlineTableHead>
          </DarkOutlineTableRow>
        </DarkOutlineTableHeader>
        <DarkOutlineTableBody>
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onEdit={onEdit}
              onDelete={onDelete}
              onChangeRole={onChangeRole}
              onChangeStatus={onChangeStatus}
              isSelected={selectedRowId === user.id}
              onSelect={onRowSelect || (() => {})}
            />
          ))}
        </DarkOutlineTableBody>
      </DarkOutlineTable>
    </div>
  );
}

