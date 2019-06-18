
import BencodeDecoder from "./bencode-decoder.js";
import Torrent from "./torrent.js";

class TorrentViewer {

    constructor () {
        const html = document.documentElement;
        html.addEventListener("dragover", event => event.preventDefault());
        html.addEventListener("drop", this.drop.bind(this));

        this.deserializeAndRead();
    }

    drop(event) {
        event.preventDefault();

        for (const item of event.dataTransfer.items) {
            if (item.kind === "file") {
                const file = item.getAsFile();
                console.info(`Dropped file "${file.name}", ${file.size} bytes`);

                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.addEventListener("load", this.onFileReady.bind(this));

                break;  // found a file, consider it done
            }
        }
    }

    /**
     * @private
     * @param {ProgressEvent} event
     */
    onFileReady(event) {
        const fileReader = /** @type {FileReader} */ event.target;
        const result = /** @type {ArrayBuffer} */ fileReader.result;

        TorrentViewer.serializeAndSave(result);
        this.parse(result);
    }

    parse(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        const dictionary = BencodeDecoder.decode(view);

        const torrent = new Torrent(dictionary);
        console.info(torrent);
    }

    /**
     * @param {ArrayBuffer} arrayBuffer
     */
    static serializeAndSave(arrayBuffer) {
        const buffer = new Uint8Array(arrayBuffer);
        let serializedFile = "";
        for (let i = 0; i < buffer.byteLength; i++) {
            serializedFile += String.fromCharCode(buffer[i]);
        }
        const base64 = btoa(serializedFile);
        localStorage.setItem("sample", base64);
        console.info(base64);
    }

    deserializeAndRead() {
        const base64 = localStorage.getItem("sample");
        if (base64) {
            const string = atob(base64);
            const byteBuffer = new Uint8Array(string.length);
            for (let i = 0; i < byteBuffer.byteLength; i++) {
                byteBuffer[i] = string.charCodeAt(i);
            }

            this.parse(byteBuffer.buffer);
        }
    }
}

window.addEventListener("load", () => new TorrentViewer());
