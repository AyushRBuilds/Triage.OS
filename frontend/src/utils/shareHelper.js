const XOR_KEY = 0x5A;

// Helper to generate a small random alphanumeric string
const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();

export const encodeShareToken = (id) => {
  if (!id) return '';
  try {
    // 1. Convert ID to Hex-XOR
    const hex = id.split('')
      .map(char => (char.charCodeAt(0) ^ XOR_KEY).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    
    // 2. Wrap with random noise to make every link unique (e.g., ABCD...ID...XYZ1)
    return `${rand()}${hex}${rand()}`;
  } catch (e) {
    return id;
  }
};

export const decodeShareToken = (token) => {
  if (!token || typeof token !== 'string' || token.length < 10) return null;
  try {
    // 1. Strip the 4-char random prefix and 4-char random suffix
    const hex = token.substring(4, token.length - 4);
    
    // 2. Decode Hex-XOR
    let decoded = '';
    for (let i = 0; i < hex.length; i += 2) {
      const h = hex.substr(i, 2);
      const charCode = parseInt(h, 16) ^ XOR_KEY;
      decoded += String.fromCharCode(charCode);
    }
    
    return decoded;
  } catch (e) {
    return null;
  }
};
