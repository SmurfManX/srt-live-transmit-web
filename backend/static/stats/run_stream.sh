ffmpeg -re -i https://receiver.adjara.com/a/index.m3u8 -c copy -f mpegts udp://233.23.23.100:23100?pkt_size=1316
