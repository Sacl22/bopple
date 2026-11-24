const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

const AUDIO_RE = /\.(mp3|m4a|aac|flac|ogg|oga|opus|wav|mp4)$/i;

app.setName('Bopple');

// ---------- 配置（自动保存到 %APPDATA%\Bopple\config.json） ----------
function configPath(){ return path.join(app.getPath('userData'), 'config.json'); }
let configCache = null;
function readConfig(){
  if(configCache) return configCache;
  try { configCache = JSON.parse(fs.readFileSync(configPath(), 'utf8')) || {}; }
  catch(e){ configCache = {}; }
  return configCache;
}
function writeConfig(cfg){
  configCache = cfg;
  try {
    fs.mkdirSync(path.dirname(configPath()), { recursive: true });
    fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2), 'utf8');
  } catch(e){}
}

// ---------- 扫描文件夹 ----------
async function scanFolder(dir){
  const out = [];
  async function walk(d, depth){
    if(depth > 6) return;
    let ents = [];
    try { ents = await fs.promises.readdir(d, { withFileTypes: true }); } catch(e){ return; }
    for(const ent of ents){
      if(ent.name.startsWith('.')) continue;
      const full = path.join(d, ent.name);
      if(ent.isDirectory()){ await walk(full, depth + 1); }
      else if(AUDIO_RE.test(ent.name)){ out.push({ name: ent.name, path: full }); }
    }
  }
  await walk(dir, 0);
  out.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }));
  return out;
}

// ---------- IPC ----------
ipcMain.handle('cfg:get', () => readConfig());
ipcMain.handle('cfg:set', (e, patch) => {
  const next = Object.assign({}, readConfig(), (patch && typeof patch === 'object') ? patch : {});
  writeConfig(next);
  return next;
});
ipcMain.handle('folder:pick', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender) || undefined;
  const r = await dialog.showOpenDialog(win, {
    title: '选择音乐文件夹',
    buttonLabel: '选择',
    properties: ['openDirectory']
  });
  if(r.canceled || !r.filePaths.length) return null;
  return r.filePaths[0];
});
ipcMain.handle('folder:exists', async (e, dir) => {
  try { const st = await fs.promises.stat(dir); return st.isDirectory(); } catch(err){ return false; }
});
ipcMain.handle('folder:scan', (e, dir) => scanFolder(dir));
ipcMain.handle('track:read', (e, p) => fs.promises.readFile(p));

function createWindow(){
  const win = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 520,
    minHeight: 400,
    autoHideMenuBar: true,
    backgroundColor: '#0b0b10',
    title: 'Bopple',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });

  win.removeMenu();
  win.loadFile(path.join(__dirname, 'app.html'));

  // 外部链接用系统浏览器打开，不新开 Electron 窗口
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') app.quit();
});
