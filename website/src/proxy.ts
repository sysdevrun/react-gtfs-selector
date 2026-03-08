export function getProxyUrl(httpsUrl: string): string {
  if (!httpsUrl.startsWith('https://')) {
    throw new Error('URL must start with https://');
  }
  // Remove https:// prefix
  const withoutProtocol = httpsUrl.substring(8);
  return `https://gtfs-proxy.sys-dev-run.re/proxy/${withoutProtocol}`;
}
