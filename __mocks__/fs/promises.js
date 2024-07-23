// __mocks__/fs/promises.js
const { fs } = require("memfs");
module.exports = fs.promises;