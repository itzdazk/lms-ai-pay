export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

export function formatDuration(minutes: number): string {
  if (!minutes) return '0 phút';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return mins > 0 ? `${hours}t ${mins}p` : `${hours}t`;
  }
  return `${mins}p`;
}
