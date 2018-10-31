/**
 * Created by cx on 2018/10/18.
 * Include
 * description
 */
const path = require('path');

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    }
  }
}
