// Vitest 전용 스텁. 실제 server-only 패키지는 Next.js 번들러가 클라이언트 번들에
// 포함될 때만 에러를 던지도록 특수 처리하는데, Vitest(순수 Node)에는 그 처리가 없어
// import만 해도 항상 에러가 난다. 테스트에서는 이 빈 모듈로 대체한다.
export {};
