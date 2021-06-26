/* 
面板扩展
功能: 新建脚本并绑定组件
*/
'use strict';
const path = require('path');
const fs = require('fs');
const config = require('../../config');
const tools = require('../../tools/tools');
const exec = require('child_process').exec;

let TEMPLE_PATH = path.join(path.resolve(__dirname, './'), 'new_file_temple');
let USER_TEMPLE_PATH = path.join(config.cacheDir, 'new_file_temple');
let NEW_FILE_RULE = path.join(
    path.resolve(__dirname, './'),
    'new_script_rule.js'
);
let USER_NEW_FILE_RULE = path.join(config.cacheDir, 'new_script_rule.js');

module.exports = {
    // 面板初始化
    ready(parent) {
        // index.js 对象
        this.parent = parent;
    },

    // monaco 编辑器初始化
    onLoad() {
        this.temples = {};

        // 首次使用拷贝模板到可写路径
        if (
            !tools.isDirectory(USER_TEMPLE_PATH) &&
            tools.isDirectory(TEMPLE_PATH)
        ) {
            tools.createDir(USER_TEMPLE_PATH);
            let fileList = tools.getFileList(TEMPLE_PATH, []);
            for (let i = 0; i < fileList.length; i++) {
                const filePath = fileList[i];
                tools.copyFile(
                    filePath,
                    path.join(USER_TEMPLE_PATH, path.basename(filePath))
                );
            }
        }

        // 首次使用拷贝模板到可写路径
        if (!tools.isFileExit(USER_NEW_FILE_RULE)) {
            tools.copyFile(NEW_FILE_RULE, USER_NEW_FILE_RULE);
        }

        this.upTempletList();
    },

    upTempletList() {
        this.temples = {};
        let fileList = tools.getFileList(USER_TEMPLE_PATH, []);
        for (let i = 0; i < fileList.length; i++) {
            const filePath = fileList[i];
            if (
                filePath.indexOf('.DS_Store') != -1 ||
                filePath.indexOf('desktop.ini') != -1
            ) {
                continue;
            }
            this.temples[path.basename(filePath)] = filePath; // ['file.js'] = 'dir/game/file.js'
        }
    },

    newFileAndBindNode(templePath) {
        if (templePath == null || !tools.isFileExit(templePath)) {
            console.log('新建脚本文件不存在');
            return;
        }

        Editor.Scene.callSceneScript(
            'simple-code',
            'get-curr-scene-url-and-node',
            {},
            function (err, args) {
                if (args == null) {
                    return;
                }

                try {
                    let saveUrl = require(USER_NEW_FILE_RULE).getSavePath(
                        templePath,
                        args.url,
                        args.currNodeName
                    );
                    let saveFspath = Editor.remote.assetdb.urlToFspath(saveUrl);
                    tools.createDir(saveFspath);
                    args = { templePath, saveUrl, saveFspath };
                    Editor.Scene.callSceneScript(
                        'simple-code',
                        'new-js-file',
                        args,
                        (err, event) => {
                            Editor.Ipc.sendToPanel(
                                'simple-code',
                                'custom-cmd',
                                { cmd: 'openFile' }
                            );
                        }
                    );
                } catch (error) {
                    Editor.error(
                        tools.translateZhAndEn(
                            '检测新建脚本规则是否填错:',
                            'Check if new script rule is filled incorrectly:'
                        ),
                        error
                    );
                }
            }
        );
    },

    updateMenu() {
        let selectInfo = Editor.Selection.curGlobalActivate();
        if (selectInfo == null || selectInfo.id == null) {
            // 清除菜单
            Editor.Ipc.sendToMain('simple-code:setMenuConfig', {
                id: 'cc-new-file',
                menuCfg: undefined,
            });
            return;
        }

        let submenu = [];

        for (const key in this.temples) {
            let item = { label: key, enabled: true, cmd: 'new-script-templet' };
            submenu.push(item);
        }

        submenu.push({ type: 'separator' });
        submenu.push({
            label: tools.translateZhAndEn('刷新模板', 'Refresh Templates'),
            enabled: true,
            cmd: 'refresh-template',
        });
        submenu.push({
            label: tools.translateZhAndEn('自定义模板', 'Custom Template'),
            enabled: true,
            cmd: 'custom-template',
        });
        submenu.push({
            label: tools.translateZhAndEn(
                '自定义生成规则',
                'Custom Build Rules'
            ),
            enabled: true,
            cmd: 'custom-build-templet-rules',
        });

        let menuCfg = {
            layerMenu: [
                { type: 'separator' },
                {
                    label: tools.translate('new-script-bind'),
                    enabled: true,
                    submenu: submenu,
                }, // 生成拖拽组件
            ],
            assetMenu: [
                { type: 'separator' },
                {
                    label: tools.translate('new-script-templet'),
                    enabled: true,
                    submenu: submenu,
                }, // 生成拖拽组件
            ],
        };
        this.menuCfg = menuCfg;
        Editor.Ipc.sendToMain('simple-code:setMenuConfig', {
            id: 'cc-new-file',
            menuCfg: menuCfg,
        });
    },

    // 面板销毁
    onDestroy() {},

    messages: {
        'new-js-file'() {
            let filePath =
                this.temples['define.' + this.parent.cfg.newFileType];
            this.newFileAndBindNode(filePath);
        },

        // 刷新模板
        'refresh-template'(e, args) {
            this.upTempletList();
            this.updateMenu();
        },

        // 自定模板
        'custom-template'(e, args) {
            exec((Editor.isWin32 ? 'start ' : 'open ') + USER_TEMPLE_PATH);
        },

        // 自定规则
        'custom-build-templet-rules'(e, args) {
            this.parent.openOutSideFile(USER_NEW_FILE_RULE, true);
        },

        'new-script-templet'(e, args) {
            let selectInfo = Editor.Selection.curGlobalActivate();
            if (selectInfo == null || selectInfo.id == null) {
                return;
            }

            // 在资源管理中创建
            if (selectInfo.type == 'asset') {
                let templePath = this.temples[args.label];
                let filePath = Editor.remote.assetdb.uuidToFspath(
                    selectInfo.id
                );

                let fspath = tools.isDirectory(filePath)
                    ? filePath
                    : path.dirname(filePath);
                if (!templePath || !tools.isDirectory(fspath)) {
                    return;
                }

                let s_ind = fspath.indexOf(config.prsPath);
                if (
                    s_ind == -1 ||
                    !fspath.substr(config.prsPath.length).match('assets')
                ) {
                    alert(
                        tools.translateZhAndEn(
                            '不能选择在根目录创建模板',
                            'Cannot choose to create template in root directory'
                        )
                    );
                    return;
                }

                let data = fs.readFileSync(templePath);
                fspath = path.join(fspath, args.label);

                let saveUrl = Editor.remote.assetdb.fspathToUrl(fspath);
                Editor.assetdb.create(saveUrl, data);
            } else {
                // 节点上创建
                let templePath = this.temples[args.label];
                this.newFileAndBindNode(templePath);
            }
        },

        'selection:activated'() {
            if (this.parent == null) return;
            this.updateMenu();
        },
    },
};
