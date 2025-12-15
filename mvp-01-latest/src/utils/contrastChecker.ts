/**
 * WCAG 2.1 Color Contrast Checker
 * Validates color combinations meet AA/AAA standards
 */

export interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  passesAAALarge: boolean;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Use hex colors (#RRGGBB)');
  }
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function checkContrast(
  foreground: string,
  background: string,
  fontSize: number = 16, // pixels
  isBold: boolean = false
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);
  
  // Large text is 18pt (24px) or 14pt (18.66px) bold
  const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && isBold);
  
  // WCAG 2.1 requirements
  const AA_NORMAL = 4.5;
  const AA_LARGE = 3.0;
  const AAA_NORMAL = 7.0;
  const AAA_LARGE = 4.5;
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: isLargeText ? ratio >= AA_LARGE : ratio >= AA_NORMAL,
    passesAAA: isLargeText ? ratio >= AAA_LARGE : ratio >= AAA_NORMAL,
    passesAALarge: ratio >= AA_LARGE,
    passesAAALarge: ratio >= AAA_LARGE,
  };
}

/**
 * Verify The Mirror's color system meets WCAG AA
 */
export function verifyMirrorColorSystem(): {
  passing: Array<{ name: string; result: ContrastResult }>;
  failing: Array<{ name: string; result: ContrastResult }>;
} {
  const darkTheme = {
    background: '#14161A',
    text: '#E6E8EB',
    textSecondary: '#A9AFB7',
    textMuted: '#6E737A',
    accent: '#CBA35D',
    border: '#2A2D33',
  };
  
  const tests = [
    { name: 'Primary text on dark bg', fg: darkTheme.text, bg: darkTheme.background, size: 16 },
    { name: 'Secondary text on dark bg', fg: darkTheme.textSecondary, bg: darkTheme.background, size: 14 },
    { name: 'Muted text on dark bg', fg: darkTheme.textMuted, bg: darkTheme.background, size: 14 },
    { name: 'Accent text on dark bg', fg: darkTheme.accent, bg: darkTheme.background, size: 16 },
    { name: 'Border on dark bg (UI elements)', fg: darkTheme.border, bg: darkTheme.background, size: 16 },
  ];
  
  const passing: Array<{ name: string; result: ContrastResult }> = [];
  const failing: Array<{ name: string; result: ContrastResult }> = [];
  
  tests.forEach(test => {
    const result = checkContrast(test.fg, test.bg, test.size);
    const item = { name: test.name, result };
    
    if (result.passesAA) {
      passing.push(item);
    } else {
      failing.push(item);
    }
  });
  
  return { passing, failing };
}

/**
 * Suggest adjusted color that meets contrast requirements
 */
export function suggestAdjustedColor(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const bgRgb = hexToRgb(background);
  if (!bgRgb) throw new Error('Invalid background color');
  
  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Calculate target luminance
  const targetLum = bgLum > 0.5
    ? (bgLum + 0.05) / targetRatio - 0.05  // Dark text on light bg
    : (bgLum + 0.05) * targetRatio - 0.05; // Light text on dark bg
  
  // This is simplified - in production, you'd iterate to find the exact color
  const adjustment = targetLum > bgLum ? 1.2 : 0.8;
  
  const fgRgb = hexToRgb(foreground);
  if (!fgRgb) throw new Error('Invalid foreground color');
  
  const adjusted = {
    r: Math.min(255, Math.max(0, Math.round(fgRgb.r * adjustment))),
    g: Math.min(255, Math.max(0, Math.round(fgRgb.g * adjustment))),
    b: Math.min(255, Math.max(0, Math.round(fgRgb.b * adjustment))),
  };
  
  return `#${adjusted.r.toString(16).padStart(2, '0')}${adjusted.g.toString(16).padStart(2, '0')}${adjusted.b.toString(16).padStart(2, '0')}`;
}
