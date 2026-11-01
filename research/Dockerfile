# Static-analysis sandbox for Honda Connect ONE RE.
# Everything lives in this image + the mounted project dir. Nuke with `./re clean`.
FROM node:24-trixie

# REA pinned to match host install.
ARG REA_VERSION=6.8.0
ARG JADX_VERSION=1.5.0
# apktool from apt (Debian) is 2.7.0, vulnerable to CVE-2024-21633. Use a patched release.
ARG APKTOOL_VERSION=2.9.3

# Fail early if the base node is too old for REA.
RUN node -e 'const s=require("semver");' 2>/dev/null; \
    node -p "process.version" | grep -Eq 'v(2[46]|[3-9][0-9])' || (echo "node too old for REA" && exit 1)

RUN apt-get update && apt-get install -y --no-install-recommends \
        default-jre-headless \
        git \
        curl \
        unzip \
        python3 \
        python3-venv \
        python3-pip \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# jadx (deeper decompile than apktool alone).
RUN curl -fsSL -o /tmp/jadx.zip \
        https://github.com/skylot/jadx/releases/download/v${JADX_VERSION}/jadx-${JADX_VERSION}.zip \
    && mkdir -p /opt/jadx && unzip -q /tmp/jadx.zip -d /opt/jadx && rm /tmp/jadx.zip \
    && ln -s /opt/jadx/bin/jadx /usr/local/bin/jadx \
    && ln -s /opt/jadx/bin/jadx-gui /usr/local/bin/jadx-gui 2>/dev/null || true

# Patched apktool (jar + wrapper) from upstream release.
RUN curl -fsSL -o /usr/local/bin/apktool.jar \
        https://github.com/iBotPeaches/Apktool/releases/download/v${APKTOOL_VERSION}/apktool_${APKTOOL_VERSION}.jar \
    && curl -fsSL -o /usr/local/bin/apktool \
        https://raw.githubusercontent.com/iBotPeaches/Apktool/v${APKTOOL_VERSION}/scripts/linux/apktool \
    && chmod +x /usr/local/bin/apktool

# REA CLI + MCP, installed globally so it needs no per-run npx download.
RUN npm install -g rea-agents@${REA_VERSION}

# REA uses a caller-supplied apktool; point it at the patched one.
ENV REA_APKTOOL_COMMAND=/usr/local/bin/apktool

WORKDIR /work
CMD ["bash"]
