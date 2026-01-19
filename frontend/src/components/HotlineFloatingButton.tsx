// src/components/HotlineFloatingButton.tsx
import { useState, useRef, useEffect } from 'react';
import { Phone, MessageCircle, Facebook, Mail, X } from 'lucide-react';
import { Button } from './ui/button';
import { CONTACT_INFO } from '../lib/constants';
import { getPublicSystemConfig, type PublicSystemSettings } from '../lib/api/system-config';

export function HotlineFloatingButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState<PublicSystemSettings['contact'] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load contact info from API
  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const publicConfig = await getPublicSystemConfig();
        if (publicConfig?.contact) {
          setContactInfo(publicConfig.contact);
        }
      } catch (error) {
        console.error('Failed to load contact info from API, using defaults:', error);
        // Fallback to constants if API fails
      }
    };
    loadContactInfo();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Use API data if available, fallback to constants
  const hotline = contactInfo?.hotline || CONTACT_INFO.hotline;
  const hotlineDisplay = contactInfo?.hotlineDisplay || CONTACT_INFO.hotlineDisplay;
  const email = contactInfo?.email || CONTACT_INFO.email;
  const zalo = contactInfo?.zalo || CONTACT_INFO.zalo;
  const facebook = contactInfo?.facebook || CONTACT_INFO.facebook;
  const workingHours = contactInfo?.workingHours || CONTACT_INFO.workingHours;

  const handlePhoneClick = () => {
    window.location.href = `tel:${hotline}`;
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${email}`;
  };

  const handleZaloClick = () => {
    window.open(zalo, '_blank');
  };

  const handleFacebookClick = () => {
    window.open(facebook, '_blank');
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-28 md:right-6 z-40" ref={menuRef}>
      {/* Glow Ring */}
      <div 
        className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" 
        style={{ width: '64px', height: '64px' }}
      ></div>

      {/* Main Button */}
      <Button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        size="lg"
        className="relative h-14 w-14 md:h-16 md:w-16 rounded-full md:shadow-2xl md:shadow-blue-500/50 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-110 md:hover:shadow-blue-400/70 border-3 border-white/40 shadow-inner"
        aria-label="Liên hệ hỗ trợ"
      >
        <Phone className="h-6 w-6 md:h-7 md:w-7 text-white" />
      </Button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute bottom-20 right-0 mb-2 w-[calc(100vw-2rem)] max-w-56 md:w-56 bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl shadow-2xl overflow-hidden">
          {/* Menu Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-3 flex items-center justify-between">
            <div>
              <h3 className="text-white text-sm font-semibold">Liên hệ hỗ trợ</h3>
              <p className="text-blue-100 text-xs hidden md:block">Chọn kênh liên hệ</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Phone Option */}
            <button
              onClick={handlePhoneClick}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#2D2D2D] transition-colors text-white"
            >
              <div className="p-2 bg-blue-500/20 rounded-full">
                <Phone className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Điện thoại</div>
                <div className="text-xs text-gray-400">{hotlineDisplay}</div>
              </div>
            </button>

            {/* Email Option */}
            {email && (
              <button
                onClick={handleEmailClick}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#2D2D2D] transition-colors text-white"
              >
                <div className="p-2 bg-blue-500/20 rounded-full">
                  <Mail className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Email</div>
                  <div className="text-xs text-gray-400">{email}</div>
                </div>
              </button>
            )}

            {/* Zalo Option */}
            <button
              onClick={handleZaloClick}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#2D2D2D] transition-colors text-white"
            >
              <div className="p-2 bg-blue-500/20 rounded-full">
                <MessageCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Zalo</div>
                <div className="text-xs text-gray-400">Nhắn tin trực tiếp</div>
              </div>
            </button>

            {/* Facebook Option */}
            <button
              onClick={handleFacebookClick}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#2D2D2D] transition-colors text-white"
            >
              <div className="p-2 bg-blue-500/20 rounded-full">
                <Facebook className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Facebook</div>
                <div className="text-xs text-gray-400">Fanpage của chúng tôi</div>
              </div>
            </button>
          </div>

          {/* Working Hours Info */}
          <div className="px-4 py-2 border-t border-[#2D2D2D] bg-[#1F1F1F]">
            <p className="text-xs text-gray-400">
              Giờ làm việc: {workingHours}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
