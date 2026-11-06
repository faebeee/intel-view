FROM kalilinux/kali-rolling@sha256:73915d5d54833d498f52fd200960126be4a2dbdcc110d75d70839c4ef155ed03

RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    libcap2-bin \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r kaliuser && useradd -r -g kaliuser kaliuser \
    && setcap cap_net_raw+ep /usr/bin/nmap

USER kaliuser

CMD ["tail", "-f", "/dev/null"]
