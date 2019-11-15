
# Torrent file viewer

A simple web app that lets you drag and drop `.torrent` files and see their contents.

[Live app here](https://luciopaiva.com/torrent-file-viewer)

`.torrent` files are simple instructions on how to download a file from the BitTorrent network. Internally they keep a simple dictionary containing things like tracker address, file name and hashes. The information is stored using the [Bencode encoding](https://en.wikipedia.org/wiki/Bencode) - check `bencode-decoder.js` to see how it is parsed. Bencode is really just another way to encode collections of keys and values, like JSON or YML formats.
