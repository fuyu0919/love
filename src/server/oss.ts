import { createHmac } from 'node:crypto';

const env = (key: string): string =>
  process.env[key] ?? ((import.meta.env as Record<string, string | undefined>)[key] ?? '');

export interface OssConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  cdnHost: string;
  dir: string;
}

export function getOssConfig(): OssConfig {
  return {
    region: env('OSS_REGION'),
    bucket: env('OSS_BUCKET'),
    accessKeyId: env('OSS_ACCESS_KEY_ID'),
    accessKeySecret: env('OSS_ACCESS_KEY_SECRET'),
    cdnHost: env('OSS_CDN_HOST').replace(/\/$/, ''),
    dir: (env('OSS_DIR') || 'uploads').replace(/^\/|\/$/g, ''),
  };
}

export function ossConfigured(): boolean {
  const config = getOssConfig();
  return Boolean(config.region && config.bucket && config.accessKeyId && config.accessKeySecret);
}

/**
 * 生成浏览器直传 OSS 的 PostObject 签名。
 * 浏览器拿到后直接 POST 到 host，文件不经过服务器。
 */
export function createPostSignature(maxSizeMb = 200) {
  const config = getOssConfig();
  if (!ossConfigured()) {
    return null;
  }
  const host = `https://${config.bucket}.${config.region}.aliyuncs.com`;
  const expireAt = new Date(Date.now() + 10 * 60 * 1000);
  const expiration = expireAt.toISOString();
  const policy = {
    expiration,
    conditions: [
      { bucket: config.bucket },
      ['content-length-range', 1, maxSizeMb * 1024 * 1024],
      ['starts-with', '$key', `${config.dir}/`],
    ],
  };
  const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64');
  const signature = createHmac('sha1', config.accessKeySecret)
    .update(policyBase64)
    .digest('base64');

  return {
    host,
    dir: `${config.dir}/`,
    accessId: config.accessKeyId,
    policy: policyBase64,
    signature,
    expireAt: expiration,
    cdnHost: config.cdnHost,
  };
}

/**
 * 把 OSS 原始地址转成 CDN + 图片处理地址；本地 /images 路径原样返回。
 */
export function imageUrl(src: string, width = 1600): string {
  if (!src || !/^https?:\/\//i.test(src)) return src;
  const config = getOssConfig();
  let url = src;
  let isOss = false;
  try {
    const parsed = new URL(src);
    isOss =
      /(^|\.)aliyuncs\.com$/i.test(parsed.hostname) ||
      (Boolean(config.cdnHost) && parsed.host === new URL(config.cdnHost).host);
    if (config.cdnHost && isOss) {
      const cdn = new URL(config.cdnHost);
      parsed.protocol = cdn.protocol;
      parsed.host = cdn.host;
      url = parsed.toString();
    }
  } catch {
    return src;
  }
  if (!isOss) return src;
  return `${url}${url.includes('?') ? '&' : '?'}x-oss-process=image/resize,w_${width}/format,webp`;
}
