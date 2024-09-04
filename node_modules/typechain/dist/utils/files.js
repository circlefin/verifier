"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAbsPath = exports.getFileExtension = exports.getFilename = void 0;
const path_1 = require("path");
function getFilename(path) {
    return (0, path_1.parse)(path).name;
}
exports.getFilename = getFilename;
function getFileExtension(path) {
    return (0, path_1.parse)(path).ext;
}
exports.getFileExtension = getFileExtension;
function ensureAbsPath(path) {
    if ((0, path_1.isAbsolute)(path)) {
        return path;
    }
    return (0, path_1.join)(process.cwd(), path);
}
exports.ensureAbsPath = ensureAbsPath;
//# sourceMappingURL=files.js.map