import path from 'path'
import fs from 'fs'
import regedit from 'regedit'
import { log, logErr } from './logHelper'
import { shell } from 'electron'

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
            creationTime: stats.birthtime
        });
    });
    // 根据创建时间排序，从大到小
    vpkFilesInfo.sort((a, b) => b.creationTime - a.creationTime);

    log(`找到${vpkFilesInfo.length}个vpk文件`);
    return vpkFilesInfo;
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

const installVpk = async (filePaths: string[], isCoverd: boolean) => {
    let success = true;
    //vpk文件
    //将文件复制到addons文件夹下
    const addonsPath = await getAddonsPath();
    for (const filepath of filePaths) {
        const fileName = path.basename(filepath);
        let destPath = path.join(addonsPath, fileName);
        try {
            if (isCoverd) {
                await fs.promises.copyFile(filepath, destPath);
            } else {
                await fs.promises.copyFile(filepath, destPath, fs.constants.COPYFILE_EXCL);
            }
            log(`${fileName} 已安装`);
        } catch (err) {
            success = false;
            if (err.code === 'EEXIST') {
                //文件已存在
                logErr(`${fileName} 已存在`);
            } else {
                logErr(err);
            }
        }
    }
    return success;


    //压缩包



}

const l4d2Hellper = {
    getGamePath,
    getAddonsPath,
    getVpkFiles,
    delectVpk,
    installVpk,
};

export default l4d2Hellper