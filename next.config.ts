import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      // TMDB posters & provider logos
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      // Open Library covers
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/b/**",
      },
      // iTunes / Apple CDN artwork
      {
        protocol: "https",
        hostname: "is*.mzstatic.com",
        pathname: "/**",
      },
      // Deezer artist images
      {
        protocol: "https",
        hostname: "e-cdns-images.dzcdn.net",
        pathname: "/**",
      },
      // Google Books thumbnails
      {
        protocol: "https",
        hostname: "books.google.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
