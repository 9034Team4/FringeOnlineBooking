const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://3.25.85.247:3000',
        changeOrigin: true
      }
    }
  }
}) 