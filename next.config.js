/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["cloudinary"],
  // Vercel's loader cannot require jose's ESM build from jwks-rsa's CJS.
  // Bundle this dependency chain so it does not rely on require(ESM).
  transpilePackages: ["firebase-admin", "jwks-rsa", "jose"],
  images: {
    qualities: [75, 90, 100],
    remotePatterns: [
      "localhost",
      "media.discordapp.net",
      "assets.openai.com",
      "cdn.midjourney.com",
      "images.unsplash.com",
      "firebasestorage.googleapis.com",
      "picsum.photos",
      "plus.unsplash.com",
      "storage.googleapis.com",
      "img.youtube.com",
      "res.cloudinary.com",
    ].map((hostname) => ({
      protocol: hostname === "localhost" ? "http" : "https",
      hostname,
    })),
  },
};

module.exports = nextConfig;
