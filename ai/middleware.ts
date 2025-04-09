import { Redis } from '@upstash/redis';
import {
  type LanguageModelV1,
  type LanguageModelV1Middleware,
  type LanguageModelV1StreamPart,
  simulateReadableStream,
} from 'ai';

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_TOKEN,
});

const CACHE_TTL = Number.parseInt(process.env.REDIS_TTL_SECONDS || '3600', 10);
const MAX_KEY_SIZE_BYTES = 32 * 1024; // 32 KB

function safeStringifyKey(params: unknown): string | null {
  try {
    const str = JSON.stringify(params);
    if (Buffer.byteLength(str, 'utf-8') > MAX_KEY_SIZE_BYTES) {
      console.warn('🔁 Skipping Redis cache: key size exceeds 32KB limit');
      return null;
    }
    return str;
  } catch (err) {
    console.warn('⚠️ Failed to stringify cache key:', err);
    return null;
  }
}

export const cacheMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const cacheKey = safeStringifyKey(params);
    if (!cacheKey) return await doGenerate();

    try {
      const cached = (await redis.get(cacheKey)) as Awaited<
        ReturnType<LanguageModelV1['doGenerate']>
      > | null;

      if (cached !== null) {
        return {
          ...cached,
          response: {
            ...cached.response,
            timestamp: cached?.response?.timestamp
              ? new Date(cached.response.timestamp)
              : undefined,
          },
        };
      }
    } catch (err) {
      console.warn('❌ Redis read error (wrapGenerate):', err);
    }

    const result = await doGenerate();

    try {
      await redis.set(cacheKey, result, { ex: CACHE_TTL });
    } catch (err) {
      console.warn('❌ Redis write error (wrapGenerate):', err);
    }

    return result;
  },

  wrapStream: async ({ doStream, params }) => {
    const cacheKey = safeStringifyKey(params);
    if (!cacheKey) return await doStream();

    try {
      const cached = await redis.get(cacheKey);

      if (cached !== null) {
        const formattedChunks = (cached as LanguageModelV1StreamPart[]).map(p => {
          if (p.type === 'response-metadata' && p.timestamp) {
            return { ...p, timestamp: new Date(p.timestamp) };
          } else return p;
        });

        return {
          stream: simulateReadableStream({
            initialDelayInMs: 0,
            chunkDelayInMs: 10,
            chunks: formattedChunks,
          }),
          rawCall: { rawPrompt: null, rawSettings: {} },
        };
      }
    } catch (err) {
      console.warn('❌ Redis read error (wrapStream):', err);
    }

    const { stream, ...rest } = await doStream();
    const fullResponse: LanguageModelV1StreamPart[] = [];

    const transformStream = new TransformStream<
      LanguageModelV1StreamPart,
      LanguageModelV1StreamPart
    >({
      transform(chunk, controller) {
        fullResponse.push(chunk);
        controller.enqueue(chunk);
      },
      flush() {
        try {
          redis.set(cacheKey, fullResponse, { ex: CACHE_TTL }).catch(err => {
            console.warn('❌ Redis write error (wrapStream flush):', err);
          });
        } catch (err) {
          console.warn('❌ Redis set failed in flush:', err);
        }
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};