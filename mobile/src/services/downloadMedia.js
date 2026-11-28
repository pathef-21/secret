import { Linking, Platform } from 'react-native';

export async function downloadMediaFile(url, filename = 'man-ak-bae-souvenir.jpg') {
  if (!url) return false;

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const extFromMime = blob.type?.includes('png')
        ? 'png'
        : blob.type?.includes('webp')
        ? 'webp'
        : blob.type?.includes('mp4')
        ? 'mp4'
        : blob.type?.includes('webm')
        ? 'webm'
        : 'jpg';
      const safeName = filename.includes('.') ? filename : `${filename}.${extFromMime}`;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
      return true;
    } catch {
      // Fallback: direct link download / open in new tab
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }
  }

  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
