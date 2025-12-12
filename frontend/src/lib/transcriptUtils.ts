/**
 * Convert transcript JSON to WebVTT format for HTML5 video subtitles
 */

export interface TranscriptItem {
  time: number; // Time in seconds
  text: string;
}

/**
 * Format time to WebVTT format (HH:MM:SS.mmm)
 */
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Convert transcript items to WebVTT format
 */
export function convertTranscriptToVTT(items: TranscriptItem[]): string {
  if (!items || items.length === 0) {
    return 'WEBVTT\n\n';
  }

  // Sort by time
  const sortedItems = [...items].sort((a, b) => a.time - b.time);

  let vtt = 'WEBVTT\n\n';
  
  sortedItems.forEach((item, index) => {
    const startTime = formatVTTTime(item.time);
    // End time is start of next item, or start + 5 seconds if last item
    const endTime = index < sortedItems.length - 1
      ? formatVTTTime(sortedItems[index + 1].time)
      : formatVTTTime(item.time + 5);
    
    // Escape text for VTT (replace &, <, >)
    const escapedText = item.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, ' '); // Replace newlines with spaces
    
    vtt += `${index + 1}\n`;
    vtt += `${startTime} --> ${endTime}\n`;
    vtt += `${escapedText}\n\n`;
  });

  return vtt;
}

/**
 * Create a blob URL from VTT content
 */
export function createVTTBlobURL(vttContent: string): string {
  const blob = new Blob([vttContent], { type: 'text/vtt' });
  return URL.createObjectURL(blob);
}

