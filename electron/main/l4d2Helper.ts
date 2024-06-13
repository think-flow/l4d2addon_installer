import path from 'path'
import fs from 'fs'
import regedit from 'regedit'
import { log, logErr } from './logHelper'
import { shell } from 'electron'
import jszip from 'jszip'
import cp from 'child_process'

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
            creationTime: stats.birthtime
        });
    });
    // 根据创建时间排序，从大到小
    vpkFilesInfo.sort((a, b) => b.creationTime - a.creationTime);

    // log(`找到${vpkFilesInfo.length}个vpk文件`);
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
    const addonsPath = await getAddonsPath();
    for (const filepath of filePaths) {
        const fileName = path.basename(filepath);
        const extname = path.extname(filepath).toLowerCase();
        if (extname === '.vpk') {
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
        } else if (extname === '.zip') {
            log(`正在解压 ${fileName}`);
            const vpkEntries: jszip.JSZipObject[] = [];
            try {
                const buffer = await fs.promises.readFile(filepath);
                const zip = await jszip.loadAsync(buffer);
                zip.forEach(async (_, zipEntry) => {
                    if (zipEntry.dir) return;
                    if (path.extname(zipEntry.name).toLocaleLowerCase() === '.vpk') {
                        vpkEntries.push(zipEntry);
                    }
                });
                log(`解压出${vpkEntries.length}个文件 ${vpkEntries.map(c => `"${c.name}"`).reduce((pv, cv) => `${pv},${cv}`)}`);
            } catch (err) {
                success = false;
                logErr(err);
                continue; //如果解压文件失败，则去处理下一个文件
            }

            //压缩文件解压成功，开始写入文件
            for (const entry of vpkEntries) {
                try {
                    let destPath = path.join(addonsPath, path.basename(entry.name));
                    if ((!isCoverd) && fs.existsSync(destPath)) {
                        //要求不覆盖文件，假如文件存在则输出错误件
                        success = false;
                        logErr(`${entry.name} 已存在`);
                        continue;
                    }
                    const buffer = await entry.async('nodebuffer');
                    await fs.promises.writeFile(destPath, buffer);
                    log(`${entry.name} 已安装`);
                } catch (err) {
                    success = false;
                    logErr(err);
                }
            }
        } else if (extname === '.rar') {
            log(`正在解压 ${fileName}`);

            //创建unrar进程
            let unrarProcess = cp.fork('./electron/worker_threads/unrar-worker.js');
            const run_unrar_process = (filePath, addonsPath, isCoverd): Promise<void> => {
                return new Promise((resolve, reject) => {
                    unrarProcess.on('message', (msg: any) => {
                        if (msg.type === 'finished') {
                            resolve();
                        } else if (msg.type === 'msg') {
                            log(msg.content);
                        } else {
                            success = false;
                            logErr(msg.content);
                        }
                    });
                    unrarProcess.on('error', (err) => {
                        success = false;
                        reject(err);
                    });
                    unrarProcess.on('exit', (code) => {
                        success = false;
                        if (code !== 0) {
                            reject(new Error(`unrar-worker stopped with exit code ${code}`));
                        }
                    });
                    //启动unrar进程
                    unrarProcess.send({ filePath, addonsPath, isCoverd });
                })
            }

            try {
                await run_unrar_process(filepath, addonsPath, isCoverd);
                unrarProcess.kill(); //杀掉unrar进程
            } catch (err) {
                //解压进程异常退出
                logErr(`${fileName} 解压失败 ${err.message}`)
                continue;
            }
            /*
                        //该方式会阻塞主线程，导致窗口不能响应
                        const buffer = await fs.promises.readFile(filepath);
                        const extractor = await createExtractorFromData({ data: buffer });
                        const extracted = extractor.extract({
                            files: (fileHeader) => {
                                if (fileHeader.flags.directory) return false;
                                return path.extname(fileHeader.name).toLocaleLowerCase() === '.vpk';
                            }
                        });
                        let vpkFiles: ArcFile[] = [];
                        try {
                            vpkFiles = [...extracted.files];
                            log(`解压出${vpkFiles.length}个文件 ${vpkFiles.map(c => `"${c.fileHeader.name}"`).reduce((pv, cv) => `${pv},${cv}`)}`);
            
                        } catch (err) {
                            success = false;
                            if (err.reason === 'ERAR_MISSING_PASSWORD') {
                                logErr('不支持带有密码的rar文件');
                            } else {
                                logErr(err)
                            }
                            continue; //如果解压文件失败，则去处理下一个文件
                        }
            
            
                        //压缩文件解压成功，开始写入文件
                        for (const vpkFile of vpkFiles) {
                            try {
                                let destPath = path.join(addonsPath, path.basename(vpkFile.fileHeader.name));
                                if ((!isCoverd) && fs.existsSync(destPath)) {
                                    //要求不覆盖文件，假如文件存在则输出错误件
                                    success = false;
                                    logErr(`${vpkFile.fileHeader.name} 已存在`);
                                    continue;
                                }
                                // const buffer = Buffer.from(vpkFile.extraction)
                                // await fs.promises.writeFile(destPath, buffer);
                                log(`${vpkFile.fileHeader.name} 已安装`);
                            } catch (err) {
                                console.log(err)
                                success = false;
                                logErr(err);
                            }
                        }
            */
        } else {
            success = false;
            logErr(`${fileName} 不支持该文件格式`);
        }
    }
    return success;
}

const l4d2Hellper = {
    getGamePath,
    getAddonsPath,
    getVpkFiles,
    delectVpk,
    installVpk,
};

export default l4d2Hellper