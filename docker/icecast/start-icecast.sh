#!/bin/sh
set -eu

: "${ICECAST_SOURCE_PASSWORD:?Set ICECAST_SOURCE_PASSWORD}"
: "${ICECAST_ADMIN_PASSWORD:?Set ICECAST_ADMIN_PASSWORD}"

case "${ICECAST_SOURCE_PASSWORD}${ICECAST_ADMIN_PASSWORD}" in
  *[!A-Za-z0-9_-]*)
    echo "Icecast passwords may contain only letters, numbers, underscore and hyphen." >&2
    exit 1
    ;;
esac

sed \
  -e "s/__ICECAST_SOURCE_PASSWORD__/${ICECAST_SOURCE_PASSWORD}/g" \
  -e "s/__ICECAST_ADMIN_PASSWORD__/${ICECAST_ADMIN_PASSWORD}/g" \
  /etc/icecast2/icecast.xml.template > /run/icecast.xml

exec icecast2 -c /run/icecast.xml
