/** @type {import('next').NextConfig} */
const nextConfig = {
  // News thumbnails come from many different outlet hosts; skip Next/Image
  // optimization so we don't have to whitelist every domain.
  images: {
    unoptimized: true,
  },
  // Keep the lowdb JSON file and other Node-only deps out of the bundle trace
  // noise; the poller runs only in the Node.js runtime.
  serverExternalPackages: ["lowdb"],
};

export default nextConfig;
