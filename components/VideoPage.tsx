import React, {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { VideoItem } from '../types';
import { API_BASE_URL } from '../utils/apiConfig';
import {
  encodeFallbacks,
  normalizeMediaValue,
  shiftFallback,
} from '../utils/mediaUrl';

const FALLBACK_THUMBNAIL = 'https://img.freepik.com/free-vector/film-strip-with-blue-background_1017-29914.jpg?t=st=1731708207~exp=1731711807~hmac=6bce3a20112a2d1064573d4032c042a9ec3841e46431761279bae7664d763529&w=1380';
const FILTER_DEFAULT = 'Tous';
const DEFAULT_PAGE_SIZE = 6;
const HLS_CDN_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js';

interface HlsLikeInstance {
  loadSource(url: string): void;
  attachMedia(video: HTMLVideoElement): void;
  destroy(): void;
}

type HlsConstructor = {
  new (config?: Record<string, unknown>): HlsLikeInstance;
  isSupported(): boolean;
};

declare global {
  interface Window {
    Hls?: HlsConstructor;
  }
}

const loadHlsLibrary = async (): Promise<HlsConstructor | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.Hls) {
    return window.Hls;
  }

  if (document.getElementById('fjkm-hls-script')) {
    return new Promise((resolve) => {
      const check = () => {
        if (window.Hls) {
          resolve(window.Hls);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = 'fjkm-hls-script';
    script.src = HLS_CDN_SRC;
    script.async = true;
    script.onload = () => {
      resolve(window.Hls ?? null);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
};

const guessMimeType = (url: string): string => {
  const sanitised = url.split('?')[0].toLowerCase();
  if (sanitised.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  if (sanitised.endsWith('.mpd')) return 'application/dash+xml';
  if (sanitised.endsWith('.webm')) return 'video/webm';
  if (sanitised.endsWith('.ogv') || sanitised.endsWith('.ogg')) return 'video/ogg';
  return 'video/mp4';
};

const YOUTUBE_WATCH_BASE = 'https://www.youtube.com/watch?v=';
const YOUTUBE_EMBED_BASE = 'https://www.youtube.com/embed/';

const getInitials = (value: string): string => {
  const words = value.trim().split(/\s+/u);
  if (words.length === 0) return 'FJ';
  const first = words[0]?.[0];
  const last = words.length > 1 ? words[words.length - 1]?.[0] : words[0]?.[1];
  return `${first ?? 'F'}${last ?? 'J'}`.toUpperCase();
};

const formatRelativeTime = (date: string): string => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'Il y a peu';
  }
  const now = Date.now();
  const diffMs = parsed.getTime() - now;
  const absMs = Math.abs(diffMs);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['week', 1000 * 60 * 60 * 24 * 7],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
  ];
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  for (const [unit, value] of units) {
    if (absMs >= value) {
      const amount = Math.round(diffMs / value);
      return rtf.format(amount, unit);
    }
  }
  return 'Il y a quelques instants';
};

const formatDuration = (duration?: string | number | null): string | null => {
  if (!duration) return null;
  if (typeof duration === 'string') {
    const trimmed = duration.trim();
    if (trimmed.includes(':')) return trimmed;
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber)) {
      duration = asNumber;
    } else {
      return trimmed;
    }
  }
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    const seconds = Math.max(0, Math.floor(duration));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remaining
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  }
  return null;
};

const pickString = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return undefined;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.-]+/g, ''));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const shuffle = <T,>(items: T[]): T[] => {
  const clone = items.slice();
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

const getYoutubeIdFromUrl = (value: string): string | undefined => {
  try {
    const url = new URL(value.trim());
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '').trim() || undefined;
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v.trim();
      const path = url.pathname.split('/').filter(Boolean);
      const embedIndex = path.indexOf('embed');
      if (embedIndex !== -1 && path[embedIndex + 1]) {
        return path[embedIndex + 1];
      }
    }
  } catch (error) {
    console.warn('Impossible d\'analyser l\'URL YouTube', value, error);
  }
  return undefined;
};

const resolveVideoUrls = (candidate: {
  videoUrl?: unknown;
  video_url?: unknown;
  url?: unknown;
  link?: unknown;
  watchUrl?: unknown;
  watch_url?: unknown;
  embedUrl?: unknown;
  embed_url?: unknown;
  youtubeId?: unknown;
  youtube_id?: unknown;
  videoId?: unknown;
  video_id?: unknown;
}): { videoUrl: string; embedUrl: string; platform?: VideoItem['platform'] } => {
  let maybeVideoUrl =
    pickString(
      candidate.videoUrl,
      candidate.video_url,
      candidate.watchUrl,
      candidate.watch_url,
      candidate.url,
      candidate.link,
    ) ?? '';

  const youtubeId =
    pickString(
      candidate.youtubeId,
      candidate.youtube_id,
      candidate.videoId,
      candidate.video_id,
    ) ?? (maybeVideoUrl ? getYoutubeIdFromUrl(maybeVideoUrl) : undefined);

  if ((!maybeVideoUrl || maybeVideoUrl.length === 0) && youtubeId) {
    maybeVideoUrl = `${YOUTUBE_WATCH_BASE}${youtubeId}`;
  }

  let embedUrl =
    pickString(candidate.embedUrl, candidate.embed_url) ??
    (youtubeId ? `${YOUTUBE_EMBED_BASE}${youtubeId}` : '');

  if (!embedUrl || embedUrl.length === 0) {
    embedUrl = maybeVideoUrl;
  }

  const platform: VideoItem['platform'] | undefined =
    youtubeId ||
    (maybeVideoUrl &&
      (maybeVideoUrl.includes('youtube.com') || maybeVideoUrl.includes('youtu.be')))
      ? 'youtube'
      : undefined;

  return {
    videoUrl: maybeVideoUrl,
    embedUrl,
    platform,
  };
};

const mapVideoCollection = (payload: unknown): VideoItem[] => {
  const mapArray = (items: unknown[]): VideoItem[] =>
    items.map((raw, index) => {
      const candidate = raw as Partial<VideoItem> & {
        id?: unknown;
        title?: unknown;
        thumbnailUrl?: unknown;
        thumbnail?: unknown;
        channel?: unknown;
        channelName?: unknown;
        channel_name?: unknown;
        views?: unknown;
        viewCount?: unknown;
        view_count?: unknown;
        statistics?: unknown;
        publishedAt?: unknown;
        published_at?: unknown;
        createdAt?: unknown;
        created_at?: unknown;
        duration?: unknown;
        tags?: unknown;
        categories?: unknown;
        description?: unknown;
      };

      const channel =
        pickString(
          candidate.channelName,
          candidate.channel_name,
          typeof candidate.channel === 'object'
            ? (candidate.channel as { name?: unknown }).name
            : null,
        ) ?? 'FJKM Anosivavaka';

      const rawThumbnail =
        pickString(
          candidate.thumbnailUrl,
          candidate.thumbnail,
          (candidate as { posterUrl?: unknown }).posterUrl,
          (candidate as { poster?: unknown }).poster,
          (candidate as { cover?: unknown }).cover,
        ) ?? '';
      const { primary, fallbacks } = normalizeMediaValue(rawThumbnail, {
        fallback: FALLBACK_THUMBNAIL,
      });

      const views =
        toNumber(candidate.views) ??
        toNumber(
          typeof candidate.statistics === 'object'
            ? (candidate.statistics as { views?: unknown }).views
            : undefined,
        ) ??
        toNumber(
          typeof candidate.viewCount === 'object'
            ? (candidate.viewCount as { total?: unknown }).total
            : candidate.viewCount,
        ) ??
        toNumber(
          typeof candidate.view_count === 'object'
            ? (candidate.view_count as { total?: unknown }).total
            : candidate.view_count,
        ) ??
        0;

      const timestamps = [
        pickString(candidate.publishedAt),
        pickString(candidate.published_at),
        pickString(candidate.createdAt),
        pickString(candidate.created_at),
      ].filter(Boolean) as string[];

      const publishedAt =
        timestamps.find((value) => !Number.isNaN(new Date(value).getTime())) ??
        new Date().toISOString();

      const tagsRaw =
        candidate.tags ??
        (typeof candidate.categories === 'object'
          ? (candidate.categories as { name?: string }[]).map((item) =>
              item?.name ?? '',
            )
          : candidate.categories);

      const tags =
        Array.isArray(tagsRaw) && tagsRaw.length > 0
          ? tagsRaw
              .map((item) =>
                typeof item === 'string'
                  ? item.trim()
                  : typeof item === 'object' && item
                  ? pickString((item as { name?: unknown }).name)
                  : null,
              )
              .filter((item): item is string => Boolean(item && item.length > 0))
          : [];

      const streamUrl =
        pickString(
          (candidate as { streamUrl?: unknown }).streamUrl,
          (candidate as { stream_url?: unknown }).stream_url,
          (candidate as { stream?: unknown }).stream,
          (candidate as { source?: unknown }).source,
          (candidate as { src?: unknown }).src,
          (candidate as { hls?: unknown }).hls,
          (candidate as { hlsUrl?: unknown }).hlsUrl,
          (candidate as { hls_url?: unknown }).hls_url,
          candidate.videoUrl,
        ) ?? null;

      const streamType =
        pickString(
          (candidate as { streamType?: unknown }).streamType,
          (candidate as { stream_type?: unknown }).stream_type,
          (candidate as { mimeType?: unknown }).mimeType,
          (candidate as { mime_type?: unknown }).mime_type,
        ) ?? null;

      const resolved = resolveVideoUrls(candidate);

      let platform: VideoItem['platform'] = resolved.platform ?? 'youtube';
      if (streamUrl) {
        platform = 'other';
      } else if (
        resolved.videoUrl &&
        !resolved.videoUrl.includes('youtube.com') &&
        !resolved.videoUrl.includes('youtu.be')
      ) {
        platform = 'other';
      }

      const safeVideoUrl =
        resolved.videoUrl || streamUrl || resolved.embedUrl || 'about:blank';
      const safeEmbedUrl =
        resolved.embedUrl || streamUrl || resolved.videoUrl || safeVideoUrl;
      const resolvedStreamType = streamUrl
        ? streamType ?? guessMimeType(streamUrl)
        : streamType;

      return {
        id: pickString(candidate.id) ?? `video-${index}`,
        title: pickString(candidate.title) ?? `Vidéo ${index + 1}`,
        thumbnailUrl: primary,
        thumbnailFallbacks: fallbacks,
        channelName: channel,
        views,
        publishedAt,
        duration: formatDuration(candidate.duration),
        tags,
        description: pickString(candidate.description) ?? '',
        videoUrl: safeVideoUrl,
        embedUrl: safeEmbedUrl,
        streamUrl,
        streamType: resolvedStreamType ?? null,
        platform,
      } satisfies VideoItem;
    });

  if (Array.isArray(payload)) {
    return mapArray(payload);
  }

  if (payload && typeof payload === 'object') {
    const maybeData = (payload as { data?: unknown }).data;
    if (Array.isArray(maybeData)) {
      return mapArray(maybeData);
    }
  }

  throw new Error('Réponse de vidéos invalide');
};

const FALLBACK_VIDEOS: VideoItem[] = [
  {
    id: '13aWK_9Gt_w',
    title: "Fotoampivavahana FJKM 19 Okt 2025 Ambavahadimitafo Culte FJKM Official Worship Service ©FTV-AFiFaB",
    channelName: "FJKMorg",
    duration: '1:04:04',
    views: 1100,
    publishedAt: '2025-10-19T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship', 'Ambavahadimitafo'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 19 Okt 2025 Ambavahadimitafo Culte FJKM Official Worship Service ©FTV-AFiFaB.",
    thumbnailUrl: 'https://i.ytimg.com/vi/13aWK_9Gt_w/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/13aWK_9Gt_w/maxresdefault.jpg', 'https://i.ytimg.com/vi/13aWK_9Gt_w/sddefault.jpg', 'https://i.ytimg.com/vi/13aWK_9Gt_w/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=13aWK_9Gt_w',
    embedUrl: 'https://www.youtube.com/embed/13aWK_9Gt_w',
    platform: 'youtube',
  },
  {
    id: '1HJEbbZlatM',
    title: "Fotoampivavahana FJKM PASKA 20 Aprily 2025 Ambanilalana  Culte FJKM Official Worship Sce ©FTV-AFiFaB",
    channelName: "FJKMorg",
    duration: '1:14:45',
    views: 6000,
    publishedAt: '2025-04-20T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship', 'Ambanilalana'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM PASKA 20 Aprily 2025 Ambanilalana  Culte FJKM Official Worship Sce ©FTV-AFiFaB.",
    thumbnailUrl: 'https://i.ytimg.com/vi/1HJEbbZlatM/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/1HJEbbZlatM/maxresdefault.jpg', 'https://i.ytimg.com/vi/1HJEbbZlatM/sddefault.jpg', 'https://i.ytimg.com/vi/1HJEbbZlatM/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=1HJEbbZlatM',
    embedUrl: 'https://www.youtube.com/embed/1HJEbbZlatM',
    platform: 'youtube',
  },
  {
    id: '24xlrY4UJ6E',
    title: "HERINANDRO MASINA 2025 : ALAROBIA 16 APRILY 2025 - FJKM ISOTRY FITIAVANA",
    channelName: "FJKM Isotry Fitiavana",
    duration: '1:08:27',
    views: 1000,
    publishedAt: '2025-04-16T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship'],
    description: "Rediffusion YouTube du culte FJKM — HERINANDRO MASINA 2025 : ALAROBIA 16 APRILY 2025 - FJKM ISOTRY FITIAVANA.",
    thumbnailUrl: 'https://i.ytimg.com/vi/24xlrY4UJ6E/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/24xlrY4UJ6E/maxresdefault.jpg', 'https://i.ytimg.com/vi/24xlrY4UJ6E/sddefault.jpg', 'https://i.ytimg.com/vi/24xlrY4UJ6E/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=24xlrY4UJ6E',
    embedUrl: 'https://www.youtube.com/embed/24xlrY4UJ6E',
    platform: 'youtube',
  },
  {
    id: '25MijQ6dvVI',
    title: "20 Desambra Fanoloran jaza   Batisa   Fandraisana Katekomena andiany Fahazavana",
    channelName: "FJKM Ambavahadimitafo",
    duration: '58:03',
    views: 165,
    publishedAt: '2025-11-03T21:43:04.183114Z',
    tags: ['FJKM', 'Culte', 'Worship'],
    description: "Rediffusion YouTube du culte FJKM — 20 Desambra Fanoloran jaza   Batisa   Fandraisana Katekomena andiany Fahazavana.",
    thumbnailUrl: 'https://i.ytimg.com/vi/25MijQ6dvVI/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/25MijQ6dvVI/maxresdefault.jpg', 'https://i.ytimg.com/vi/25MijQ6dvVI/sddefault.jpg', 'https://i.ytimg.com/vi/25MijQ6dvVI/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=25MijQ6dvVI',
    embedUrl: 'https://www.youtube.com/embed/25MijQ6dvVI',
    platform: 'youtube',
  },
  {
    id: '34ekukei6hE',
    title: "Fotoampivavahana FJKM 6 Novambra 2022 Ambohijanaka Fitiavana.\"Miomana handray ny Mpamonjy\" ©FTV-FJKM",
    channelName: "FJKMorg",
    duration: '1:00:13',
    views: 358,
    publishedAt: '2022-11-06T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship', 'Ambohijanaka'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 6 Novambra 2022 Ambohijanaka Fitiavana.\"Miomana handray ny Mpamonjy\" ©FTV-FJKM.",
    thumbnailUrl: 'https://i.ytimg.com/vi/34ekukei6hE/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/34ekukei6hE/maxresdefault.jpg', 'https://i.ytimg.com/vi/34ekukei6hE/sddefault.jpg', 'https://i.ytimg.com/vi/34ekukei6hE/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=34ekukei6hE',
    embedUrl: 'https://www.youtube.com/embed/34ekukei6hE',
    platform: 'youtube',
  },
  {
    id: '4Om212Il69w',
    title: "FJKM Ambavahadimitafo 03 Mey 2020",
    channelName: "FJKM Ambavahadimitafo",
    duration: '54:57',
    views: 107,
    publishedAt: '2020-05-03T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship', 'Ambavahadimitafo'],
    description: "Rediffusion YouTube du culte FJKM — FJKM Ambavahadimitafo 03 Mey 2020.",
    thumbnailUrl: 'https://i.ytimg.com/vi/4Om212Il69w/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/4Om212Il69w/maxresdefault.jpg', 'https://i.ytimg.com/vi/4Om212Il69w/sddefault.jpg', 'https://i.ytimg.com/vi/4Om212Il69w/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=4Om212Il69w',
    embedUrl: 'https://www.youtube.com/embed/4Om212Il69w',
    platform: 'youtube',
  },
  {
    id: '4ZqpOfSyG0o',
    title: "Fotoampivavahana FJKM Pentekosta 2025 8 Jona Manjakaray Culte FJKM Official Worship Sce ©FTV-AFiFaB",
    channelName: "FJKMorg",
    duration: '1:06:09',
    views: 3600,
    publishedAt: '2025-10-30T21:43:09.722533Z',
    tags: ['FJKM', 'Culte', 'Worship', 'Pentekosta'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM Pentekosta 2025 8 Jona Manjakaray Culte FJKM Official Worship Sce ©FTV-AFiFaB.",
    thumbnailUrl: 'https://i.ytimg.com/vi/4ZqpOfSyG0o/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/4ZqpOfSyG0o/maxresdefault.jpg', 'https://i.ytimg.com/vi/4ZqpOfSyG0o/sddefault.jpg', 'https://i.ytimg.com/vi/4ZqpOfSyG0o/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=4ZqpOfSyG0o',
    embedUrl: 'https://www.youtube.com/embed/4ZqpOfSyG0o',
    platform: 'youtube',
  },
  {
    id: '7WB5n20usGQ',
    title: "Fotoampivavahana FJKM 5 Okt 2025 Rasalama Martiora Ambohipotsy Culte Official Worship  ©FTV-AFiFaB",
    channelName: "FJKMorg",
    duration: '56:07',
    views: 1400,
    publishedAt: '2025-10-05T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship', 'Rasalama'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 5 Okt 2025 Rasalama Martiora Ambohipotsy Culte Official Worship  ©FTV-AFiFaB.",
    thumbnailUrl: 'https://i.ytimg.com/vi/7WB5n20usGQ/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/7WB5n20usGQ/maxresdefault.jpg', 'https://i.ytimg.com/vi/7WB5n20usGQ/sddefault.jpg', 'https://i.ytimg.com/vi/7WB5n20usGQ/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=7WB5n20usGQ',
    embedUrl: 'https://www.youtube.com/embed/7WB5n20usGQ',
    platform: 'youtube',
  },
  {
    id: 'alSqMm1j8is',
    title: "Fotoampivavahana FJKM 29 may 2022. Manavao ny Fanahy Masina. Ivontoearana Spia. Nalaina tao FTV-FJKM",
    channelName: "FJKMorg",
    duration: '52:51',
    views: 1400,
    publishedAt: '2022-05-29T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 29 may 2022. Manavao ny Fanahy Masina. Ivontoearana Spia. Nalaina tao FTV-FJKM.",
    thumbnailUrl: 'https://i.ytimg.com/vi/alSqMm1j8is/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/alSqMm1j8is/maxresdefault.jpg', 'https://i.ytimg.com/vi/alSqMm1j8is/sddefault.jpg', 'https://i.ytimg.com/vi/alSqMm1j8is/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=alSqMm1j8is',
    embedUrl: 'https://www.youtube.com/embed/alSqMm1j8is',
    platform: 'youtube',
  },
  {
    id: 'AZysdVKRLKE',
    title: "Fotoampivavahana FJKM Taombaovao 1Jan 2025 Namontana Fialofana Culte FJKM Official Worship FtvAFiFaB",
    channelName: "FJKMorg",
    duration: '52:02',
    views: 29000,
    publishedAt: '2025-11-01T21:43:36.546374Z',
    tags: ['FJKM', 'Culte', 'Worship', 'Namontana'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM Taombaovao 1Jan 2025 Namontana Fialofana Culte FJKM Official Worship FtvAFiFaB.",
    thumbnailUrl: 'https://i.ytimg.com/vi/AZysdVKRLKE/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/AZysdVKRLKE/maxresdefault.jpg', 'https://i.ytimg.com/vi/AZysdVKRLKE/sddefault.jpg', 'https://i.ytimg.com/vi/AZysdVKRLKE/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=AZysdVKRLKE',
    embedUrl: 'https://www.youtube.com/embed/AZysdVKRLKE',
    platform: 'youtube',
  },
  {
    id: 'cd1PpGI8XKc',
    title: "Fotoampivavahana FJKM 21 Sept. 2025 Andohatanjona Culte FJKM Official Worship Service ©FTV-AFiFaB",
    channelName: "FJKMorg",
    duration: '53:40',
    views: 373,
    publishedAt: '2025-09-21T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship', 'Andohatanjona'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 21 Sept. 2025 Andohatanjona Culte FJKM Official Worship Service ©FTV-AFiFaB.",
    thumbnailUrl: 'https://i.ytimg.com/vi/cd1PpGI8XKc/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/cd1PpGI8XKc/maxresdefault.jpg', 'https://i.ytimg.com/vi/cd1PpGI8XKc/sddefault.jpg', 'https://i.ytimg.com/vi/cd1PpGI8XKc/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=cd1PpGI8XKc',
    embedUrl: 'https://www.youtube.com/embed/cd1PpGI8XKc',
    platform: 'youtube',
  },
  {
    id: 'EfwYJidw_uc',
    title: "Fotoampivavahana FJKM 31 Jolay 2022. Avaratr'Andohalo. Iorenana amin'ny finoana ny fanompoana. © FTV",
    channelName: "FJKMorg",
    duration: '1:09:53',
    views: 1400,
    publishedAt: '2022-07-31T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 31 Jolay 2022. Avaratr'Andohalo. Iorenana amin'ny finoana ny fanompoana. © FTV.",
    thumbnailUrl: 'https://i.ytimg.com/vi/EfwYJidw_uc/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/EfwYJidw_uc/maxresdefault.jpg', 'https://i.ytimg.com/vi/EfwYJidw_uc/sddefault.jpg', 'https://i.ytimg.com/vi/EfwYJidw_uc/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=EfwYJidw_uc',
    embedUrl: 'https://www.youtube.com/embed/EfwYJidw_uc',
    platform: 'youtube',
  },
  {
    id: 'EW4rV746dpo',
    title: "Fotoampivavahana FJKM 3 jolay 2022. Anosizato Fonenana Masina Spaa11. Nalaina @fjkmtvfahazavana9859",
    channelName: "FJKMorg",
    duration: '55:26',
    views: 511,
    publishedAt: '2022-07-03T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 3 jolay 2022. Anosizato Fonenana Masina Spaa11. Nalaina @fjkmtvfahazavana9859.",
    thumbnailUrl: 'https://i.ytimg.com/vi/EW4rV746dpo/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/EW4rV746dpo/maxresdefault.jpg', 'https://i.ytimg.com/vi/EW4rV746dpo/sddefault.jpg', 'https://i.ytimg.com/vi/EW4rV746dpo/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=EW4rV746dpo',
    embedUrl: 'https://www.youtube.com/embed/EW4rV746dpo',
    platform: 'youtube',
  },
  {
    id: 'hjoJuHoRZIo',
    title: "Fotoampivavahana FJKM 15 may 2022. Katedraly Analakely Spia. \"Manavao ny Fanahy Masina\". ©FtvFjkm",
    channelName: "FJKMorg",
    duration: '1:02:32',
    views: 737,
    publishedAt: '2022-05-15T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 15 may 2022. Katedraly Analakely Spia. \"Manavao ny Fanahy Masina\". ©FtvFjkm.",
    thumbnailUrl: 'https://i.ytimg.com/vi/hjoJuHoRZIo/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/hjoJuHoRZIo/maxresdefault.jpg', 'https://i.ytimg.com/vi/hjoJuHoRZIo/sddefault.jpg', 'https://i.ytimg.com/vi/hjoJuHoRZIo/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=hjoJuHoRZIo',
    embedUrl: 'https://www.youtube.com/embed/hjoJuHoRZIo',
    platform: 'youtube',
  },
  {
    id: 'IyKr2ss_acw',
    title: "FANOMPOAM-PIVAVAHANA ALAHADY 06 JOLAY 2025 - FJKM ISOTRY FITIAVANA",
    channelName: "FJKM Isotry Fitiavana",
    duration: '57:33',
    views: 0,
    publishedAt: '2025-07-06T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship'],
    description: "Rediffusion YouTube du culte FJKM — FANOMPOAM-PIVAVAHANA ALAHADY 06 JOLAY 2025 - FJKM ISOTRY FITIAVANA.",
    thumbnailUrl: 'https://i.ytimg.com/vi/IyKr2ss_acw/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/IyKr2ss_acw/maxresdefault.jpg', 'https://i.ytimg.com/vi/IyKr2ss_acw/sddefault.jpg', 'https://i.ytimg.com/vi/IyKr2ss_acw/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=IyKr2ss_acw',
    embedUrl: 'https://www.youtube.com/embed/IyKr2ss_acw',
    platform: 'youtube',
  },
  {
    id: 'kArbvtkM4rA',
    title: "Fotoampivavahana FJKM 19 Desambra 2021-Anonimasina Ziona Ambatolampikely SPAA12. Nalaina @FTV Fjkm.",
    channelName: "FJKMorg",
    duration: '1:13:25',
    views: 318,
    publishedAt: '2021-12-19T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 19 Desambra 2021-Anonimasina Ziona Ambatolampikely SPAA12. Nalaina @FTV Fjkm..",
    thumbnailUrl: 'https://i.ytimg.com/vi/kArbvtkM4rA/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/kArbvtkM4rA/maxresdefault.jpg', 'https://i.ytimg.com/vi/kArbvtkM4rA/sddefault.jpg', 'https://i.ytimg.com/vi/kArbvtkM4rA/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=kArbvtkM4rA',
    embedUrl: 'https://www.youtube.com/embed/kArbvtkM4rA',
    platform: 'youtube',
  },
  {
    id: 'l9ASOAv5_yo',
    title: "Fotoampivavahana FJKM 14 Sept 2025 Rasalama Manarintsoa Culte Official Worship Service ©FTV-AFiFaB",
    channelName: "FJKMorg",
    duration: '53:13',
    views: 598,
    publishedAt: '2025-09-14T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship', 'Rasalama'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 14 Sept 2025 Rasalama Manarintsoa Culte Official Worship Service ©FTV-AFiFaB.",
    thumbnailUrl: 'https://i.ytimg.com/vi/l9ASOAv5_yo/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/l9ASOAv5_yo/maxresdefault.jpg', 'https://i.ytimg.com/vi/l9ASOAv5_yo/sddefault.jpg', 'https://i.ytimg.com/vi/l9ASOAv5_yo/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=l9ASOAv5_yo',
    embedUrl: 'https://www.youtube.com/embed/l9ASOAv5_yo',
    platform: 'youtube',
  },
  {
    id: 'lBYVePijmKU',
    title: "Fotoampivavahana FJKM 13 Feb 2022 Amboasarikely SPAA10. Alahady \"Baiboly\".Nalaina tao @FTV-FJKM",
    channelName: "FJKMorg",
    duration: '1:09:01',
    views: 408,
    publishedAt: '2022-02-13T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship', 'Amboasarikely'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 13 Feb 2022 Amboasarikely SPAA10. Alahady \"Baiboly\".Nalaina tao @FTV-FJKM.",
    thumbnailUrl: 'https://i.ytimg.com/vi/lBYVePijmKU/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/lBYVePijmKU/maxresdefault.jpg', 'https://i.ytimg.com/vi/lBYVePijmKU/sddefault.jpg', 'https://i.ytimg.com/vi/lBYVePijmKU/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=lBYVePijmKU',
    embedUrl: 'https://www.youtube.com/embed/lBYVePijmKU',
    platform: 'youtube',
  },
  {
    id: 'mPCmpXKgpVQ',
    title: "Fotoampivavahana FJKM 7 Aogositra 2022. Mamoriarivo Fitiavana Spia. Tano mafy ny Finoana. ©FTV-FJKM",
    channelName: "FJKMorg",
    duration: '1:02:26',
    views: 7000,
    publishedAt: '2022-08-07T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship'],
    description: "Rediffusion YouTube du culte FJKM — Fotoampivavahana FJKM 7 Aogositra 2022. Mamoriarivo Fitiavana Spia. Tano mafy ny Finoana. ©FTV-FJKM.",
    thumbnailUrl: 'https://i.ytimg.com/vi/mPCmpXKgpVQ/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/mPCmpXKgpVQ/maxresdefault.jpg', 'https://i.ytimg.com/vi/mPCmpXKgpVQ/sddefault.jpg', 'https://i.ytimg.com/vi/mPCmpXKgpVQ/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=mPCmpXKgpVQ',
    embedUrl: 'https://www.youtube.com/embed/mPCmpXKgpVQ',
    platform: 'youtube',
  },
  {
    id: 'QfAoeZSiHRk',
    title: "FANOMPOAM-PIVAVAHANA ALAHADY 15 JONA 2025 - FJKM ISOTRY FITIAVANA",
    channelName: "FJKM Isotry Fitiavana",
    duration: '1:14:58',
    views: 727,
    publishedAt: '2025-06-15T12:00:00Z',
    tags: ['FJKM', 'Culte', 'Worship'],
    description: "Rediffusion YouTube du culte FJKM — FANOMPOAM-PIVAVAHANA ALAHADY 15 JONA 2025 - FJKM ISOTRY FITIAVANA.",
    thumbnailUrl: 'https://i.ytimg.com/vi/QfAoeZSiHRk/hqdefault.jpg',
    thumbnailFallbacks: ['https://i.ytimg.com/vi/QfAoeZSiHRk/maxresdefault.jpg', 'https://i.ytimg.com/vi/QfAoeZSiHRk/sddefault.jpg', 'https://i.ytimg.com/vi/QfAoeZSiHRk/mqdefault.jpg'],
    videoUrl: 'https://www.youtube.com/watch?v=QfAoeZSiHRk',
    embedUrl: 'https://www.youtube.com/embed/QfAoeZSiHRk',
    platform: 'youtube',
  },
];

const ActiveVideoSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="aspect-video w-full animate-pulse rounded-2xl bg-gray-200" />
    <div className="space-y-2">
      <div className="h-5 w-3/4 rounded bg-gray-200" />
      <div className="h-4 w-1/2 rounded bg-gray-100" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-4 w-2/3 rounded bg-gray-100" />
    </div>
  </div>
);

const ListSkeleton: React.FC = () => (
  <div className="animate-pulse rounded-2xl bg-white/80 p-3 shadow-sm">
    <div className="flex gap-3">
      <div className="h-24 w-40 flex-shrink-0 rounded-xl bg-gray-200" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-100" />
        <div className="h-3 w-1/2 rounded bg-gray-100" />
      </div>
    </div>
  </div>
);

interface VideoCardProps {
  video: VideoItem;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = memo(({ video, isActive, onSelect }) => {
  const handleImageError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const target = event.currentTarget;
      const nextSrc = shiftFallback(target);
      if (nextSrc) {
        target.src = nextSrc;
      } else {
        target.onerror = null;
        target.src = FALLBACK_THUMBNAIL;
      }
    },
    [],
  );

  return (
    <button
      type="button"
      onClick={() => onSelect(video.id)}
      aria-pressed={isActive}
      className={`group flex w-full gap-3 rounded-2xl bg-white/90 p-3 text-left shadow-sm transition hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
    >
      <div className="relative h-24 w-40 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        <img
          src={video.thumbnailUrl}
          onError={handleImageError}
          alt={video.title}
          loading="lazy"
          data-fallbacks={
            video.thumbnailFallbacks && video.thumbnailFallbacks.length > 0
              ? encodeFallbacks(video.thumbnailFallbacks)
              : undefined
          }
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {video.duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs font-semibold text-white">
            {video.duration}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition group-hover:text-blue-600">
          {video.title}
        </h3>
        <p className="text-xs font-medium text-gray-600">{video.channelName}</p>
        <p className="text-xs text-gray-500">{formatRelativeTime(video.publishedAt)}</p>
      </div>
    </button>
  );
});

VideoCard.displayName = 'VideoCard';

const VideoPage: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [filters, setFilters] = useState<string[]>([FILTER_DEFAULT]);
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = DEFAULT_PAGE_SIZE;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const hlsInstanceRef = useRef<HlsLikeInstance | null>(null);
  const deferredSearch = useDeferredValue(searchQuery);
  const normalizedSearch = useMemo(
    () => deferredSearch.trim().toLowerCase(),
    [deferredSearch],
  );

  const handleSearchSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/videos`, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Statut inattendu ${response.status}`);
        }

        const payload = await response.json();
        const mapped = mapVideoCollection(payload);

        if (!isMounted) return;

        setVideos(mapped);
        const computedFilters = [
          FILTER_DEFAULT,
          ...new Set(
            mapped
              .flatMap((video) => video.tags ?? [])
              .map((tag) => tag.trim())
              .filter(Boolean),
          ),
        ];
        setFilters(computedFilters);
        setSelectedVideoId(mapped[0]?.id ?? null);
      } catch (err) {
        if (!isMounted || controller.signal.aborted) return;
        console.error('Impossible de charger les vidéos', err);
        const randomized = shuffle(FALLBACK_VIDEOS);
        setVideos(randomized);
        const fallbackFilters = [
          FILTER_DEFAULT,
          ...new Set(randomized.flatMap((video) => video.tags ?? []).filter(Boolean)),
        ];
        setFilters(fallbackFilters);
        setError("Impossible de récupérer les vidéos pour le moment.");
        setSelectedVideoId(randomized[0]?.id ?? null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const initiateFetch = () => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (
          window as unknown as {
            requestIdleCallback?: (callback: () => void) => number;
          }
        ).requestIdleCallback?.(() => {
          void fetchVideos();
        });
      } else {
        setTimeout(() => {
          void fetchVideos();
        }, 0);
      }
    };

    initiateFetch();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesFilter =
        activeFilter === FILTER_DEFAULT || video.tags?.includes(activeFilter);
      if (!matchesFilter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      const haystack = `${video.title} ${video.channelName}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [activeFilter, normalizedSearch, videos]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, activeFilter, normalizedSearch]);

  useEffect(() => {
    const total = Math.max(1, Math.ceil(filteredVideos.length / pageSize));
    if (currentPage > total) {
      setCurrentPage(total);
    }
  }, [filteredVideos.length, pageSize, currentPage]);

  useEffect(() => {
    if (filteredVideos.length === 0) {
      setSelectedVideoId(null);
      return;
    }
    if (!filteredVideos.some((video) => video.id === selectedVideoId)) {
      setSelectedVideoId(filteredVideos[0]?.id ?? null);
    }
  }, [filteredVideos, selectedVideoId]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredVideos.length / pageSize)),
    [filteredVideos.length, pageSize],
  );

  const paginatedVideos = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return filteredVideos.slice(start, end);
  }, [filteredVideos, currentPage, pageSize, totalPages]);

  useEffect(() => {
    if (paginatedVideos.length === 0) {
      return;
    }
    if (!paginatedVideos.some((video) => video.id === selectedVideoId)) {
      setSelectedVideoId(paginatedVideos[0]?.id ?? null);
    }
  }, [paginatedVideos, selectedVideoId]);

  const selectedVideo = useMemo(
    () => filteredVideos.find((video) => video.id === selectedVideoId) ?? null,
    [filteredVideos, selectedVideoId],
  );

  const listVideos = useMemo(
    () =>
      paginatedVideos.filter((video) => {
        if (!selectedVideo) return true;
        return video.id !== selectedVideo.id;
      }),
    [paginatedVideos, selectedVideo],
  );

  const pageStartIndex = useMemo(() => {
    if (filteredVideos.length === 0) return 0;
    const safePage = Math.min(currentPage, totalPages);
    return (safePage - 1) * pageSize + 1;
  }, [filteredVideos.length, currentPage, totalPages, pageSize]);

  const pageEndIndex = useMemo(() => {
    if (filteredVideos.length === 0) return 0;
    const safePage = Math.min(currentPage, totalPages);
    return Math.min(safePage * pageSize, filteredVideos.length);
  }, [filteredVideos.length, currentPage, totalPages, pageSize]);

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleVideoSelect = useCallback((id: string) => {
    setSelectedVideoId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const activeEmbedUrl = useMemo(() => {
    if (!selectedVideo || selectedVideo.platform !== 'youtube') return null;
    const url = selectedVideo.embedUrl || selectedVideo.videoUrl;
    if (!url) return null;
    return url.includes('?') ? `${url}&rel=0` : `${url}?rel=0`;
  }, [selectedVideo]);

  const streamingSourceUrl = useMemo(() => {
    if (!selectedVideo || selectedVideo.platform === 'youtube') {
      return null;
    }
    const source = selectedVideo.streamUrl ?? selectedVideo.videoUrl;
    if (!source || source === 'about:blank') {
      return null;
    }
    return source;
  }, [selectedVideo]);

  const streamingMimeType = useMemo(() => {
    if (!selectedVideo || selectedVideo.platform === 'youtube') {
      return null;
    }
    return selectedVideo.streamType ?? (streamingSourceUrl ? guessMimeType(streamingSourceUrl) : null);
  }, [selectedVideo, streamingSourceUrl]);

  useEffect(() => {
    const videoElement = videoElementRef.current;
    if (!videoElement) return;

    if (!selectedVideo || selectedVideo.platform === 'youtube') {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      videoElement.pause();
      videoElement.removeAttribute('src');
      videoElement.load();
      return;
    }

    const sourceUrl = streamingSourceUrl;
    if (!sourceUrl) {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      videoElement.pause();
      videoElement.removeAttribute('src');
      return;
    }

    let cancelled = false;

    const setup = async () => {
      const maybeHls =
        Boolean(
          selectedVideo.streamType &&
            selectedVideo.streamType.toLowerCase().includes('mpegurl'),
        ) || sourceUrl.toLowerCase().includes('.m3u8');

      if (maybeHls) {
        const HlsConstructor = await loadHlsLibrary();
        if (cancelled) return;

        if (HlsConstructor?.isSupported?.()) {
          if (hlsInstanceRef.current) {
            hlsInstanceRef.current.destroy();
          }
          const instance = new HlsConstructor({ enableWorker: true });
          instance.loadSource(sourceUrl);
          instance.attachMedia(videoElement);
          hlsInstanceRef.current = instance;
          return;
        }
      }

      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }

      if (videoElement.src !== sourceUrl) {
        videoElement.src = sourceUrl;
      }
      videoElement.load();
    };

    setup();

    return () => {
      cancelled = true;
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [selectedVideo, streamingSourceUrl]);

  const resultsCount = filteredVideos.length;
  const searchActive = Boolean(normalizedSearch);
  const filterActive = activeFilter !== FILTER_DEFAULT;
  const trimmedSearch = searchQuery.trim();
  const activeCriteria = [filterActive ? `Filtre : ${activeFilter}` : null, searchActive ? `Recherche : "${trimmedSearch}"` : null]
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-20 pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 pb-12">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 p-8 text-white shadow-xl">
            <p className="text-xs uppercase tracking-[0.4em] text-blue-100/80">Vidéos</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Découvrez nos dernières vidéos
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-blue-50 sm:text-base">
              Retrouvez les cultes en direct, les messages inspirants et les temps forts de la
              communauté. Les vidéos se mettent automatiquement à jour depuis nos chaînes en ligne.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-md backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    activeFilter === filter
                      ? 'border-blue-600 bg-blue-600 text-white shadow'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:text-blue-600'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <form
              className="relative w-full md:w-80"
              role="search"
              onSubmit={handleSearchSubmit}
            >
              <label htmlFor="video-search" className="sr-only">
                Rechercher une vidéo
              </label>
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="20" y1="20" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                id="video-search"
                type="search"
                value={searchQuery}
                autoComplete="off"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher une vidéo par titre ou chaîne..."
                className="w-full rounded-full border border-gray-200 bg-white/90 py-3 pl-11 pr-12 text-sm text-gray-700 shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-blue-50 text-blue-500 transition hover:bg-blue-100"
                  aria-label="Effacer la recherche"
                >
                  ×
                </button>
              )}
            </form>
          </div>
          <div
            className="text-xs text-gray-500"
            aria-live="polite"
          >
            {resultsCount === 0
              ? 'Aucune vidéo ne correspond à vos critères pour le moment.'
              : `${resultsCount} vidéo${resultsCount > 1 ? 's' : ''} disponible${resultsCount > 1 ? 's' : ''}${
                  activeCriteria ? ` • ${activeCriteria}` : ''
                }`}
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <section className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8 lg:pr-8">
            {loading ? (
              <ActiveVideoSkeleton />
            ) : selectedVideo ? (
              <div className="space-y-6">
                <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-2xl ring-1 ring-black/10">
                  {selectedVideo.platform === 'youtube' && activeEmbedUrl ? (
                    <iframe
                      key={selectedVideo.id}
                      src={activeEmbedUrl}
                      title={selectedVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      className="h-full w-full"
                    />
                  ) : streamingSourceUrl ? (
                    <video
                      key={selectedVideo.id}
                      ref={videoElementRef}
                      className="h-full w-full"
                      poster={selectedVideo.thumbnailUrl}
                      controls
                      preload="metadata"
                      playsInline
                      controlsList="nodownload"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-900/60 p-6 text-center text-sm text-gray-100">
                      Source vidéo indisponible pour cette sélection.
                    </div>
                  )}
                </div>
                <div className="space-y-6 rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-blue-100/60 backdrop-blur">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-lg font-bold uppercase text-white shadow-inner sm:flex">
                        {getInitials(selectedVideo.channelName)}
                      </div>
                      <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                          {selectedVideo.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-2 font-semibold text-gray-800">
                            <svg
                              aria-hidden="true"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="7" r="4" />
                              <path d="M5.5 21a6.5 6.5 0 0113 0" />
                            </svg>
                            {selectedVideo.channelName}
                          </span>
                          <span className="flex items-center gap-1 text-amber-600">
                            <svg
                              aria-hidden="true"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {formatRelativeTime(selectedVideo.publishedAt)}
                          </span>
                        </div>
                        {selectedVideo.platform !== 'youtube' && streamingSourceUrl && (
                          <p className="text-xs text-gray-500">
                            Streaming optimisé ({streamingMimeType ?? 'video/mp4'})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedVideo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 shadow-sm"
                        >
                          #{tag.replace(/^#/u, '')}
                        </span>
                      ))}
                    </div>
                  )}
                  {selectedVideo.description && (
                    <div className="space-y-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-white to-blue-50/50 p-5 text-sm leading-relaxed text-slate-700 shadow-inner">
                      <p className="font-semibold text-blue-900/80">À propos de la vidéo</p>
                      <p className="whitespace-pre-line">
                        {selectedVideo.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-6 text-center text-gray-600 shadow-sm">
                Aucune vidéo sélectionnée pour le moment.
              </div>
            )}
          </div>
          <aside className="lg:col-span-4 lg:border-l lg:border-gray-200 lg:pl-8">
            <div className="space-y-4">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <ListSkeleton key={`list-skeleton-${index}`} />
                  ))
                : listVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      isActive={video.id === selectedVideoId}
                      onSelect={handleVideoSelect}
                    />
                  ))}
            </div>
            {!loading && !filteredVideos.length && (
              <div className="mt-10 rounded-xl bg-white p-6 text-center text-gray-600 shadow-sm">
                Aucune vidéo trouvée pour cette sélection pour le moment.
              </div>
            )}
          </aside>
          <div className="lg:col-span-12 mt-10 flex flex-col items-center justify-between gap-4 text-xs text-gray-600 sm:flex-row sm:text-sm">
            <p>
              {filteredVideos.length > 0
                ? `Affichage ${pageStartIndex}-${pageEndIndex} sur ${filteredVideos.length} vidéos`
                : 'Aucune vidéo à afficher'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  currentPage <= 1
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                Précédent
              </button>
              <div className="flex items-center gap-1">
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`h-9 min-w-[2.25rem] rounded-full border px-3 text-xs font-semibold transition sm:text-sm ${
                      page === currentPage
                        ? 'border-blue-600 bg-blue-600 text-white shadow'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  currentPage >= totalPages
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                Suivant
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VideoPage;
