import { API_BASE_URL } from './apiConfig';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const CSS_URL_FUNCTION_PATTERN = /^url\((.*?)\)$/i;
const NGROK_HOST_SUFFIX = 'ngrok-free.app';

const ensureTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value : `${value}/`;

const sanitiseRelative = (value: string): string => value.replace(/^\/+/, '');

const withNgrokBypass = (url: URL): string => {
  if (url.hostname.endsWith(NGROK_HOST_SUFFIX)) {
    url.searchParams.set('ngrok-skip-browser-warning', '1');
  }
  return url.toString();
};

const unique = <T,>(values: Iterable<T>): T[] => {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
};

export interface MediaNormalizationOptions {
  fallback?: string;
  relativePrefixes?: string[];
}

export interface NormalizedMediaValue {
  primary: string;
  fallbacks: string[];
}

export const normalizeMediaValue = (
  raw: unknown,
  options: MediaNormalizationOptions = {},
): NormalizedMediaValue => {
  const fallback = options.fallback;
  const relativePrefixes = options.relativePrefixes ?? ['storage/'];
  const baseUrl = ensureTrailingSlash(API_BASE_URL.replace(/\s+/g, ''));
  const candidates: string[] = [];

  const addRelativeCandidate = (value: string, preferPrimary = false) => {
    try {
      const url = new URL(sanitiseRelative(value), baseUrl);
      const candidate = withNgrokBypass(url);
      if (preferPrimary) {
        candidates.unshift(candidate);
      } else {
        candidates.push(candidate);
      }
    } catch (error) {
      console.error('Impossible de construire l\'URL média à partir d\'un chemin relatif', error, value);
    }
  };

  const addAbsoluteCandidate = (value: string) => {
    try {
      const url = new URL(value);
      const relativeWithQuery =
        url.pathname && url.pathname !== '/'
          ? `${url.pathname}${url.search ?? ''}`
          : null;
      const preferRelativePrimary = url.hostname.endsWith(NGROK_HOST_SUFFIX);

      if (relativeWithQuery && preferRelativePrimary) {
        addRelativeCandidate(relativeWithQuery, true);
      }

      candidates.push(withNgrokBypass(url));

      if (relativeWithQuery && !preferRelativePrimary) {
        addRelativeCandidate(relativeWithQuery);
      }
    } catch (error) {
      console.error('Impossible d\'analyser le candidat d\'URL média absolue', error, value);
    }
  };

  if (raw && typeof raw === 'object') {
    const candidate =
      (raw as { url?: unknown }).url ??
      (raw as { path?: unknown }).path ??
      (raw as { href?: unknown }).href;
    if (typeof candidate === 'string') {
      raw = candidate;
    }
  }

  if (typeof raw === 'string') {
    let trimmed = raw.trim();

    const cssUrlMatch = trimmed.match(CSS_URL_FUNCTION_PATTERN);
    if (cssUrlMatch) {
      trimmed = cssUrlMatch[1].trim().replace(/^['"]|['"]$/g, '');
    }

    if (trimmed.length > 0) {
      if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
        addAbsoluteCandidate(trimmed);
      } else {
        addRelativeCandidate(trimmed);

        const normalisedPrefixes = relativePrefixes
          .map((prefix) => sanitiseRelative(prefix))
          .filter(Boolean);

        for (const prefix of normalisedPrefixes) {
          if (!trimmed.startsWith(prefix)) {
            addRelativeCandidate(`${prefix}${trimmed}`);
          } else {
            const withoutPrefix = sanitiseRelative(trimmed.slice(prefix.length));
            if (withoutPrefix.length > 0) {
              addRelativeCandidate(withoutPrefix);
            }
          }
        }
      }
    }
  }

  const normalisedCandidates = unique(candidates);

  if (normalisedCandidates.length === 0 && fallback) {
    normalisedCandidates.push(fallback);
  }

  const [primaryCandidate, ...rest] = normalisedCandidates;
  const primary =
    primaryCandidate ??
    fallback ??
    'https://picsum.photos/seed/fjkm-placeholder/800/600';

  const fallbacks = rest.slice();

  if (fallback && primary !== fallback && !fallbacks.includes(fallback)) {
    fallbacks.push(fallback);
  }

  return { primary, fallbacks };
};

export const encodeFallbacks = (fallbacks: string[]): string =>
  fallbacks.map((url) => encodeURIComponent(url)).join('|');

export const shiftFallback = (target: HTMLImageElement): string | null => {
  const encoded = target.dataset.fallbacks;
  if (!encoded) return null;

  const queue = encoded.split('|').filter(Boolean);
  const nextEncoded = queue.shift();

  if (queue.length > 0) {
    target.dataset.fallbacks = queue.join('|');
  } else {
    delete target.dataset.fallbacks;
  }

  return nextEncoded ? decodeURIComponent(nextEncoded) : null;
};
