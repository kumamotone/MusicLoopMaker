# Music Loop Maker

A desktop application for creating music loops by repeating audio files. Built with Electron and React.

## Features

- Load WAV audio files
- Set the number of repetitions
- Process audio files to create loops
- Convert to MP3 format with custom settings
- Choose custom output folder
- Waveform visualization using wavesurfer.js

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [SoX](http://sox.sourceforge.net/) - Sound eXchange, a command line utility for audio processing

### Installing SoX

#### macOS
```
brew install sox
```

#### Windows
Download and install from [SoX website](http://sox.sourceforge.net/)

#### Linux
```
sudo apt-get install sox
```

## Installation

1. Clone the repository
2. Install dependencies:
```
npm install
```

## Running the application

Start the development server and Electron app:
```
npm run dev
```

## Building for production

```
npm run build
npm run package
```

## License

MIT