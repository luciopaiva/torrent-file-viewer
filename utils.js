
function assert(value, errorMessage) {
    if (!value) {
        throw new Error(errorMessage);
    }
}

export {
    assert,
};
