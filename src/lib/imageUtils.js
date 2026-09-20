/**
 * Toi uu URL anh tu Supabase Storage bang Image Transformation API.
 * Tu dong chuyen anh sang WebP va resize phu hop voi kich thuoc hien thi.
 * Docs: https://supabase.com/docs/guides/storage/image-transformations
 */
export function optimizeImageUrl(url, options = {}) {
  // Temporary disable Image Transformation since Supabase Free plan does not support it
  // and will result in a 400 error.
  return url;
}

export const imgPresets = {
  card: (url) => optimizeImageUrl(url, { width: 400, height: 400, quality: 80 }),
  detail: (url) => optimizeImageUrl(url, { width: 800, height: 800, quality: 90 }),
  banner: (url) => optimizeImageUrl(url, { width: 1200, height: 600, quality: 85 }),
  thumb: (url) => optimizeImageUrl(url, { width: 120, height: 120, quality: 75 }),
};
