# rts

An Electron application with React


## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For Linux
$ npm run build:linux
```
the output will be an AppImage file which is a self contained app. You can launch the app buy double clicking the AppImage File inside the dist dir or by running ./<filename> in the terminal
## Linux AppImage dependencies

The crushing tests (Small Crush, Crush, Big Crush, Alpha, Rabbit) and NIST STS need **libtestu01**; the Die Harder test needs **dieharder**. On first launch, RTS checks for these and, if missing, prompts for your password and installs them via the system package manager (apt/dnf/zypper). Supported distros: Debian, Ubuntu, Fedora, openSUSE. You can also install manually, e.g. `sudo apt install libtestu01-0-dev dieharder`.
