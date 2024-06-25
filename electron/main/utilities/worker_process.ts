import { utilityProcess, ForkOptions, UtilityProcess } from 'electron'
import path from 'node:path'

const workerProcess = {
    /**
    * 函数将根据workerName自动从./dist-electron/main/worker_threads文件夹下寻找.js文件
    * 
    * 内部封装utilityProcess.fork
    * 
    * Docs: https://electronjs.org/docs/api/utility-process
    * @param workerName 需要运行的worker名称
    */
    run: (workerName: string, args?: string[], options?: ForkOptions): UtilityProcess => {
        if (!workerName) {
            throw new Error('workerName can not be empty')
        }
        //.ts后缀 转.js
        //无后缀 增加js
        const extname = path.extname(workerName)
        if (extname === '.ts') {
            workerName = workerName.replace(/\.ts$/, '.js')
        } else if (extname === '') {
            workerName = workerName + '.js'
        }
        const workerPath = path.join(process.env.WORKER_THREADS, workerName)
        // console.log(`prepare to run ${workerPath}`)
        return utilityProcess.fork(workerPath, args, options)
    }
}

export default workerProcess