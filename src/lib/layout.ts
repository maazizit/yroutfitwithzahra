import { useWindowDimensions } from 'react-native';

const CONTENT_MAX = 560;

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;
  const contentWidth = Math.min(width - 28, CONTENT_MAX);
  const pagePadding = isWide ? Math.max((width - contentWidth) / 2, 14) : 14;

  return { width, isWide, contentWidth, pagePadding };
}
