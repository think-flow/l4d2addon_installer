import path from 'path'
import os from 'os'
import fs from 'fs';
import regedit from 'regedit';

// Windows平台读取注册表
const getSteamPathWindows = () => {
    return new Promise((resolve, reject) => {
        const steamRegistryPath = 'HKCU\\Software\\Valve\\Steam';
        const steamRegistryKey = 'SteamPath';

        regedit.list(steamRegistryPath, (err, result) => {
            if (err) {
                return reject('读取注册表出错: ' + err);
            }

            if (result[steamRegistryPath] && result[steamRegistryPath].values[steamRegistryKey]) {
                resolve(result[steamRegistryPath].values[steamRegistryKey].value);
            } else {
                reject('未找到Steam安装路径');
            }
        });
    });
};

// macOS平台检查常见路径
const getSteamPathMacOS = () => {
    return new Promise((resolve, reject) => {
        const steamPaths = [
            path.join(os.homedir(), '.steam', 'steam'),
            path.join(os.homedir(), '.local', 'share', 'Steam')
        ];

        for (const steamPath of steamPaths) {
            if (fs.existsSync(steamPath)) {
                return resolve(steamPath);
            }
        }

        reject('未找到Steam安装路径');
    });
};

// 获取Steam路径
const getSteamPath = () => {
    return new Promise((resolve, reject) => {
        if (os.platform() === 'win32') {
            getSteamPathWindows().then(resolve).catch(reject);
        } else if (os.platform() === 'darwin') {
            getSteamPathMacOS().then(resolve).catch(reject);
        } else {
            reject('不支持的操作系统');
        }
    });
};

// 解析 libraryfolders.vdf 文件
const parseLibraryFoldersVDF = (vdfContent) => {
    const libraryFolders = [];
    const lines = vdfContent.split('\n');
    for (const line of lines) {
        const match = line.match(/"\d+"\s+"(.+?)"/);
        if (match) {
            libraryFolders.push(match[1]);
        }
    }
    return libraryFolders;
};

// 获取 Left 4 Dead 2 的安装路径
const getGamePath = () => {
    return getSteamPath()
        .then(steamPath => {
            const libraryFoldersFile = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
            if (!fs.existsSync(libraryFoldersFile)) {
                throw new Error('未找到 libraryfolders.vdf 文件');
            }

            const vdfContent = fs.readFileSync(libraryFoldersFile, 'utf-8');
            const libraryFolders = parseLibraryFoldersVDF(vdfContent);

            for (const folder of libraryFolders) {
                const gamePath = path.join(folder, 'steamapps', 'common', 'Left 4 Dead 2');
                if (fs.existsSync(gamePath)) {
                    return gamePath;
                }
            }

            const defaultGamePath = path.join(steamPath, 'steamapps', 'common', 'Left 4 Dead 2');
            if (fs.existsSync(defaultGamePath)) {
                return defaultGamePath;
            }

            throw new Error('未找到 Left 4 Dead 2 的安装路径');
        });
};

const getAddonsPath = async () => {
    let gamePath = await getGamePath();
    let addonsPath = path.join(gamePath, 'left4dead2', 'addons');
    if (!await fs.existsSync(addonsPath)) {
        throw new Error('未找到 Addons 文件夹路径');
    }
    return addonsPath;
}

const getVpkFiles = () => {
    return new Promise(async (resolve, reject) => {
        let addonsPath = await getAddonsPath();
        fs.readdir(addonsPath, (err, files) => {
            if (err) {
                return reject('读取目录出错: ' + err);
            }
            const vpkFiles = files.filter(file => path.extname(file).toLowerCase() === '.vpk');
            const vpkFilesInfo = [];
            vpkFiles.forEach(file => {
                const filePath = path.join(addonsPath, file);
                const stats = fs.statSync(filePath);
                vpkFilesInfo.push({
                    file,
                    fileWithoutEx:path.parse(filePath).name,
                    filePath,
                    creationTime: stats.birthtime
                });
            });
            // 根据创建时间排序，从大到小
            vpkFilesInfo.sort((a, b) => b.creationTime - a.creationTime);
            resolve(vpkFilesInfo);
        })
    })
}

const l4d2Hellper = {
    getGamePath,
    getAddonsPath,
    getVpkFiles
};

export default l4d2Hellper