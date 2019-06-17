
import { assert } from "./utils.js";

export default class BencodeDecoder {

    static DICTIONARY_BEGIN = "d".charCodeAt(0);
    static LIST_BEGIN = "l".charCodeAt(0);
    static INTEGER_BEGIN = "i".charCodeAt(0);
    static TYPE_END = "e".charCodeAt(0);
    static COLON = ":".charCodeAt(0);
    static DIGITS = "0123456789".split("").map(d => d.charCodeAt(0));

    static utf8Decoder = new TextDecoder("utf-8");

    /** @type {DataView} */
    view = null;

    constructor (view) {
        this.view = view;
        this.index = 0;
        console.info(this.parseDictionary());
    }

    nextByte() {
        return this.view.getUint8(this.index++);
    }

    unread() {
        this.index--;
    }

    parseDictionary() {
        const begin = this.nextByte();
        assert(begin === BencodeDecoder.DICTIONARY_BEGIN, "Expected dictionary");

        let dict = {};

        let cmd = this.nextByte();
        while (cmd !== BencodeDecoder.TYPE_END) {
            this.unread();
            const key = this.parseDictionaryKey();
            dict[key] = this.parseValue();

            cmd = this.nextByte();
        }

        return dict;
    }

    parseValue() {
        const cmd = this.nextByte();
        this.unread();

        switch (cmd) {
            case BencodeDecoder.INTEGER_BEGIN:
                return this.parseInteger();
            case BencodeDecoder.LIST_BEGIN:
                return this.parseList();
            case BencodeDecoder.DICTIONARY_BEGIN:
                return this.parseDictionary();
            default:
                if (BencodeDecoder.DIGITS.includes(cmd)) {
                    return this.parseByteString();
                } else {
                    throw new Error(`Unknown value identifier "${cmd}"`);
                }
        }
    }

    parseList() {
        assert(this.nextByte() === BencodeDecoder.LIST_BEGIN, "Expected list begin marker");

        const list = [];

        let cmd = this.nextByte();
        while (cmd !== BencodeDecoder.TYPE_END) {
            this.unread();
            list.push(this.parseValue());
            cmd = this.nextByte();
        }

        return list;
    }

    parseInteger() {
        assert(this.nextByte() === BencodeDecoder.INTEGER_BEGIN, "Expected integer begin marker");
        const integer = this.parseBaseTenNumber();
        assert(this.nextByte() === BencodeDecoder.TYPE_END, "Expected integer end marker");
        return integer;
    }

    parseDictionaryKey() {
        return BencodeDecoder.utf8Decoder.decode(this.parseByteString());
    }

    parseByteString() {
        const len = this.parseBaseTenNumber();
        this.matchColon();
        return this.parseString(len);
    }

    parseBaseTenNumber() {
        let str = "";
        let code = this.nextByte();

        while (BencodeDecoder.DIGITS.includes(code)) {
            str += String.fromCharCode(code);
            code = this.nextByte();
        }
        this.unread();

        return parseInt(str, 10);
    }

    matchColon() {
        assert(this.nextByte() === BencodeDecoder.COLON, "Expected colon");
    }

    parseString(length) {
        let start = this.index;
        this.index += length;
        return this.view.buffer.slice(start, this.index);
        // let str = "";
        // for (let i = 0; i < length; i++) {
        //     str += String.fromCharCode(this.nextByte());
        // }
        // return str;
    }
}
