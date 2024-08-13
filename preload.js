const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('electron', {
  processWav: (filePath, repeatCount, outputFolder, useCustomOutputFolder) => ipcRenderer.send('process-wav', { filePath, repeatCount, outputFolder, useCustomOutputFolder }),
  onProcessWavResponse: (callback) => ipcRenderer.on('process-wav-response', callback),
  convertToMp3: (filePath, repeatCount, encodeSetting, outputFolder, useCustomOutputFolder) => ipcRenderer.send('convert-to-mp3', { filePath, repeatCount, encodeSetting, outputFolder, useCustomOutputFolder }),
  onConvertToMp3Response: (callback) => ipcRenderer.on('convert-to-mp3-response', callback),
  readFile: (filePath) => fs.readFileSync(filePath),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  path: {
    dirname: path.dirname,
    basename: path.basename,
  },
});