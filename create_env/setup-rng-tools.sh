#!/usr/bin/env bash

# Get the parent directory (project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
REPORT_FILE="$PROJECT_DIR/rng-install-report.json"

echo "========================================="
echo " FULL RNG Tools Installation"
echo "========================================="
echo "Project Dir: $PROJECT_DIR"
echo "Script Dir: $SCRIPT_DIR"
echo ""

########################################
# Setup directories
########################################
PRAC_DIR="${HOME}/PractRand"

########################################
# Install base packages
########################################
sudo apt update
sudo apt install -y build-essential git wget libgmp-dev \
                    dieharder ent

########################################
# Install TestU01 (official source)
########################################
if command -v crush &> /dev/null; then
  echo "[OK] TestU01 (crush) already installed"
else
  echo "Installing TestU01..."
  cd /tmp
  rm -rf TestU01-* 2>/dev/null || true
  wget https://simul.iro.umontreal.ca/testu01/TestU01.zip
  unzip -o TestU01.zip
  cd TestU01-*
  ./configure
  make
  sudo make install
  sudo ldconfig
  if [ -d /usr/local/TestU01/bin ]; then
    sudo ln -sf /usr/local/TestU01/bin/crush /usr/local/bin/crush 2>/dev/null || true
    sudo ln -sf /usr/local/TestU01/bin/bcrush /usr/local/bin/bcrush 2>/dev/null || true
    sudo ln -sf /usr/local/TestU01/bin/rabbit /usr/local/bin/rabbit 2>/dev/null || true
    sudo ln -sf /usr/local/TestU01/bin/scrush /usr/local/bin/scrush 2>/dev/null || true
    sudo ln -sf /usr/local/TestU01/bin/alphabit /usr/local/bin/alpha 2>/dev/null || true
  fi
  echo "TestU01 installed successfully"
fi

########################################
# Install PractRand (official source - v0.96)
########################################
if [ -f "${PRAC_DIR}/bin/RNG_test" ]; then
  echo "[OK] PractRand already installed at ${PRAC_DIR}/bin/RNG_test"
else
  echo "Installing PractRand..."
  cd /tmp
  rm -rf PractRand* 2>/dev/null || true
  wget -O PractRand_0.96.zip https://sourceforge.net/projects/pracrand/files/PractRand_0.96.zip/download
  unzip -o PractRand_0.96.zip
  cd PractRand
  mkdir -p "${PRAC_DIR}/bin"
  g++ -std=c++11 -O3 -Iinclude tools/RNG_test.cpp src/*.cpp src/RNGs/*.cpp src/RNGs/other/*.cpp -lpthread -o RNG_test
  cp RNG_test "${PRAC_DIR}/bin/RNG_test"
  chmod +x "${PRAC_DIR}/bin/RNG_test"
  echo "PractRand installed successfully at ${PRAC_DIR}/bin/RNG_test"
fi

########################################
# Install NIST STS (official source)
########################################
NIST_DIR="$PROJECT_DIR/rngTests/sts/nist"
NIST_PARENT="$PROJECT_DIR/rngTests/sts"

# Check if git repo already exists
if [ -d "$NIST_DIR/.git" ]; then
  echo "[OK] NIST STS git repo exists at $NIST_DIR"
  cd "$NIST_DIR"
  if [ ! -f "src/sts" ] && [ ! -f "sts" ]; then
    echo "Compiling NIST STS..."
    make
  else
    echo "[OK] NIST STS already compiled"
  fi
  cd "$PROJECT_DIR"
else
  # Clean up any existing incomplete installation
  if [ -d "$NIST_DIR" ]; then
    echo "Removing incomplete NIST STS directory..."
    rm -rf "$NIST_DIR"
  fi

  echo "Installing NIST STS..."
  mkdir -p "$NIST_PARENT"
  cd "$NIST_PARENT"
  git clone https://github.com/arcetri/sts.git nist
  cd nist
  make
  cd "$PROJECT_DIR"
  echo "NIST STS installed successfully at $NIST_DIR"
fi

########################################
# Detect/Set Paths
########################################
DIEHARDER_PATH=$(which dieharder)
ENT_PATH=$(which ent)
PRACTRAND_PATH="${PRAC_DIR}/bin/RNG_test"
CRUSH_PATH=$(which crush)
BCRUSH_PATH=$(which bcrush)
RABBIT_PATH=$(which rabbit 2>/dev/null || echo "/usr/local/bin/rabbit")
SCRUSH_PATH=$(which scrush)
ALPHA_PATH=$(which alpha 2>/dev/null || echo "/usr/local/bin/alpha")
NIST_PATH="rngTests/sts/nist"

echo "========================================="
echo " Detected Tool Paths"
echo "========================================="
echo "DIEHARDER: $DIEHARDER_PATH"
echo "ENT: $ENT_PATH"
echo "PRACTRAND: $PRACTRAND_PATH"
echo "CRUSH: $CRUSH_PATH"
echo "BCRUSH: $BCRUSH_PATH"
echo "RABBIT: $RABBIT_PATH"
echo "SCRUSH: $SCRUSH_PATH"
echo "ALPHA: $ALPHA_PATH"
echo "NIST: $NIST_PATH"
echo ""

########################################
# Generate .env
########################################
cat > "$ENV_FILE" <<EOL
# Linux paths
NIST_LINUX_PATH=${NIST_PATH}
PRACTRAND_LINUX_PATH=${PRACTRAND_PATH}
DIEHARDER_LINUX_PATH=${DIEHARDER_PATH}
TESTU01_CRUSH_LINUX_PATH=${CRUSH_PATH}
TESTU01_BCRUSH_LINUX_PATH=${BCRUSH_PATH}
TESTU01_RABBIT_LINUX_PATH=${RABBIT_PATH}
TESTU01_SCRUSH_LINUX_PATH=${SCRUSH_PATH}
TESTU01_ALPHA_LINUX_PATH=${ALPHA_PATH}
ENT_LINUX_PATH=${ENT_PATH}

# WSL paths (Windows)
NIST_WSL_PATH=${NIST_PATH}
PRACTRAND_WSL_PATH=${PRACTRAND_PATH}
DIEHARDER_WSL_PATH=${DIEHARDER_PATH}
TESTU01_CRUSH_WSL_PATH=${CRUSH_PATH}
TESTU01_BCRUSH_WSL_PATH=${BCRUSH_PATH}
TESTU01_RABBIT_WSL_PATH=${RABBIT_PATH}
TESTU01_SCRUSH_WSL_PATH=${SCRUSH_PATH}
TESTU01_ALPHA_WSL_PATH=${ALPHA_PATH}
ENT_WSL_PATH=${ENT_PATH}

# =========================
# Execution backend
# =========================

# Available modes: wsl (Windows), linux (Linux/macOS), docker (Docker)
# Default: wsl on Windows, linux on Linux/macOS
RNG_EXECUTION_MODE=linux

# Docker image name (required if RNG_EXECUTION_MODE=docker)
RNG_DOCKER_IMAGE=rng-tools

# To switch execution modes:
# 1. WSL mode:    RNG_EXECUTION_MODE=wsl
# 2. Linux mode:  RNG_EXECUTION_MODE=linux
# 3. Docker mode: RNG_EXECUTION_MODE=docker (and ensure docker image is built: cd create_env && docker build -t rng-tools .)
EOL

########################################
# Verification Report
########################################
echo "========================================="
echo " Installation Complete"
echo "========================================="
echo ""
echo "Configuration file created: $ENV_FILE"
echo ""
echo "To use these settings:"
echo "1. The .env file has been generated in your project root"
echo "2. Default execution mode is set to: linux"
echo "3. To switch execution modes, edit .env and change RNG_EXECUTION_MODE"
echo ""

cat > "$REPORT_FILE" <<EOF
{
  "dieharder": {
    "status": "ok",
    "path": "$DIEHARDER_PATH"
  },
  "ent": {
    "status": "ok",
    "path": "$ENT_PATH"
  },
  "practrand": {
    "status": "ok",
    "path": "$PRACTRAND_PATH"
  },
  "testu01": {
    "status": "ok",
    "paths": {
      "crush": "$CRUSH_PATH",
      "bcrush": "$BCRUSH_PATH",
      "rabbit": "$RABBIT_PATH",
      "scrush": "$SCRUSH_PATH",
      "alpha": "$ALPHA_PATH"
    }
  },
  "nist_sts": {
    "status": "ok",
    "path": "$NIST_PATH"
  }
}
EOF

echo "Installation report saved to: $REPORT_FILE"
echo "========================================="
