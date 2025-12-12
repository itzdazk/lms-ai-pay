import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Loader2 } from 'lucide-react';

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
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const loadedUrlRef = useRef<string | null>(null);

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
          
          console.log('Fetching transcript JSON from URL:', url);
          
          const response = await fetch(url, {
            credentials: 'include',
          });
          
          if (!response.ok) {
            console.error('Transcript JSON fetch failed:', response.status, response.statusText);
            throw new Error(`Failed to load transcript JSON: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Transcript JSON data received:', data);
          
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
          } else {
            console.warn('Unexpected transcript JSON format:', data);
          }
          
          console.log('Parsed transcript items:', items.length);
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

  // Auto-scroll to current time (only within transcript container, not the whole page)
  useEffect(() => {
    if (!transcriptRef.current || transcript.length === 0) return;
    if (currentTime === 0) return; // Don't scroll when video just starts

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
        // Scroll only within the container, not the whole page
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const elementTop = elementRect.top - containerRect.top + container.scrollTop;
        const elementCenter = elementTop - (containerRect.height / 2) + (elementRect.height / 2);
        
        container.scrollTo({
          top: elementCenter,
          behavior: 'smooth',
        });
      }
    }
  }, [currentTime, transcript]);

  if (loading) {
    return (
      <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Đang tải transcript...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If error occurred, log it but don't show error (transcript is optional)
  if (error) {
    console.error('Transcript error:', error, 'URL:', transcriptJsonUrl);
    return null;
  }

  // If no transcript data available after loading, don't render anything (transcript is optional)
  if (!loading && transcript.length === 0) {
    return null;
  }

  return (
    <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
      <CardContent className="pt-6">
        <div
          ref={transcriptRef}
          className="space-y-4 max-h-96 overflow-y-auto"
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
                    : 'hover:bg-[#1F1F1F]'
                }`}
              >
                <span
                  className={`text-sm font-mono flex-shrink-0 ${
                    isActive ? 'text-blue-500' : 'text-gray-500'
                  }`}
                >
                  {formatTime(item.time)}
                </span>
                <p
                  className={`text-sm flex-1 ${
                    isActive ? 'text-white' : 'text-gray-300'
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

