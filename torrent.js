
import { arrayBufferToUtf8, assert } from "./utils.js";

export default class Torrent {

    /** @type {String} URL of the tracker for this torrent (when there's a single one) */
    announce = null;
    /** @type {String[]} URLs of the trackers for this torrent (when there're multiple ones) */
    announceList = null;
    /** @type {Date} when was this torrent created */
    creationDate = null;
    /** @type {Number} when there's a single file in the torrent, this is its size in bytes */
    length = null;
    /** @type {String} when there's a single file in the torrent, this is its name */
    name = null;
    /** @type {Number} a torrent is made up of pieces and each piece has this size in bytes */
    pieceLength = null;
    /** @type {ArrayBuffer[]} list of SHA-1 hashes for every piece of this torrent */
    pieces = null;
    /** @type {{name: String, length: Number}[]} list of files in the torrent (when there's more than one) */
    files = null;

    /**
     * @param {Object} dictionary
     */
    constructor (dictionary) {
        // console.info(dictionary);

        this.announce = arrayBufferToUtf8(dictionary["announce"]);

        const announceList = dictionary["announce-list"];
        if (announceList) {
            this.announceList = announceList.flat(Number.POSITIVE_INFINITY)
                .map(tracker => arrayBufferToUtf8(tracker));
        }
        this.creationDate = new Date(dictionary["creation date"] * 1000);
        const info = dictionary["info"];
        this.length = info["length"];
        this.name = arrayBufferToUtf8(info["name"]);
        this.pieceLength = info["piece length"];
        const piecesRaw = info["pieces"];
        this.pieces = [];

        assert(piecesRaw.byteLength % 20 === 0, "Field 'pieces' has wrong size");

        for (let i = 0; i < piecesRaw.byteLength; i += 20) {
            this.pieces.push(piecesRaw.slice(i, i + 20));
        }

        const files = info["files"];
        if (files) {
            this.files = [];
            for (const file of files) {
                this.files.push({
                    name: Array.isArray(file.path) ?
                        (file.path.length > 1 ? file.path.map(arrayBufferToUtf8) : arrayBufferToUtf8(file.path[0])) :
                        arrayBufferToUtf8(file.path),
                    length: file.length,
                })
            }
        }

        // const actualCount = this.pieces.length;
        // const expectedCount = Math.ceil(this.length / this.pieceLength);
        // console.info(actualCount, expectedCount);
        // assert(actualCount === expectedCount, "File size doesn't match the sum of the pieces");
    }
}
