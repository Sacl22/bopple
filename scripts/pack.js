// 打包脚本：把当前目录打成 Windows x64 桌面应用
// 用法：pnpm run pack  →  产物在 dist/Bopple-win32-x64/Bopple.exe
const path = require('path');
const packager = require('@electron/packager');

packager({
  dir: path.join(__dirname, '..'),
  name: 'Bopple',
  platform: 'win32',
  arch: 'x64',
  out: 'dist',
  overwrite: true,
  icon: 'icon.ico',
  asar: true,
  ignore: [
    /^\/node_modules($|\/)/,
    /^\/dist($|\/)/,
    /^\/screenshots($|\/)/,
    /^\/scripts($|\/)/,
    /^\/\.git($|\/)/,
    /^\/\.github($|\/)/,
    /^\/README\.md$/,
    /^\/LICENSE$/,
    /^\/\.gitignore$/
  ]
})
  .then(paths => {
    console.log('打包完成：');
    (paths || []).forEach(p => console.log('  ' + p));
  })
  .catch(err => {
    console.error('打包失败：', err);
    process.exit(1);
  });
