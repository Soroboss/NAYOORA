import { Vibrant } from 'node-vibrant/node';

export interface ExtractedColors {
  primary: string;
  secondary: string;
  text: string;
}

export async function extractColorsFromLogo(logoUrl: string | null): Promise<ExtractedColors> {
  // Default fallback corporate blue theme
  const fallback: ExtractedColors = {
    primary: '#1e40af', // Blue 800
    secondary: '#3b82f6', // Blue 500
    text: '#ffffff',
  };

  if (!logoUrl) {
    return fallback;
  }

  try {
    // node-vibrant can extract palettes from image buffers or URLs
    const palette = await Vibrant.from(logoUrl).getPalette();
    
    // Fallbacks to default if the palette extraction didn't yield specific colors
    const primary = palette.Vibrant?.hex || palette.DarkVibrant?.hex || fallback.primary;
    const secondary = palette.LightVibrant?.hex || palette.Muted?.hex || fallback.secondary;
    const text = palette.DarkMuted?.hex || fallback.text;

    return {
      primary,
      secondary,
      text: '#ffffff' // Usually white text looks best on vibrant backgrounds, or we can use dark depending on brightness
    };
  } catch (error) {
    console.warn("Failed to extract colors from logo, using fallback:", error);
    return fallback;
  }
}
