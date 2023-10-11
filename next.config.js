/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    experimental: {
        swcPlugins: [['@swc-jotai/react-refresh', {}]]
    },
    async rewrites() {
        return [
            {
                source: '/python/:path*',
                destination: 'http://localhost:5000/python/:path*'
            }
        ]
    }
}

module.exports = nextConfig
