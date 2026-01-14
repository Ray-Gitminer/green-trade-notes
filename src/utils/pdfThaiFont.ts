import jsPDF from "jspdf";

// Sarabun font from Google Fonts - Regular weight
const SARABUN_FONT_URL = "https://cdn.jsdelivr.net/npm/@fontsource/sarabun@5.0.28/files/sarabun-thai-400-normal.woff";

// Cache for the font data
let cachedFontBase64: string | null = null;

/**
 * Fetches the Sarabun Thai font and converts it to base64
 */
async function fetchSarabunFont(): Promise<string> {
  if (cachedFontBase64) {
    return cachedFontBase64;
  }

  try {
    const response = await fetch(SARABUN_FONT_URL);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    cachedFontBase64 = base64;
    return base64;
  } catch (error) {
    console.error("Failed to load Sarabun font:", error);
    throw error;
  }
}

/**
 * Adds Sarabun Thai font to jsPDF instance and sets it as default
 * Call this after creating jsPDF instance and before any text operations
 */
export async function addThaiFont(doc: jsPDF): Promise<void> {
  try {
    const fontBase64 = await fetchSarabunFont();
    
    // Add font to VFS (Virtual File System)
    doc.addFileToVFS("Sarabun-Regular.ttf", fontBase64);
    
    // Register the font
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    
    // Set as default font
    doc.setFont("Sarabun", "normal");
  } catch (error) {
    console.warn("Could not load Thai font, using default font:", error);
    // Fallback to default font - Thai characters may not render correctly
  }
}

/**
 * Pre-loads the Thai font for faster PDF generation
 * Call this when component mounts to cache the font
 */
export async function preloadThaiFont(): Promise<void> {
  try {
    await fetchSarabunFont();
  } catch (error) {
    console.warn("Failed to preload Thai font:", error);
  }
}
