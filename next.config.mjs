/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export: Next emits plain HTML/JS to out/ with NO server and NO
  // serverless functions. All data comes from a prebuilt snapshot.json that a
  // GitHub Action refreshes out-of-band, so the deployed site never runs code.
  output: "export",
  // News thumbnails come from many different outlet hosts; skip Next/Image
  // optimization so we don't have to whitelist every domain (also required by
  // static export).
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
