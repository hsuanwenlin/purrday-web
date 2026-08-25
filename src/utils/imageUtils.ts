// 限制格式與大小
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 10;

export interface CompressResult {
  base64: string;
  originalSize: string;
  compressedSize: string;
}

/**
 * 壓縮圖片主函式
 */
export function compressImage(
  file: File,
  maxWidth = 1024,
  quality = 0.7
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    // 1. 檢查檔案格式
    if (!ALLOWED_TYPES.includes(file.type)) {
      return reject(new Error("只支援 JPG、PNG 或 WEBP 格式的圖片喔！"));
    }

    // 2. 檢查檔案大小
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return reject(new Error(`圖片太大了！請上傳低於 ${MAX_FILE_SIZE_MB}MB 的圖片`));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        // Canvas 等比例縮放計算
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // 輸出成壓縮後的 Base64 (JPEG 格式)
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);

        // 計算縮減前後的大約體積 (KB)
        const origKB = (file.size / 1024).toFixed(1);
        const compKB = (compressedBase64.length * (3 / 4) / 1024).toFixed(1);

        resolve({
          base64: compressedBase64,
          originalSize: `${origKB} KB`,
          compressedSize: `${compKB} KB`,
        });
      };

      img.onerror = () => reject(new Error("圖片載入失敗，請換一張試試！"));
    };

    reader.onerror = () => reject(new Error("讀取檔案失敗！"));
  });
}