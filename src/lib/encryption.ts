// Simple client-side encryption for whistleblower submissions
// In production, use a more robust encryption library

const ENCRYPTION_KEY = 'linksy-ethics-2024'; // In production, use proper key management

export function generateSubmissionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'WB-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function encryptContent(content: string): string {
  // Simple base64 encoding with obfuscation
  // In production, use proper AES encryption
  try {
    const encoded = btoa(unescape(encodeURIComponent(content)));
    return encoded.split('').reverse().join('');
  } catch {
    return btoa(content);
  }
}

export function decryptContent(encrypted: string): string {
  try {
    const reversed = encrypted.split('').reverse().join('');
    return decodeURIComponent(escape(atob(reversed)));
  } catch {
    try {
      return atob(encrypted);
    } catch {
      return encrypted;
    }
  }
}
