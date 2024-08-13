const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      sandbox: false
    }
  });

  const startUrl = process.env.NODE_ENV === 'development' ?
    'http://localhost:3000' :
    `file://${path.join(__dirname, 'dist', 'index.html')}`;

  mainWindow.loadURL(startUrl);

  // 開発者ツールを開く
  mainWindow.webContents.openDevTools();
}

app.on('ready', () => {
  createWindow();

  // ここでipcMainハンドラーを設定
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (result.canceled) {
      return null;
    } else {
      return result.filePaths[0];
    }
  });
});

ipcMain.on('process-wav', (event, args) => {
  const { filePath, repeatCount, outputFolder, useCustomOutputFolder } = args;
  const fileName = path.basename(filePath, path.extname(filePath));
  const outputFilePath = useCustomOutputFolder
    ? path.join(outputFolder, `${fileName}_repeated_${repeatCount}.wav`)
    : path.join(path.dirname(filePath), `${fileName}_repeated_${repeatCount}.wav`);
  const command = `sox "${filePath.replace(/"/g, '\\"')}" "${outputFilePath.replace(/"/g, '\\"')}" repeat ${repeatCount-1}`;

  console.log(`Executing command: ${command}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${stderr}`);
      event.reply('process-wav-response', { success: false, message: stderr });
    } else {
      console.log(`Output: ${stdout}`);
      console.log(`Error output: ${stderr}`);
      if (fs.existsSync(outputFilePath)) {
        event.reply('process-wav-response', { success: true, outputFilePath });
      } else {
        event.reply('process-wav-response', { success: false, message: 'Output WAV file not found' });
      }
    }
  });
});

ipcMain.on('convert-to-mp3', (event, args) => {
  const { filePath, repeatCount, encodeSetting, outputFolder, useCustomOutputFolder } = args;
  const fileName = path.basename(filePath, path.extname(filePath));
  const outputFilePath = useCustomOutputFolder
    ? path.join(outputFolder, `${fileName}_repeated_${repeatCount}x.mp3`)
    : path.join(path.dirname(filePath), `${fileName}_repeated_${repeatCount}x.mp3`);
  const command = `sox "${filePath.replace(/"/g, '\\"')}" "${outputFilePath.replace(/"/g, '\\"')}" repeat ${repeatCount - 1} ${encodeSetting}`;

  console.log(`Executing command: ${command}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${stderr}`);
      event.reply('convert-to-mp3-response', { success: false, message: stderr });
    } else {
      console.log(`Output: ${stdout}`);
      console.log(`Error output: ${stderr}`);
      if (fs.existsSync(outputFilePath)) {
        event.reply('convert-to-mp3-response', { success: true, outputFilePath });
      } else {
        event.reply('convert-to-mp3-response', { success: false, message: 'Output MP3 file not found' });
      }
    }
  });
});