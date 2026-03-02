FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y \
    build-essential \
    autoconf \
    automake \
    libtool \
    libgmp-dev \
    libfftw3-dev \
    wget \
    unzip \
    git \
    make \
    gcc \
    g++ \
    perl \
    python3 \
    dieharder \
    ent \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt

# Install TestU01
RUN set -eux; \
        wget https://simul.iro.umontreal.ca/testu01/TestU01.zip; \
        unzip TestU01.zip; \
        cd TestU01-*; \
        ./configure; \
        make; \
        make install; \
        ldconfig; \
        if [ -d /usr/local/TestU01/bin ]; then \
            ln -sf /usr/local/TestU01/bin/crush /usr/local/bin/crush; \
            ln -sf /usr/local/TestU01/bin/bcrush /usr/local/bin/bcrush; \
            ln -sf /usr/local/TestU01/bin/rabbit /usr/local/bin/rabbit; \
            ln -sf /usr/local/TestU01/bin/scrush /usr/local/bin/scrush; \
            ln -sf /usr/local/TestU01/bin/alphabit /usr/local/bin/alpha; \
        fi

# Install PractRand
RUN set -eux; \
    wget -O PractRand_0.96.zip https://sourceforge.net/projects/pracrand/files/PractRand_0.96.zip/download; \
        unzip PractRand_0.96.zip; \
        cd PractRand; \
        g++ -std=c++11 -O3 -Iinclude tools/RNG_test.cpp src/*.cpp src/RNGs/*.cpp src/RNGs/other/*.cpp -lpthread -o RNG_test; \
        cp RNG_test /usr/local/bin/RNG_test

# Install NIST STS
RUN set -eux; \
        git clone https://github.com/arcetri/sts.git nist-sts; \
        cd nist-sts; \
        make; \
        if [ -x /opt/nist-sts/src/sts ]; then \
            ln -sf /opt/nist-sts/src/sts /usr/local/bin/niststs; \
        elif [ -x /opt/nist-sts/sts ]; then \
            ln -sf /opt/nist-sts/sts /usr/local/bin/niststs; \
        fi

# Install RTS-provided TestU01 runner binaries
RUN set -eux; \
        git clone --depth 1 https://github.com/abdullahallhyany/rts.git /tmp/rts; \
        cp /tmp/rts/rngTests/crushing/crush /usr/local/bin/crush; \
        cp /tmp/rts/rngTests/crushing/Bcrush /usr/local/bin/bcrush; \
        cp /tmp/rts/rngTests/crushing/rabbit /usr/local/bin/rabbit; \
        cp /tmp/rts/rngTests/crushing/scrush /usr/local/bin/scrush; \
        cp /tmp/rts/rngTests/crushing/alpha /usr/local/bin/alpha; \
        chmod +x /usr/local/bin/crush /usr/local/bin/bcrush /usr/local/bin/rabbit /usr/local/bin/scrush /usr/local/bin/alpha

WORKDIR /data

CMD ["/bin/bash"]
