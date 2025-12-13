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
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { SubtitleSettingsDialog, type SubtitleSettings, DEFAULT_SETTINGS } from './SubtitleSettingsDialog';

interface VideoPlayerProps {
  videoUrl?: string;
  subtitleUrl?: string; // WebVTT subtitle URL
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  initialTime?: number;
  className?: string;
}

export function VideoPlayer({
  videoUrl,
  subtitleUrl,
  onTimeUpdate,
  onEnded,
  initialTime = 0,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [subtitleSettingsOpen, setSubtitleSettingsOpen] = useState(false);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(DEFAULT_SETTINGS);
  const [isDragging, setIsDragging] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const subtitleStyleRef = useRef<HTMLStyleElement | null>(null);
  const isDraggingRef = useRef(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hasAttemptedAutoplayRef = useRef(false);

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
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, duration]);

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

  // Handle skip backward (10 seconds)
  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };

  // Handle skip forward (10 seconds)
  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, currentTime + 10);
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

  // Event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      if (initialTime > 0) {
        video.currentTime = initialTime;
        setCurrentTime(initialTime);
      }
      // Auto-play video when metadata is loaded (with sound)
      if (!hasAttemptedAutoplayRef.current) {
        hasAttemptedAutoplayRef.current = true;
        video.play().catch((error) => {
          // Autoplay may be blocked by browser, that's okay
          // User will need to click play manually
          console.log('Autoplay prevented:', error);
        });
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

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement;
      setIsFullscreen(isFullscreenNow);
      setFullscreenContainer(isFullscreenNow ? (document.fullscreenElement as HTMLElement) : null);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [onTimeUpdate, onEnded, initialTime]);

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
      } else {
        // Only set default if nothing is saved
        setSubtitleSettings(DEFAULT_SETTINGS);
      }
      setSettingsLoaded(true);
    } catch (error) {
      console.error('Error loading subtitle settings:', error);
      setSubtitleSettings(DEFAULT_SETTINGS);
      setSettingsLoaded(true);
    }
  }, [settingsLoaded]);

  // Apply subtitle styles
  useEffect(() => {
    if (!subtitleSettings) return;
    if (!videoRef.current) return;
    
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

    // Text color with opacity
    const textColor = subtitleSettings.color || '#FFFFFF';
    const textOpacity = (subtitleSettings.textOpacity || 100) / 100;
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
    
    // Debug: Log current settings
    
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
  }, [subtitleSettings, showSubtitles]);
  
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

  // Auto-play when videoUrl changes
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      // Reset autoplay attempt flag when videoUrl changes
      hasAttemptedAutoplayRef.current = false;
      
      const video = videoRef.current;
      // Wait for video to be ready
      const handleCanPlay = () => {
        if (!hasAttemptedAutoplayRef.current) {
          hasAttemptedAutoplayRef.current = true;
          // Try autoplay with sound
          video.play().catch((error) => {
            // Autoplay may be blocked by browser, that's okay
            // User will need to click play manually
            console.log('Autoplay prevented:', error);
          });
        }
      };
      
      if (video.readyState >= 3) {
        // Video is already loaded enough to play
        handleCanPlay();
      } else {
        video.addEventListener('canplay', handleCanPlay, { once: true });
        return () => {
          video.removeEventListener('canplay', handleCanPlay);
        };
      }
    }
  }, [videoUrl]);

  // Save subtitle settings to localStorage
  const handleSubtitleSettingsChange = (settings: SubtitleSettings) => {
    try {
      localStorage.setItem('subtitle-settings', JSON.stringify(settings));
      setSubtitleSettings(settings);
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
      className={`relative bg-black aspect-video group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
          setTimeout(() => setShowControls(false), 2000);
        }
      }}
    >
      <video
        ref={videoRef}
        id="lesson-video-player"
        src={videoUrl}
        className="w-full h-full"
        onClick={togglePlay}
        autoPlay
        playsInline
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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div className="absolute bottom-16 left-0 right-0 px-4">
          <div
            ref={progressBarRef}
            className="h-2 bg-white/20 rounded-full overflow-visible cursor-pointer group/progress hover:h-3 transition-all relative"
            onClick={handleSeek}
            onMouseDown={handleDragStart}
          >
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
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={skipBackward}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={skipForward}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 ml-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <div className="w-20 h-1 bg-white/30 rounded-full cursor-pointer">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                    onClick={(e) => {
                      const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                      if (rect) {
                        const pos = (e.clientX - rect.left) / rect.width;
                        handleVolumeChange(Math.max(0, Math.min(1, pos)));
                      }
                    }}
                  />
                </div>
              </div>
              <span className="text-sm ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={playbackRate.toString()} onValueChange={handlePlaybackRateChange}>
                <SelectTrigger className="w-20 h-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <SelectItem value="0.5" className="text-white">0.5x</SelectItem>
                  <SelectItem value="0.75" className="text-white">0.75x</SelectItem>
                  <SelectItem value="1" className="text-white">1x</SelectItem>
                  <SelectItem value="1.25" className="text-white">1.25x</SelectItem>
                  <SelectItem value="1.5" className="text-white">1.5x</SelectItem>
                  <SelectItem value="2" className="text-white">2x</SelectItem>
                </SelectContent>
              </Select>
              {subtitleUrl && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`text-white hover:bg-white/20 ${showSubtitles ? 'bg-white/20' : ''}`}
                    onClick={() => {
                      const newValue = !showSubtitles;
                      setShowSubtitles(newValue);
                      if (videoRef.current) {
                        const tracks = videoRef.current.textTracks;
                        for (let i = 0; i < tracks.length; i++) {
                          tracks[i].mode = newValue ? 'showing' : 'hidden';
                        }
                      }
                    }}
                    title={showSubtitles ? 'Tắt phụ đề' : 'Bật phụ đề'}
                  >
                    <Subtitles className="h-4 w-4" />
                  </Button>
                  {showSubtitles && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => setSubtitleSettingsOpen(true)}
                      title="Cài đặt phụ đề"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </Button>
                  )}
                </>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle Settings Dialog */}
      <SubtitleSettingsDialog
        open={subtitleSettingsOpen}
        onOpenChange={setSubtitleSettingsOpen}
        settings={subtitleSettings}
        onSettingsChange={handleSubtitleSettingsChange}
        container={fullscreenContainer || undefined}
      />
      {/* Debug: Uncomment to check fullscreen container */}
      {/* {isFullscreen && console.log('Fullscreen container:', fullscreenContainer, 'Fullscreen element:', document.fullscreenElement)} */}
    </div>
  );
}

