const DEFAULT_CLIENT_ID = 'ca-pub-5745115058807126';

function getRawAdSenseId(): string {
  const fromEnv = import.meta.env.PUBLIC_ADSENSE_CLIENT_ID;
  const trimmed = typeof fromEnv === 'string' ? fromEnv.trim() : '';
  return trimmed || DEFAULT_CLIENT_ID;
}

function extractNumericId(raw: string): string {
  const withoutPrefixes = raw.replace(/^ca-pub-/, '').replace(/^pub-/, '');
  const digitsOnly = withoutPrefixes.replace(/[^0-9]/g, '');
  return digitsOnly || withoutPrefixes;
}

export function getAdSenseClientId(): string {
  const raw = getRawAdSenseId();

  if (raw.startsWith('ca-pub-')) {
    return raw;
  }

  if (raw.startsWith('pub-')) {
    return `ca-pub-${raw.slice(4)}`;
  }

  if (/^\d+$/.test(raw)) {
    return `ca-pub-${raw}`;
  }

  const normalized = extractNumericId(raw);
  return `ca-pub-${normalized}`;
}

export function getAdsTxtPublisherId(): string {
  const normalized = extractNumericId(getRawAdSenseId());
  return `pub-${normalized}`;
}

export function getAdSenseMetaContent(): string {
  return getAdSenseClientId();
}
