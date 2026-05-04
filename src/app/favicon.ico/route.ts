export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="12" fill="#0f5fa6"/>
    <rect x="16" y="12" width="32" height="40" rx="4" fill="#e6f1ff"/>
    <path d="M24 24h16M24 32h16M24 40h10" stroke="#0a4f8c" stroke-width="4" stroke-linecap="round"/>
  </svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
