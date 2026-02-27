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

## Configurable Tool Paths

Paths to external RNG binaries are no longer hardcoded. You can provide custom locations via environment variables loaded from a `.env` file in the project root.

Supported variables (Linux and WSL):

```
NIST_LINUX_PATH
NIST_WSL_PATH

PRACTRAND_LINUX_PATH
PRACTRAND_WSL_PATH

DIEHARDER_LINUX_PATH
DIEHARDER_WSL_PATH

TESTU01_CRUSH_LINUX_PATH
TESTU01_CRUSH_WSL_PATH
TESTU01_BCRUSH_LINUX_PATH
TESTU01_BCRUSH_WSL_PATH
TESTU01_RABBIT_LINUX_PATH
TESTU01_RABBIT_WSL_PATH
TESTU01_SCRUSH_LINUX_PATH
TESTU01_SCRUSH_WSL_PATH
TESTU01_ALPHA_LINUX_PATH
TESTU01_ALPHA_WSL_PATH

ENT_LINUX_PATH
ENT_WSL_PATH
```

If a variable is unset the application uses safe defaults (bundled executables within `rngTests` on Linux, or names like `dieharder` that rely on the PATH). Existing installations continue working without any configuration.

See `.env.example` for a template of the environment file.
