import path from 'node:path'
import fs from 'node:fs'
import regedit from 'regedit'
import { log, logErr } from './logHelper'
import { shell } from 'electron'
import cp from 'node:child_process'

//缓存获得的steam安装路径
let g_steamPath: string = null;
let g_gamePath: string = null;
let g_addonsPath: string = null;


// 获取Steam路径
const getSteamPath = () => {
    if (g_steamPath != null) {
        return Promise.resolve(g_steamPath);
    }
    //从注册表中获取steam安装路径
    return new Promise<string>((resolve, reject) => {
        const steamRegistryPath = 'HKCU\\Software\\Valve\\Steam';
        const steamRegistryKey = 'SteamPath';

        //如果不从指定的位置读取regList.wsf文件
        //那么在程序打包后，读取注册表时，会因为找不到regList.wsf文件而报错
        regedit.setExternalVBSLocation('./resources/app.asar.unpacked/node_modules/regedit/vbs')

        regedit.list([steamRegistryPath], (err, result) => {
            if (err) {
                return reject('读取注册表出错: ' + err);
            }
            if (result[steamRegistryPath] && result[steamRegistryPath].values[steamRegistryKey]) {
                g_steamPath = <string>result[steamRegistryPath].values[steamRegistryKey].value
                return resolve(g_steamPath);
            } else {
                return reject('未找到Steam安装路径');
            }
        });
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
    return <string[]>libraryFolders;
};

// 获取 Left 4 Dead 2 的安装路径
const getGamePath = async () => {
    if (g_gamePath != null) {
        return g_gamePath;
    }
    const steamPath = await getSteamPath();
    const libraryFoldersFile = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
    if (!fs.existsSync(libraryFoldersFile)) {
        throw new Error('未找到 libraryfolders.vdf 文件');
    }

    const vdfContent = await fs.promises.readFile(libraryFoldersFile, 'utf-8');
    const libraryFolders = parseLibraryFoldersVDF(vdfContent);

    for (const folder of libraryFolders) {
        const gamePath = path.join(folder, 'steamapps', 'common', 'Left 4 Dead 2');
        if (fs.existsSync(gamePath)) {
            g_gamePath = gamePath;
            return gamePath;
        }
    }

    const defaultGamePath = path.join(steamPath, 'steamapps', 'common', 'Left 4 Dead 2');
    if (fs.existsSync(defaultGamePath)) {
        g_gamePath = defaultGamePath;
        return defaultGamePath;
    }

    throw new Error('未找到 Left 4 Dead 2 的安装路径');
};

const getAddonsPath = async () => {
    if (g_addonsPath != null) {
        return g_addonsPath;
    }
    const gamePath = await getGamePath();
    const addonsPath = path.join(gamePath, 'left4dead2', 'addons');
    if (!fs.existsSync(addonsPath)) {
        throw new Error('未找到 Addons 文件夹路径');
    }
    g_addonsPath = addonsPath;
    return addonsPath;
}

const getVpkFiles = async () => {
    const addonsPath = await getAddonsPath();
    const files = await fs.promises.readdir(addonsPath);
    const vpkFiles = files.filter(file => path.extname(file).toLowerCase() === '.vpk');
    const vpkFilesInfo = [];
    vpkFiles.forEach(file => {
        const filePath = path.join(addonsPath, file);
        const stats = fs.statSync(filePath);
        vpkFilesInfo.push({
            file,
            fileWithoutEx: path.parse(filePath).name,
            filePath,
            creationTime: stats.birthtime,
            size: formatFileSize(stats.size)
        });
    });
    // 根据创建时间排序，从大到小
    vpkFilesInfo.sort((a, b) => b.creationTime - a.creationTime);

    // log(`找到${vpkFilesInfo.length}个vpk文件`);
    return vpkFilesInfo;

    function formatFileSize(bytes: number) {
        if (bytes === 0) return '0 B';
        const thresholds = {
            'TB': Math.pow(1024, 4),
            'GB': Math.pow(1024, 3),
            'MB': Math.pow(1024, 2),
            'KB': 1024,
            'B': 1,
        };
        let unit = 'B';
        for (let u in thresholds) {
            if (bytes >= thresholds[u]) {
                unit = u;
                break;
            }
        }
        return Math.floor((bytes / thresholds[unit]) * 100) / 100 + ' ' + unit;
    }
}

const delectVpk = async (filePaths: string[], toTrash: boolean = true) => {
    let success = true;
    if (toTrash) {
        // 将文件移到回收站
        for (const filePath of filePaths) {
            try {
                await shell.trashItem(filePath);
                log(`${path.basename(filePath)} 已成功移至回收站`);
            } catch (err) {
                logErr(`文件移至回收站时出错` + err);
                success = false;
            }
        }
    } else {
        // 直接删除文件
        for (const filePath of filePaths) {
            try {
                await fs.promises.unlink(filePath)
                log(`${path.basename(filePath)} 删除成功`);
            } catch (err) {
                logErr(`文件删除时出错` + err);
                success = false;
            }
        }
    }
    return success;
}

const installVpk = (filePaths: string[], isCoverd: boolean) => {
    return new Promise(async (resolve, reject) => {
        const addonsPath = await getAddonsPath();
        let workerPath = './electron/worker_threads/install-vpk-worker.js';
        if (process.env.NODE_ENV !== 'development') {
            workerPath = './resources/app.asar.unpacked/worker_threads/install-vpk-worker.js';
        }
        //创建文件安装进程
        const installerProcess = cp.fork(workerPath);
        let success = true;
        installerProcess.on('message', (msg: any) => {
            if (msg.type === 'message') {
                log(msg.content);
            } else if (msg.type === 'error') {
                success = false;
                logErr(msg.content);
            }
        });
        installerProcess.on('error', (err) => {
            logErr(err.message);
            resolve(false);             //当进程执行出现异常 就结束promise等待
        });
        installerProcess.on('exit', (code) => {
            if (code !== 0) {
                logErr(`unrar-worker stopped with exit code ${code}`);
            }
            resolve(success);           //当进程退出 就结束promise等待
        });
        //启动进程
        installerProcess.send({ filePaths, addonsPath, isCoverd });
    });
}

const l4d2Hellper = {
    getGamePath,
    getAddonsPath,
    getVpkFiles,
    delectVpk,
    installVpk,
};

export default l4d2Hellper