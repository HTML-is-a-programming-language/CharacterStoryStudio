/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: "./tsconfig.web.json",
  },
  // @remotion/bundler는 내부적으로 웹팩을 다시 실행해 Remotion 컴포지션을 번들링하는
  // Node 전용 도구다. Next의 웹팩 안에서 이걸 또 번들링하려고 하면(중첩 번들링) 깨진다
  // ("Self-reference dependency" 웹팩 에러). external로 지정해 런타임에 require()만
  // 하도록 한다 — 이 Route Handler는 항상 Node.js 런타임에서만 실행된다.
  // @ffprobe-installer/ffprobe도 같은 이유로 추가했다 — index.js가 동적 require로 자신의
  // tsconfig.json/.d.ts까지 끌어들이는 Node 전용 패키지라, 웹팩이 tsconfig.json을 JS로
  // 파싱하려다 실패한다(QA 자동 통합, ADR-022).
  experimental: {
    serverComponentsExternalPackages: ["@remotion/bundler", "@remotion/renderer", "@ffprobe-installer/ffprobe"],
  },
};

export default nextConfig;
