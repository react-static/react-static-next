import os from "os";
import path from "path";
import fse from "fs-extra";
let createdHomeDirectory = "";
export function osHomeDirectory() {
    let dirPath;
    if (process.env.__UNSAFE_REACT_STATIC_HOME_DIRECTORY) {
        dirPath = process.env.__UNSAFE_REACT_STATIC_HOME_DIRECTORY;
    }
    else {
        const home = os.homedir();
        if (!home) {
            throw new Error("Can't determine your home directory; make sure your $HOME environment variable is set.");
        }
        if (process.env.REACT_STATIC_STAGING) {
            dirPath = path.join(home, ".react-static-staging");
        }
        else if (process.env.REACT_STATIC_LOCAL) {
            dirPath = path.join(home, ".react-static-local");
        }
        else {
            dirPath = path.join(home, ".react-static");
        }
    }
    if (createdHomeDirectory !== dirPath) {
        fse.mkdirSync(dirPath);
        createdHomeDirectory = dirPath;
    }
    return dirPath;
}
