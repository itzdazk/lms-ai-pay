import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { DarkOutlineButton } from '../ui/buttons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ChevronRight } from 'lucide-react';

export interface SubtitleSettings {
  fontSize: number; // 14, 16, 18, 20, 24, 28
  color: string; // hex color
  textOpacity: number; // 0, 25, 50, 75, 100
  fontFamily: string;
  textEffect: 'none' | 'stroke' | 'shadow'; // không viền, bo viền, đổ bóng
  backgroundColor: string; // hex color
  backgroundOpacity: number; // 0, 25, 50, 75, 100
}

export const DEFAULT_SETTINGS: SubtitleSettings = {
  fontSize: 20,
  color: '#FFFFFF',
  textOpacity: 100,
  fontFamily: 'Arial',
  textEffect: 'stroke',
  backgroundColor: '#000000',
  backgroundOpacity: 0,
};

// Màu có sẵn
const PRESET_COLORS = [
  { name: 'Trắng', value: '#FFFFFF' },
  { name: 'Vàng', value: '#FFFF00' },
  { name: 'Xanh lá', value: '#00FF00' },
  { name: 'Xanh dương', value: '#00BFFF' },
  { name: 'Đỏ', value: '#FF0000' },
  { name: 'Cam', value: '#FFA500' },
  { name: 'Đen', value: '#000000' },
];

// Cỡ chữ có sẵn
const PRESET_FONT_SIZES = [14, 16, 18, 20, 24, 28];

// Font chữ có sẵn (khoảng 10)
const PRESET_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Georgia',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS',
  'Tahoma',
];

// Độ trong suốt
const OPACITY_OPTIONS = [0, 25, 50, 75, 100];

// Text effect options
const TEXT_EFFECT_OPTIONS = [
  { value: 'none', label: 'Không viền' },
  { value: 'stroke', label: 'Bo viền' },
  { value: 'shadow', label: 'Đổ bóng' },
];

interface SubtitleSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SubtitleSettings;
  onSettingsChange: (settings: SubtitleSettings) => void;
  container?: HTMLElement | null;
}

export function SubtitleSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  container,
}: SubtitleSettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<SubtitleSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, open]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  const getColorName = (value: string) => {
    return PRESET_COLORS.find((c) => c.value === value)?.name || 'Trắng';
  };

  const getTextEffectLabel = (value: string) => {
    return TEXT_EFFECT_OPTIONS.find((e) => e.value === value)?.label || 'Bo viền';
  };

  const renderContent = () => (
    <>
      <div className="px-4 pb-4 space-y-0">
        {/* Màu chữ */}
        <SettingItem
          label="Màu chữ"
          value={
            <div className="flex items-center gap-1.5">
              <div
                className="w-3.5 h-3.5 rounded-full border border-[#2D2D2D]"
                style={{ backgroundColor: localSettings.color }}
              />
              <span className="text-gray-300 text-xs">{getColorName(localSettings.color)}</span>
            </div>
          }
          onSelect={() => {}}
        >
          {PRESET_COLORS.map((color) => (
            <DropdownMenuItem
              key={color.value}
              onClick={(e) => {
                e.stopPropagation();
                setLocalSettings({ ...localSettings, color: color.value });
              }}
              className="text-white hover:bg-[#2D2D2D] cursor-pointer flex items-center gap-1.5 text-xs py-1.5"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-[#2D2D2D]"
                style={{ backgroundColor: color.value }}
              />
              <span>{color.name}</span>
            </DropdownMenuItem>
          ))}
        </SettingItem>

        {/* Cỡ chữ */}
        <SettingItem
          label="Cỡ chữ"
          value={<span className="text-gray-300 text-xs">{localSettings.fontSize}pt</span>}
          onSelect={() => {}}
        >
          {PRESET_FONT_SIZES.map((size) => (
            <DropdownMenuItem
              key={size}
              onClick={(e) => {
                e.stopPropagation();
                setLocalSettings({ ...localSettings, fontSize: size });
              }}
              className="text-white hover:bg-[#2D2D2D] cursor-pointer text-xs py-1.5"
            >
              {size}pt
            </DropdownMenuItem>
          ))}
        </SettingItem>

        {/* Độ trong */}
        <SettingItem
          label="Độ trong"
          value={<span className="text-gray-300 text-xs">{localSettings.textOpacity}%</span>}
          onSelect={() => {}}
        >
          {OPACITY_OPTIONS.map((opacity) => (
            <DropdownMenuItem
              key={opacity}
              onClick={(e) => {
                e.stopPropagation();
                setLocalSettings({ ...localSettings, textOpacity: opacity });
              }}
              className="text-white hover:bg-[#2D2D2D] cursor-pointer text-xs py-1.5"
            >
              {opacity}%
            </DropdownMenuItem>
          ))}
        </SettingItem>

        {/* Font chữ */}
        <SettingItem
          label="Font chữ"
          value={<span className="text-gray-300 text-xs">{localSettings.fontFamily}</span>}
          onSelect={() => {}}
        >
          {PRESET_FONTS.map((font) => (
            <DropdownMenuItem
              key={font}
              onClick={(e) => {
                e.stopPropagation();
                setLocalSettings({ ...localSettings, fontFamily: font });
              }}
              className="text-white hover:bg-[#2D2D2D] cursor-pointer text-xs py-1.5"
            >
              {font}
            </DropdownMenuItem>
          ))}
        </SettingItem>

        {/* Viền chữ */}
        <SettingItem
          label="Viền chữ"
          value={<span className="text-gray-300 text-xs">{getTextEffectLabel(localSettings.textEffect)}</span>}
          onSelect={() => {}}
        >
          {TEXT_EFFECT_OPTIONS.map((effect) => (
            <DropdownMenuItem
              key={effect.value}
              onClick={(e) => {
                e.stopPropagation();
                setLocalSettings({ ...localSettings, textEffect: effect.value as 'none' | 'stroke' | 'shadow' });
              }}
              className="text-white hover:bg-[#2D2D2D] cursor-pointer text-xs py-1.5"
            >
              {effect.label}
            </DropdownMenuItem>
          ))}
        </SettingItem>

        {/* Màu nền */}
        <SettingItem
          label="Màu nền"
          value={
            <div className="flex items-center gap-1.5">
              <div
                className="w-3.5 h-3.5 rounded-full border border-[#2D2D2D]"
                style={{ backgroundColor: localSettings.backgroundColor }}
              />
              <span className="text-gray-300 text-xs">{getColorName(localSettings.backgroundColor)}</span>
            </div>
          }
          onSelect={() => {}}
        >
          {PRESET_COLORS.map((color) => (
            <DropdownMenuItem
              key={color.value}
              onClick={(e) => {
                e.stopPropagation();
                setLocalSettings({ ...localSettings, backgroundColor: color.value });
              }}
              className="text-white hover:bg-[#2D2D2D] cursor-pointer flex items-center gap-1.5 text-xs py-1.5"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-[#2D2D2D]"
                style={{ backgroundColor: color.value }}
              />
              <span>{color.name}</span>
            </DropdownMenuItem>
          ))}
        </SettingItem>

        {/* Độ trong Nền */}
        <SettingItem
          label="Độ trong Nền"
          value={<span className="text-gray-300 text-xs">{localSettings.backgroundOpacity}%</span>}
          onSelect={() => {}}
        >
          {OPACITY_OPTIONS.map((opacity) => (
            <DropdownMenuItem
              key={opacity}
              onClick={(e) => {
                e.stopPropagation();
                setLocalSettings({ ...localSettings, backgroundOpacity: opacity });
              }}
              className="text-white hover:bg-[#2D2D2D] cursor-pointer text-xs py-1.5"
            >
              {opacity}%
            </DropdownMenuItem>
          ))}
        </SettingItem>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-[#2D2D2D]">
        <DarkOutlineButton
          onClick={handleReset}
          size="sm"
          className="text-xs h-7 px-3"
        >
          Mặc định
        </DarkOutlineButton>
        <div className="flex gap-1.5">
          <DarkOutlineButton
            onClick={() => onOpenChange(false)}
            size="sm"
            className="text-xs h-7 px-3"
          >
            Hủy
          </DarkOutlineButton>
          <Button
            onClick={handleSave}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3"
          >
            Lưu
          </Button>
        </div>
      </div>
    </>
  );

  const SettingItem = ({
    label,
    value,
    onSelect,
    children,
  }: {
    label: string;
    value: string | React.ReactNode;
    onSelect: () => void;
    children: React.ReactNode;
  }) => (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full flex items-center justify-between py-2 px-0 hover:bg-[#2D2D2D] transition-colors rounded relative z-[105]"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <span className="text-white text-xs">{label}</span>
          <div className="flex items-center gap-1.5">
            {value}
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[#1A1A1A] border-[#2D2D2D] text-white min-w-[160px] z-[110]"
        container={container || undefined}
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking inside the dialog or on dialog backdrop
          const target = e.target as HTMLElement;
          const dialogElement = target.closest('[role="dialog"]') || 
                                target.closest('.bg-black\\/50') ||
                                target.closest('.bg-\\[\\#1A1A1A\\]');
          if (dialogElement) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing dropdown when pressing escape (let dialog handle it)
          e.preventDefault();
        }}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Always use the same UI (fullscreen style) regardless of container
  if (open) {
    const targetContainer = container || document.body;
    return createPortal(
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" 
        onClick={(e) => {
          // Only close if clicking directly on backdrop, not on dropdown menus
          const target = e.target as HTMLElement;
          if (target.classList.contains('bg-black') || target.classList.contains('bg-black/50')) {
            onOpenChange(false);
          }
        }}
        onPointerDown={(e) => {
          // Prevent closing when clicking on dropdown menus
          const target = e.target as HTMLElement;
          if (target.closest('[data-slot="dropdown-menu-content"]') || 
              target.closest('[data-radix-portal]')) {
            e.stopPropagation();
          }
        }}
      >
        <div 
          className="bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-xs w-full rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="px-4 pt-4 pb-3 border-b border-[#2D2D2D] relative">
            <h2 className="text-white text-base font-semibold">Cài đặt phụ đề</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-[#2D2D2D]"
            >
              ✕
            </button>
          </div>
          {renderContent()}
        </div>
      </div>,
      targetContainer
    );
  }

  return null;
}

