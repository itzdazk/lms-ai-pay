import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Loader2, FileX } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface TranscriptItem {
  time: number; // Time in seconds
  text: string;
}

interface TranscriptProps {
  transcriptJsonUrl?: string;
  transcriptJson?: any;
  transcriptText?: string;
  onTimeClick?: (time: number) => void;
  currentTime?: number;
  className?: string;
}

export function Transcript({
  transcriptJsonUrl,
  transcriptJson,
  transcriptText,
  onTimeClick,
  currentTime = 0,
  className = '',
}: TranscriptProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const loadedUrlRef = useRef<string | null>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const isAutoScrollingRef = useRef(false);
  const lastScrollTopRef = useRef<number>(0);

  // Format time to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse transcript from different formats
  useEffect(() => {
    // If no transcript data is provided, don't load anything
    if (!transcriptJsonUrl && !transcriptJson && !transcriptText) {
      setTranscript([]);
      setLoading(false);
      loadedUrlRef.current = null;
      return;
    }

    // Prevent duplicate fetches for the same URL
    const currentUrl = transcriptJsonUrl || (transcriptJson ? 'json' : 'text');
    if (loadedUrlRef.current === currentUrl) {
      return;
    }

    const loadTranscript = async () => {
      setLoading(true);
      setError(null);

      try {
        let items: TranscriptItem[] = [];

        // If transcriptText is provided, parse it
        if (transcriptText) {
          // Simple parsing: assume format like "00:00 Text here\n00:15 More text"
          const lines = transcriptText.split('\n').filter(line => line.trim());
          items = lines.map(line => {
            const match = line.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
            if (match) {
              const minutes = parseInt(match[1], 10);
              const seconds = parseInt(match[2], 10);
              return {
                time: minutes * 60 + seconds,
                text: match[3],
              };
            }
            return null;
          }).filter((item): item is TranscriptItem => item !== null);
        }
        // If transcriptJson is provided, parse it
        else if (transcriptJson) {
          // Handle different JSON formats
          if (Array.isArray(transcriptJson)) {
            items = transcriptJson.map((item: any) => ({
              time: item.start || item.time || 0,
              text: item.text || item.content || '',
            }));
          } else if (transcriptJson.segments && Array.isArray(transcriptJson.segments)) {
            items = transcriptJson.segments.map((segment: any) => ({
              time: segment.start || segment.time || 0,
              text: segment.text || segment.content || '',
            }));
          }
        }
        // If transcriptJsonUrl is provided, fetch it
        else if (transcriptJsonUrl) {
          // Handle both relative and absolute URLs
          let url = transcriptJsonUrl;
          if (transcriptJsonUrl.startsWith('/')) {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
            const baseUrl = API_BASE_URL.replace('/api/v1', '');
            url = `${baseUrl}${transcriptJsonUrl}`;
          }
          
          const response = await fetch(url, {
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error(`Failed to load transcript JSON: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (Array.isArray(data)) {
            items = data.map((item: any) => ({
              time: item.start || item.time || 0,
              text: item.text || item.content || '',
            }));
          } else if (data.segments && Array.isArray(data.segments)) {
            items = data.segments.map((segment: any) => ({
              time: segment.start || segment.time || 0,
              text: segment.text || segment.content || '',
            }));
          }
        }

        setTranscript(items);
        loadedUrlRef.current = currentUrl;
      } catch (err: any) {
        setError(err.message || 'Failed to load transcript');
        loadedUrlRef.current = null;
      } finally {
        setLoading(false);
      }
    };

    loadTranscript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptJsonUrl, transcriptJson, transcriptText]);

  // Handle user scroll - pause auto-scroll when user is scrolling manually
  useEffect(() => {
    const container = transcriptRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If this scroll is from auto-scroll, ignore it
      if (isAutoScrollingRef.current) {
        isAutoScrollingRef.current = false;
        lastScrollTopRef.current = container.scrollTop;
        return;
      }

      // Check if scroll position actually changed (user scroll)
      const currentScrollTop = container.scrollTop;
      if (Math.abs(currentScrollTop - lastScrollTopRef.current) > 5) {
        isUserScrollingRef.current = true;
        lastScrollTopRef.current = currentScrollTop;
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Reset flag after user stops scrolling for 3 seconds
        scrollTimeoutRef.current = window.setTimeout(() => {
          isUserScrollingRef.current = false;
        }, 3000);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to current time (only when user is not scrolling manually)
  useEffect(() => {
    if (!transcriptRef.current || transcript.length === 0) return;
    if (currentTime === 0) return; // Don't scroll when video just starts
    if (isUserScrollingRef.current) return; // Don't auto-scroll if user is scrolling

    // Find the current transcript item
    const currentItemIndex = transcript.findIndex(
      (item, index) => {
        const nextItem = transcript[index + 1];
        return currentTime >= item.time && (!nextItem || currentTime < nextItem.time);
      }
    );

    if (currentItemIndex >= 0) {
      const container = transcriptRef.current;
      const element = container.children[currentItemIndex] as HTMLElement;
      if (element && container) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // Calculate element position relative to container
        const elementTopRelative = elementRect.top - containerRect.top + container.scrollTop;
        const elementBottomRelative = elementTopRelative + elementRect.height;
        const viewportTop = container.scrollTop;
        const viewportBottom = container.scrollTop + containerRect.height;
        
        // Check if element is fully visible in viewport (with some margin)
        const margin = 50; // 50px margin
        const isFullyVisible = 
          elementTopRelative >= viewportTop + margin &&
          elementBottomRelative <= viewportBottom - margin;
        
        // Only scroll if element is not fully visible
        if (!isFullyVisible) {
          // Mark that we're auto-scrolling
          isAutoScrollingRef.current = true;
          
          const elementCenter = elementTopRelative - (containerRect.height / 2) + (elementRect.height / 2);
          
          container.scrollTo({
            top: elementCenter,
            behavior: 'smooth',
          });
          
          // Reset flag after scroll animation (smooth scroll takes ~500ms)
          setTimeout(() => {
            isAutoScrollingRef.current = false;
            lastScrollTopRef.current = container.scrollTop;
          }, 600);
        }
      }
    }
  }, [currentTime, transcript]);

  if (loading) {
    return (
      <Card className={`${isDark ? 'bg-[#1A1A1A] border-[#2D2D2D]' : 'bg-white border-gray-200'} ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Đang tải transcript...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If error occurred, don't show error (transcript is optional)
  if (error) {
    return (
      <Card className={`${isDark ? 'bg-[#1A1A1A] border-[#2D2D2D]' : 'bg-white border-gray-200'} ${className}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <FileX className={`h-12 w-12 mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Chưa có transcript</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no transcript data available after loading, show message
  if (!loading && transcript.length === 0) {
    return (
      <Card className={`${isDark ? 'bg-[#1A1A1A] border-[#2D2D2D]' : 'bg-white border-gray-200'} ${className}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <FileX className={`h-12 w-12 mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Chưa có transcript</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${isDark ? 'bg-[#1A1A1A] border-[#2D2D2D]' : 'bg-white border-gray-200'} ${className}`}>
      <CardContent className="pt-6">
        <div
          ref={transcriptRef}
          className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar"
          onWheel={() => {
            // User is scrolling with mouse wheel
            isUserScrollingRef.current = true;
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = window.setTimeout(() => {
              isUserScrollingRef.current = false;
            }, 3000);
          }}
          onTouchStart={() => {
            // User is scrolling on touch device
            isUserScrollingRef.current = true;
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = window.setTimeout(() => {
              isUserScrollingRef.current = false;
            }, 3000);
          }}
        >
          {transcript.map((item, index) => {
            const isActive = currentTime >= item.time && 
              (index === transcript.length - 1 || currentTime < transcript[index + 1].time);

            return (
              <div
                key={index}
                onClick={() => {
                  if (onTimeClick) {
                    onTimeClick(item.time);
                  }
                }}
                className={`flex gap-4 p-2 rounded cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 border-l-2 border-blue-600'
                    : isDark ? 'hover:bg-[#1F1F1F]' : 'hover:bg-gray-100'
                }`}
              >
                <span
                  className={`text-sm font-mono flex-shrink-0 ${
                    isActive ? 'text-blue-500' : isDark ? 'text-gray-500' : 'text-gray-600'
                  }`}
                >
                  {formatTime(item.time)}
                </span>
                <p
                  className={`text-sm flex-1 ${
                    isActive 
                      ? isDark ? 'text-white' : 'text-gray-900'
                      : isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

