import path from 'node:path'
import fs from 'node:fs'
import jszip from 'jszip'
import { createExtractorFromData } from 'node-unrar-js'

process.on('message', async (arg) => {
    const { addonsPath, filePaths, isCoverd } = arg;

    for (const filePath of filePaths) {
        const extname = path.extname(filePath).toLowerCase();
        if (extname === '.vpk') {
            await vpk_installer(filePath, addonsPath, isCoverd);
        } else if (extname === '.zip') {
            await zip_installer(filePath, addonsPath, isCoverd);
        } else if (extname === '.rar') {
            await rar_installer(filePath, addonsPath, isCoverd);
        } else {
            logErr(`${path.basename(filePath)} 不支持该文件格式`);
        }
    }

    //执行完成 进程正常退出
    process.exit(0);
})

//vpk文件安装程序
async function vpk_installer(filePath, addonsPath, isCoverd) {
    const fileName = path.basename(filePath);
    const destPath = path.join(addonsPath, fileName);
    try {
        if (isCoverd) {
            await fs.promises.copyFile(filePath, destPath);
        } else {
            await fs.promises.copyFile(filePath, destPath, fs.constants.COPYFILE_EXCL);
        }
        log(`${fileName} 已安装`);
    } catch (err) {
        if (err.code === 'EEXIST') {
            //文件已存在
            logErr(`${fileName} 已存在`);
        } else {
            logErr(err.message);
        }
    }
}

//zip文件安装程序
async function zip_installer(filePath, addonsPath, isCoverd) {
    const fileName = path.basename(filePath);
    log(`正在解压 ${fileName}`);
    const vpkEntries = [];
    try {
        const buffer = await fs.promises.readFile(filePath);
        const zip = await jszip.loadAsync(buffer);
        zip.forEach(async (_, zipEntry) => {
            if (zipEntry.dir) return;
            if (path.extname(zipEntry.name).toLocaleLowerCase() === '.vpk') {
                vpkEntries.push(zipEntry);
            }
        });
        log(`解压出${vpkEntries.length}个文件 ${vpkEntries.map(c => `"${c.name}"`).reduce((pv, cv) => `${pv},${cv}`)}`);
    } catch (err) {
        logErr(err.message);
        return; //如果解压文件失败，则去处理下一个文件
    }

    //压缩文件解压成功，开始写入文件
    for (const entry of vpkEntries) {
        const destPath = path.join(addonsPath, path.basename(entry.name));
        if ((!isCoverd) && fs.existsSync(destPath)) {
            //要求不覆盖文件，假如文件存在则输出错误件
            logErr(`${entry.name} 已存在`);
            continue;
        }
        try {
            const buffer = await entry.async('nodebuffer');
            await fs.promises.writeFile(destPath, buffer);
            log(`${entry.name} 已安装`);
        } catch (err) {
            logErr(err.message);
        }
    }
}

//rar文件安装程序
async function rar_installer(filePath, addonsPath, isCoverd) {
    const fileName = path.basename(filePath);
    log(`正在解压 ${fileName}`);
    const buffer = await fs.promises.readFile(filePath);
    const extractor = await createExtractorFromData({ data: buffer });
    const extracted = extractor.extract({
        files: (fileHeader) => {
            if (fileHeader.flags.directory) return false;
            return path.extname(fileHeader.name).toLocaleLowerCase() === '.vpk';
        }
    });
    let vpkFiles = null;
    try {
        vpkFiles = [...extracted.files];
        log(`解压出${vpkFiles.length}个文件 ${vpkFiles.map(c => `"${c.fileHeader.name}"`).reduce((pv, cv) => `${pv},${cv}`)}`);
    } catch (err) {
        if (err.reason === 'ERAR_MISSING_PASSWORD') {
            logErr('不支持带有密码的rar文件');
        } else {
            logErr(err.message)
        }
        return; //如果解压文件失败，则去处理下一个文件
    }

    //压缩文件解压成功，开始写入文件
    for (const vpkFile of vpkFiles) {
        try {
            const destPath = path.join(addonsPath, path.basename(vpkFile.fileHeader.name));
            if ((!isCoverd) && fs.existsSync(destPath)) {
                //要求不覆盖文件，假如文件存在则输出错误件
                logErr(`${vpkFile.fileHeader.name} 已存在`);
                continue;
            }
            const buffer = Buffer.from(vpkFile.extraction)
            await fs.promises.writeFile(destPath, buffer);
            log(`${vpkFile.fileHeader.name} 已安装`);
        } catch (err) {
            logErr(err.message);
        }
    }

}

//向主进程发送日志信息
function log(msg) {
    process.send({ type: 'message', content: msg })
}

//向主进程发送错误信息
function logErr(msg) {
    process.send({ type: 'error', content: msg })
}