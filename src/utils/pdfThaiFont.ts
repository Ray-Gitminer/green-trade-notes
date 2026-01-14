import jsPDF from "jspdf";
import sarabunRegularTtf from "@/assets/fonts/Sarabun-Regular.ttf";
import sarabunBoldTtf from "@/assets/fonts/Sarabun-Bold.ttf";

const FONT_FAMILY = "Sarabun";
const VFS_REGULAR = "Sarabun-Regular.ttf";
const VFS_BOLD = "Sarabun-Bold.ttf";

type FontWeight = "normal" | "bold";

// Cache for the font data (base64-encoded TTF)
const cachedFontBase64: Record<FontWeight, string | null> = {
  normal: null,
  bold: null,
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  // Convert in chunks to avoid call stack limits for large files
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function fetchSarabunFont(weight: FontWeight): Promise<string> {
  const cached = cachedFontBase64[weight];
  if (cached) return cached;

  const fontUrl = weight === "bold" ? sarabunBoldTtf : sarabunRegularTtf;
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(`Failed to load Sarabun ${weight} font: ${response.status} ${response.statusText}`);
  }

  const base64 = arrayBufferToBase64(await response.arrayBuffer());
  cachedFontBase64[weight] = base64;
  return base64;
}

/**
 * Adds Sarabun Thai font (TTF) to a jsPDF instance and sets it as default.
 * Call this after creating jsPDF instance and before any text operations.
 */
export async function addThaiFont(doc: jsPDF): Promise<void> {
  try {
    const [regularBase64, boldBase64] = await Promise.all([
      fetchSarabunFont("normal"),
      fetchSarabunFont("bold"),
    ]);

    // Add fonts to VFS (Virtual File System)
    doc.addFileToVFS(VFS_REGULAR, regularBase64);
    doc.addFileToVFS(VFS_BOLD, boldBase64);

    // Register fonts
    doc.addFont(VFS_REGULAR, FONT_FAMILY, "normal");
    doc.addFont(VFS_BOLD, FONT_FAMILY, "bold");

    // Set as default font (all subsequent doc.text uses this unless overridden)
    doc.setFont(FONT_FAMILY, "normal");
  } catch (error) {
    console.warn("Could not load Thai font, using default font:", error);
  }
}

/**
 * Pre-loads Sarabun (regular + bold) for faster PDF generation.
 */
export async function preloadThaiFont(): Promise<void> {
  try {
    await Promise.all([fetchSarabunFont("normal"), fetchSarabunFont("bold")]);
  } catch (error) {
    console.warn("Failed to preload Thai font:", error);
  }
}
