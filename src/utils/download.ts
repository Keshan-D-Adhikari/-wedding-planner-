/**
 * Saves content as a file on the user's device. Everything happens in the browser —
 * nothing is uploaded anywhere.
 */
export function downloadFile(content: BlobPart, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();

  // Give the browser a moment to start the download before freeing the memory.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
