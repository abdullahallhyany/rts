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
## Docker Backend (Optional)

RTS supports Docker as an optional execution backend, allowing you to run RNG tests inside a containerized environment. This is useful for:
- **Isolation**: Run tests in a sandboxed container without system dependencies
- **Reproducibility**: Ensure consistent tool versions across different machines
- **Cross-platform**: Run the same Docker image on Windows, Linux, and macOS

### Prerequisites

- **Docker**: Install Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Verify installation: `docker --version`

### Building the Docker Image

```bash
# Navigate to the create_env directory
cd create_env

# Build the image (tagged as 'rng-tools')
docker build -t rng-tools .
```

The image includes all precompiled RNG tools:
- **dieharder**: Statistical randomness testing
- **ent**: Entropy analysis
- **RNG_test** (PractRand): Practical randomness testing
- **crush, bcrush, rabbit, scrush, alpha** (TestU01): Comprehensive test suites
- **niststs** (NIST STS): NIST Statistical Test Suite

### Configuring Docker Mode

Edit `.env` in the project root to enable Docker execution:

```env
# Execution backend: 'docker', 'wsl' (Windows only), or 'linux'
# Default: 'wsl' on Windows, 'linux' on Linux/macOS
RNG_EXECUTION_MODE=docker

# Docker image name (must match the image you built)
RNG_DOCKER_IMAGE=rng-tools
```

### Execution Modes

The application supports three execution backends, configurable via `RNG_EXECUTION_MODE`:

| Mode | Platform | Description |
|------|----------|-------------|
| `docker` | Any | Run tests inside a Docker container (requires Docker) |
| `wsl` | Windows | Run tests in Windows Subsystem for Linux |
| `linux` | Linux | Run tests natively on the system |

**Platform Defaults** (if `RNG_EXECUTION_MODE` is not set):
- Windows: `wsl`
- Linux/macOS: `linux`

### Switching Between Backends

Simply change the `RNG_EXECUTION_MODE` variable in `.env` and restart the application:

```bash
# Use Docker
RNG_EXECUTION_MODE=docker

# Use WSL (Windows only)
RNG_EXECUTION_MODE=wsl

# Use native Linux
RNG_EXECUTION_MODE=linux
```

No code changes required—all switching is configuration-driven.

### Troubleshooting Docker Mode

**Issue**: `docker: command not found`
- **Solution**: Ensure Docker is installed and the `docker` command is in your PATH

**Issue**: `docker: Error response from daemon: no such image`
- **Solution**: Build the image first: `cd create_env && docker build -t rng-tools .`

**Issue**: Volume permission errors
- **Solution**: Ensure Docker has permission to access your test data directory
