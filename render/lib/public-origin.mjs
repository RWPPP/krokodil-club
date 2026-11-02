const DEFAULT_ORIGIN = 'https://krokodil-proxy-test.onrender.com';

export function publicOrigin(value = process.env.PUBLIC_SERVER_URL || DEFAULT_ORIGIN) {
 const url = new URL(value);
 if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
  throw new Error('PUBLIC_SERVER_URL must be an HTTPS origin');
 }
 return url.origin;
}

export const SITE = publicOrigin();
