import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as React from 'react';
import { Button } from '../ui/button';
import { DarkOutlineButton } from '../ui/buttons';
import { Check } from 'lucide-react';

interface PlaybackRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRate: number;
  onRateChange: (rate: number) => void;
  container?: HTMLElement | null;
}

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export function PlaybackRateDialog({
  open,
  onOpenChange,
  currentRate,
  onRateChange,
  container,
}: PlaybackRateDialogProps) {
  const [selectedRate, setSelectedRate] = useState(currentRate);

  useEffect(() => {
    setSelectedRate(currentRate);
  }, [currentRate, open]);

  const handleRateSelect = (rate: number) => {
    setSelectedRate(rate);
    onRateChange(rate);
    onOpenChange(false);
  };

  // Always use the same UI (fullscreen style) regardless of container
  if (open) {
    const targetContainer = container || document.body;
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
        <div 
          className="bg-[#1A1A1A] border-[#2D2D2D] text-white w-[220px] rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 pt-4 pb-3 border-b border-[#2D2D2D] relative">
            <h2 className="text-white text-base font-semibold">Tốc độ</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-[#2D2D2D]"
            >
              ✕
            </button>
          </div>
          
          <div className="px-4 py-3 space-y-1">
            {PLAYBACK_RATES.map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateSelect(rate)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-white hover:bg-[#2D2D2D] cursor-pointer transition-colors ${
                  selectedRate === rate ? 'bg-[#2D2D2D]' : ''
                }`}
              >
                <span className="text-sm">{rate}x</span>
                {selectedRate === rate && (
                  <Check className="h-4 w-4 text-yellow-400" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end px-4 py-3 border-t border-[#2D2D2D]">
            <DarkOutlineButton
              onClick={() => onOpenChange(false)}
              size="sm"
              className="text-xs h-7 px-3"
            >
              Hủy
            </DarkOutlineButton>
          </div>
        </div>
      </div>,
      targetContainer
    );
  }

  return null;
}

