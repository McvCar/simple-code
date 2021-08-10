/**
 * 1.监听文件变动
 */

const fs = require("fs");
const path = require("path");
const tools = require("./tools");
 
 
 /**
  * 事件回调
  *
  * @callback WatchEventCallback
  * @param {string} eventName - 事件名 create | delete | change | init
  * @param {Array<string>} files - 改变的文件
  */
 
 /**
  * 监听事件
  */
 class WatchFile {
     /** 
      * @param {WatchFile} watchObj
      * @param {string} pathName 
      * @param {WatchEventCallback} eventCallback 
      */
     constructor(watchObj,pathName,eventCallback){
         this.pathName = pathName;
         this.eventCallback = eventCallback;
         this._watchObj = watchObj;
         /** @type Object<string,fs.Stats> */
         this._files = {}
         this._isChecking = false;
         this._isInit = false;
         this._isExistPath = false;
         this.check();
     }
 
     stop(){
         this._watchObj.removeWatch(this.eventCallback);
     }
 
     /**
      * 更新文件状态
      */
     async check(){
         if(this._isChecking){
             return;
         }
         let pathStat = fs.existsSync(this.pathName) ? fs.statSync(this.pathName) : undefined;
         if(!pathStat){
             // 监听的目录被删除
             if(this._isExistPath) setTimeout(this._removeAllFile.bind(this),1);
             this._isExistPath = false;
             return ;
         }

         this._isExistPath = true;
         this._isChecking = true;
         let newFiles = {}
         if(pathStat && pathStat.isDirectory())
         {
             newFiles = await getDirAllFiles(this.pathName,newFiles)
             this._update(newFiles)
         }else if(pathStat.isFile())
         {
             newFiles[this.pathName] = pathStat;
             // 延迟执行防止循环调用
             setTimeout(()=>this._update(newFiles),1) 
         }
     }
 
     /**
      * 更新状态
      * @param {Object<string,fs.Stats>} newFiles 
      */
     _update(newFiles){
         let deleteFiles = [];
         let changeFiles = [];
         let createFiles = [];
         for (const filePath in this._files) {
             const oldFileStats = this._files[filePath];
             const newFileStats = newFiles[filePath]
             if(newFileStats == null){
                 // 文件被删
                 deleteFiles.push(filePath);
             }else if(newFileStats.mtimeMs != oldFileStats.mtimeMs){
                 // 文件被修改
                 changeFiles.push(filePath);
             }
         }
 
         for (const filePath in newFiles) {
             /** @type fs.Stats */
             const oldFileStats = this._files[filePath];
             if(oldFileStats == null){
                 // 新创文件
                 createFiles.push(filePath);
             }
         }
         let isInit = this._isInit;
         this._files = newFiles;
         this._isChecking = false;
         this._isInit = true;
 
         // 调用事件
         if(this.eventCallback){
             if(!isInit){
                 this.eventCallback('init',createFiles);
             }else{
                 if(deleteFiles.length) this.eventCallback('delete',deleteFiles);
                 if(changeFiles.length) this.eventCallback('change',changeFiles);
                 if(createFiles.length) this.eventCallback('create',createFiles);
             }
         }
     }

     _removeAllFile(){
        let deleteFiles = [];
        for (const filePath in this._files) {
            deleteFiles.push(filePath);
        }
        this._files = {};
        if(deleteFiles.length) this.eventCallback('delete',deleteFiles);
     }
 }
 
 /**
  * 监听文件类
  */
  class WatchMgr{
     constructor(){
         /** @type [WatchFile] */
         this.eventListens = []
         this.watchFileBuffs = {}
     }
 
     /**
      * 
      * @param {string} pathName 
      * @param {WatchEventCallback} eventCallback 
      * @returns {WatchFile}
      */
     addWatchPath(pathName,eventCallback) {
         let watchFile = new WatchFile(this,pathName,eventCallback);
         this.eventListens.push(watchFile);
         return watchFile;
     }
     
     checkAll() {
         for (let i = 0; i < this.eventListens.length; i++) {
             const watchFile = this.eventListens[i];
             watchFile.check();
         }
     }
 
     check(pathName) {
         for (let i = 0; i < this.eventListens.length; i++) {
             const watchFile = this.eventListens[i];
             if(watchFile.pathName == pathName){
                 watchFile.check();
                 break
             }
         }
     }
 
     removeWatch(pathName) {
         for (let i = 0; i < this.eventListens.length; i++) {
             const watchFile = this.eventListens[i];
             if(watchFile.pathName == pathName){
                 this.eventListens.splice(i,1);
                 break
             }
         }
     }
  }
 
 
async function getDirAllFiles(dirPath ,result = {}) {
    return new Promise((resolve, reject )=> 
    {
        fs.readdir(dirPath,(err,files)=>
        {
            if(err) return reject(err);
            let len = files.length;
            if(len == 0){
                resolve(result); // 没有文件
                return;
            }

            let cur_ind = 0;
            files.forEach((val) => {
                let fPath = path.join(dirPath, val);
                fs.stat(fPath,async (err,stat)=>
                {
                    if(err) return reject(err);
                    if (stat.isDirectory()) {
                        result = await getDirAllFiles(fPath,result);
                    } else if (stat.isFile()) {
                        result[fPath] = stat ;
                    }
                    cur_ind ++;
                    if(cur_ind == len) {
                        resolve(result)
                    }
                })
            });
         });
    })
 }
  
 
  exports.WatchMgr = WatchMgr;
  exports.WatchFile = WatchFile;