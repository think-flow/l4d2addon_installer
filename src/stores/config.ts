import { reactive } from 'vue'
import { defineStore } from 'pinia'

type appConfig = {
    leftSideWidth: number,
    isCoverd: boolean
}

const defaultConfig: appConfig = {
    leftSideWidth: 25,
    isCoverd: true
}

export const useAppConfigStore = defineStore('application-config', () => {
    const str = localStorage.getItem('application-config') || 'null';
    let config = <appConfig>JSON.parse(str);

    if (!config) config = defaultConfig;

    const appConfig = reactive(config);
    
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('application-config', JSON.stringify(appConfig))
    })

    return { config: appConfig }
})