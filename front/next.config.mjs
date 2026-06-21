/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['mapbox-gl', 'react-map-gl'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
