import { createExtractorFromData } from 'node-unrar-js'
import path from 'path'
import fs from 'fs'

console.log('unarar-worker is running')

process.on('message', async (arg) => {
    const { filePath, addonsPath, isCoverd } = arg;
    const buffer = await fs.promises.readFile(filePath);
    const extractor = await createExtractorFromData({ data: buffer });
    const extracted = extractor.extract({
        files: (fileHeader) => {
            if (fileHeader.flags.directory) return false;
            return path.extname(fileHeader.name).toLocaleLowerCase() === '.vpk';
        }
    });
    //child_process方式无法将vpkFiles传递出去，那就只能把主要逻辑放这了
    let vpkFiles = null;
    try {
        vpkFiles = [...extracted.files];
        sendMsg(`解压出${vpkFiles.length}个文件 ${vpkFiles.map(c => `"${c.fileHeader.name}"`).reduce((pv, cv) => `${pv},${cv}`)}`);
    } catch (err) {
        if (err.reason === 'ERAR_MISSING_PASSWORD') {
            sendError('不支持带有密码的rar文件');
        } else {
            sendError(err.message)
        }
        sendFinished();
        return; //文件解压失败，则终止后续处理
    }

    //压缩文件解压成功，开始写入文件
    for (const vpkFile of vpkFiles) {
        try {
            let destPath = path.join(addonsPath, path.basename(vpkFile.fileHeader.name));
            if ((!isCoverd) && fs.existsSync(destPath)) {
                //要求不覆盖文件，假如文件存在则输出错误件
                sendError(`${vpkFile.fileHeader.name} 已存在`);
                continue;
            }
            const buffer = Buffer.from(vpkFile.extraction)
            await fs.promises.writeFile(destPath, buffer);
            sendMsg(`${vpkFile.fileHeader.name} 已安装`);
        } catch (err) {
            sendError(err);
        }
    }
    sendFinished();
});

//向主程序发送 解压程序已完成的信号。虽然已完成，但不是只压缩文件一定解压成功了
function sendFinished() {
    process.send({ type: 'finished' })
}

function sendMsg(msg) {
    process.send({ type: 'msg', content: msg })
}

function sendError(msg) {
    process.send({ type: 'error', content: msg })
}
