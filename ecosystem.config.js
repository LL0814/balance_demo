module.exports = {
    apps: [
        {
            name: 'balance_demo',
            script: 'dist/main.js',
            instances: 'max', // 集群实例数量
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000, // 可选：自定义端口
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 3000, // Or whatever port your NestJS app listens on
                // Add other development-specific environment variables here
            },
            watch: false, // 可选：禁用文件监听重启
            autorestart: true, // 崩溃后自动重启
        },
    ],
}
