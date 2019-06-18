
const utf8Decoder = new TextDecoder("utf-8");

function assert(value, errorMessage) {
    if (!value) {
        throw new Error(errorMessage);
    }
}

function arrayBufferToUtf8(arrayBuffer) {
    return utf8Decoder.decode(arrayBuffer);
}

export {
    assert,
    arrayBufferToUtf8,
};
