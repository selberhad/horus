function splitFirstWord(message) {
    const [first] = message.split(' ', 1);
    return [first, message.substring(first.length+1)];
}
function ucFirst(string) {
    return string[0].toUpperCase() + string.substring(1);
}

module.exports = {
    splitFirstWord,
    ucFirst
};
