import { useState, useRef, useEffect } from 'react';
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
  videoUrl?: string;
  subtitleUrl?: string; // WebVTT subtitle URL
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  initialTime?: number;
  seekTo?: number; // Seek to this time when it changes
  className?: string;
  title?: string; // Lesson title
  showSidebar?: boolean; // Whether sidebar is visible
}

export function VideoPlayer({
  videoUrl,
  subtitleUrl,
  onTimeUpdate,
  onEnded,
  initialTime = 0,
  seekTo,
  className = '',
  title,
  showSidebar = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
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
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [isVideoFocused, setIsVideoFocused] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

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
    }
  };

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

  // Handle seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0 && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = pos * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      isDraggingRef.current = true;
      setIsDragging(true);
      setShowControls(true);
      handleSeek(e);
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
        const newTime = Math.min(Math.max(0, videoRef.current.currentTime + delta), duration);
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
        const newTime = pos * duration;
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
    };
    const handlePause = () => setIsPlaying(false);

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
        console.log('[VideoPlayer] Loading subtitle settings from localStorage:', parsed);
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
        console.log('[VideoPlayer] Migrated settings:', migrated);
        setSubtitleSettings(migrated);
        setSettingsLoaded(true);
      } else {
        // Only set default if nothing is saved
        console.log('[VideoPlayer] No saved settings, using defaults');
        setSubtitleSettings(DEFAULT_SETTINGS);
        setSettingsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading subtitle settings:', error);
      setSubtitleSettings(DEFAULT_SETTINGS);
      setSettingsLoaded(true);
    }
  }, [settingsLoaded]);

  // Debug: Log when subtitleSettings changes
  useEffect(() => {
    if (subtitleSettings) {
      console.log('[VideoPlayer] subtitleSettings state updated:', subtitleSettings);
    }
  }, [subtitleSettings]);

  // Re-apply subtitle settings when video is ready and settings are loaded (after page reload)
  useEffect(() => {
    console.log('[VideoPlayer] Re-apply effect triggered:', {
      hasVideo: !!videoRef.current,
      hasSettings: !!subtitleSettings,
      settingsLoaded,
      videoReadyState: videoRef.current?.readyState
    });
    
    if (!videoRef.current || !subtitleSettings || !settingsLoaded) {
      console.log('[VideoPlayer] Re-apply check failed - waiting for conditions');
      return;
    }
    
    const video = videoRef.current;
    // Wait for video to have metadata
    const checkAndApply = () => {
      if (video.readyState >= 1) {
        console.log('[VideoPlayer] Video ready with settings loaded, forcing subtitle re-render', subtitleSettings);
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
                      console.log('[VideoPlayer] Subtitle track re-enabled with new settings');
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
          console.log('[VideoPlayer] Metadata loaded, will apply settings after styles are ready');
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
                      console.log('[VideoPlayer] Subtitle track refreshed after metadata load');
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
  }, [settingsLoaded, videoUrl, subtitleSettings, showSubtitles]); // Include subtitleSettings to re-apply when it changes

  // Apply subtitle styles
  useEffect(() => {
    if (!subtitleSettings) {
      console.log('[VideoPlayer] No subtitle settings, skipping style application');
      return;
    }
    if (!videoRef.current) {
      console.log('[VideoPlayer] No video ref, skipping style application');
      return;
    }
    if (!settingsLoaded) {
      console.log('[VideoPlayer] Settings not loaded yet, skipping style application');
      return;
    }
    console.log('[VideoPlayer] Applying subtitle styles:', subtitleSettings);
    
    // Determine subtitle position based on controls visibility
    // When controls are visible, push subtitle higher to avoid overlap
    // Controls take up about 80-100px from bottom, so we need to push subtitle higher
    const subtitleBottom = showControls ? '30%' : '5%';

    // Remove old style if exists
    const oldStyle = document.getElementById('subtitle-styles');
    if (oldStyle) {
      oldStyle.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = 'subtitle-styles';
    document.head.appendChild(style);
    subtitleStyleRef.current = style;
    
    // Ensure video has an ID
    if (!videoRef.current.id) {
      videoRef.current.id = 'lesson-video-player';
    }
    const bgColor = subtitleSettings.backgroundColor || '#000000';
    const bgOpacity = (subtitleSettings.backgroundOpacity !== undefined ? subtitleSettings.backgroundOpacity : 0) / 100;
    
    console.log('[VideoPlayer] Applying background color from settings:', {
      rawBgColor: subtitleSettings.backgroundColor,
      bgColor,
      backgroundOpacity: subtitleSettings.backgroundOpacity,
      bgOpacity,
      settings: subtitleSettings
    });
    
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
      console.error('Error parsing background color:', error);
    }
    const bgRgba = `rgba(${bgR}, ${bgG}, ${bgB}, ${bgOpacity})`;
    console.log('[VideoPlayer] Parsed background color RGBA:', bgRgba, { bgR, bgG, bgB, bgOpacity });

    // Text color with opacity
    const textColor = subtitleSettings.color || '#FFFFFF';
    console.log('[VideoPlayer] Applying text color from settings:', {
      rawColor: subtitleSettings.color,
      textColor,
      settings: subtitleSettings
    });
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
      console.error('Error parsing text color:', error);
    }
    const textRgba = `rgba(${textR}, ${textG}, ${textB}, ${textOpacity})`;
    console.log('[VideoPlayer] Parsed text color RGBA:', textRgba, { textR, textG, textB, textOpacity });

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

    // Get video element ID for more specific selector
    const videoId = videoRef.current.id || 'lesson-video-player';
    const videoSelector = `#${videoId}`;
    
    console.log('[VideoPlayer] Creating CSS with:', {
      videoSelector,
      textRgba,
      bgRgba,
      fontSize: subtitleSettings.fontSize,
      fontFamily: subtitleSettings.fontFamily,
      textEffect: subtitleSettings.textEffect
    });
    
    // Apply styles with more specific selectors
    // Use both standard and webkit selectors for better browser compatibility
    style.textContent = `
      ${videoSelector}::cue,
      video::cue {
        font-size: ${subtitleSettings.fontSize || 20}px !important;
        color: ${textRgba} !important;
        font-family: "${subtitleSettings.fontFamily || 'Arial'}", sans-serif !important;
        ${textEffectStyle}
        background-color: ${bgRgba} !important;
        background: ${bgRgba} !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        line-height: 1.4 !important;
        white-space: pre-wrap !important;
        outline: none !important;
      }
      ${videoSelector}::-webkit-media-text-track-display {
        font-size: ${subtitleSettings.fontSize || 20}px !important;
        color: ${textRgba} !important;
        font-family: "${subtitleSettings.fontFamily || 'Arial'}", sans-serif !important;
        ${textEffectStyle}
        background-color: ${bgRgba} !important;
        background: ${bgRgba} !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
      }
      ${videoSelector}::-webkit-media-text-track-container {
        font-size: ${subtitleSettings.fontSize || 20}px !important;
      }
      ${videoSelector}::cue(v[lang="vi"]) {
        bottom: ${subtitleBottom} !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        position: absolute !important;
        width: auto !important;
        max-width: 90% !important;
        z-index: 10 !important;
        transition: bottom 0.3s ease !important;
      }
      /* Additional selectors for better browser support */
      *::cue {
        font-size: ${subtitleSettings.fontSize || 20}px !important;
        color: ${textRgba} !important;
        font-family: "${subtitleSettings.fontFamily || 'Arial'}", sans-serif !important;
        ${textEffectStyle}
        background-color: ${bgRgba} !important;
        background: ${bgRgba} !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
      }
    `;
    
    console.log('[VideoPlayer] CSS applied, first 300 chars:', style.textContent.substring(0, 300));
    console.log('[VideoPlayer] Background RGBA in CSS:', bgRgba);
    
    // Force a re-render of the subtitle track after CSS is applied
    // Only do this when subtitleSettings change, not when showControls changes
    // to avoid flickering when controls appear/disappear
    if (videoRef.current && showSubtitles) {
      setTimeout(() => {
        const tracks = videoRef.current?.textTracks;
        if (tracks) {
          for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].kind === 'subtitles' && tracks[i].mode === 'showing') {
              // Force cue update by toggling
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
  }, [subtitleSettings, showSubtitles, settingsLoaded, videoUrl]); // Add videoUrl to re-apply when video changes
  
  // Separate effect to update subtitle position when controls visibility changes
  // This only updates CSS, doesn't toggle track mode to avoid flickering
  useEffect(() => {
    if (!videoRef.current || !showSubtitles || !subtitleSettings) return;
    
    const subtitleBottom = showControls ? '30%' : '5%';
    const style = document.getElementById('subtitle-styles');
    if (style && style.textContent) {
      const videoId = videoRef.current.id || 'lesson-video-player';
      const videoSelector = `#${videoId}`;
      
      // Update only the bottom value in CSS without toggling track
      const currentCSS = style.textContent;
      const regex = new RegExp(`(${videoSelector.replace('#', '\\#')}::cue\\(v\\[lang="vi"\\]\\s*\\{[^}]*bottom:\\s*)[\\d.]+%`, 'g');
      const newCSS = currentCSS.replace(regex, `$1${subtitleBottom}`);
      
      if (newCSS !== currentCSS) {
        style.textContent = newCSS;
      }
    }
  }, [showControls, showSubtitles, subtitleSettings]);
  

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

  // Force update subtitle track when settings change
  useEffect(() => {
    if (videoRef.current && subtitleUrl && showSubtitles) {
      // Force browser to re-render cues by toggling track mode
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
                // Force a repaint by accessing video properties
                const video = videoRef.current;
                const currentTime = video.currentTime;
                // Trigger a small time change to force cue re-render
                video.currentTime = currentTime + 0.001;
                setTimeout(() => {
                  if (video) {
                    video.currentTime = currentTime;
                  }
                }, 10);
              }
            }, 150);
          }
        }
      }
    }
  }, [subtitleSettings, subtitleUrl, showSubtitles]);

  // Reset initial play button when videoUrl changes
  useEffect(() => {
    setShowInitialPlayButton(false);
    setIsLoading(true);
  }, [videoUrl]);

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
      console.log('[VideoPlayer] Saving subtitle settings:', settings);
      localStorage.setItem('subtitle-settings', JSON.stringify(settings));
      setSubtitleSettings(settings);
      console.log('[VideoPlayer] Settings saved and state updated');
    } catch (error) {
      console.error('Error saving subtitle settings:', error);
    }
  };

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
          className={`absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 transition-opacity duration-300 ${
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
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 controls-container z-50 pointer-events-none ${
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
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.min(duration, currentTime + 5);
                  }
                }}
                title="Tiến 5 giây"
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
                <>
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
                        console.error('Error saving subtitle visibility:', error);
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
                        className="text-white hover:bg-[#2D2D2D] cursor-pointer flex items-center justify-between px-3 py-2.5"
                        onClick={() => setPlaybackRateDialogOpen(true)}
                      >
                        <span>Tốc độ</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">{playbackRate}x</span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
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
      {/* Debug: Uncomment to check fullscreen container */}
      {/* {isFullscreen && console.log('Fullscreen container:', fullscreenContainer, 'Fullscreen element:', document.fullscreenElement)} */}
    </div>
  );
}

