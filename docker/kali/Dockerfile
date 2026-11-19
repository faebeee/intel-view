# Pinned to the multi-arch manifest list (amd64/arm64/arm/386) so each host
# runs a native image; a single-arch pin forces emulation on Apple Silicon,
# where BIND tools (dig/host) segfault.
FROM kalilinux/kali-rolling@sha256:1ff4a2be3849333687b3ed2b31bb5af0cd1b7c0a11ec7713feb5abe5a6b2795c

RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    dnsutils \
    whois \
    netbase \
    libcap2-bin \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r kaliuser && useradd -r -g kaliuser kaliuser \
    && setcap cap_net_raw+ep /usr/lib/nmap/nmap

USER kaliuser

CMD ["tail", "-f", "/dev/null"]
