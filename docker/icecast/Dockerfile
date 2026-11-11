FROM debian:bookworm-slim
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends icecast2 ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*
COPY icecast.xml.template /etc/icecast2/icecast.xml.template
COPY start-icecast.sh /usr/local/bin/start-icecast
RUN chmod 0755 /usr/local/bin/start-icecast
EXPOSE 8000
CMD ["/usr/local/bin/start-icecast"]
