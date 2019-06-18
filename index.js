
import BencodeDecoder from "./bencode-decoder.js";
import Torrent from "./torrent.js";

class TorrentViewer {

    /** @private {HTMLTableElement} */
    table = null;

    constructor () {
        const html = document.documentElement;
        html.addEventListener("dragover", event => event.preventDefault());
        html.addEventListener("drop", this.drop.bind(this));

        this.deserializeSampleAndRead();  // ToDo may want to remove this after debugging is done
    }

    drop(event) {
        event.preventDefault();

        for (const item of event.dataTransfer.items) {
            if (item.kind === "file") {
                const file = item.getAsFile();
                console.info(`Dropped file "${file.name}", ${file.size} bytes`);

                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.addEventListener("load", this.onFileReady.bind(this, file.name, file.size));

                break;  // found a file, consider it done
            }
        }
    }

    /**
     * @private
     * @param {String} fileName
     * @param {Number} fileSize
     * @param {ProgressEvent} event
     */
    onFileReady(fileName, fileSize, event) {
        const fileReader = /** @type {FileReader} */ event.target;
        const fileContents = /** @type {ArrayBuffer} */ fileReader.result;

        TorrentViewer.serializeSampleAndSave(fileContents, fileName, fileSize);  // ToDo may want to remove this after debugging is done
        this.parse(fileContents, fileName, fileSize);
    }

    /**
     * @param {ArrayBuffer} fileContents
     * @param {String} fileName
     * @param {Number} fileSize
     */
    parse(fileContents, fileName, fileSize) {
        const view = new DataView(fileContents);
        const dictionary = BencodeDecoder.decode(view);

        const torrent = new Torrent(dictionary);

        this.fileNameElement = document.getElementById("file-name");
        if (!this.fileNameElement) {
            this.fileNameElement = document.createElement("h2");
            this.fileNameElement.setAttribute("id", "file-name");
            document.body.appendChild(this.fileNameElement);
        }
        this.fileNameElement.innerText = `${fileName} (${fileSize} bytes)`;

        this.table = /** @type {HTMLTableElement} */ document.getElementById("torrent-details");
        if (!this.table) {
            this.table = document.createElement("table");
            this.table.setAttribute("id", "torrent-details");
            document.body.appendChild(this.table);
        }

        this.upsertRow("announce", torrent.announce);
        this.upsertRow("announce-list", torrent.announceList ? torrent.announceList.join("<br>") : "not specified");
        this.upsertRow("creation-date", torrent.creationDate ? torrent.creationDate.toISOString() : "unknown");
        this.upsertRow("length", torrent.length > 0 ? torrent.length + " bytes" : "not specified");
        this.upsertRow("name", torrent.name ? torrent.name : "not specified");
        this.upsertRow("piece-length", torrent.pieceLength + " bytes");
        this.upsertRow("pieces", torrent.pieces.length + " pieces");
        this.upsertRow("files", torrent.files ?
            torrent.files.map(file => `${file.name} (${file.length} bytes)`).join("<br>") : "not specified");
    }

    upsertRow(key, value) {
        let row = document.getElementById("torrent-" + key);
        let valCol;
        if (!row) {
            row = this.table.insertRow();
            row.setAttribute("id", "torrent-" + key);
            const keyCol = row.insertCell();
            keyCol.innerHTML = key;
            valCol = row.insertCell();
        } else {
            valCol = row.querySelectorAll("td").item(1);
        }
        valCol.innerHTML = value;
    }

    /**
     * @param {ArrayBuffer} fileContents
     * @param {String} fileName
     * @param {Number} fileSize
     */
    static serializeSampleAndSave(fileContents, fileName, fileSize) {
        const buffer = new Uint8Array(fileContents);
        let serializedFile = "";
        for (let i = 0; i < buffer.byteLength; i++) {
            serializedFile += String.fromCharCode(buffer[i]);
        }
        const base64 = btoa(serializedFile);
        localStorage.setItem("sample-contents", base64);
        localStorage.setItem("sample-name", fileName);
        localStorage.setItem("sample-size", fileSize.toString());
    }

    deserializeSampleAndRead() {
        const base64 = localStorage.getItem("sample");
        if (base64) {
            const string = atob(base64);
            const byteBuffer = new Uint8Array(string.length);
            for (let i = 0; i < byteBuffer.byteLength; i++) {
                byteBuffer[i] = string.charCodeAt(i);
            }

            const fileName = localStorage.getItem("sample-name");
            const fileSize = localStorage.getItem("sample-size");
            this.parse(byteBuffer.buffer, fileName, fileSize ? parseInt(fileSize) : null);
        }
    }
}

window.addEventListener("load", () => new TorrentViewer());
