import { getAdsTxtPublisherId } from '../lib/adsense';

// Dynamic ads.txt generation for Google AdSense
// This ensures the file is properly served in production

export async function GET() {
  const adsensePublisherId = getAdsTxtPublisherId();

  // Generate ads.txt content
  const content = `google.com, ${adsensePublisherId}, DIRECT, f08c47fec0942fa0`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
    }
  });
}
