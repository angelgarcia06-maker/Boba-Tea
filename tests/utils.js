export function validHttpUrl(value) {
  try { const url = new URL(String(value).trim()); return ['http:', 'https:'].includes(url.protocol); }
  catch { return false; }
}
export function validSocialUrl(platform, value) {
  if (!validHttpUrl(value)) return false;
  const {hostname, pathname} = new URL(value);
  const host = hostname.toLowerCase();
  const domain = (base) => host === base || host.endsWith('.' + base);
  if (platform === 'instagram') return domain('instagram.com');
  if (platform === 'tiktok') return domain('tiktok.com');
  if (platform === 'maps') return domain('google.com') && (pathname.startsWith('/maps') || host === 'maps.google.com') || domain('maps.app.goo.gl') || domain('goo.gl') && pathname.startsWith('/maps');
  return false;
}
export function validCtaUrl(value) { return /^#[a-z][a-z\d_-]*$/i.test(value.trim()) || validHttpUrl(value); }
export function publicPageUrl(locationLike) {
  const url = new URL(locationLike.href); url.search = ''; url.hash = ''; return url.toString();
}
export function cleanText(text, limit = 1000) { return String(text ?? '').trim().slice(0, limit); }
export function validateComment(name, body) {
  const n = cleanText(name, 1001), b = cleanText(body, 2001);
  if (n.length < 2 || n.length > 60) return 'El nombre debe tener entre 2 y 60 caracteres.';
  if (b.length < 5 || b.length > 1000) return 'El comentario debe tener entre 5 y 1000 caracteres.';
  return '';
}
export function platformHomeLinks(social) {
  return social.instagram === 'https://www.instagram.com/' && social.tiktok === 'https://www.tiktok.com/' && social.maps === 'https://www.google.com/maps';
}
