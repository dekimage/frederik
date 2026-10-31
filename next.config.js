/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["firebase-admin", "cloudinary"],
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
