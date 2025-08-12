
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/dashboard/upgrade',
                destination: '/dashboard',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
