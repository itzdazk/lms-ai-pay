import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Loader2 } from 'lucide-react';

interface TranscriptItem {
  time: number; // Time in seconds
  text: string;
}

interface TranscriptProps {
  transcriptUrl?: string;
  transcriptJson?: any;
  transcriptText?: string;
  onTimeClick?: (time: number) => void;
  currentTime?: number;
  className?: string;
}

export function Transcript({
  transcriptUrl,
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

  // Format time to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse transcript from different formats
  useEffect(() => {
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
        // If transcriptUrl is provided, fetch it
        else if (transcriptUrl) {
          const response = await fetch(transcriptUrl);
          if (!response.ok) {
            throw new Error('Failed to load transcript');
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
      } catch (err: any) {
        setError(err.message || 'Failed to load transcript');
      } finally {
        setLoading(false);
      }
    };

    loadTranscript();
  }, [transcriptUrl, transcriptJson, transcriptText]);

  // Auto-scroll to current time
  useEffect(() => {
    if (!transcriptRef.current || transcript.length === 0) return;

    // Find the current transcript item
    const currentItemIndex = transcript.findIndex(
      (item, index) => {
        const nextItem = transcript[index + 1];
        return currentTime >= item.time && (!nextItem || currentTime < nextItem.time);
      }
    );

    if (currentItemIndex >= 0) {
      const element = transcriptRef.current.children[currentItemIndex] as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  if (error) {
    return (
      <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-gray-400">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transcript.length === 0) {
    return (
      <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-gray-400">Chưa có transcript cho bài học này</p>
          </div>
        </CardContent>
      </Card>
    );
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

