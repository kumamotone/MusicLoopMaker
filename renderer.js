import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.js';

let waveSurfer;
let filePath = '';
let outputFilePath = '';
let isInitialLoad = true;  // 初回ロードかどうかを追跡するフラグ

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');
  const repeatCountInput = document.getElementById('repeatCount');
  const outputFormatSelect = document.getElementById('outputFormat');
  const mp3SettingsDiv = document.getElementById('mp3Settings');
  const encodeSettingSelect = document.getElementById('encodeSetting');
  const runButton = document.getElementById('runButton');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeDisplay = document.getElementById('volumeDisplay');
  const totalDurationSpan = document.getElementById('totalDuration');
  const outputFolderInput = document.getElementById('outputFolder');
  const selectFolderButton = document.getElementById('selectFolderButton');
  let outputFolder = '';

  
  // WaveSurferのインスタンスを作成
  waveSurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: 'violet',
    progressColor: 'purple',
    plugins: [
      TimelinePlugin.create({
        container: '#wave-timeline'
      }),
      RegionsPlugin.create(),
      HoverPlugin.create({
        lineColor: '#ff0000',
        lineWidth: 2,
        labelBackground: '#555',
        labelColor: '#fff',
        labelSize: '11px',
      })

    ]
  });
  
  waveSurfer.on('interaction', () => {
    waveSurfer.play()
  })


  // Regions プラグインを取得
  const regionsPlugin = waveSurfer.getActivePlugins().find(plugin => plugin instanceof RegionsPlugin);
   

  console.log('WaveSurfer instance created:', waveSurfer);

  waveSurfer.on('error', (error) => {
    console.error('WaveSurfer error:', error);
  });

  const playPauseButton = document.getElementById('playPauseButton');
  const stopButton = document.getElementById('stopButton');

  // 再生/一時停止ボタンの機能
  playPauseButton.addEventListener('click', () => {
    waveSurfer.playPause();
    updatePlayPauseButton();
  });

  // 停止ボタンの機能
  stopButton.addEventListener('click', () => {
    waveSurfer.stop();
    updatePlayPauseButton();
  });

  // 再生状態が変更されときのイベントリスナー
  waveSurfer.on('play', updatePlayPauseButton);
  waveSurfer.on('pause', updatePlayPauseButton);

  function updateRegions() {
    if (!regionsPlugin) {
      console.error('Regions plugin not found');
      return;
    }

    // 既存のリージョンをクリア
    regionsPlugin.clearRegions();

    const repeatCount = isInitialLoad ? 1 : parseInt(repeatCountInput.value);
    const duration = waveSurfer.getDuration();
    const regionDuration = duration / repeatCount;

    for (let i = 0; i < repeatCount; i++) {
      regionsPlugin.addRegion({
        start: i * regionDuration,
        end: (i + 1) * regionDuration,
        color: i % 2 === 0 ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
        drag: false,
        resize: false
      });
    }
  }
  
  // 読み込み完了時の処理
  waveSurfer.on('ready', () => {
    console.log('WaveSurfer is ready');
    
    // 停止ボタンを有効化
    stopButton.disabled = false;
    playPauseButton.disabled = false;
  
    if (waveSurfer.getDuration() > 0) {
      updateRegions();
    } else {
      console.error('Invalid duration');
    }

    // 初回ロード後にフラグをリセット
    isInitialLoad = false;

    // 波形の長さを保存
    waveDuration = waveSurfer.getDuration();
    updateTotalDuration();
  });
  

  // 初期状態では停止ボタンを無効化
  stopButton.disabled = true;
  playPauseButton.disabled = true;

  function updatePlayPauseButton() {
    const icon = playPauseButton.querySelector('.material-icons');
    icon.textContent = waveSurfer.isPlaying() ? 'pause' : 'play_arrow';
  }

  // クリックした位置から再生
  document.getElementById('waveform').addEventListener('click', function(e) {
    const clickPosition = e.offsetX / this.clientWidth;
    const duration = waveSurfer.getDuration();
    waveSurfer.play(clickPosition * duration);
  });

  function updateLoopRegion() {
    if (!regionsPlugin) {
      console.error('Regions plugin not found');
      return;
    }
  
    const regions = regionsPlugin.getRegions();
    if (regions.length > 0) {
      // ファイルがドロップされたときは初回ロードとして扱う
      isInitialLoad = true;

      const region = regions[0];
      region.update({
        start: parseFloat(loopStart.value),
        end: parseFloat(loopEnd.value)
      });
    }
  }
   
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      filePath = files[0].path;
      console.log('File path:', filePath);
      dropZone.textContent = `File: ${files[0].name}`;
      
      // ファイルを読み込んでArrayBufferに変換
      const reader = new FileReader();
      reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        // ArrayBufferからBlob作成
        const blob = new Blob([new Uint8Array(arrayBuffer)]);
        // BlobからURLを作成
        const url = URL.createObjectURL(blob);
        // WaveSurferでURLを読み込む
        waveSurfer.load(url);
      };
      reader.readAsArrayBuffer(files[0]);

      // 出力先フォルダを設定
      outputFolder = window.electron.path.dirname(filePath);
      outputFolderInput.value = outputFolder;
      outputFolderInput.title = outputFolder; // ツールチップとして完全なパスを表示
    }
  });

  outputFormatSelect.addEventListener('change', function() {
    mp3SettingsDiv.style.display = this.value === 'mp3' ? 'block' : 'none';
  });

  selectFolderButton.addEventListener('click', async () => {
    try {
      const result = await window.electron.selectFolder();
      if (result) {
        outputFolder = result;
        outputFolderInput.value = outputFolder;
        outputFolderInput.title = outputFolder; // ツールチップとして完全なパスを表示
      }
    } catch (error) {
      console.error('フォルダ選択エラー:', error);
    }
  });

  runButton.addEventListener('click', () => {
    if (!filePath) {
      alert('Please drag and drop a file.');
      return;
    }

    const repeatCount = repeatCountInput.value;
    const outputFormat = outputFormatSelect.value;
    const useCustomOutputFolder = outputFolder !== window.electron.path.dirname(filePath);

    if (outputFormat === 'wav') {
      window.electron.processWav(filePath, repeatCount, outputFolder, useCustomOutputFolder);
    } else if (outputFormat === 'mp3') {
      const encodeSetting = encodeSettingSelect.value;
      window.electron.convertToMp3(filePath, repeatCount, encodeSetting, outputFolder, useCustomOutputFolder);
    }
  });

  window.electron.onProcessWavResponse((event, args) => {
    if (args.success) {
      outputFilePath = args.outputFilePath;
      updateOutput(`Output File: ${args.outputFilePath}`);
      
      // ファイルを読み込んでArrayBufferに変換
      const arrayBuffer = window.electron.readFile(args.outputFilePath);
      // ArrayBufferからBlobを作成
      const blob = new Blob([new Uint8Array(arrayBuffer)]);
      // BlobからURLを作成
      const url = URL.createObjectURL(blob);
      // WaveSurferでURLを読み込む
      waveSurfer.load(url);
      
      console.log('Output file loaded into WaveSurfer:', args.outputFilePath);

      
    } else {
      updateOutput(`Error: ${args.message}`);
    }
  });

  window.electron.onConvertToMp3Response((event, args) => {
    if (args.success) {
      updateOutput(`MP3 Output File: ${args.outputFilePath}`);
    } else {
      updateOutput(`Error: ${args.message}`);
    }
  });

  // 音量スライダーの初期化
  waveSurfer.setVolume(0.5);

  volumeSlider.addEventListener('input', () => {
    const volume = volumeSlider.value / 100;
    waveSurfer.setVolume(volume);
    volumeDisplay.textContent = `${volumeSlider.value}%`;
  });

  let waveDuration = 0; // 波形の長さを保存する変数

  // wavesurferの準備完了時に実行
  waveSurfer.on('ready', function() {
    waveDuration = waveSurfer.getDuration();
    updateTotalDuration();
  });

  repeatCountInput.addEventListener('input', updateTotalDuration);

  function updateTotalDuration() {
    const repeatCount = parseInt(repeatCountInput.value);
    const totalSeconds = waveDuration * repeatCount;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    totalDurationSpan.textContent = `処理後の時間: ${minutes}分${seconds}秒`;
  }

  function updateOutput(message) {
    const outputElement = document.getElementById('output');
    if (message) {
      outputElement.textContent += message + '\n';
      outputElement.style.display = 'block';
    } else {
      outputElement.textContent = '';
      outputElement.style.display = 'none';
    }
  }
});