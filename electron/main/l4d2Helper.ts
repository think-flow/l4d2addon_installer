import path from 'node:path'
import fs from 'node:fs'
import { log, logErr } from './logHelper'
import { BrowserWindow } from 'electron'
import workerProcess from './utilities/worker_process'

//缓存获得的steam安装路径
let g_steamPath: string = null;
let g_gamePath: string = null;
let g_addonsPath: string = null;
let g_folderWatcher: unknown = null;

// 获取Steam路径
const getSteamPath = () => {
    if (g_steamPath != null) {
        return Promise.resolve(g_steamPath);
    }
    //从注册表中获取steam安装路径
    return new Promise<string>(async (resolve, reject) => {
        const steamRegistryPath = 'HKCU\\Software\\Valve\\Steam';
        const steamRegistryKey = 'SteamPath';

        //如果不从指定的位置读取regList.wsf文件
        //那么在程序打包后，读取注册表时，会因为找不到regList.wsf文件而报错
        const regedit = await import('regedit')
        if (process.env.NODE_ENV !== 'development') {
            regedit.setExternalVBSLocation(path.join(process.env.ASAR_UNPACK, 'node_modules/regedit/vbs'))
        }
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

    //监听addons文件夹变化
    if (!g_folderWatcher) {
        const { watch } = await import('chokidar');
        const watcher = watch(addonsPath, { persistent: true, ignoreInitial: true })
        watcher.on('add', path => sendFolderChangedEvent('add', path));
        watcher.on('change', path => sendFolderChangedEvent('change', path));
        watcher.on('unlink', path => sendFolderChangedEvent('unlink', path));
        watcher.on('error', error => logErr(`监控文件夹路径时发生错误: ${error.message}`));
        g_folderWatcher = watcher;
    }
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

    function sendFolderChangedEvent(eventType: string, fildPath: string) {
        if (path.extname(fildPath).toLowerCase() !== '.vpk') return;
        BrowserWindow.fromId(1).webContents.send('main-process-addons-folder-changed', { type: eventType, path: fildPath })
    }
}

const delectVpk = async (filePaths: string[], toTrash: boolean = true) => {
    let success = true;
    if (toTrash) {
        const { shell } = await import('electron');
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
        //创建文件安装进程
        const installer = workerProcess.run('install-vpk-worker');
        let success = true;
        installer.on('message', (msg: any) => {
            if (msg.type === 'message') {
                log(msg.content);
            } else if (msg.type === 'error') {
                success = false;
                logErr(msg.content);
            } else {
                reject('不支持的消息类型');
            }
        });
        installer.on('exit', (code) => {
            if (code !== 0) {
                success = false;
                logErr(`unrar-worker stopped with exit code ${code}`);
            }
            resolve(success);           //进程退出 结束promise等待
        });
        const addonsPath = await getAddonsPath();
        installer.postMessage({ filePaths, addonsPath, isCoverd });
    });
}

export default {
    getGamePath,
    getAddonsPath,
    getVpkFiles,
    delectVpk,
    installVpk,
}