/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Heavy server-only SDKs — keep out of webpack bundle (avoids phantom vendor-chunks).
    serverComponentsExternalPackages: ["firebase-admin", "cloudinary"],
  },
  images: {
    domains: [
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
    ],
  },
};

module.exports = nextConfig;
