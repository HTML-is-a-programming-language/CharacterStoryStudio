/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: "./tsconfig.web.json",
  },
  // @remotion/bundler는 내부적으로 웹팩을 다시 실행해 Remotion 컴포지션을 번들링하는
  // Node 전용 도구다. Next의 웹팩 안에서 이걸 또 번들링하려고 하면(중첩 번들링) 깨진다
  // ("Self-reference dependency" 웹팩 에러). external로 지정해 런타임에 require()만
  // 하도록 한다 — 이 Route Handler는 항상 Node.js 런타임에서만 실행된다.
  experimental: {
    serverComponentsExternalPackages: ["@remotion/bundler", "@remotion/renderer"],
  },
};

export default nextConfig;
