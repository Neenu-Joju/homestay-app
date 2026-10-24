/**
 * Utility to compress image files client-side before uploading to Supabase Storage.
 * Keeps free-tier storage usage minimal (typically compresses 3-8 MB camera photos down to 150-300 KB).
 */

export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.75,
    mimeType = 'image/jpeg',
  } = options;

  // If it's a PDF or not an image, return original
  if (!file.type.startsWith('image/')) {
    return {
      file,
      previewUrl: URL.createObjectURL(file),
      originalSize: file.size,
      compressedSize: file.size,
      ratio: '0%',
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let { width, height } = img;

        // Calculate scaled dimensions keeping aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                previewUrl: URL.createObjectURL(file),
                originalSize: file.size,
                compressedSize: file.size,
                ratio: '0%',
              });
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanFileName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            const originalMB = file.size / (1024 * 1024);
            const compressedMB = blob.size / (1024 * 1024);
            const savedPercent = Math.max(
              0,
              Math.round(((file.size - blob.size) / file.size) * 100)
            );

            resolve({
              file: compressedFile,
              previewUrl: URL.createObjectURL(blob),
              originalSize: file.size,
              compressedSize: blob.size,
              originalFormatted: `${originalMB.toFixed(2)} MB`,
              compressedFormatted: `${compressedMB > 1 ? compressedMB.toFixed(2) + ' MB' : (blob.size / 1024).toFixed(0) + ' KB'}`,
              savedPercent: `${savedPercent}%`,
            });
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        resolve({
          file,
          previewUrl: URL.createObjectURL(file),
          originalSize: file.size,
          compressedSize: file.size,
          ratio: '0%',
        });
      };
    };

    reader.onerror = () => {
      resolve({
        file,
        previewUrl: URL.createObjectURL(file),
        originalSize: file.size,
        compressedSize: file.size,
        ratio: '0%',
      });
    };
  });
};
