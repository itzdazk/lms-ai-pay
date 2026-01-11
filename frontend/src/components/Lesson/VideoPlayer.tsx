import { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Loader2,
  Subtitles,
  Settings,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { SubtitleSettingsDialog, type SubtitleSettings, DEFAULT_SETTINGS } from './SubtitleSettingsDialog';
import { PlaybackRateDialog } from './PlaybackRateDialog';

interface VideoPlayerProps {
      onSeek?: (time: number) => void;
    watchedDuration?: number;
  videoUrl?: string;
  subtitleUrl?: string; // WebVTT subtitle URL
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  getCurrentTime?: (fn: () => number) => void;
  onEnded?: () => void;
  initialTime?: number;
  seekTo?: number; // Seek to this time when it changes
  className?: string;
  title?: string; // Lesson title
  showSidebar?: boolean; // Whether sidebar is visible
  onPlay?: () => void;
  onPause?: () => void;
  isCompleted?: boolean; // Whether the lesson is completed
}

export function VideoPlayer({
// ...existing code...
  videoUrl,
  subtitleUrl,
  onTimeUpdate,
  onEnded,
  initialTime = 0,
  seekTo,
  className = '',
  title,
  showSidebar = true,
  onPlay,
  onPause,
  getCurrentTime,
  watchedDuration = 0,
  onSeek,
  isCompleted = false,
}: VideoPlayerProps) {
  // Anti-spam forward: lưu lịch sử bấm forward
  const [forwardClicks, setForwardClicks] = useState<number[]>([]);
  const [forwardLocked, setForwardLocked] = useState(false);
  // Log mỗi lần watchedDuration prop thay đổi
  // eslint-disable-next-line no-console
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  // Hàm lấy currentTime trực tiếp từ video element
  const getCurrentTimeFn = () => videoRef.current?.currentTime ?? currentTime;

  // Truyền hàm getCurrentTimeFn ra ngoài qua prop getCurrentTime (chỉ khi mount)
  useEffect(() => {
    if (getCurrentTime) {
      getCurrentTime(getCurrentTimeFn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCurrentTime]);
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('video-volume');
      if (saved !== null) {
        const v = parseFloat(saved);
        if (!isNaN(v) && v >= 0 && v <= 1) return v;
      }
    } catch {}
    return 1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  // Load subtitle visibility state from localStorage
  const [showSubtitles, setShowSubtitles] = useState(() => {
    try {
      const saved = localStorage.getItem('subtitle-visible');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [showCenterPlayButton, setShowCenterPlayButton] = useState(false);
  const [showInitialPlayButton, setShowInitialPlayButton] = useState(false);
  const [subtitleSettingsOpen, setSubtitleSettingsOpen] = useState(false);
  // Don't initialize with DEFAULT_SETTINGS - wait for localStorage to load
  // This prevents applying white color styles before the saved settings are loaded
  // Use null initially, then set to actual settings once loaded
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings | null>(null);
  const [playbackRateDialogOpen, setPlaybackRateDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const subtitleStyleRef = useRef<HTMLStyleElement | null>(null);
  const isDraggingRef = useRef(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const isDraggingVolumeRef = useRef(false);
  const previousSubtitleSettingsRef = useRef<string>('');
  const previousShowControlsRef = useRef<boolean | null>(null);
  const previousIsFullscreenRef = useRef<boolean | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [isVideoFocused, setIsVideoFocused] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  // Đã loại bỏ toàn bộ logic viewedSegments
  const lessonIdRef = useRef<number | string | undefined>(undefined); // Truyền lessonId từ props nếu cần
  const hasResetPlaybackRateRef = useRef(false); // Track if we've already reset playback rate for this watchedDuration crossing

  // Format time to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      // Hide initial play button when user starts playing
      setShowInitialPlayButton(false);
      // Show center play button
      setShowCenterPlayButton(true);
      setTimeout(() => setShowCenterPlayButton(false), 1000);
    }
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
      try {
        localStorage.setItem('video-volume', String(newVolume));
      } catch {}
    }
  };
  // Khi mount hoặc khi videoUrl đổi, luôn đồng bộ volume từ state vào video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume, videoUrl]);

  // Attach video source with HLS support
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    const video = videoRef.current;
    const isHls = videoUrl.includes('.m3u8');
    const onLoadedMeta = () => setIsLoading(false);

    setIsLoading(true);
    setVideoError(null);
    console.log('[VideoPlayer] Source type:', isHls ? 'HLS' : 'MP4', videoUrl);

    if (isHls && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const hls = new Hls({ enableWorker: true, lowLatencyMode: false, startLevel: -1 });
      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => setIsLoading(false));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setVideoError('Không thể tải video');
              hls.destroy();
              hlsRef.current = null;
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', onLoadedMeta);
      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMeta);
      };
    }

    // Fallback: MP4 or unsupported HLS
    video.src = videoUrl;
    video.addEventListener('loadedmetadata', onLoadedMeta);
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMeta);
    };
  }, [videoUrl]);

  // Handle mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (rate: string) => {
    if (videoRef.current) {
      const newRate = parseFloat(rate);
      videoRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
  };

  // Prevent duplicated toast: only show once every 2 seconds
  const lastSeekToastRef = useRef<number>(0);
  // Handle seek (anti-skip): chỉ cho phép kéo trong vùng đã xem
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0 && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      let newTime = pos * duration;
      if (watchedDuration !== undefined && newTime > watchedDuration) {
        // Không cho phép seek vượt quá watchedDuration, không làm gì cả
        const now = Date.now();
        if (now - lastSeekToastRef.current > 2000) {
          toast.warning('Bạn chỉ có thể tua đến phần đã xem!');
          lastSeekToastRef.current = now;
        }
        return;
      }
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (onSeek) onSeek(newTime);
    }
  };

  // Handle drag start: chỉ cho phép kéo nếu vị trí nằm trong watchedDuration
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0 && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      let newTime = pos * duration;
      if (watchedDuration !== undefined && newTime > watchedDuration) {
        const now = Date.now();
        if (now - lastSeekToastRef.current > 2000) {
          toast.warning('Bạn chỉ có thể tua đến phần đã xem!');
          lastSeekToastRef.current = now;
        }
        return;
      }
      isDraggingRef.current = true;
      setIsDragging(true);
      setShowControls(true);
      handleSeek(e);
      if (onSeek) onSeek(newTime);
    }
  };

  // Keyboard shortcuts: arrow left/right to seek, up/down to change volume
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current || !isVideoFocused) return;

      const target = e.target as HTMLElement | null;
      // Don't respond if user is typing in an input/textarea
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (subtitleSettingsOpen || playbackRateDialogOpen) return;

      const seekBy = (delta: number) => {
        if (!videoRef.current) return;
        let newTime = videoRef.current.currentTime + delta;
        if (watchedDuration !== undefined && delta > 0 && newTime > watchedDuration) {
          const now = Date.now();
          if (now - lastSeekToastRef.current > 2000) {
            toast.warning('Bạn chỉ có thể tua đến phần đã xem!');
            lastSeekToastRef.current = now;
          }
          return;
        }
        newTime = Math.min(Math.max(0, newTime), duration);
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      };

      const changeVolume = (delta: number) => {
        const baseVolume = isMuted ? 0 : volume;
        const newVolume = Math.min(1, Math.max(0, baseVolume + delta));
        handleVolumeChange(newVolume);
      };

      switch (e.key) {
        case ' ':
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekBy(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekBy(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.05);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, isMuted, volume, subtitleSettingsOpen, playbackRateDialogOpen, isVideoFocused, isPlaying]);

  // Handle click outside to unfocus video
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsVideoFocused(false);
      }
    };

    if (isVideoFocused) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVideoFocused]);

  // Handle volume drag start
  const handleVolumeDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingVolumeRef.current = true;
    setShowControls(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    handleVolumeChange(pos);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && videoRef.current && duration > 0 && progressBarRef.current) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        let newTime = pos * duration;
        if (watchedDuration !== undefined && newTime > watchedDuration) {
          // Không cho phép kéo vượt quá watchedDuration
          return;
        }
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
      if (isDraggingVolumeRef.current && volumeBarRef.current) {
        const rect = volumeBarRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        handleVolumeChange(pos);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      isDraggingVolumeRef.current = false;
    };

    if (isDragging || isDraggingVolumeRef.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, duration, volume]);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Check if video URL is missing
  useEffect(() => {
    if (!videoUrl || videoUrl.trim() === '') {
      setVideoError('Video không tồn tại hoặc chưa được tải lên');
      setIsLoading(false);
    } else {
      setVideoError(null);
    }
  }, [videoUrl]);

  // Event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      setVideoError(null); // Clear error if video loads successfully
      if (initialTime > 0) {
        video.currentTime = initialTime;
        setCurrentTime(initialTime);
      } else {
        // Show initial play button when video is loaded and not playing
        setShowInitialPlayButton(true);
      }
      // Force re-apply subtitle settings when video metadata is loaded
      // This ensures settings are applied even after page reload
      if (subtitleSettings && showSubtitles) {
        setTimeout(() => {
          const tracks = video.textTracks;
          for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].kind === 'subtitles' && tracks[i].mode === 'showing') {
              tracks[i].mode = 'hidden';
              setTimeout(() => {
                if (video) {
                  tracks[i].mode = 'showing';
                }
              }, 50);
            }
          }
        }, 200);
      }
    };

    const handleError = () => {
      setIsLoading(false);
      const error = video.error;
      if (error) {
        let errorMessage = 'Không thể tải video';
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = 'Video bị hủy khi đang tải';
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMessage = 'Lỗi kết nối mạng khi tải video';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Lỗi giải mã video';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Định dạng video không được hỗ trợ';
            break;
          default:
            errorMessage = 'Không thể tải video';
        }
        setVideoError(errorMessage);
      } else {
        setVideoError('Không thể tải video');
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime, video.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) {
        onEnded();
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setShowInitialPlayButton(false);
      console.log('[VideoPlayer] Sự kiện play được gọi', new Date().toLocaleTimeString());
      if (onPlay) onPlay();
    };
    const handlePause = () => {
      setIsPlaying(false);
      console.log('[VideoPlayer] Sự kiện pause được gọi', new Date().toLocaleTimeString());
      if (onPause) onPause();
    };

    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement;
      setIsFullscreen(isFullscreenNow);
      setFullscreenContainer(isFullscreenNow ? (document.fullscreenElement as HTMLElement) : null);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [onTimeUpdate, onEnded, initialTime, subtitleSettings, showSubtitles]);

  // Load subtitle settings from localStorage (only once on mount)
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  useEffect(() => {
    if (settingsLoaded) return; // Only load once
    
    try {
      const saved = localStorage.getItem('subtitle-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old format to new format
        if ('textStroke' in parsed) {
          parsed.textEffect = parsed.textStroke ? 'stroke' : 'none';
          delete parsed.textStroke;
          delete parsed.strokeColor;
        }
        // Ensure all required fields exist
        const migrated = {
          fontSize: parsed.fontSize || 20,
          color: parsed.color || '#FFFFFF',
          textOpacity: parsed.textOpacity !== undefined ? parsed.textOpacity : 100,
          fontFamily: parsed.fontFamily || 'Arial',
          textEffect: parsed.textEffect || 'stroke',
          backgroundColor: parsed.backgroundColor || '#000000',
          backgroundOpacity: parsed.backgroundOpacity !== undefined ? parsed.backgroundOpacity : 0,
        };
        setSubtitleSettings(migrated);
        setSettingsLoaded(true);
      } else {
        // Only set default if nothing is saved
        setSubtitleSettings(DEFAULT_SETTINGS);
      setSettingsLoaded(true);
    }
  } catch (error) {
      setSubtitleSettings(DEFAULT_SETTINGS);
      setSettingsLoaded(true);
    }
  }, [settingsLoaded]);


  // Re-apply subtitle settings when video is ready and settings are loaded (after page reload)
  useEffect(() => {
    if (!videoRef.current || !subtitleSettings || !settingsLoaded) {
      return;
    }
    
    const video = videoRef.current;
    // Wait for video to have metadata
    const checkAndApply = () => {
      if (video.readyState >= 1) {
        // Force re-render of subtitle track to apply loaded settings
        // Styles should already be applied by the other useEffect, just need to refresh the track
        setTimeout(() => {
          if (video && showSubtitles) {
            const tracks = video.textTracks;
            for (let i = 0; i < tracks.length; i++) {
              if (tracks[i].kind === 'subtitles') {
                const wasShowing = tracks[i].mode === 'showing';
                if (wasShowing) {
                  tracks[i].mode = 'hidden';
                  setTimeout(() => {
                    if (video) {
                      tracks[i].mode = 'showing';
                    }
                  }, 200);
                }
              }
            }
          }
        }, 300); // Wait for styles to be applied first
      } else {
        // Wait for metadata
        const handleMetadata = () => {
          // Styles will be applied by the other useEffect when video ref is ready
          // Just refresh the track after a delay to ensure styles are applied
          setTimeout(() => {
            if (video && showSubtitles) {
              const tracks = video.textTracks;
              for (let i = 0; i < tracks.length; i++) {
                if (tracks[i].kind === 'subtitles' && tracks[i].mode === 'showing') {
                  tracks[i].mode = 'hidden';
                  setTimeout(() => {
                    if (video) {
                      tracks[i].mode = 'showing';
                    }
                  }, 200);
                }
              }
            }
          }, 500);
        };
        video.addEventListener('loadedmetadata', handleMetadata, { once: true });
        return () => {
          video.removeEventListener('loadedmetadata', handleMetadata);
        };
      }
    };
    
    checkAndApply();
  }, [settingsLoaded, videoUrl, subtitleSettings, showSubtitles]); // Don't include showControls to avoid recreating CSS on every controls change

  // Apply subtitle styles
  useEffect(() => {
    if (!subtitleSettings) {
      return;
    }
    if (!videoRef.current) {
      return;
    }
    if (!settingsLoaded) {
      return;
    }
    
    // Determine subtitle position based on controls visibility and fullscreen mode
    // When controls are visible, push subtitle higher to avoid overlap
    // In fullscreen, use slightly lower position
    const subtitleBottom = isFullscreen 
      ? (showControls ? '4%' : '1%')
      : (showControls ? '6%' : '2%');

    // Get or create style element (don't remove and recreate to avoid flicker)
    let style = document.getElementById('subtitle-styles') as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = 'subtitle-styles';
      document.head.appendChild(style);
    }
    subtitleStyleRef.current = style;
    
    // Ensure video has an ID
    if (!videoRef.current.id) {
      videoRef.current.id = 'lesson-video-player';
    }
    const bgColor = subtitleSettings.backgroundColor || '#000000';
    const bgOpacity = (subtitleSettings.backgroundOpacity !== undefined ? subtitleSettings.backgroundOpacity : 0) / 100;
    
    // Parse hex color safely
    let bgR = 0, bgG = 0, bgB = 0;
    try {
      if (bgColor.startsWith('#')) {
        const hex = bgColor.slice(1);
        if (hex.length === 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          bgR = isNaN(r) ? 0 : r;
          bgG = isNaN(g) ? 0 : g;
          bgB = isNaN(b) ? 0 : b;
        } else if (hex.length === 3) {
          const r = parseInt(hex[0] + hex[0], 16);
          const g = parseInt(hex[1] + hex[1], 16);
          const b = parseInt(hex[2] + hex[2], 16);
          bgR = isNaN(r) ? 0 : r;
          bgG = isNaN(g) ? 0 : g;
          bgB = isNaN(b) ? 0 : b;
        }
      }
    } catch (error) {
      // Ignore parsing errors
    }
    const bgRgba = `rgba(${bgR}, ${bgG}, ${bgB}, ${bgOpacity})`;

    // Text color with opacity
    const textColor = subtitleSettings.color || '#FFFFFF';
    const textOpacity = (subtitleSettings.textOpacity !== undefined ? subtitleSettings.textOpacity : 100) / 100;
    let textR = 255, textG = 255, textB = 255;
    try {
      if (textColor.startsWith('#')) {
        const hex = textColor.slice(1);
        if (hex.length === 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          textR = isNaN(r) ? 255 : r;
          textG = isNaN(g) ? 255 : g;
          textB = isNaN(b) ? 255 : b;
        } else if (hex.length === 3) {
          const r = parseInt(hex[0] + hex[0], 16);
          const g = parseInt(hex[1] + hex[1], 16);
          const b = parseInt(hex[2] + hex[2], 16);
          textR = isNaN(r) ? 255 : r;
          textG = isNaN(g) ? 255 : g;
          textB = isNaN(b) ? 255 : b;
        }
      }
    } catch (error) {
      // Ignore parsing errors
    }
    const textRgba = `rgba(${textR}, ${textG}, ${textB}, ${textOpacity})`;

    // Text effect
    let textEffectStyle = '';
    const textEffect = subtitleSettings.textEffect || 'stroke';
    if (textEffect === 'stroke') {
      // Use text-shadow to create outline effect instead of stroke to preserve text color
      textEffectStyle = `text-shadow: -1px -1px 0 rgba(0,0,0,0.8), 1px -1px 0 rgba(0,0,0,0.8), -1px 1px 0 rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.8) !important;`;
    } else if (textEffect === 'shadow') {
      textEffectStyle = `text-shadow: 2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8) !important;`;
    }
    // 'none' doesn't need any style
    
    // Background color for text only - combine text effect with background
    // For video subtitles, background-color without padding will only apply to text, not a block
    let combinedStyle = textEffectStyle;
    if (bgOpacity > 0) {
      // Extract text-shadow values from textEffectStyle if it exists
      let effectShadows = '';
      if (textEffectStyle) {
        // Extract shadows from textEffectStyle (remove "text-shadow: " and " !important;")
        const effectMatch = textEffectStyle.match(/text-shadow:\s*(.+?)\s*!important;/);
        if (effectMatch) {
          effectShadows = effectMatch[1];
        }
      }
      
      // Create multiple text-shadow layers to simulate background around text
      // This creates background only around the text characters, not a block
      const shadowLayers = [];
      // Create a solid background effect using multiple shadow layers
      for (let x = -2; x <= 2; x++) {
        for (let y = -2; y <= 2; y++) {
          // Skip the center to avoid covering the text
          if (x === 0 && y === 0) continue;
          shadowLayers.push(`${x}px ${y}px 0 ${bgRgba}`);
        }
      }
      
      // Combine text effect shadows with background shadows
      const allShadows = effectShadows ? [effectShadows, ...shadowLayers] : shadowLayers;
      combinedStyle = `text-shadow: ${allShadows.join(', ')} !important;`;
    }

    // Get video element ID for more specific selector
    const videoId = videoRef.current.id || 'lesson-video-player';
    const videoSelector = `#${videoId}`;
    
    // Apply styles with more specific selectors
    // Use both standard and webkit selectors for better browser compatibility
    style.textContent = `
      ${videoSelector}::cue,
      video::cue {
        font-size: ${subtitleSettings.fontSize || 20}px !important;
        color: ${textRgba} !important;
        font-family: "${subtitleSettings.fontFamily || 'Arial'}", sans-serif !important;
        ${combinedStyle}
        line-height: 1.4 !important;
        white-space: normal !important;
        word-wrap: break-word !important;
        text-align: center !important;
        max-width: 80% !important;
        outline: none !important;
      }
      ${videoSelector}::-webkit-media-text-track-display {
        font-size: ${subtitleSettings.fontSize || 20}px !important;
        color: ${textRgba} !important;
        font-family: "${subtitleSettings.fontFamily || 'Arial'}", sans-serif !important;
        ${combinedStyle}
        bottom: ${subtitleBottom} !important;
        top: auto !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        position: absolute !important;
        width: auto !important;
        max-width: 80% !important;
        text-align: center !important;
        word-wrap: break-word !important;
        white-space: normal !important;
        transition: none !important;
      }
      ${videoSelector}::-webkit-media-text-track-container {
        font-size: ${subtitleSettings.fontSize || 20}px !important;
        bottom: ${subtitleBottom} !important;
        top: auto !important;
        transition: none !important;
      }
      ${videoSelector}::cue {
        bottom: ${subtitleBottom} !important;
        top: auto !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        position: absolute !important;
        width: auto !important;
        max-width: 80% !important;
        text-align: center !important;
        word-wrap: break-word !important;
        white-space: normal !important;
        ${combinedStyle}
        z-index: 10 !important;
        transition: none !important;
      }
      /* Additional selectors for better browser support */
      *::cue {
        font-size: ${subtitleSettings.fontSize || 20}px !important;
        color: ${textRgba} !important;
        font-family: "${subtitleSettings.fontFamily || 'Arial'}", sans-serif !important;
        ${combinedStyle}
        text-align: center !important;
        word-wrap: break-word !important;
        white-space: normal !important;
        max-width: 80% !important;
      }
    `;
    
    // Force a re-render of the subtitle track after CSS is applied
    // Only do this when subtitleSettings actually change, not on every render
    // to avoid flickering when controls appear/disappear
    if (videoRef.current && showSubtitles && subtitleSettings) {
      const settingsKey = JSON.stringify(subtitleSettings);
      // Only toggle if settings actually changed
      if (previousSubtitleSettingsRef.current !== settingsKey) {
        previousSubtitleSettingsRef.current = settingsKey;
        setTimeout(() => {
          const tracks = videoRef.current?.textTracks;
          if (tracks) {
            for (let i = 0; i < tracks.length; i++) {
              if (tracks[i].kind === 'subtitles' && tracks[i].mode === 'showing') {
                // Force cue update by toggling (only when settings change)
                tracks[i].mode = 'hidden';
                setTimeout(() => {
                  if (videoRef.current) {
                    tracks[i].mode = 'showing';
                  }
                }, 50);
              }
            }
          }
        }, 100);
      }
    }
  }, [subtitleSettings, showSubtitles, settingsLoaded, videoUrl]); // Add videoUrl to re-apply when video changes
  
  // Quick update subtitle position when showControls or isFullscreen changes (without recreating entire CSS)
  useEffect(() => {
    if (!videoRef.current || !showSubtitles || !subtitleSettings) {
      previousShowControlsRef.current = showControls;
      previousIsFullscreenRef.current = isFullscreen;
      return;
    }
    
    // Update if showControls or isFullscreen changed
    if (previousShowControlsRef.current === showControls && previousIsFullscreenRef.current === isFullscreen) {
      return;
    }
    previousShowControlsRef.current = showControls;
    previousIsFullscreenRef.current = isFullscreen;
    
    const subtitleBottom = isFullscreen 
      ? (showControls ? '4%' : '1%')
      : (showControls ? '6%' : '2%');
    const style = document.getElementById('subtitle-styles');
    if (style && style.textContent) {
      // Update all bottom values in CSS
      const currentCSS = style.textContent;
      const regex = /bottom:\s*[\d.]+%\s*(!important)?/gi;
      const newCSS = currentCSS.replace(regex, (match) => {
        const hasImportant = match.includes('!important');
        return hasImportant ? `bottom: ${subtitleBottom} !important` : `bottom: ${subtitleBottom}`;
      });
      
      // Update CSS without removing element to avoid flicker
      if (newCSS !== currentCSS) {
        style.textContent = newCSS;
      }
    }
  }, [showControls, showSubtitles, subtitleSettings, isFullscreen]);

  // Sync subtitle track when subtitleUrl or showSubtitles changes
  useEffect(() => {
    if (videoRef.current && subtitleUrl) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].kind === 'subtitles') {
          tracks[i].mode = showSubtitles ? 'showing' : 'hidden';
        }
      }
    }
  }, [subtitleUrl, showSubtitles]);

  // Force update subtitle track when settings change (but not on every render)
  useEffect(() => {
    if (videoRef.current && subtitleUrl && showSubtitles && subtitleSettings) {
      // Only force update if settings actually changed
      const settingsKey = JSON.stringify(subtitleSettings);
      if (previousSubtitleSettingsRef.current === settingsKey) {
        return; // Settings haven't changed, skip
      }
      previousSubtitleSettingsRef.current = settingsKey;
      
      // Force browser to re-render cues by toggling track mode (only when settings change)
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].kind === 'subtitles') {
          const currentMode = tracks[i].mode;
          if (currentMode === 'showing') {
            tracks[i].mode = 'hidden';
            // Use setTimeout to ensure style is applied before showing again
            setTimeout(() => {
              if (videoRef.current) {
                tracks[i].mode = 'showing';
              }
            }, 150);
          }
        }
      }
    }
  }, [subtitleSettings, subtitleUrl, showSubtitles]);

  // Pause video when subtitle settings modal opens
  useEffect(() => {
    if (subtitleSettingsOpen && videoRef.current && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [subtitleSettingsOpen, isPlaying]);

  // Reset initial play button when videoUrl changes
  useEffect(() => {
    setShowInitialPlayButton(false);
    setIsLoading(true);
    // Reset flag when video changes
    hasResetPlaybackRateRef.current = false;
  }, [videoUrl]);

  // Auto-reset playback rate to 1x when crossing watchedDuration marker
  useEffect(() => {
    if (videoRef.current && watchedDuration > 0 && currentTime >= watchedDuration && playbackRate > 1) {
      // User has crossed the yellow marker and playback rate is > 1x, reset to 1x
      // Only reset once per crossing (not continuously)
      if (!hasResetPlaybackRateRef.current) {
        handlePlaybackRateChange('1');
        toast.info('Đã tự động giảm tốc độ về 1x khi vượt qua phần đã xem');
        hasResetPlaybackRateRef.current = true;
      }
    } else if (currentTime < watchedDuration) {
      // Reset flag when going back below watchedDuration
      hasResetPlaybackRateRef.current = false;
    }
  }, [currentTime, watchedDuration, playbackRate]);

  // Handle seek from external (e.g., transcript click)
  useEffect(() => {
    if (seekTo !== undefined && seekTo !== null && videoRef.current) {
      videoRef.current.currentTime = seekTo;
      setCurrentTime(seekTo);
    }
  }, [seekTo]);

  // Save subtitle settings to localStorage
  const handleSubtitleSettingsChange = (settings: SubtitleSettings) => {
    try {
      localStorage.setItem('subtitle-settings', JSON.stringify(settings));
      setSubtitleSettings(settings);
    } catch (error) {
      // Ignore save errors
    }
  };

  // Ghi đè lessonId từ props nếu cần
  // useEffect(() => {
  //   lessonIdRef.current = props.lessonId;
  // }, [props.lessonId]);

  if (!videoUrl) {
    return (
      <div className={`relative bg-black aspect-video flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
          <p className="text-lg">Đang tải video...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black aspect-[16/9] group ${className}`}
      style={{ maxHeight: showSidebar ? '70vh' : '75vh' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
          setTimeout(() => setShowControls(false), 2000);
        }
      }}
      onClick={() => setIsVideoFocused(true)}
      onBlur={(e) => {
        // Only blur if focus is moving outside the container
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setIsVideoFocused(false);
        }
      }}
      tabIndex={0}
    >
      {/* Title overlay - shows/hides with controls */}
      {title && (
        <div 
          className={`absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/50 to-transparent px-4 py-3 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h3 className="text-white text-base font-semibold line-clamp-2">{title}</h3>
        </div>
      )}
      <video
        ref={videoRef}
        id="lesson-video-player"
        src={videoUrl}
        className="w-full h-full"
        playsInline
        crossOrigin="anonymous"
        onClick={() => setIsVideoFocused(true)}
      >
        {subtitleUrl && (
          <track
            kind="subtitles"
            srcLang="vi"
            label="Tiếng Việt"
            src={subtitleUrl}
            default={showSubtitles}
          />
        )}
      </video>

      {/* Loading overlay */}
      {isLoading && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      )}

      {/* Video Error overlay */}
      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <div className="space-y-2">
              <h3 className="text-white text-xl font-semibold">Không thể phát video</h3>
              <p className="text-gray-300 text-sm max-w-md">{videoError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Clickable overlay for play/pause - placed before controls */}
      {!(subtitleSettingsOpen || playbackRateDialogOpen) && (
        <div 
          className="absolute inset-0 z-40 cursor-pointer"
          onClick={(e) => {
            // Don't toggle if clicking on controls or buttons
            const target = e.target as HTMLElement;
            const clickedElement = target.closest('.controls-container') || 
                                   target.closest('button') || 
                                   target.closest('[role="button"]') || 
                                   target.closest('[role="menuitem"]') ||
                                   target.closest('[role="menu"]') ||
                                   target.closest('[data-radix-portal]') ||
                                   target.closest('[data-slot="dropdown-menu-content"]') ||
                                   target.closest('[data-slot="select-content"]');
            
            if (!clickedElement) {
              togglePlay();
            }
          }}
        >
          {/* Center Play/Pause Button */}
          {(showCenterPlayButton || showInitialPlayButton) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative">
                {/* Main button */}
                <div className="relative bg-gradient-to-br from-black/80 via-black/70 to-black/80 rounded-full p-3 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  <div className="relative">
                    {isPlaying ? (
                      <Pause className="h-10 w-10 text-gray-200" fill="currentColor" />
                    ) : (
                      <Play className="h-10 w-10 text-gray-200 ml-0.5" fill="currentColor" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Controls overlay */}
      {!videoError && (
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent transition-opacity duration-300 controls-container z-50 pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        } ${subtitleSettingsOpen || playbackRateDialogOpen ? 'pointer-events-none' : ''}`}
        style={{ 
          pointerEvents: (subtitleSettingsOpen || playbackRateDialogOpen) ? 'none' : undefined 
        }}
      >
        {/* Progress bar */}
        <div 
          className="absolute bottom-12 left-0 right-0 px-2 pointer-events-auto"
          style={{ 
            pointerEvents: (subtitleSettingsOpen || playbackRateDialogOpen) ? 'none' : 'auto' 
          }}
        >
          {/* Timeline */}
          <div className="flex items-center justify-between mb-0.5 px-0.5">
            <span className="text-white text-[10px] font-medium">
              {formatTime(currentTime)}
            </span>
            <span className="text-white text-[10px] font-medium">
              {formatTime(duration)}
            </span>
          </div>
          {/* Slider */}
          <div
            ref={progressBarRef}
            className="h-2 bg-white/20 rounded-full overflow-visible cursor-pointer group/progress hover:h-2.5 transition-all relative"
            onClick={handleSeek}
            onMouseDown={handleDragStart}
            onMouseMove={(e) => {
              const rect = progressBarRef.current?.getBoundingClientRect();
              if (!rect || duration <= 0) {
                setHoverTime(null);
                setHoverPercent(null);
                return;
              }
              const pos = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
              const percent = pos / rect.width;
              setHoverPercent(percent * 100);
              setHoverTime(percent * duration);
            }}
            onMouseLeave={() => {
              setHoverTime(null);
              setHoverPercent(null);
            }}
          >
            {hoverTime !== null && hoverPercent !== null && (
              <div
                className="absolute -top-8 px-2.5 py-1.5 rounded bg-black/85 text-white text-xs font-semibold shadow-lg pointer-events-none select-none"
                style={{
                  left: `${hoverPercent}%`,
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
            <div
              className="h-full bg-blue-600 transition-all group-hover/progress:bg-blue-500"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            {/* WatchedDuration marker */}
            {watchedDuration > 0 && duration > 0 && watchedDuration < duration && (
              <div
                className="absolute top-0 bottom-0 w-1.5"
                style={{
                  left: `calc(${(watchedDuration / duration) * 100}% - 3px)`,
                  background: '#FFD600', // vàng nổi bật
                  borderRadius: '2px',
                  zIndex: 2,
                  boxShadow: '0 0 4px 1px #FFD600',
                  pointerEvents: 'none',
                }}
                title="Cột mốc đã xem"
              />
            )}
            {/* Progress thumb */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full transition-opacity shadow-lg cursor-grab active:cursor-grabbing ${
                isDragging ? 'opacity-100 scale-125' : 'opacity-0 group-hover/progress:opacity-100'
              }`}
              style={{ left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 8px)` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-2 pointer-events-auto"
          style={{ 
            pointerEvents: (subtitleSettingsOpen || playbackRateDialogOpen) ? 'none' : 'auto' 
          }}
        >
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 h-7 w-7"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 h-7 px-2"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(0, currentTime - 5);
                  }
                }}
                title="Lùi 5 giây"
              >
                <SkipBack className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 h-7 px-2"
                onClick={() => {
                  if (forwardLocked) {
                    toast.warning('Bạn đang tua quá nhanh, vui lòng chờ một chút!');
                    return;
                  }
                  const now = Date.now();
                  // Lưu lại thời điểm bấm forward
                  setForwardClicks(prev => {
                    const updated = [...prev.filter(t => now - t < 10000), now];
                    // Nếu quá 3 lần trong 10 giây thì khóa forward 5 giây
                    if (updated.length > 3) {
                      setForwardLocked(true);
                      toast.warning('Bạn đang tua quá nhanh, vui lòng chờ 5 giây!');
                      setTimeout(() => setForwardLocked(false), 5000);
                      return [];
                    }
                    return updated;
                  });
                  if (videoRef.current && watchedDuration !== undefined) {
                    const nextTime = Math.min(duration, currentTime + 5);
                    if (nextTime > watchedDuration) {
                      toast.warning('Bạn chỉ có thể tua đến phần đã xem!');
                      return;
                    }
                    videoRef.current.currentTime = nextTime;
                  }
                }}
                title="Tiến 5 giây"
                disabled={forwardLocked || (watchedDuration !== undefined && currentTime >= watchedDuration)}
              >
                <SkipForward className="h-3 w-3" />
              </Button>
              <div className="flex items-center gap-1.5 ml-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-7 w-7"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </Button>
                <div 
                  ref={volumeBarRef}
                  className="w-16 h-1 bg-white/30 rounded-full cursor-pointer relative py-1 flex items-center"
                  onClick={(e) => {
                    if (!isDraggingVolumeRef.current) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (rect) {
                        const pos = (e.clientX - rect.left) / rect.width;
                        handleVolumeChange(Math.max(0, Math.min(1, pos)));
                      }
                    }
                  }}
                  onMouseDown={handleVolumeDragStart}
                  style={{ pointerEvents: 'auto' }}
                >
                  <div
                    className="h-0.5 bg-white rounded-full pointer-events-none transition-all"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs ml-1.5">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {subtitleUrl && (
                <Button
                  size="icon"
                  variant="ghost"
                  className={`text-white hover:bg-white/20 h-7 w-7 ${showSubtitles ? 'bg-white/20' : ''}`}
                  onClick={() => {
                    const newValue = !showSubtitles;
                    setShowSubtitles(newValue);
                    // Save to localStorage
                    try {
                      localStorage.setItem('subtitle-visible', String(newValue));
                    } catch (error) {
                      // Ignore save errors
                    }
                    if (videoRef.current) {
                      const tracks = videoRef.current.textTracks;
                      for (let i = 0; i < tracks.length; i++) {
                        tracks[i].mode = newValue ? 'showing' : 'hidden';
                      }
                    }
                  }}
                  title={showSubtitles ? 'Tắt phụ đề' : 'Bật phụ đề'}
                >
                  <Subtitles className="h-3.5 w-3.5" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={settingsButtonRef}
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-7 w-7"
                    title="Cài đặt"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="bg-[#1A1A1A] border-[#2D2D2D] text-white min-w-[200px] !z-[9999] py-1"
                  align="end"
                  side="top"
                  container={fullscreenContainer || undefined}
                >
                  <DropdownMenuLabel className="text-white text-sm font-semibold px-3 py-1.5">
                    Cài đặt
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#2D2D2D] my-1" />
                  <DropdownMenuItem
                    className="text-white hover:bg-[#2D2D2D] cursor-pointer flex items-center justify-between px-3 py-2.5"
                    onClick={() => {
                      // TODO: Implement quality selection
                      toast.info('Tính năng chọn chất lượng đang được phát triển');
                    }}
                  >
                    <span>Chất lượng</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Auto (1080P)</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-white hover:bg-[#2D2D2D] cursor-pointer flex items-center justify-between px-3 py-2.5"
                    onClick={() => setSubtitleSettingsOpen(true)}
                  >
                    <span>Phụ đề</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Tuỳ chỉnh</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={`flex items-center justify-between px-3 py-2.5 ${
                      isCompleted
                        ? 'text-white hover:bg-[#2D2D2D] cursor-pointer'
                        : 'text-gray-500 cursor-not-allowed opacity-50'
                    }`}
                    onClick={() => {
                      if (isCompleted) {
                        setPlaybackRateDialogOpen(true)
                      } else {
                        toast.info('Chỉ có thể sử dụng tốc độ phát khi bài học đã hoàn thành')
                      }
                    }}
                    disabled={!isCompleted}
                  >
                    <span>Tốc độ</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">{playbackRate}x</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 h-7 w-7"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
              >
                {isFullscreen ? (
                  <Minimize className="h-3.5 w-3.5" />
                ) : (
                  <Maximize className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}


      {/* Subtitle Settings Dialog */}
      {subtitleSettings && (
        <SubtitleSettingsDialog
          open={subtitleSettingsOpen}
          onOpenChange={setSubtitleSettingsOpen}
          settings={subtitleSettings}
          onSettingsChange={handleSubtitleSettingsChange}
          container={fullscreenContainer || undefined}
        />
      )}
      <PlaybackRateDialog
        open={playbackRateDialogOpen}
        onOpenChange={setPlaybackRateDialogOpen}
        currentRate={playbackRate}
        onRateChange={(rate) => handlePlaybackRateChange(rate.toString())}
        container={fullscreenContainer || undefined}
      />
    </div>
  );
}

