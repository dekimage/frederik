/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
};

module.exports = nextConfig;
