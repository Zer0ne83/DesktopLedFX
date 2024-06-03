"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSD2VerStr = void 0;
//////////////////////////////////////////////////
// MODULES - IMPORTS/REQUIRES
//////////////////////////////////////////////////
const electron_1 = require("electron");
const contextMenu = require("electron-context-menu");
const promises_1 = require("fs/promises");
const child_process_1 = require("child_process");
const dtlfxCP = require('child_process').spawn;
const date_fns_1 = require("date-fns");
const http_terminator_1 = require("http-terminator");
const axios_1 = require("axios");
const sdk = require("cue-sdk");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const http = require("http");
const sacn = require("sacn");
const genDefDataObj = () => {
    const uDocsDirPath = path.normalize(path.join(electron_1.app.getPath('home'), 'Documents'));
    const uPicsDirPath = path.normalize(path.join(electron_1.app.getPath('home'), 'Pictures'));
    let baseData = {
        paths: {
            dtlfxPaths: {
                baseDir: path.normalize(path.join(uDocsDirPath, 'dtlfx')),
                dataDir: path.normalize(path.join(uDocsDirPath, 'dtlfx/dtlfxData')),
                dataFile: path.normalize(path.join(uDocsDirPath, 'dtlfx/dtlfxData/dtlfxData.json'))
            },
            userPaths: {
                home: path.normalize(electron_1.app.getPath('home')),
                appData: path.normalize(electron_1.app.getPath('appData')),
                documents: uDocsDirPath,
                pictures: uPicsDirPath
            },
            ledfxPaths: {
                exe: path.normalize('C:\\Program Files (x86)\\LedFx\\data\\LedFx.exe'),
                config: path.normalize(path.join(electron_1.app.getPath('appData'), '.ledfx/config.json'))
            },
            mediaPaths: {
                images: path.normalize(path.join(uPicsDirPath, '/dtlfxImages')),
                plates: path.normalize(path.join(uPicsDirPath, '/dtlfxImages/dtlfxPlates'))
            }
        },
        settings: {
            autostart: false,
            showstatsbar: false,
            speed: 50,
            icuesync: true,
            z1bmode: true
        },
        lastUpdated: ((0, date_fns_1.getUnixTime)(new Date()))
    };
    return baseData;
};
//---------------------------------------------
let z1bModeCFGName = 'z1bonly';
const selectLFXConfigsDirPath = path.normalize('C:\\Users\\owenl\\Desktop\\DopeUtils\\dtlfxConfigs');
const selectLFXConfig = (configName) => __awaiter(void 0, void 0, void 0, function* () {
    const cfgDir = path.normalize('C:\\Users\\owenl\\Desktop\\DopeUtils\\dtlfxConfigs');
    const cfgFile = configName + '.json';
    const cfgPath = path.normalize(path.join(cfgDir, cfgFile));
    if ((yield exists(cfgPath))) {
        return Promise.resolve(cfgPath);
    }
    else {
        return Promise.resolve(false);
    }
    ;
});
//---------------------------------------------
let doSendVizInf2Box = false;
//---------------------------------------------
const genDefListsObj = () => { return { images: { active: false, list: [], block: [] }, plates: { active: false, list: [], block: [] } }; };
//---------------------------------------------
const dtlfxSupportedFX = ['bands', 'bands_matrix', 'bar', 'blade_power_plus', 'block_reflections', 'blocks', 'crawler', 'energy', 'energy2', 'equalizer', 'fire', 'glitch', 'lava_lamp', 'magnitude', 'marching', 'melt', 'melt_and_sparkle', 'multiBar', 'pitchSpectrum', 'power', 'rain', 'real_strobe', 'scan', 'scan_and_flare', 'scan_multi', 'scroll', 'strobe', 'water', 'wavelength'];
const dtlfxDefGradsArr = [
    { name: 'Rainbow', gradient: 'linear-gradient(90deg,rgb(255,0,0) 0%,rgb(255,120,0) 14%,rgb(255,200,0) 28%,rgb(0,255,0) 42%,rgb(0,199,140) 56%,rgb(0,0,255) 70%,rgb(128,0,128) 84%,rgb(255,0,178) 98%)' },
    { name: 'DFloor', gradient: 'linear-gradient(90deg,rgb(255,0,0) 0%,rgb(255,0,178) 50%,rgb(0,0,255) 100%)' },
    { name: 'Plasma', gradient: 'linear-gradient(90deg,rgb(0,0,255) 0%,rgb(128,0,128) 25%,rgb(255,0,0) 50%,rgb(255,40,0) 75%,rgb(255,200,0) 100%)' },
    { name: 'Ocean', gradient: 'linear-gradient(90deg,rgb(0,255,255) 0%,rgb(0,0,255) 100%)' },
    { name: 'Viridis', gradient: 'linear-gradient(90deg,rgb(128,0,128) 0%,rgb(0,0,255) 25%,rgb(0,128,128) 50%,rgb(0,255,0) 75%,rgb(255,200,0) 100%)' },
    { name: 'Jungle', gradient: 'linear-gradient(90deg,rgb(0,255,0) 0%,rgb(34,139,34) 50%,rgb(255,120,0) 100%)' },
    { name: 'Spring', gradient: 'linear-gradient(90deg,rgb(255,0,178) 0%,rgb(255,40,0) 50%,rgb(255,200,0) 100%)' },
    { name: 'Winter', gradient: 'linear-gradient(90deg,rgb(0,199,140) 0%,rgb(0,255,50) 100%)' },
    { name: 'Frost', gradient: 'linear-gradient(90deg,rgb(0,0,255) 0%,rgb(0,255,255) 33%,rgb(128,0,128) 66%,rgb(255,0,178) 99%)' },
    { name: 'Sunset', gradient: 'linear-gradient(90deg,rgb(0,0,128) 0%,rgb(255,120,0) 50%,rgb(255,0,0) 100%)' },
    { name: 'Borealis', gradient: 'linear-gradient(90deg,rgb(255,40,0) 0%,rgb(128,0,128) 33%,rgb(0,199,140) 66%,rgb(0,255,0) 99%)' },
    { name: 'Rust', gradient: 'linear-gradient(90deg,rgb(255,40,0) 0%,rgb(255,0,0) 100%)' },
    { name: 'Winamp', gradient: 'linear-gradient(90deg,rgb(0,255,0) 0%,rgb(255,200,0) 25%,rgb(255,120,0) 50%,rgb(255,40,0) 75%,rgb(255,0,0) 100%)' }
];
const lowMidHighEffects = ['energy', 'rain', 'scroll'];
//---------------------------------------------
function getCUEErr(e) {
    const eCodes = {
        69: { code: 69, str: 'NIL_Response', msg: 'ERROR: SDK is Dead' },
        0: { code: 0, str: 'CE_Success', msg: 'No Errors' },
        1: { code: 1, str: 'CE_NotConnected', msg: 'ERROR: Not Connected' },
        2: { code: 2, str: 'CE_NoControl', msg: 'ERROR: No Control' },
        3: { code: 3, str: 'CE_IncompatibleProtocol', msg: 'ERROR: Bad Protocol' },
        4: { code: 4, str: 'CE_InvalidArguments', msg: 'ERROR: Bad Args/Params' },
        5: { code: 5, str: 'CE_InvalidOperation', msg: 'ERROR: Bad Operation' },
        6: { code: 6, str: 'CE_DeviceNotFound', msg: 'ERROR: Device Not Found' },
        7: { code: 7, str: 'CE_NotAllowed', msg: 'ERROR: Not Allowed' }
    };
    if (eCodes.hasOwnProperty(e)) {
        return eCodes[e];
    }
    else {
        return eCodes[69];
    }
    ;
}
;
//--------------------------------------------
function getCUESess(c) {
    const sSCodes = {
        0: { code: 0, str: 'CSS_Invalid', msg: 'No Status' },
        1: { code: 1, str: 'CSS_Closed', msg: 'Disconnected' },
        2: { code: 2, str: 'CSS_Connecting', msg: 'Connecting' },
        3: { code: 3, str: 'CSS_Timeout', msg: 'Timeout' },
        4: { code: 4, str: 'CSS_ConnectionRefused', msg: 'Refused' },
        5: { code: 5, str: 'CSS_ConnectionLost', msg: 'Lost' },
        6: { code: 6, str: 'CSS_Connected', msg: 'Connected' }
    };
    if (sSCodes.hasOwnProperty(c)) {
        return sSCodes[c];
    }
    else {
        return sSCodes[0];
    }
    ;
}
;
//////////////////////////////////////////////////
// GLOBAL VARIABLES
//////////////////////////////////////////////////
let hostLANIP = '192.168.0.3';
const hlIP = () => { return hostLANIP; };
let dtlfxMode = 'prod';
let dtlfxWindow = null;
let dtlfxWindowState = {
    monSize: { x: 0, y: 0, width: 0, height: 0 },
    useSize: { height: 0, width: 0 },
    defSize: { x: 0, y: 0, width: 0, height: 0 },
    sizePos: { x: 0, y: 0, width: 0, height: 0 },
    viz: 'showing',
    fullscreen: false,
    unresponsive: false
};
let dtlfxHomeActive = false;
let dtlfxDevTools = null;
let dtlfxCM = null;
let dtlfxDisposeAppCM = null;
let dtlfxTray = null;
let dtlfxCMBuildInProg = false;
let dtlfxData = null;
let dtlfxSCsActive = false;
let dtlfxSCInProg = false;
let termDTLFXInProg = false;
let dtlfxKillNoPrompt = false;
//------------------------------------------------
let dtlfxWebSVR = null;
let dtlfxWebSVRTerminate;
//------------------------------------------------
let mbLimits = { images: 200, plates: 200 };
let dmxRecOpts = { universes: [1], port: 5568, iface: '192.168.0.3', reuseAddr: true };
let dmxRecInst = null;
let dmxLastPacketTime = 0;
let dmxMainFilterFPS = 30;
let dmxMainFPSLimit = 100;
let dmxRecIsInit = false;
let dtlfxPlayState = 'stopped';
let dtlfxLayerStates = { subbeat: true, bands: true, blocks: true, images: true, plates: true };
//------------------------------------------------
let ledFXCoreIsRunning = false;
let gettingLFXCoreData = false;
let ledFXCoreData = { info: { host: (hlIP()), port: 6699, version: 'NK' }, devices: {}, virtuals: {}, effects: {} };
let ledFXDeviceId = null;
let currentLFXEConfigs = [];
let rendEffectInfo = null;
//------------------------------------------------
let cueSDKStatus = null;
let cueDevsData = false;
let sacnRGBArr = [];
let sacnAMPV = 0;
let cueSetDevsLEDList = [];
//------------------------------------------------
let wcIsRunning = false;
//------------------------------------------------
let uMediaLists = genDefListsObj();
//////////////////////////////////////////////////
// UTILITY FUNCTIONS
//////////////////////////////////////////////////
const availCons = (fnName, msg) => __awaiter(void 0, void 0, void 0, function* () { if (termDTLFXInProg) {
    return;
} ; try {
    if (dtlfxWindow && dtlfxWindow.webContents) {
        dtlfxWindow.webContents.send('sendAvailCons', [fnName, msg]);
    }
    else {
        let tStr = (0, date_fns_1.format)(new Date(), 'HH:mm:ss.SS'), m = tStr + ' - [MAIN|' + fnName + '] (Log): ';
        if (typeof msg === 'string') {
            console.log(m + msg);
        }
        else {
            console.log(m);
            console.dir(msg, { depth: null });
        }
    }
}
catch (e) {
    e = e;
    return;
} });
//-------------------------------------------------
const fxType2Name = (fxT) => { return fxT.split('_').map((w) => (w.toLowerCase() === 'and' ? '&' : capd(w))).join(''); };
//-------------------------------------------------
const exists = (path) => __awaiter(void 0, void 0, void 0, function* () { try {
    yield (0, promises_1.access)(path);
    return true;
}
catch (_a) {
    return false;
} });
//-------------------------------------------------
const doW = (s) => __awaiter(void 0, void 0, void 0, function* () { return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () { setTimeout(() => __awaiter(void 0, void 0, void 0, function* () { resolve(true); }), (s * 1000)); })); });
//-------------------------------------------------
const capd = (s) => { return s.charAt(0).toUpperCase() + s.slice(1); };
//-------------------------------------------------
const statSize = (path) => __awaiter(void 0, void 0, void 0, function* () { try {
    const sRes = yield (0, promises_1.stat)(path);
    if (sRes && sRes.size > 0) {
        return Promise.resolve({ r: true, d: sRes.size });
    }
    else {
        return Promise.resolve({ r: false, d: 0 });
    }
}
catch (e) {
    return Promise.resolve({ r: false, d: 0 });
} });
//-------------------------------------------------
const icoP = (p) => { const iP = path.join(__dirname, '../dist/' + p); return iP; };
//-------------------------------------------------
const natIco = (pngFileName) => { return (electron_1.nativeImage.createFromPath((icoP('assets/' + pngFileName)))); };
//-------------------------------------------------
const isJSON = (data) => { if (typeof data !== 'string') {
    return Promise.resolve(false);
} ; try {
    const result = JSON.parse(data);
    const type = Object.prototype.toString.call(result);
    return Promise.resolve(type === '[object Object]' || type === '[object Array]');
}
catch (err) {
    return Promise.resolve(false);
} };
//-------------------------------------------------
const s2T = (secs) => { let fStr = '', tH, tM, tS, hours = Math.floor(secs / 3600), mins = 0; if (hours >= 1) {
    tH = String(hours);
    secs = secs - (hours * 3600);
}
else {
    tH = null;
} ; mins = Math.floor(secs / 60); if (mins >= 1) {
    tM = String(mins);
    secs = secs - (mins * 60);
}
else {
    tM = null;
} ; if (secs < 1) {
    tS = null;
}
else {
    tS = String(secs);
} ; (tH && tM && tM.length === 1) ? tM = '0' + tM : void 0; (tS && tS.length === 1) ? tS = '0' + tS : void 0; if (tH) {
    fStr += tH;
    tM = ':' + tM;
} ; if (tM) {
    fStr += tM;
    tS = ':' + tS;
}
else {
    fStr += '00:';
} ; if (tS) {
    fStr += tS;
} ; if (fStr.includes(':null')) {
    const rX = /:null/gi;
    fStr = fStr.replace(rX, ':00');
} ; if (fStr === '') {
    fStr = '-';
} ; if (fStr === ':00') {
    fStr = '-';
} ; return fStr; };
//------------------------------------------------
function matchGStr(gStr) {
    const hex2RGB = (hex) => { const h = (hex.startsWith('#') ? hex.slice(1) : hex); if (h.length !== 6) {
        return false;
    } ; const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return `rgb(${r},${g},${b})`; };
    if (gStr.includes('#')) {
        const hexStrArr = gStr.replace('linear-gradient(90deg, ', '').replace(')', '').split(',')
            .map((ca) => { return { c: ca.split(' ')[0], p: ca.split(' ')[1].replace('.00%', '%') }; });
        let rgbStr = 'linear-gradient(90deg,';
        for (let hi = 0; hi < hexStrArr.length; hi++) {
            const rgbConv = hex2RGB(hexStrArr[hi].c);
            if (!rgbConv) {
                return false;
            }
            else {
                rgbStr += rgbConv + ' ' + hexStrArr[hi].p;
                if (hi !== hexStrArr.length - 1) {
                    rgbStr += ',';
                }
                else {
                    rgbStr += ')';
                }
            }
        }
        ;
        const mI = dtlfxDefGradsArr.findIndex((o) => o.gradient === rgbStr);
        if (mI !== -1) {
            const gO = dtlfxDefGradsArr[mI];
            return { n: gO.name, g: gO.gradient, i: mI };
        }
        else {
            return false;
        }
        ;
    }
    else {
        let mS = gStr.replace(/, /g, ',');
        const mI = dtlfxDefGradsArr.findIndex((o) => o.gradient === mS);
        if (mI !== -1) {
            const gO = dtlfxDefGradsArr[mI];
            return { n: gO.name, g: gO.gradient, i: mI };
        }
        else {
            return false;
        }
        ;
    }
}
;
//------------------------------------------------
function updateDTLFXDataPtys() {
    return __awaiter(this, void 0, void 0, function* () {
        const mergeObjs = (d, s) => __awaiter(this, void 0, void 0, function* () {
            for (const key in s) {
                if (s.hasOwnProperty(key)) {
                    if (typeof s[key] === 'object' && s[key] !== null && !Array.isArray(s[key])) {
                        if (!d.hasOwnProperty(key) || typeof d[key] !== 'object' || d[key] === null || Array.isArray(d[key])) {
                            d[key] = {};
                        }
                        ;
                        mergeObjs(d[key], s[key]);
                    }
                    else {
                        if (!d.hasOwnProperty(key)) {
                            d[key] = s[key];
                        }
                    }
                }
            }
            ;
            for (const key in d) {
                if (!s.hasOwnProperty(key)) {
                    delete d[key];
                }
            }
        });
        const freshDDObj = genDefDataObj();
        yield mergeObjs(dtlfxData, freshDDObj);
        return Promise.resolve(true);
    });
}
;
//------------------------------------------------
const readDataFile = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rR = yield fs.promises.readFile((path.normalize(path.join((electron_1.app.getPath('documents')), 'dtlfx/dtlfxData/dtlfxData.json'))), { encoding: 'utf-8' });
        if (rR && (yield isJSON(rR))) {
            const newDDObj = JSON.parse(rR);
            dtlfxData = newDDObj;
            availCons('readDataFile', 'Data File [READ] - OK');
            return Promise.resolve(dtlfxData);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    }
});
//-------------------------------------------------
const writeDataFile = (data) => __awaiter(void 0, void 0, void 0, function* () {
    if (data === null) {
        return Promise.resolve(false);
    }
    ;
    let updData = data;
    updData.lastUpdated = (0, date_fns_1.getUnixTime)(new Date());
    const updDataStr = JSON.stringify(data);
    try {
        yield fs.promises.writeFile((path.normalize(path.join((electron_1.app.getPath('documents')), 'dtlfx/dtlfxData/dtlfxData.json'))), updDataStr, { encoding: 'utf-8' });
        availCons('writeDataFile', 'Data File [WRITE] - OK');
        yield readDataFile();
        return Promise.resolve(true);
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    }
});
//------------------------------------------------
const createDir = (p, r) => __awaiter(void 0, void 0, void 0, function* () { try {
    yield fs.promises.mkdir(p, { recursive: r });
    return Promise.resolve(true);
}
catch (e) {
    availCons('createDir', 'ERROR: ' + e);
    return Promise.resolve(false);
} });
//------------------------------------------------
const rM = (topic, data) => { try {
    if (dtlfxHomeActive && dtlfxWindow && dtlfxWindow.webContents) {
        dtlfxWindow.webContents.send(topic, [data]);
    }
}
catch (e) {
    e = e;
} };
//-------------------------------------------------
const popMediaList = (type) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(yield exists(dtlfxData.paths.mediaPaths[type]))) {
            availCons('popMediaList|' + type.toUpperCase(), 'ERROR: Media Dir Path for [' + type.toUpperCase() + '] !exists');
            uMediaLists[type].list = [];
            uMediaLists[type].block = [];
            uMediaLists[type].active = false;
            if (dtlfxHomeActive) {
                dtlfxWindow.webContents.send('uMediaListData', [uMediaLists]);
            }
            ;
            return Promise.resolve(uMediaLists[type].active);
        }
        else {
            uMediaLists[type].list = yield fs.promises.readdir(dtlfxData.paths.mediaPaths[type], { encoding: 'utf-8' });
            if (uMediaLists[type].list.length < 1) {
                availCons('popMediaList|' + type.toUpperCase(), 'NIL: ' + capd(type) + ' Media List EMPTY');
                uMediaLists[type].list = [];
                uMediaLists[type].block = [];
                uMediaLists[type].active = false;
            }
            else {
                availCons('popMediaList|' + type.toUpperCase(), 'OK: ' + capd(type) + ' Media List Populated (' + String(uMediaLists[type].list.length) + ')');
                uMediaLists[type].block = [];
                uMediaLists[type].active = true;
            }
            ;
            if (dtlfxHomeActive) {
                dtlfxWindow.webContents.send('uMediaListData', [uMediaLists]);
            }
            ;
            return Promise.resolve(uMediaLists[type].active);
        }
    }
    catch (e) {
        availCons('popMediaList|' + type, e);
        uMediaLists[type].list = [];
        uMediaLists[type].active = false;
        if (dtlfxHomeActive) {
            dtlfxWindow.webContents.send('uMediaListData', [uMediaLists]);
        }
        ;
        return Promise.resolve(uMediaLists[type].active);
    }
    ;
});
//-------------------------------------------------
const findLFXExe = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
        (0, child_process_1.exec)('powershell.exe -Command "powershell.exe -Command Get-ChildItem -ErrorAction Ignore -Attributes !System -Path ' + dtlfxData.paths.userPaths.home + ',C:\\Program*\\ -Recurse ledfx.exe | Where{-NOT ($_.BaseName -cmatch "[a-z]")}"', (error, stdout, stderr) => __awaiter(void 0, void 0, void 0, function* () {
            if (error || stderr || !stdout) {
                resolve(false);
            }
            else {
                let exeFPs = [], exeDir = null, fnRX = new RegExp('ledfx.exe', 'i'), rxOK = (s) => { return (fnRX.test(s)); }, rLs = stdout.split('\n');
                for (let li = 0; li < rLs.length; li++) {
                    if (rLs[li].trim().replace(/\s+/gi, '').length > 0) {
                        if (rLs[li].trim().startsWith('Directory:')) {
                            const dirStr = rLs[li].trim().split(' : ')[1].trim();
                            if (dirStr && dirStr.length > 0 && ((yield exists(path.normalize(dirStr))))) {
                                exeDir = path.normalize(dirStr);
                            }
                        }
                        else if ((rxOK(rLs[li].trim())) && exeDir !== null) {
                            const fnStr = rLs[li].trim().split('.exe')[0].split(' ')[rLs[li].trim().split('.exe')[0].split(' ').length - 1] + '.exe';
                            if (fnStr && fnStr.length > 0 && ((yield exists(path.normalize(path.join(exeDir, fnStr)))))) {
                                exeFPs.push(path.normalize(path.join(exeDir, fnStr)));
                                exeDir = null;
                            }
                        }
                    }
                }
                ;
                if (exeFPs.length > 0) {
                    resolve(exeFPs);
                }
                else {
                    resolve(false);
                }
                ;
            }
        }));
    }));
});
//-------------------------------------------------
const findLFXConfig = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
        (0, child_process_1.exec)('powershell.exe Get-ChildItem -ErrorAction Ignore -Attributes !System,Directory -Path ' + dtlfxData.paths.userPaths.appData + ' -Recurse ".ledfx"', (error, stdout, stderr) => __awaiter(void 0, void 0, void 0, function* () {
            if (error || stderr || !stdout) {
                resolve(false);
            }
            else {
                let configFPs = [], prevDir = null, rLs = stdout.split('\n');
                for (let li = 0; li < rLs.length; li++) {
                    if (rLs[li].trim().replace(/\s+/gi, '').length > 0) {
                        if (rLs[li].trim().startsWith('Directory:')) {
                            const dirStr = rLs[li].trim().split(' : ')[1].trim();
                            if (dirStr && dirStr.length > 0 && ((yield exists(path.normalize(dirStr))))) {
                                prevDir = path.normalize(dirStr);
                            }
                        }
                        else if (rLs[li].trim().endsWith(' .ledfx') && prevDir !== null) {
                            const tryFPStr = path.normalize(path.join(prevDir, '.ledfx/config.json'));
                            if ((yield exists(tryFPStr))) {
                                configFPs.push(tryFPStr);
                                prevDir = null;
                            }
                        }
                    }
                    ;
                }
                ;
                if (configFPs.length > 0) {
                    resolve(configFPs);
                }
                else {
                    resolve(false);
                }
                ;
            }
            ;
        }));
    }));
});
//-------------------------------------------------
function setHostLANIP() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            (0, child_process_1.exec)('ipconfig | findstr IPv4', (err, stdout) => {
                var _a;
                if (err) {
                    availCons('getHostLANIP', `ERROR: ${err.message}`);
                    resolve(false);
                }
                ;
                const ip = (_a = stdout.split(':').pop()) === null || _a === void 0 ? void 0 : _a.trim();
                if (ip) {
                    if (hostLANIP !== ip) {
                        hostLANIP = ip;
                    }
                    ;
                    availCons('getHostLANIP', `Host LAN IP: ${ip}`);
                    resolve(true);
                }
                else {
                    availCons('getHostLANIP', 'ERROR: Unknown IP/Format');
                    resolve(false);
                }
            });
        }));
    });
}
;
//////////////////////////////////////////////////
// IPCMAIN LISTENERS/HANDLERS
//////////////////////////////////////////////////
electron_1.ipcMain.on('openExtWebURL', (e, args) => { electron_1.shell.openExternal(args[0]); });
//////////////////////////////////////////////////
// ELECTRON MAIN FUNCTION
//////////////////////////////////////////////////
try {
    availCons('ElectronMainFn', '()...');
    electron_1.app.disableHardwareAcceleration();
    electron_1.app.once('ready', () => __awaiter(void 0, void 0, void 0, function* () { initDTLFX(); scs(true); }));
    electron_1.app.on('browser-window-focus', () => { availCons('App|EVENT', 'browser-window-focus'); scs(true); });
    electron_1.app.on('browser-window-blur', () => { availCons('App|EVENT', 'browser-window-blur'); scs(false); });
    electron_1.app.on('web-contents-created', () => { availCons('App|EVENT', 'web-contents-created'); });
    electron_1.app.on('window-all-closed', () => { availCons('App|EVENT', 'window-all-closed'); electron_1.app.quit(); });
    electron_1.app.on('before-quit', (e) => __awaiter(void 0, void 0, void 0, function* () { try {
        termDTLFXInProg = true;
        e.preventDefault();
        if (dtlfxKillNoPrompt) {
            electron_1.app.exit();
        }
        else {
            if ((yield closeConf())) {
                electron_1.app.exit();
            }
        }
    }
    catch (e) {
        e = e;
    } }));
    electron_1.app.on('quit', () => { return; });
    electron_1.app.on('will-quit', () => { electron_1.app.exit(); });
}
catch (e) {
    availCons('ElectronMainFn', 'ERROR: ' + e);
}
;
//------------------------------------------------
function initDTLFX() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('InitDTLFX', '()...');
        yield checkAppFS();
        if (!dtlfxWindow) {
            electron_1.ipcMain.on('homeInitsDone', () => __awaiter(this, void 0, void 0, function* () {
                yield setHostLANIP();
                yield checkWCRunning();
                yield rebuildCMs();
                delayedInits();
            }));
            initDTLFXWindow();
        }
        ;
    });
}
//////////////////////////////////////////////////
function delayedInits() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('delayedInits', '()...');
        yield doW(3);
        yield dtlfxInitWebSVR();
        yield startRestartAll();
        if (dtlfxData.settings.icuesync) {
            yield initCUESDK();
        }
        ;
        yield rebuildCMs();
    });
}
;
//////////////////////////////////////////////////
// MAIN CLOSE/EXIT FUNCTIONS
//////////////////////////////////////////////////
function closeConf() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('closeConf', '()...');
        yield writeDataFile(dtlfxData);
        const doQuitConf = () => __awaiter(this, void 0, void 0, function* () {
            const doQuit = (yield electron_1.dialog.showMessageBox(electron_1.BrowserWindow.getFocusedWindow(), { icon: natIco('wcicon.png'), title: 'DTLFX', message: 'Kill/Exit DTLFX - Are you sure?', type: 'question', buttons: ['Cancel', 'Exit'], defaultId: 0, cancelId: 1 })).response;
            if (doQuit === 1) {
                return Promise.resolve(false);
            }
            else {
                return Promise.resolve(true);
            }
        });
        dtlfxHomeActive = false;
        const quitConfRes = yield doQuitConf();
        dtlfxHomeActive = true;
        if (quitConfRes) {
            return Promise.resolve(false);
        }
        else {
            if (dtlfxPlayState === 'started') {
                dtlfxPlayControlFn('stop');
            }
            ;
            yield killDMXReceiver();
            yield ledfx2Kill();
            if (cueSDKStatus && cueSDKStatus.session && cueSDKStatus.session.code === 6) {
                sdk.CorsairDisconnect();
            }
            ;
            yield doKillWebSVR();
            if (wcIsRunning) {
                yield reqWifiCUE('get', 'stopped');
            }
            ;
            return Promise.resolve(true);
        }
        ;
    });
}
//////////////////////////////////////////////////
// DTlFX FS FUNCTIONS
//////////////////////////////////////////////////
function checkAppFS() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('checkAppFS', '()...');
        // DTLFX Paths
        let baseAppPaths = Object.values((genDefDataObj()).paths.dtlfxPaths);
        for (let bapi = 0; bapi < baseAppPaths.length; bapi++) {
            if (!(yield exists(baseAppPaths[bapi]))) {
                if (bapi < 2) {
                    const cdRes = yield createDir(baseAppPaths[bapi], true);
                    if (!cdRes) {
                        errorDTLFXDialog('appFS', 'exit', ['core', baseAppPaths[bapi]]);
                    }
                }
                else {
                    const wdfRes = yield writeDataFile((genDefDataObj()));
                    if (!wdfRes) {
                        errorDTLFXDialog('appFS', 'exit');
                    }
                }
            }
            else {
                yield readDataFile();
            }
        }
        ;
        // Add New Ptys
        yield updateDTLFXDataPtys();
        // Media Paths
        for (let [k, v] of Object.entries(dtlfxData.paths.mediaPaths)) {
            if (!(yield exists(v))) {
                const cdRes = yield createDir(v, true);
                if (!cdRes) {
                    const sddRes = yield openFileDTLFXDialog('folder', k, 'DTLFX ' + capd(k) + ' Folder', dtlfxData.paths.dtlfxPaths.baseDir);
                    if (!sddRes) {
                        errorDTLFXDialog('appFS', 'exit', ['media', capd(k)]);
                    }
                    else {
                        dtlfxData.paths.mediaPaths[k] = path.normalize(sddRes);
                    }
                }
            }
            ;
            yield popMediaList(k);
        }
        ;
        // LedFX Paths
        if (!dtlfxData.paths.ledfxPaths.exe || !(yield exists(dtlfxData.paths.ledfxPaths.exe))) {
            const findExeRes = yield findLFXExe();
            if (!findExeRes) {
                const sfdRes = yield openFileDTLFXDialog('file', 'ledfxExe', 'LedFx Core Executable', dtlfxData.paths.userPaths.home);
                if (!sfdRes) {
                    errorDTLFXDialog('ledfxExe', 'exit');
                }
                else {
                    dtlfxData.paths.ledfxPaths.exe = sfdRes;
                }
            }
            else {
                if (findExeRes.length === 1) {
                    dtlfxData.paths.ledfxPaths.exe = findExeRes[0];
                }
                else {
                    const cODRes = yield confirmOptsDTLFXDialog('ledfxFiles', 'LedFx Core Executable', findExeRes);
                    if (!cODRes) {
                        dtlfxData.paths.ledfxPaths.config = findExeRes[0];
                    }
                    else {
                        dtlfxData.paths.ledfxPaths.exe = cODRes;
                    }
                }
            }
        }
        ;
        if (!dtlfxData.paths.ledfxPaths.config || !(yield exists(dtlfxData.paths.ledfxPaths.config))) {
            const findConfigRes = yield findLFXConfig();
            if (!findConfigRes) {
                const sfdRes = yield openFileDTLFXDialog('file', 'ledfxConfig', 'LedFx Config File', dtlfxData.paths.userPaths.home);
                if (sfdRes) {
                    dtlfxData.paths.ledfxPaths.config = sfdRes;
                }
            }
            else {
                if (findConfigRes.length === 1) {
                    dtlfxData.paths.ledfxPaths.config = findConfigRes[0];
                }
                else {
                    const cODRes = yield confirmOptsDTLFXDialog('ledfxFiles', 'LedFx Config File', findConfigRes);
                    if (cODRes) {
                        dtlfxData.paths.ledfxPaths.config = cODRes;
                    }
                }
            }
        }
        ;
        // Save & Load
        yield writeDataFile(dtlfxData);
        return Promise.resolve(true);
    });
}
//////////////////////////////////////////////////
// DTLFX DIALOG FUNCTIONS
//////////////////////////////////////////////////
function confirmOptsDTLFXDialog(type, title, options) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('confirmOptsDTLFXDialog', '(' + type + ',' + title + ',options[])...');
        let codMsgs = '', codBtns = [];
        if (type === 'ledfxFiles') {
            codMsgs = 'Multiple LedFx ' + (title.includes('Core') ? 'Executables' : 'Configs') + ' Found!\nSELECT preferred ' + title + ':\n';
        }
        ;
        for (let oi = 0; oi < options.length; oi++) {
            codMsgs += '(' + String(oi + 1) + ') - ' + options[oi] + (oi !== (options.length - 1) ? '\n' : '');
            codBtns.push('Option ' + String(oi + 1));
        }
        ;
        codBtns.push('Cancel');
        let codOpts = { title: 'DTLFX Select Option', message: codMsgs, type: 'question', buttons: codBtns, defaultId: 0, cancelId: (codBtns.length - 1) };
        const { response } = yield electron_1.dialog.showMessageBox(electron_1.BrowserWindow.getFocusedWindow(), codOpts);
        if (response === (codBtns.length - 1)) {
            return Promise.resolve(false);
        }
        else {
            return Promise.resolve(options[response]);
        }
        ;
    });
}
//------------------------------------------------
function errorDTLFXDialog(type, then, data) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('errorDTLFXDialog', '(' + type + ',' + then + ',' + data + ')...');
        const errTMs = {
            appData: { t: 'DTLFX Error - Config', m: 'Failed to READ Core DTLFX Data file:\n' + dtlfxData.paths.dtlfxPaths.dataFile },
            appFS: { t: 'DTLFX Error - ' + capd(data[0]) + ' Folder', m: 'Failed to CREATE' + (data[0] === 'media' ? ' or SELECT ' + capd(data[1]) : '') + ' ' + capd(data[0]) + ' folder' + (data[0] === 'core' ? ':\n' + data[1] : '') },
            ledfxExe: { t: 'DTLFX Error - LedFx.exe', m: 'Failed to FIND or SELECT LedFx Core Executable' },
            gen: { t: 'DTLFX Error - ' + data[0], m: data[1] }
        };
        const doErrMB = (t, m) => __awaiter(this, void 0, void 0, function* () { return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () { yield electron_1.dialog.showMessageBox(electron_1.BrowserWindow.getFocusedWindow(), { title: t, message: m, type: 'error', buttons: [(then === 'exit' ? 'Exit' : 'OK')], defaultId: 0 }); resolve(); })); });
        yield doErrMB(errTMs[type].t, errTMs[type].m);
        if (then === 'exit') {
            dtlfxKillNoPrompt = true;
            electron_1.app.quit();
        }
        else {
            return Promise.resolve(true);
        }
        ;
    });
}
//------------------------------------------------
function openFileDTLFXDialog(type, key, title, startDir) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('openFileDTLFXDialog', '(' + type + ',' + key + ',' + title + ',' + startDir + ')...');
        const fFilters = { ledfxExe: [{ name: 'LedFxCoreExe', extensions: ['exe'] }], ledfxConfig: [{ name: 'LedFxConfig', extensions: ['json'] }] };
        let sfdOpts = { title: title, defaultPath: (startDir && (yield exists(startDir)) ? startDir : (electron_1.app.getPath('home'))), buttonLabel: 'Select ' + (type === 'file' ? 'File' : 'Folder'), properties: [(type === 'file' ? 'openFile' : 'openDirectory'), 'showHiddenFiles'] };
        if (type === 'file') {
            sfdOpts['filters'] = fFilters[key];
        }
        ;
        const { canceled, filePaths } = yield electron_1.dialog.showOpenDialog(electron_1.BrowserWindow.getFocusedWindow(), sfdOpts);
        if (canceled || filePaths.length === 0) {
            return Promise.resolve(false);
        }
        else {
            return Promise.resolve(filePaths[0]);
        }
    });
}
;
//////////////////////////////////////////////////
// DTLFX WINDOW FUNCTIONS
//////////////////////////////////////////////////
function initDTLFXWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('initDTLFXWindow', '()...');
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            if (dtlfxWindow === null) {
                try {
                    dtlfxWindowState.useSize = (electron_1.screen.getPrimaryDisplay()).workAreaSize;
                    dtlfxWindowState.monSize = (electron_1.screen.getPrimaryDisplay()).bounds;
                    const defW = (dtlfxWindowState.useSize.width - 600); //2840
                    const defX = (dtlfxWindowState.useSize.width - defW) / 2; //300
                    const defH = Math.ceil((defW / 21) * 9); //1217
                    const defY = Math.ceil((dtlfxWindowState.useSize.height - defH) / 2); //92
                    dtlfxWindowState.defSize = { x: defX, y: defY, width: defW, height: defH };
                    let dtLFXWinOpts = { x: defX, y: defY, width: defW, maxWidth: dtlfxWindowState.monSize.width, height: defH, maxHeight: dtlfxWindowState.monSize.height, title: 'DTLFX', darkTheme: true, frame: false, transparent: true, icon: path.join(__dirname, '../dist/assets/32x32pngico.png'), movable: false, resizable: false, minimizable: false, maximizable: false, fullscreenable: true, fullscreen: false, show: false, webPreferences: { nodeIntegration: true, nodeIntegrationInWorker: true, nodeIntegrationInSubFrames: true, webSecurity: false, allowRunningInsecureContent: true, webgl: true, plugins: true, backgroundThrottling: false, sandbox: false, contextIsolation: false, spellcheck: false, defaultFontFamily: { sansSerif: 'Arial' }, defaultFontSize: 14 } };
                    dtlfxWindow = new electron_1.BrowserWindow(dtLFXWinOpts);
                    let pathIndex = './index.html';
                    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
                        pathIndex = '../dist/index.html';
                    }
                    ;
                    const url = new URL(path.join('file:', __dirname, pathIndex));
                    dtlfxWindow.webContents.on('did-finish-load', () => __awaiter(this, void 0, void 0, function* () {
                        electron_1.ipcMain.on('dtlfxDoShowWindow', (e, args) => __awaiter(this, void 0, void 0, function* () {
                            try {
                                if (dtlfxWindow && dtlfxWindow.webContents) {
                                    dtlfxHomeActive = true;
                                    dtlfxWindowState.sizePos = dtlfxWindow.getBounds();
                                    rM('winStateUpdate', dtlfxWindowState);
                                    if (!dtlfxData.settings.z1bmode) {
                                        dtlfxWindow.show();
                                        if (!dtlfxDevTools && dtlfxMode === 'dev') {
                                            try {
                                                dtlfxDevTools = new electron_1.BrowserWindow;
                                                dtlfxWindow.webContents.setDevToolsWebContents(dtlfxDevTools.webContents);
                                                dtlfxWindow.webContents.openDevTools({ mode: 'detach', activate: false });
                                                dtlfxDevTools.on('ready-to-show', () => {
                                                    dtlfxDevTools.setPosition(375, 115, false);
                                                    dtlfxDevTools.setSize(1460, 900, false);
                                                    dtlfxDevTools.minimize();
                                                });
                                                dtlfxWindow.webContents.on('devtools-closed', () => { electron_1.app.quit(); });
                                            }
                                            catch (e) {
                                                e = e;
                                            }
                                        }
                                        ;
                                    }
                                    else {
                                        yield doZ1BModeWindowHide();
                                    }
                                    resolve(true);
                                }
                                else {
                                    dtlfxHomeActive = false;
                                }
                                ;
                            }
                            catch (e) {
                                e = e;
                                resolve(false);
                            }
                            ;
                        }));
                        dtlfxWindow.webContents.send('dtlfxWindowIsReady', true);
                    }));
                    dtlfxWindow.loadURL(url.href);
                    dtlfxWindow.on('show', () => { dtlfxWindowState.viz = 'showing'; rM('winStateUpdate', dtlfxWindowState); rebuildCMs(); });
                    dtlfxWindow.on('hide', () => { dtlfxWindowState.viz = 'hidden'; ; rM('winStateUpdate', dtlfxWindowState); rebuildCMs(); });
                    dtlfxWindow.on('enter-full-screen', () => {
                        dtlfxWindowState.fullscreen = true;
                        dtlfxWindowState.sizePos = dtlfxWindowState.monSize;
                        rM('winStateUpdate', dtlfxWindowState);
                        rebuildCMs();
                    });
                    dtlfxWindow.on('leave-full-screen', () => {
                        dtlfxWindowState.fullscreen = false;
                        dtlfxWindowState.sizePos = dtlfxWindowState.defSize;
                        rM('winStateUpdate', dtlfxWindowState);
                        rebuildCMs();
                    });
                    dtlfxWindow.on('unresponsive', () => { dtlfxWindowState.unresponsive = true; rM('winStateUpdate', dtlfxWindowState); rebuildCMs(); });
                    dtlfxWindow.on('responsive', () => { dtlfxWindowState.unresponsive = false; rM('winStateUpdate', dtlfxWindowState); rebuildCMs(); });
                }
                catch (e) {
                    e = e;
                    availCons('initDTLFXWindow', e);
                    resolve(false);
                }
                ;
            }
            else {
                availCons('initDTLFXWindow', 'SKIPPED - DTLFXWindow Already Created');
                resolve(false);
            }
            ;
        }));
    });
}
;
//--------------------------------------------------
function doZ1BModeWindowHide() {
    if (dtlfxWindow) {
        if (dtlfxWindow.isFullScreen) {
            winCtrl('fullscreen', false);
        }
        ;
        winCtrl('hide');
    }
    ;
    return Promise.resolve(true);
}
//--------------------------------------------------
function winCtrl(action, param) {
    availCons('winCtrl', '(' + action + '' + (param !== undefined ? ',' + String(param) : '') + ')...');
    if (!electron_1.app || !dtlfxWindow) {
        return;
    }
    else {
        switch (action) {
            case 'show':
                dtlfxWindow.show();
                break;
            case 'hide':
                dtlfxWindow.hide();
                break;
            case 'fullscreen':
                dtlfxWindow.setFullScreen(param);
                break;
            case 'exit':
                electron_1.app.quit();
                break;
            default: break;
        }
        ;
    }
}
;
//--------------------------------------------------
function loadIcon(nameDotPng) {
    return __awaiter(this, void 0, void 0, function* () {
        let iconObject = null;
        let iconPath = '';
        if (dtlfxMode === 'prod') {
            iconPath = path.join(__dirname, 'assets/' + nameDotPng);
        }
        else {
            iconPath = path.join(__dirname, '../dist/assets/' + nameDotPng);
        }
        ;
        if ((yield exists(iconPath))) {
            iconObject = electron_1.nativeImage.createFromPath(iconPath);
        }
        else {
            console.log('No ICO Available');
            availCons('loadIcon', 'No ICO Available');
        }
        ;
        return Promise.resolve(iconObject);
    });
}
//------------------------------------------------
function cmUpdateMediaDir(mkey) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('cmUpdateMediaDir', '(' + mkey + ')...');
        const sfdIRes = yield openFileDTLFXDialog('folder', mkey, 'DTLFX ' + capd(mkey) + ' Folder', dtlfxData.paths.mediaPaths[mkey]);
        if (sfdIRes !== false) {
            dtlfxData.paths.mediaPaths[mkey] = sfdIRes;
            yield writeDataFile(dtlfxData);
            popMediaList(mkey);
        }
        ;
    });
}
//------------------------------------------------
function cmUpdateLayerToggles(lkey) {
    availCons('cmUpdateLayerToggles', '(' + lkey + ')...');
    dtlfxLayerStates[lkey] ? dtlfxLayerStates[lkey] = false : dtlfxLayerStates[lkey] = true;
    if (dtlfxHomeActive) {
        dtlfxWindow.webContents.send('toggleDTLFXLayer', [lkey, dtlfxLayerStates[lkey]]);
    }
    ;
    rebuildCMs();
}
//------------------------------------------------
function cmDoSoloLayer(lkey) {
    availCons('cmDoSoloLayer', '(' + lkey + ')...');
    for (const [k, v] of Object.entries(dtlfxLayerStates)) {
        if (k !== lkey) {
            dtlfxLayerStates[k] = false;
        }
        else {
            dtlfxLayerStates[k] = true;
        }
    }
    ;
    if (dtlfxHomeActive) {
        dtlfxWindow.webContents.send('soloDTLFXLayer', [lkey, dtlfxLayerStates]);
    }
    ;
    rebuildCMs();
}
//------------------------------------------------
function toggleShowStatsBar() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('toggleShowStatsBar', '()...');
        if (dtlfxData.settings.showstatsbar) {
            dtlfxData.settings.showstatsbar = false;
        }
        else {
            dtlfxData.settings.showstatsbar = true;
        }
        ;
        rM('showStatsBarUpdate', dtlfxData.settings.showstatsbar);
        rM('showStatusMsg', 'Toggled Status Bar: ' + (dtlfxData.settings.showstatsbar ? 'SHOW' : 'HIDE'));
        yield writeDataFile(dtlfxData);
        yield rebuildCMs();
    });
}
//------------------------------------------------
function toggleAutoStartSetting() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('toggleAutoStartSetting', '()...');
        if (dtlfxData.settings.autostart) {
            dtlfxData.settings.autostart = false;
        }
        else {
            dtlfxData.settings.autostart = true;
        }
        ;
        rM('showStatusMsg', 'Toggled Autostart: ' + (dtlfxData.settings.autostart ? 'ON' : 'OFF'));
        yield writeDataFile(dtlfxData);
        yield rebuildCMs();
    });
}
//------------------------------------------------
function toggleICUESync() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('toggleICUESync', '()...');
        if (dtlfxData.settings.icuesync) {
            dtlfxData.settings.icuesync = false;
        }
        else {
            dtlfxData.settings.icuesync = true;
        }
        ;
        rM('showStatusMsg', 'Toggled LedFX > iCUE: ' + (dtlfxData.settings.icuesync ? 'ON' : 'OFF'));
        if (!dtlfxData.settings.icuesync && cueSDKStatus && cueSDKStatus.session && cueSDKStatus.session.code === 6) {
            sdk.CorsairDisconnect();
        }
        ;
        if (dtlfxData.settings.icuesync) {
            yield initCUESDK();
        }
        ;
        yield writeDataFile(dtlfxData);
        yield rebuildCMs();
    });
}
//------------------------------------------------
function toggleZ1BModeSetting() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('toggleZ1BModeSetting', '()...');
        if (dtlfxData.settings.z1bmode) {
            dtlfxData.settings.z1bmode = false;
        }
        else {
            dtlfxData.settings.z1bmode = true;
        }
        ;
        rM('showStatusMsg', 'Toggled Z1Box Mode: ' + (dtlfxData.settings.z1bmode ? 'ON' : 'OFF'));
        yield writeDataFile(dtlfxData);
        yield rebuildCMs();
        if (dtlfxData.settings.z1bmode) {
            yield doZ1BModeWindowHide();
        }
        else {
            winCtrl('show');
        }
        ;
        yield doW(1);
        startRestartAll();
    });
}
//////////////////////////////////////////////////
// DTLFX TRAY/CM FUNCTIONS
//////////////////////////////////////////////////
function rebuildCMs() {
    return __awaiter(this, void 0, void 0, function* () {
        if (dtlfxCMBuildInProg) {
            availCons('rebuildCMs', 'SKIPPED - Already In Prog');
            return Promise.resolve(false);
        }
        ;
        dtlfxCMBuildInProg = true;
        if (dtlfxDisposeAppCM !== null) {
            dtlfxDisposeAppCM();
            dtlfxDisposeAppCM = null;
        }
        ;
        if (dtlfxTray) {
            dtlfxTray.destroy();
            dtlfxTray = null;
        }
        ;
        //------------
        let speedLevelsArr = [];
        for (let soi = 0; soi < 11; soi++) {
            const setPerc = (soi * 10).toString() + '%', setNo = (soi * 10);
            speedLevelsArr.push({ label: setPerc, visible: true, enabled: (dtlfxData.settings.speed !== setNo), type: 'checkbox', checked: (dtlfxData.settings.speed === setNo), click: () => { modDTLFXSpeedSetting(setNo); } });
        }
        ;
        let layerTogglesArr = [], layersSumArr = [], layerIsActive = [], layerSoloArr = [], layerSoloNowStr = 'None', soloL = null;
        for (const [k, v] of Object.entries(dtlfxLayerStates)) {
            if (v) {
                layersSumArr.push((capd(k)));
                layerIsActive.push(k);
            }
            ;
            layerTogglesArr.push({ label: (capd(k)) + ' > [' + (v ? 'OFF' : 'ON') + ']', visible: true, enabled: (k === 'bands' || k === 'blocks' || k === 'subbeat' ? true : uMediaLists[k].active), type: 'checkbox', checked: v, click: () => { cmUpdateLayerToggles(k); } });
        }
        ;
        if (layerIsActive.length === 1) {
            layerSoloNowStr = capd(layerIsActive[0]);
            soloL = layerIsActive[0];
        }
        ;
        for (const [k, v] of Object.entries(dtlfxLayerStates)) {
            layerSoloArr.push({ label: (capd(k)), visible: true, enabled: (k === 'bands' || k === 'blocks' || k === 'subbeat' ? soloL === k ? false : true : !uMediaLists[k].active ? false : soloL !== k ? true : false), type: 'checkbox', checked: soloL === k, click: () => { cmDoSoloLayer(k); } });
        }
        ;
        let selLFXEffectArr = [], selLFXGradientArr = [];
        if (rendEffectInfo !== null) {
            for (let efi = 0; efi < dtlfxSupportedFX.length; efi++) {
                selLFXEffectArr.push({ label: (fxType2Name(dtlfxSupportedFX[efi])), visible: true, enabled: (rendEffectInfo.id !== dtlfxSupportedFX[efi]), type: 'checkbox', checked: (rendEffectInfo.id === dtlfxSupportedFX[efi]), click: () => { selectLedFXEffect(dtlfxSupportedFX[efi]); } });
            }
            ;
            for (let gi = 0; gi < dtlfxDefGradsArr.length; gi++) {
                selLFXGradientArr.push({ label: dtlfxDefGradsArr[gi].name, visible: true, enabled: (typeof rendEffectInfo.rgb.data !== 'object' || Array.isArray(rendEffectInfo.rgb.data) || (typeof rendEffectInfo.rgb.data === 'object' && !Array.isArray(rendEffectInfo.rgb.data) && rendEffectInfo.rgb.data.n !== dtlfxDefGradsArr[gi].name)), type: 'checkbox', checked: (typeof rendEffectInfo.rgb.data === 'object' && !Array.isArray(rendEffectInfo.rgb.data) && rendEffectInfo.rgb.data.n === dtlfxDefGradsArr[gi].name), click: () => { selectLedFXGradient(gi); } });
            }
            ;
        }
        ;
        //------------
        let baseAppCMArr = [
            { icon: (yield loadIcon('dtlfx-cm-sacn-ico-' + (dmxRecIsInit ? 'on' : 'off') + '.png')), label: '𝘀𝗔𝗖𝗡 𝗥𝗲𝗰𝗲𝗶𝘃𝗲𝗿 (' + (dmxRecIsInit ? dmxRecOpts.iface + ':' + String(dmxRecOpts.port) : 'Not Initiated') + ')', visible: true, enabled: false, click: () => { return; } },
            { type: 'separator' },
            { label: (dtlfxPlayState === 'stopped' ? 'Start' : 'Stop') + ' sACN Receiver', visible: true, enabled: ledFXCoreIsRunning, icon: (dtlfxPlayState === 'stopped' ? (yield loadIcon('dtlfx-ctrlbtn-play-ico.png')) : (yield loadIcon('dtlfx-ctrlbtn-stop-ico.png'))), type: 'normal', click: () => { dtlfxPlayControlFn((dtlfxPlayState === 'stopped' ? 'start' : 'stop')); } },
            { label: 'Z1Box Mode', visible: true, enabled: true, type: 'checkbox', checked: (dtlfxData.settings.z1bmode), click: () => { toggleZ1BModeSetting(); } },
            { label: 'Autoplay on Launch', visible: true, enabled: true, type: 'checkbox', checked: (dtlfxData.settings.autostart), click: () => { toggleAutoStartSetting(); } },
            { label: 'LedFX > iCUE', visible: true, enabled: true, type: 'checkbox', checked: (dtlfxData.settings.icuesync), click: () => { toggleICUESync(); } },
            { label: 'Restart All (LedFx+sACN)', visible: true, enabled: (ledFXCoreIsRunning || dmxRecIsInit), icon: (yield loadIcon('dtlfx-cm-restartlfx-ico.png')), type: 'normal', click: () => { startRestartAll(); } },
            { label: 'Show Stats Bar', visible: true, enabled: true, type: 'checkbox', checked: (dtlfxData.settings.showstatsbar), click: () => { toggleShowStatsBar(); } },
            { label: 'Media Folders', visible: true, enabled: true, icon: (yield loadIcon('dtlfx-cm-sub-dirpaths-ico.png')), submenu: [
                    { label: 'Select Images Dir', visible: true, enabled: true, icon: (yield loadIcon('dtlfx-cm-sub-imgdir-ico.png')), click: () => { cmUpdateMediaDir('images'); } },
                    { label: 'Select Plates Dir', visible: true, enabled: true, icon: (yield loadIcon('dtlfx-cm-sub-platedir-ico.png')), click: () => { cmUpdateMediaDir('plates'); } }
                ]
            },
            { type: 'separator' },
            { icon: (yield loadIcon('dtlfx-cm-ledfx-ico-' + (ledFXCoreIsRunning ? 'on' : 'off') + '.png')), label: '𝗟𝗲𝗱𝗙𝗫 𝗖𝗼𝗿𝗲 ' + (ledFXCoreIsRunning ? 'v' + ledFXCoreData.info.version + ' (' + String(Object.keys(ledFXCoreData.devices).length) + ' Devices)' : 'Not Running'), visible: true, enabled: false, click: () => { return; } },
            { type: 'separator' },
            { label: '𝗘𝗳𝗳𝗲𝗰𝘁 𝗧𝘆𝗽𝗲: ' + (!rendEffectInfo ? 'NK' : rendEffectInfo.isSupported ? rendEffectInfo.name : 'Unsupported'), visible: (rendEffectInfo !== null), enabled: false, type: 'normal', icon: (yield loadIcon('dtlfx-cm-effect-current-ico.png')), click: () => { return; } },
            { label: 'Set Effect', visible: ledFXCoreIsRunning, enabled: (ledFXDeviceId !== null && rendEffectInfo !== null && rendEffectInfo.isSupported), icon: (yield loadIcon('dtlfx-cm-effect-select-ico.png')), submenu: selLFXEffectArr },
            { label: 'Next Effect >', visible: ledFXCoreIsRunning, enabled: (ledFXDeviceId !== null && rendEffectInfo !== null), icon: (yield loadIcon('dtlfx-cm-effect-next-ico.png')), type: 'normal', accelerator: 'Shift+Alt+Up', click: () => { nextPrevLedFXEffect('next'); } },
            { label: '< Prev Effect', visible: ledFXCoreIsRunning, enabled: (ledFXDeviceId !== null && rendEffectInfo !== null), icon: (yield loadIcon('dtlfx-cm-effect-prev-ico.png')), type: 'normal', accelerator: 'Shift+Alt+Down', click: () => { nextPrevLedFXEffect('prev'); } },
            { type: 'separator' },
            { label: '𝗘𝗳𝗳𝗲𝗰𝘁 𝗚𝗿𝗮𝗱𝗶𝗲𝗻𝘁: ' + (!rendEffectInfo || !rendEffectInfo.isSupported ? 'NK' : (rendEffectInfo.rgb.type === 'gradient' && typeof rendEffectInfo.rgb.data === 'object' && !Array.isArray(rendEffectInfo.rgb.data) && rendEffectInfo.rgb.data.n ? rendEffectInfo.rgb.data.n : rendEffectInfo.rgb.type)), visible: (rendEffectInfo !== null), enabled: false, type: 'normal', icon: (yield loadIcon('dtlfx-cm-currentgrad-ico.png')), click: () => { return; } },
            { label: 'Set Gradient', visible: ledFXCoreIsRunning, enabled: (ledFXDeviceId !== null && rendEffectInfo !== null && rendEffectInfo.isSupported), icon: (yield loadIcon('dtlfx-cm-selectgrad-ico.png')), submenu: selLFXGradientArr },
            { label: 'Next Gradient >', visible: ledFXCoreIsRunning, enabled: (ledFXDeviceId !== null && rendEffectInfo !== null && !lowMidHighEffects.includes(rendEffectInfo.id)), icon: (yield loadIcon('dtlfx-cm-grad-next-ico.png')), type: 'normal', accelerator: 'Shift+Alt+Right', click: () => { nextPrevGradient('next'); } },
            { label: '< Prev Gradient', visible: ledFXCoreIsRunning, enabled: (ledFXDeviceId !== null && rendEffectInfo !== null && !lowMidHighEffects.includes(rendEffectInfo.id)), icon: (yield loadIcon('dtlfx-cm-grad-prev-ico.png')), type: 'normal', accelerator: 'Shift+Alt+Left', click: () => { nextPrevGradient('prev'); } },
            { type: 'separator' },
            { label: '𝗔𝗻𝗶𝗺𝗮𝘁𝗶𝗼𝗻 𝗦𝗽𝗲𝗲𝗱: ' + String(dtlfxData.settings.speed) + '%', visible: true, enabled: false, type: 'normal', icon: (yield loadIcon('dtlfx-cm-current-spd-ico.png')), click: () => { return; } },
            { label: 'Set Speed', visible: true, enabled: true, icon: (yield loadIcon('dtlfx-cm-spd-ico.png')), submenu: speedLevelsArr },
            { label: 'Inc > Speed (+10%)', visible: true, enabled: (dtlfxData.settings.speed !== 100), icon: (yield loadIcon('dtlfx-cm-speed-inc-ico.png')), type: 'normal', accelerator: 'Shift+Alt+I', click: () => { modDTLFXSpeedSetting('inc'); } },
            { label: 'Dec < Speed (-10%)', visible: true, enabled: (dtlfxData.settings.speed !== 0), icon: (yield loadIcon('dtlfx-cm-speed-dec-ico.png')), type: 'normal', accelerator: 'Shift+Alt+D', click: () => { modDTLFXSpeedSetting('dec'); } },
            { type: 'separator' },
            { label: '𝗔𝗰𝘁𝗶𝘃𝗲 𝗟𝗮𝘆𝗲𝗿𝘀: ' + (layerSoloNowStr === 'None' ? String(layersSumArr.length) + '/' + String(Object.keys(dtlfxLayerStates).length) : layerSoloNowStr) + (layerSoloNowStr !== 'None' ? ' (Solo)' : ''), visible: true, enabled: false, type: 'normal', icon: (yield loadIcon('dtlfx-cm-active-layers-ico.png')), click: () => { return; } },
            { label: 'Toggle Layers', visible: true, enabled: true, icon: (yield loadIcon('dtlfx-cm-layers-ico.png')), submenu: layerTogglesArr },
            { label: 'Layer Solo', visible: true, enabled: true, icon: (yield loadIcon('dtlfx-cm-solo-ico.png')), submenu: layerSoloArr },
            { type: 'separator' },
            { label: 'Show DTLFX', visible: (dtlfxWindowState.viz !== 'showing'), enabled: true, type: 'normal', icon: (yield loadIcon('dtlfx-win-max-ico.png')), accelerator: 'Shift+Alt+S', click: () => { winCtrl('show'); } },
            { label: 'Hide in Tray', visible: (dtlfxWindowState.viz !== 'hidden'), enabled: true, icon: (yield loadIcon('dtlfx-connected-false.png')), type: 'normal', accelerator: 'Shift+Alt+H', click: () => { winCtrl('hide'); } },
            { label: 'Fullscreen', visible: true, enabled: true, type: 'checkbox', checked: dtlfxWindowState.fullscreen, accelerator: 'Shift+Alt+F', click: () => { winCtrl('fullscreen', (dtlfxWindowState.fullscreen ? false : true)); } },
            { label: 'Exit DTLFX', visible: true, enabled: true, icon: (yield loadIcon('dtlfx-win-exit-ico.png')), type: 'normal', accelerator: 'Shift+Alt+X', click: () => { winCtrl('exit'); } }
        ];
        //------------
        const updAppMenuObj = { showSelectAll: false, showLookUpSelection: false, showSearchWithGoogle: false, showCopyImage: false, showCopyImageAddress: false, showSaveImage: false, showSaveImageAs: false, showSaveLinkAs: false, showInspectElement: false, showServices: false, prepend: () => baseAppCMArr };
        dtlfxDisposeAppCM = contextMenu(updAppMenuObj);
        let dtlfxTrayIcon = '';
        if (dtlfxMode === 'prod') {
            dtlfxTrayIcon = path.join(__dirname, 'assets/favicon.ico');
        }
        else {
            dtlfxTrayIcon = path.join(__dirname, '../dist/assets/favicon.ico');
        }
        ;
        dtlfxTray = new electron_1.Tray(dtlfxTrayIcon);
        dtlfxCM = electron_1.Menu.buildFromTemplate(baseAppCMArr);
        dtlfxTray.setToolTip('DTLFX - ' + (dtlfxPlayState === 'stopped' ? 'Stopped' : 'Running'));
        dtlfxTray.setContextMenu(dtlfxCM);
        dtlfxCMBuildInProg = false;
        return Promise.resolve(true);
    });
}
;
//------------------------------------------------
function modDTLFXSpeedSetting(data) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('modDTLFXSetting', '(' + (typeof data === 'number' ? Number(data) : String(data)) + ')...');
        if (dtlfxSCInProg) {
            return Promise.resolve(false);
        }
        ;
        dtlfxSCInProg = true;
        let existSetV = dtlfxData.settings.speed;
        let newSetV = 0, chgStr = '';
        if (typeof data === 'string') {
            const notMax = () => { return (dtlfxData.settings.speed < 100); }, notMin = () => { return (dtlfxData.settings.speed > 0); }, ckCond = (data === 'inc' ? (notMax()) : (notMin()));
            if (!ckCond) {
                rM('showStatusMsg', (data === 'inc' ? 'Max' : 'Min') + ' Speed: ' + String(dtlfxData.settings.speed) + '%');
                dtlfxSCInProg = false;
                return Promise.resolve(false);
            }
            else {
                if (data === 'inc') {
                    newSetV = (existSetV + 10);
                    chgStr = '+10';
                }
                else {
                    newSetV = (existSetV - 10);
                    chgStr = '-10';
                }
            }
        }
        else {
            newSetV = data;
            chgStr = String(Math.abs(newSetV - existSetV));
            if (existSetV > newSetV) {
                chgStr = '-' + chgStr;
            }
            else {
                chgStr = '+' + chgStr;
            }
        }
        ;
        dtlfxData.settings.speed = newSetV;
        rM('animSpeedUpdate', dtlfxData.settings.speed);
        rM('showStatusMsg', '(' + chgStr + ') Speed: ' + String(dtlfxData.settings.speed) + '%');
        yield writeDataFile(dtlfxData);
        yield rebuildCMs();
        dtlfxSCInProg = false;
    });
}
//////////////////////////////////////////////////
// SHORTCUTS
//////////////////////////////////////////////////
const scs = (tf) => { if (tf) {
    if (!dtlfxSCsActive) {
        shortCutRegs('register');
    }
}
else {
    if (dtlfxSCsActive) {
        shortCutRegs('unregister');
    }
} };
const shortCutRegs = (action) => {
    if (action === 'register') {
        if (!dtlfxData.settings.z1bmode) {
            electron_1.globalShortcut.register('Alt+Shift+Up', () => { if (dtlfxWindow.isFocused) {
                if (ledFXCoreIsRunning && rendEffectInfo) {
                    nextPrevLedFXEffect('next');
                }
            } });
            electron_1.globalShortcut.register('Alt+Shift+Down', () => { if (dtlfxWindow.isFocused) {
                if (ledFXCoreIsRunning && rendEffectInfo) {
                    nextPrevLedFXEffect('prev');
                }
            } });
            electron_1.globalShortcut.register('Alt+Shift+Right', () => { if (dtlfxWindow.isFocused) {
                if (ledFXCoreIsRunning && rendEffectInfo) {
                    nextPrevGradient('next');
                }
            } });
            electron_1.globalShortcut.register('Alt+Shift+Left', () => { if (dtlfxWindow.isFocused) {
                if (ledFXCoreIsRunning && rendEffectInfo) {
                    nextPrevGradient('prev');
                }
            } });
            electron_1.globalShortcut.register('Alt+Shift+I', () => { if (dtlfxWindow.isFocused) {
                modDTLFXSpeedSetting('inc');
            } });
            electron_1.globalShortcut.register('Alt+Shift+D', () => { if (dtlfxWindow.isFocused) {
                modDTLFXSpeedSetting('dec');
            } });
            electron_1.globalShortcut.register('Alt+Shift+S', () => { if (dtlfxWindow.isFocused) {
                winCtrl('show');
            } });
            electron_1.globalShortcut.register('Alt+Shift+H', () => { if (dtlfxWindow.isFocused) {
                winCtrl('hide');
            } });
            electron_1.globalShortcut.register('Alt+Shift+X', () => { if (dtlfxWindow.isFocused) {
                winCtrl('exit');
            } });
        }
        ;
        dtlfxSCsActive = true;
    }
    else {
        if (!dtlfxData.settings.z1bmode) {
            electron_1.globalShortcut.unregisterAll();
        }
        ;
        dtlfxSCsActive = false;
    }
    ;
};
//////////////////////////////////////////////
// LFXCORE FUNCTIONS
//////////////////////////////////////////////
electron_1.ipcMain.handle('getLFXCurrentEffect', (e, args) => __awaiter(void 0, void 0, void 0, function* () {
    let waitINT, waitTO;
    if (rendEffectInfo !== null) {
        return Promise.resolve(rendEffectInfo);
    }
    else {
        if (!ledFXCoreIsRunning) {
            return Promise.resolve(false);
        }
        else {
            if (gettingLFXCoreData) {
                return new Promise((resolve) => {
                    waitTO = setTimeout(() => {
                        if (waitINT) {
                            clearInterval(waitINT);
                        }
                        ;
                        if (rendEffectInfo !== null) {
                            resolve(rendEffectInfo);
                        }
                        else {
                            availCons('getLFXCurrentEffect', 'ERROR: Timeout (5s) Waiting for LFXCoreData');
                            resolve(false);
                        }
                        ;
                    }, 5000);
                    waitINT = setInterval(() => {
                        if (!gettingLFXCoreData && rendEffectInfo !== null) {
                            clearInterval(waitINT);
                            if (waitTO) {
                                clearTimeout(waitTO);
                            }
                            ;
                            resolve(rendEffectInfo);
                        }
                        ;
                    }, 500);
                });
            }
            else {
                const sLCDRes = yield setLFXCoreData();
                if (sLCDRes && rendEffectInfo !== null) {
                    return Promise.resolve(rendEffectInfo);
                }
                else {
                    return Promise.resolve(false);
                }
                ;
            }
            ;
        }
    }
}));
//--------------------------------------------
function lfxAPIReq(m, ep, d, to) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('lfxAPIReq', '(' + m + ',data:any' + (to ? ',' + String(to) + ')' : ')') + '...');
        try {
            let defAPIReqOpts = { url: 'http://192.168.0.3:6699/api/' + ep, method: m, responseType: 'json', timeout: (to ? to : 10000) };
            if (m !== 'get') {
                defAPIReqOpts['headers'] = { 'Content-Type': 'application/json' };
                if (typeof d === 'object') {
                    d = JSON.stringify(d);
                }
                ;
                if (!isJSON(d)) {
                    availCons('lfxAPIReq', 'ERROR: data -> JSON Failed');
                    return Promise.resolve({ r: false, d: 'ERROR: data -> JSON Failed' });
                }
                ;
                defAPIReqOpts['data'] = d;
            }
            ;
            const reqRes = yield axios_1.default.request(defAPIReqOpts);
            if (reqRes && reqRes.data && reqRes.status === 200) {
                let resObj = { r: true, d: null };
                if (typeof reqRes.data === 'object') {
                    resObj.d = reqRes.data;
                }
                else {
                    resObj.d = JSON.parse(reqRes.data);
                }
                ;
                return Promise.resolve(resObj);
            }
            else {
                availCons('lfxAPIReq', 'ERROR: [' + String(reqRes.status) + ']');
                return Promise.resolve({ r: false, d: 'ERROR: [' + String(reqRes.status) + ']' });
            }
        }
        catch (e) {
            availCons('lfxAPIReq', 'ERROR:');
            console.log(e);
            return Promise.resolve({ r: false, d: null });
        }
    });
}
//--------------------------------------------
function setLFXCoreData() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('setLFXCoreData', '()...');
        if (!ledFXCoreIsRunning) {
            availCons('reqLFXCore', 'ERROR: ledFXCoreIsRunning=false');
            return Promise.resolve(false);
        }
        ;
        gettingLFXCoreData = true;
        let epsArr = ['info', 'devices', 'virtuals', 'effects'];
        let errCount = 0;
        for (let gri = 0; gri < epsArr.length; gri++) {
            const epKey = epsArr[gri];
            try {
                const rR = yield lfxAPIReq('get', epKey, null);
                if (!rR.r || !rR.d) {
                    availCons('setLFXCoreData|' + epsArr[gri], 'ERROR: ' + (rR.d ? rR.d : 'Unknown Error'));
                    errCount++;
                }
                else {
                    if (epsArr[gri] === 'info') {
                        const urlArr = rR.d.url.replace('http://', '').split(':');
                        ledFXCoreData.info.host = urlArr[0];
                        ledFXCoreData.info.port = Number(urlArr[1]);
                        ledFXCoreData.info.version = rR.d.version;
                    }
                    else {
                        if (rR.d.hasOwnProperty('status') && rR.d.status === 'success' && rR.d.hasOwnProperty(epsArr[gri]) && !_.isEmpty(rR.d[epsArr[gri]])) {
                            ledFXCoreData[epsArr[gri]] = rR.d[epsArr[gri]];
                            if (epsArr[gri] === 'devices') {
                                for (const [k, v] of Object.entries(ledFXCoreData.devices)) {
                                    const devInf = v;
                                    if (devInf.hasOwnProperty('config') && devInf.config && devInf.config.hasOwnProperty('ip_address') && devInf.config.ip_address) {
                                        if (dtlfxData.settings.z1bmode) {
                                            if (devInf.config.ip_address === '192.168.0.111') {
                                                ledFXDeviceId = k;
                                            }
                                        }
                                        else {
                                            if (devInf.config.ip_address === (hlIP())) {
                                                ledFXDeviceId = k;
                                            }
                                        }
                                        ;
                                    }
                                }
                                ;
                            }
                            ;
                            if (epsArr[gri] === 'effects' && ledFXDeviceId !== null) {
                                if (ledFXCoreData.effects.hasOwnProperty(ledFXDeviceId) && !_.isEmpty(ledFXCoreData.effects[ledFXDeviceId])) {
                                    const dFXObj = ledFXCoreData.effects[ledFXDeviceId];
                                    availCons('setLFXCoreData', dFXObj);
                                    const fxT = dFXObj.effect_type;
                                    availCons('setLFXCoreData', fxT);
                                    let rEIObj = { isSupported: true, dtlfxIndex: (dtlfxSupportedFX.findIndex((t) => t === fxT)), id: fxT, name: (fxType2Name(fxT)), rgb: { type: null, data: null } };
                                    if (dtlfxSupportedFX.includes(fxT)) {
                                        if (dFXObj.effect_config.hasOwnProperty('gradient') && dFXObj.effect_config.gradient) {
                                            if (dFXObj.effect_config.gradient.startsWith('#')) {
                                                rEIObj.rgb.data = ledFXCoreData.effects[ledFXDeviceId].effect_config.gradient;
                                                rEIObj.rgb.type = 'color';
                                            }
                                            else {
                                                rEIObj.rgb.type = 'gradient';
                                                const matchGradRes = (matchGStr(dFXObj.effect_config.gradient));
                                                if (matchGradRes) {
                                                    rEIObj.rgb.data = matchGradRes;
                                                }
                                                else {
                                                    availCons('setLFXCoreData', 'ERROR: FAILED to match Gradient Str to Object!');
                                                    rEIObj.rgb.data = { n: 'NK', g: ledFXCoreData.effects[ledFXDeviceId].effect_config.gradient, i: -1 };
                                                }
                                            }
                                            ;
                                        }
                                        else if ((dFXObj.effect_config.hasOwnProperty('color_lows') || dFXObj.effect_config.hasOwnProperty('lows_color')) && (dFXObj.effect_config.hasOwnProperty('color_mids') || dFXObj.effect_config.hasOwnProperty('mids_color')) && (dFXObj.effect_config.hasOwnProperty('color_high') || dFXObj.effect_config.hasOwnProperty('high_color'))) {
                                            rEIObj.rgb.type = 'colors';
                                            dFXObj.effect_config.hasOwnProperty('color_lows') ? rEIObj.rgb.data = [dFXObj.effect_config.color_lows, dFXObj.effect_config.color_mids, dFXObj.effect_config.color_high] : rEIObj.rgb.data = [dFXObj.effect_config.lows_color, dFXObj.effect_config.mids_color, dFXObj.effect_config.high_color];
                                        }
                                        else {
                                            rEIObj = { isSupported: false, dtlfxIndex: -1, id: '-', name: '-', rgb: { type: null, data: null } };
                                        }
                                        ;
                                    }
                                    else {
                                        rEIObj = { isSupported: false, dtlfxIndex: -1, id: '-', name: '-', rgb: { type: null, data: null } };
                                        availCons('setLFXCoreData', 'dtlfxSupportedFX ! include (' + fxT + ')');
                                    }
                                    ;
                                    rendEffectInfo = rEIObj;
                                    rM('lfxEffectUpdate', rendEffectInfo);
                                }
                            }
                        }
                    }
                }
            }
            catch (e) {
                availCons('setLFXCoreData|' + epsArr[gri], 'ERROR:');
                console.log(e);
                errCount++;
            }
            ;
        }
        ;
        if (rendEffectInfo !== null) {
            yield sendVizInf2Z1Box();
        }
        ;
        if (errCount > 0) {
            gettingLFXCoreData = false;
            return Promise.resolve(false);
        }
        else {
            gettingLFXCoreData = false;
            return Promise.resolve(true);
        }
        ;
    });
}
;
//////////////////////////////////////////////
// MAIN DTLFX FUNCTIONS
//////////////////////////////////////////////
function dtlfxPlayControlFn(action, data) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('dtlfxPlayControls', '(' + action + ')...');
        if (ledFXCoreIsRunning) {
            if (action === 'start') {
                dtlfxPlayState = 'started';
                rM('startStopDTLFX', 'start');
            }
            else {
                dtlfxPlayState = 'stopped';
                rM('startStopDTLFX', 'stop');
            }
            ;
            rebuildCMs();
        }
        else {
            availCons('dtlfxPlayControlFn', 'SKIPPED (' + action + ') - ledFXCoreIsRunning=false');
        }
        ;
    });
}
;
//---------------------------------------------
electron_1.ipcMain.handle('getDTLFXAnimSpeed', (e, args) => { return Promise.resolve(dtlfxData.settings.speed); });
//---------------------------------------------
electron_1.ipcMain.handle('getDTLFXShowStatsBar', (e, args) => { return Promise.resolve(dtlfxData.settings.showstatsbar); });
//---------------------------------------------
electron_1.ipcMain.on('ChangeMBLimit', (e, args) => { mbLimits[args[0]] = args[1]; });
//--------------------------------------------
electron_1.ipcMain.handle('getUMediaListsData', (e, args) => { const uMO = uMediaLists; return Promise.resolve(uMO); });
//--------------------------------------------
function getFileAsBase64(filePath) { return new Promise((resolve) => { fs.readFile(filePath, (err, data) => { if (err) {
    resolve(false);
}
else {
    const base64Data = Buffer.from(data).toString('base64');
    resolve(base64Data);
} }); }); }
;
//--------------------------------------------
electron_1.ipcMain.handle('getRandUMediaDataBlock', (e, args) => __awaiter(void 0, void 0, void 0, function* () {
    if (!uMediaLists[args[0]].active || uMediaLists[args[0]].list.length < 1) {
        return Promise.resolve([]);
    }
    ;
    if (uMediaLists[args[0]].list.length <= (mbLimits[args[0]]) && uMediaLists[args[0]].block.length > 0) {
        return Promise.resolve(uMediaLists[args[0]].block);
    }
    ;
    const blockLen = (uMediaLists[args[0]].list.length > (mbLimits[args[0]]) ? (mbLimits[args[0]]) : uMediaLists[args[0]].list.length);
    const fullMediaList = uMediaLists[args[0]].list;
    let rUMDataBlock = [];
    while (rUMDataBlock.length < blockLen) {
        const rListI = Math.floor(Math.random() * fullMediaList.length);
        const existRLI = rUMDataBlock.findIndex((rLO) => rLO.i === rListI);
        if (existRLI === -1) {
            try {
                const umDirPath = dtlfxData.paths.mediaPaths[args[0]];
                const rIFName = uMediaLists[args[0]].list[rListI];
                const rIFPath = path.join(umDirPath, rIFName);
                const getRIData = yield getFileAsBase64(rIFPath);
                if (getRIData !== false) {
                    const extTypeStr = (path.extname(rIFName)).replace('.', '');
                    const finalStr = 'data:image/' + extTypeStr + ';base64,' + getRIData;
                    const finalObj = { i: rListI, d: finalStr };
                    rUMDataBlock.push(finalObj);
                    if (dtlfxHomeActive) {
                        dtlfxWindow.webContents.send('getRandUBlockProg', [args[0], rUMDataBlock.length, blockLen]);
                    }
                    ;
                }
                ;
            }
            catch (e) {
                availCons('getRandUMediaDataBlock', e);
            }
            ;
        }
        ;
    }
    ;
    return Promise.resolve(rUMDataBlock);
}));
//--------------------------------------------
function checkWCRunning() {
    return __awaiter(this, void 0, void 0, function* () { const { r } = yield reqWifiCUE('get', 'ping'); wcIsRunning = r; return Promise.resolve(r); });
}
//--------------------------------------------
function reqWifiCUE(method, data, config) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('notifyWifiCUE', '(' + method + ',data)...');
        try {
            let defReqOpts = { url: 'http://' + (hlIP()) + ':6666', method: method, timeout: 3000 };
            if (method === 'get') {
                defReqOpts['headers'] = { dtlfx: data };
                defReqOpts['responseType'] = 'text';
                if (config && config.length > 0) {
                    defReqOpts['headers']['dtlfxconfig'] = config;
                }
                ;
            }
            else {
                defReqOpts['headers'] = { 'dtlfx': 'post', 'Content-Type': 'application/json' };
                defReqOpts['data'] = data;
                defReqOpts['responseType'] = 'json';
            }
            ;
            const reqRes = yield axios_1.default.request(defReqOpts);
            if (reqRes.status !== 200) {
                availCons('reqWifiCUE', 'ERROR: ' + reqRes.status);
            }
            ;
            if (method === 'post') {
                return Promise.resolve(reqRes.data);
            }
            else {
                return Promise.resolve({ r: (reqRes.status === 200 ? true : false) });
            }
        }
        catch (e) {
            return Promise.resolve({ r: false, d: null });
        }
    });
}
//--------------------------------------------
function ledfx2IsRun() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('ledfx2IsRun', '()...');
        let cRInProg = false;
        return new Promise((resolve) => {
            let irTO = null, irINT = null;
            const checkRun = () => {
                if (!cRInProg) {
                    cRInProg = true;
                    availCons('ledfx2IsRun|CheckRun', '()...');
                    return new Promise((resolve) => {
                        (0, child_process_1.exec)('tasklist | findstr "ledFX2.exe"', (error, stdout, stderr) => {
                            if (error || stderr || !stdout) {
                                cRInProg = false;
                                resolve(false);
                            }
                            else {
                                let rPIDs = [], rawLines = stdout.split('\n');
                                if (rawLines.length > 0) {
                                    for (let i = 0; i < rawLines.length; i++) {
                                        const rL = rawLines[i].trim();
                                        if (rL.length > 0 && rL.startsWith('ledFX2.exe')) {
                                            if (rL.split(/\s+/)[1].trim() && !rPIDs.includes(rL.split(/\s+/)[1].trim())) {
                                                rPIDs.push(rL.split(/\s+/)[1].trim());
                                            }
                                            ;
                                        }
                                        ;
                                    }
                                    ;
                                    if (rPIDs.length >= 2) {
                                        availCons('ledfx2IsRun', 'SUCCESS: Found 2x New-Run LedFx.exes - ' + rPIDs.join(','));
                                        cRInProg = false;
                                        resolve(true);
                                    }
                                    else if (rPIDs.length === 1) {
                                        availCons('ledfx2IsRun', 'PROGRESS: Found 1x New-Run LedFx.exe - ' + String(rPIDs[0]));
                                        cRInProg = false;
                                        resolve(false);
                                    }
                                    else {
                                        availCons('ledfx2IsRun', 'WAIT: Found 0x New-Run LedFx.exes');
                                        cRInProg = false;
                                        resolve(false);
                                    }
                                }
                                else {
                                    availCons('ledfx2IsRun', 'WAIT: No STDOUT Reply Data');
                                    cRInProg = false;
                                    resolve(false);
                                }
                                ;
                            }
                        });
                    });
                }
                else {
                    return Promise.resolve(false);
                }
                ;
            };
            irTO = setTimeout(() => {
                availCons('ledfx2IsRun', 'ERROR: Timeout Waiting for New-Run LedFx.exes!');
                if (irINT !== null) {
                    clearInterval(irINT);
                    resolve(false);
                }
                ;
            }, 30000);
            irINT = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                const irRes = yield checkRun();
                if (irRes) {
                    clearInterval(irINT);
                    clearTimeout(irTO);
                    resolve(true);
                }
                ;
            }), 1000);
        });
    });
}
;
//--------------------------------------------
function ledfx2Kill() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('ledfx2Kill', '()...');
        return new Promise((resolve) => {
            (0, child_process_1.exec)('taskkill /F /IM ledFX2.exe /T', (error, stdout, stderr) => __awaiter(this, void 0, void 0, function* () {
                if (error || stderr || !stdout) {
                    availCons('ledfx2Kill', 'ERROR @ ledfx2Kill');
                    resolve(false);
                }
                else {
                    let killdPIDs = [], rawLines = stdout.split('\n');
                    if (rawLines.length > 0) {
                        for (let i = 0; i < rawLines.length; i++) {
                            const rL = rawLines[i].trim();
                            if (rL.length > 0 && rL.startsWith('SUCCESS: ')) {
                                killdPIDs.push(rL.split('The process with PID ')[1].split(/\s+/)[0]);
                            }
                        }
                    }
                    ;
                    if (killdPIDs.length > 0) {
                        availCons('ledfx2Kill', 'OK - Killed ' + killdPIDs.join(',') + ' @ ledfx2Kill');
                        resolve(killdPIDs);
                    }
                    else {
                        availCons('ledfx2Kill', 'OK - None to Kill @ ledfx2Kill');
                        resolve(false);
                    }
                    ;
                }
            }));
        });
    });
}
;
//--------------------------------------------
function ledfx2Run() {
    availCons('ledfx2Run', '()...');
    return new Promise((resolve) => {
        (0, child_process_1.exec)(dtlfxData.paths.ledfxPaths.exe, (error, stdout, stderr) => {
            if (error || stderr || !stdout) {
                availCons('ledfx2Run', 'ERROR @ ledfxRun()');
                resolve(false);
            }
            else {
                availCons('ledfx2Run', 'SUCCESS @ ledfx2Run()');
                resolve(true);
            }
        });
    });
}
;
//--------------------------------------------
function delOldBUConfigs() {
    return __awaiter(this, void 0, void 0, function* () {
        const allFiles = yield fs.promises.readdir(selectLFXConfigsDirPath);
        const utsFiles = allFiles.filter((f) => /^\d{13}.json$/.test(f));
        const utsNos = utsFiles.map((f) => parseInt(f.slice(0, 13)));
        utsNos.sort((a, b) => b - a);
        const keepUTSFiles = utsNos.slice(0, 3);
        const delUTSFiles = utsFiles.filter((f, i) => !keepUTSFiles.includes(parseInt(f.slice(0, 13))));
        for (const f of delUTSFiles) {
            yield fs.promises.unlink(path.join(selectLFXConfigsDirPath, f));
        }
        ;
        return Promise.resolve(true);
    });
}
//--------------------------------------------
function switchLFXConfigs(cfgName) {
    return __awaiter(this, void 0, void 0, function* () {
        const newCFGPath = yield selectLFXConfig(cfgName);
        if (!newCFGPath) {
            availCons('switchLFXConfigs', 'ERROR - Failed to Find ' + cfgName + '.json');
            return Promise.resolve(false);
        }
        ;
        yield delOldBUConfigs();
        const buCFGUTS = Date.now().toString();
        const buCFGSourcePath = dtlfxData.paths.ledfxPaths.config;
        const buCFGDestPath = path.normalize(path.join(selectLFXConfigsDirPath, buCFGUTS + '.json'));
        try {
            yield fs.promises.copyFile(buCFGSourcePath, buCFGDestPath);
        }
        catch (e) {
            availCons('switchLFXConfigs', 'ERROR: Failed to Backup Existing config.json');
            return Promise.resolve(false);
        }
        ;
        const z1bConfigSourcePath = newCFGPath;
        const z1bConfigDestPath = buCFGSourcePath;
        try {
            yield fs.promises.copyFile(z1bConfigSourcePath, z1bConfigDestPath);
            if ((yield exists(buCFGDestPath)) && (yield statSize(buCFGDestPath)).r && (yield exists(z1bConfigDestPath)) && (yield statSize(z1bConfigDestPath)).r) {
                return Promise.resolve(true);
            }
            else {
                availCons('switchLFXConfigs', 'ERROR: Missing/NIL Size backup or new config files!');
                return Promise.resolve(false);
            }
            ;
        }
        catch (e) {
            availCons('switchLFXConfigs', 'ERROR: Failed to Copy/Replace config.json with ' + cfgName + '.json');
            return Promise.resolve(false);
        }
        ;
    });
}
//--------------------------------------------
function restartLFXExes() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('restartLFXExes', '()...');
        const killRes = yield ledfx2Kill();
        if (killRes !== false) {
            rM('showStatusMsg', 'Killed ' + String(killRes.length) + 'x LedFx.exe (' + killRes.join(',') + ')');
            if (wcIsRunning) {
                reqWifiCUE('get', 'stopped');
            }
            ;
            availCons('restartLFXExes|WAIT', '2s...');
            yield doW(2);
        }
        else {
            availCons('restartLFXExes|ledfx2Kill|RESULT', killRes);
        }
        ;
        availCons('restartLFXExes|WAIT', '1s...');
        yield doW(1);
        //
        const configName = (dtlfxData.settings.z1bmode ? z1bModeCFGName : 'all');
        yield switchLFXConfigs(configName);
        yield doW(1);
        //
        ledfx2Run();
        availCons('restartLFXExes|ledfx2Run', 'Executed Here!');
        const ledfx2IsRunRes = yield ledfx2IsRun();
        availCons('restartLFXExes|ledfx2IsRun|RESULT', String(ledfx2IsRunRes));
        if (!ledfx2IsRunRes) {
            if (wcIsRunning) {
                yield reqWifiCUE('get', 'stopped');
                if (dtlfxData.settings.z1bmode) {
                    yield reqWifiCUE('get', 'config', z1bModeCFGName);
                }
                ;
            }
        }
        else {
            if (wcIsRunning) {
                if (dtlfxData.settings.z1bmode) {
                    yield reqWifiCUE('get', 'config', z1bModeCFGName);
                }
                ;
                yield reqWifiCUE('get', 'started');
            }
            ;
        }
        ;
        availCons('restartLFXExes|FINISHED', 'Final Result: ' + String(ledfx2IsRunRes));
        return Promise.resolve(ledfx2IsRunRes);
    });
}
;
//------------------------------------------------
electron_1.ipcMain.on('changeMainFilterFPS', (e, args) => { if (args[0] <= dmxMainFPSLimit) {
    dmxMainFilterFPS = args[0];
    rM('mainFilterFPSUpdate', dmxMainFilterFPS);
} });
//------------------------------------------------
function initDMXReceiver() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('initDMXReceiver', '()...');
        try {
            dmxRecInst = new sacn.Receiver({ universes: [1], port: 5568, iface: '0.0.0.0', reuseAddr: true });
            dmxRecInst.on('packet', (p) => {
                if (!dtlfxData.settings.z1bmode) {
                    if (dtlfxPlayState === 'started') {
                        const dmxNowPacketTime = Date.now();
                        if ((dmxNowPacketTime - dmxLastPacketTime) >= (1000 / dmxMainFilterFPS)) {
                            dmxLastPacketTime = dmxNowPacketTime;
                            rM('dmxRecData', p.payload);
                            if (dtlfxData.settings.icuesync && cueSDKStatus.error.code === 0 && cueSDKStatus.session.code === 6) {
                                convertPayload4ICUE(p.payload);
                            }
                            ;
                        }
                    }
                }
                else {
                    const dmxNowPacketTime = Date.now();
                    if ((dmxNowPacketTime - dmxLastPacketTime) >= (1000 / dmxMainFilterFPS)) {
                        dmxLastPacketTime = dmxNowPacketTime;
                        if (dtlfxData.settings.icuesync && cueSDKStatus.error.code === 0 && cueSDKStatus.session.code === 6) {
                            convertPayload4ICUE(p.payload);
                        }
                        ;
                    }
                }
            });
            dmxRecInst.on('error', (stdErr) => { console.log(stdErr); availCons('DMXRec|ERROR', '[INTERNAL] - ' + stdErr.name + ': ' + stdErr.message); });
            //----------
            dmxRecIsInit = true;
            availCons('initDMXReceiver', 'DMXReceiver RUNNING! - dmxRecIsInit=' + String(dmxRecIsInit) + '|dtlfxPlayState=' + dtlfxPlayState + '|ledFXCoreIsRunning=' + String(ledFXCoreIsRunning));
            rM('mainFilterFPSUpdate', dmxMainFilterFPS);
            rM('showStatusMsg', 'Started DTLFX Receiver: SUCCESS');
            yield doW(1);
            return Promise.resolve(true);
        }
        catch (e) {
            dmxRecIsInit = false;
            rebuildCMs();
            rM('showStatusMsg', 'Started DTLFX Receiver: ERROR');
            availCons('initDMXReceiver|ERROR', e);
            return Promise.resolve(false);
        }
        ;
    });
}
//------------------------------------------------
function startRestartAll() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('startRestartAll', '()...');
        const initRecRes = yield initDMXReceiver();
        availCons('startRestartAll|initDMXReceiver|RESULT', String(initRecRes));
        const rslfx2sRes = yield restartLFXExes();
        if (!rslfx2sRes) {
            rM('showStatusMsg', 'Restart LedFX.exe - FAILED');
            availCons('dtlfxInitReceiver', 'Restart LedFx.exe - FAILED');
            ledFXCoreIsRunning = false;
            rebuildCMs();
            return Promise.resolve(false);
        }
        else {
            rM('showStatusMsg', 'Restart LedFx.exe - SUCCESS');
            availCons('dtlfxInitReceiver', 'Restart LedFx.exe - SUCCESS');
            ledFXCoreIsRunning = true;
            availCons('startRestartAll|WAIT', '2s...');
            yield doW(2);
            const lfxCDRes = yield setLFXCoreData();
            availCons('startRestartAll|setLFXCoreData|RESULT', String(lfxCDRes));
            if (rendEffectInfo !== null) {
                yield sendVizInf2Z1Box();
            }
            ;
            if (dtlfxData.settings.z1bmode && dtlfxData.settings.autostart) {
                yield toggleAutoStartSetting();
            }
            ;
            if (dtlfxData.settings.z1bmode && dtlfxData.settings.showstatsbar) {
                yield toggleShowStatsBar();
            }
            ;
            if (dtlfxData.settings.autostart || dtlfxPlayState === 'started') {
                dtlfxPlayControlFn('start');
            }
            ;
            rebuildCMs();
            return Promise.resolve(true);
        }
        ;
    });
}
;
//------------------------------------------------
function killDMXReceiver() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('killDMXReceiver', '()...');
        if (dmxRecInst) {
            dmxRecInst.removeAllListeners();
            dmxRecInst.close();
        }
        ;
        dmxRecInst = null, dmxRecIsInit = false;
        return Promise.resolve(true);
    });
}
;
//////////////////////////////////////////////////
// Z1BOX FUNCTIONS
//////////////////////////////////////////////////
function z1BoxSendViz(gradOrFX, vizValue) {
    return __awaiter(this, void 0, void 0, function* () {
        let defZ1BVizOpts = { url: 'http://192.168.0.111/get?z1box=true&z1Viz', method: 'GET', timeout: 10000 };
        if (gradOrFX === 'grad') {
            defZ1BVizOpts.url += 'Grad=';
        }
        else {
            defZ1BVizOpts.url += 'FX=';
        }
        ;
        defZ1BVizOpts.url += vizValue;
        try {
            yield axios_1.default.request(defZ1BVizOpts);
            return Promise.resolve(true);
        }
        catch (e) {
            availCons('z1BoxSendViz', e);
            return Promise.resolve(false);
        }
        ;
    });
}
//////////////////////////////////////////////////
// DTLFX API/SERVER FUNCTIONS
//////////////////////////////////////////////////
function dtlfxInitWebSVR() {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('dtlfxInitWebSVR', '()...');
        try {
            dtlfxWebSVR = http.createServer((req, res) => __awaiter(this, void 0, void 0, function* () {
                const reqIP4 = req.socket.remoteAddress.replace('::ffff:', '').trim();
                availCons('WebSVR|REQUEST', 'Received [' + req.method.toLocaleLowerCase() + '] from ' + reqIP4);
                if (req.headers.dtlfxtoken.toString() === '*******') {
                    if (req.headers.dtlfxfrom.toString() === 'wificue') {
                        if (req.headers.wificue.toString() === 'sendvizinfo') {
                            doSendVizInf2Box = true;
                            if (rendEffectInfo !== null) {
                                yield sendVizInf2Z1Box();
                            }
                            else {
                                setTimeout(() => __awaiter(this, void 0, void 0, function* () { if (rendEffectInfo !== null) {
                                    sendVizInf2Z1Box();
                                } }), 10000);
                            }
                            res.writeHead(200, 'OK', { 'Content-Type': 'text/plain' });
                            res.end('OK');
                        }
                        else if (req.headers.wificue.toString() === 'getconfig') {
                            if (dtlfxData.settings.z1bmode && z1bModeCFGName !== null) {
                                res.writeHead(200, 'OK', { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ r: true, d: z1bModeCFGName }));
                            }
                            else {
                                res.writeHead(200, 'OK', { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ r: false, d: null }));
                            }
                            ;
                        }
                        else if (req.headers.wificue.toString() === 'started') {
                            if (!wcIsRunning) {
                                wcIsRunning = true;
                            }
                            ;
                            if (ledFXCoreIsRunning) {
                                if (dtlfxData.settings.z1bmode) {
                                    yield reqWifiCUE('get', 'config', z1bModeCFGName);
                                }
                                ;
                                yield reqWifiCUE('get', 'started');
                            }
                            ;
                            res.writeHead(200, 'OK', { 'Content-Type': 'text/plain' });
                            res.end('OK');
                        }
                        else if (req.headers.wificue.toString() === 'stopped') {
                            if (wcIsRunning) {
                                wcIsRunning = false;
                            }
                            ;
                            res.writeHead(200, 'OK', { 'Content-Type': 'text/plain' });
                            res.end('OK');
                        }
                        else if (req.headers.wificue.toString() === 'setcolor' && req.headers.wcdata.length > 0) {
                            setNewGradientColor(req.headers.wcdata);
                            res.writeHead(200, 'OK', { 'Content-Type': 'text/plain' });
                            res.end('OK');
                        }
                        ;
                    }
                    else if (req.headers.dtlfxfrom.toString() === 'z1box') {
                        const z1boxCMDStr = req.headers.z1box.toString();
                        if (z1boxCMDStr.startsWith('grad')) {
                            const nOp = z1boxCMDStr.replace('grad', '');
                            nextPrevGradient(nOp);
                            res.writeHead(200, 'OK');
                            res.end();
                        }
                        else if (z1boxCMDStr.startsWith('fx')) {
                            const nOp = z1boxCMDStr.replace('fx', '');
                            nextPrevLedFXEffect(nOp);
                            res.writeHead(200, 'OK');
                            res.end();
                        }
                        else if (z1boxCMDStr === 'vizgradfxinfo') {
                            let vizGFStr = rendEffectInfo.name + '/';
                            if (typeof rendEffectInfo.rgb.data === 'object' && !Array.isArray(rendEffectInfo.rgb.data)) {
                                vizGFStr += rendEffectInfo.rgb.data.n;
                            }
                            else {
                                vizGFStr += 'Color';
                            }
                            ;
                            res.writeHead(200, 'OK', { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(vizGFStr) });
                            res.end(vizGFStr);
                        }
                    }
                }
                else {
                    res.writeHead(401, 'Unauthorized', { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ r: false, d: null }));
                    availCons('WebSVR|RESPONSE', 'Sent 401 Response');
                }
            })).listen(9696);
            dtlfxWebSVRTerminate = (0, http_terminator_1.createHttpTerminator)({ gracefulTerminationTimeout: 1000, server: dtlfxWebSVR });
            availCons('dtlfxInitWebSVR', 'WebSVR Running @ ' + (hlIP()) + ':9696');
            return Promise.resolve(true);
        }
        catch (e) {
            availCons('startNotifListener', 'ERROR: ' + e);
            return Promise.resolve(false);
        }
    });
}
//--------------------------------------------
function doKillWebSVR() {
    return __awaiter(this, void 0, void 0, function* () {
        if (dtlfxWebSVR === null || dtlfxWebSVRTerminate === null) {
            return Promise.resolve(true);
        }
        ;
        try {
            yield dtlfxWebSVRTerminate.terminate();
            dtlfxWebSVRTerminate = null;
            dtlfxWebSVR = null;
            return Promise.resolve(true);
        }
        catch (e) {
            return Promise.resolve(false);
        }
    });
}
;
//////////////////////////////////////////////
// LEDFX FUNCTIONS
//////////////////////////////////////////////
function changeLFXEffect(fxId) {
    return __awaiter(this, void 0, void 0, function* () {
        //----------
        const eR = yield lfxAPIReq('get', 'effects', null);
        if (!eR.r || !eR.d) {
            availCons('changeLFXEffect|GET', 'ERROR - GETing existing Device Effect Configs');
            return Promise.resolve(false);
        }
        else {
            let devCfgsArr = [];
            for (const [k, v] of Object.entries(eR.d.effects)) {
                const devEff = v;
                devCfgsArr.push({ dId: k, effectConfig: { config: devEff.effect_config } });
            }
            ;
            currentLFXEConfigs = devCfgsArr;
        }
        ;
        //----------
        let devPostEffs = [];
        for (let eci = 0; eci < currentLFXEConfigs.length; eci++) {
            let devPost = { id: currentLFXEConfigs[eci].dId, postObj: { type: fxId } };
            if (!lowMidHighEffects.includes(fxId)) {
                devPost.postObj['config'] = { gradient: currentLFXEConfigs[eci].effectConfig.config.gradient };
            }
            ;
            if (currentLFXEConfigs[eci].effectConfig.type !== fxId) {
                devPostEffs.push(devPost);
            }
            ;
        }
        ;
        //---------
        let pReqErrs = 0;
        for (let pdi = 0; pdi < devPostEffs.length; pdi++) {
            const pR = yield lfxAPIReq('post', 'virtuals/' + devPostEffs[pdi].id + '/effects', devPostEffs[pdi].postObj);
            if (!pR.r || !pR.d || pR.d.status !== 'success') {
                availCons('changeLFXEffect|POST', 'ERROR - POSTing new Type for ' + devPostEffs[pdi].id);
                pReqErrs++;
            }
            else {
                if (devPostEffs[pdi].id === ledFXDeviceId) {
                    let rEIObj = { isSupported: true, dtlfxIndex: (dtlfxSupportedFX.findIndex((t) => t === fxId)), id: fxId, name: (fxType2Name(fxId)), rgb: { type: null, data: null } };
                    if (pR.d.effect.config.hasOwnProperty('gradient') && pR.d.effect.config.gradient) {
                        if (pR.d.effect.config.gradient.startsWith('#')) {
                            rEIObj.rgb.data = pR.d.effect.config.gradient;
                            rEIObj.rgb.type = 'color';
                        }
                        else {
                            rEIObj.rgb.type = 'gradient';
                            const matchGradRes = (matchGStr(pR.d.effect.config.gradient));
                            if (matchGradRes) {
                                rEIObj.rgb.data = matchGradRes;
                            }
                            else {
                                availCons('setLFXCoreData', 'ERROR: FAILED to match Gradient Str to Object!');
                                rEIObj.rgb.data = { n: 'NK', g: pR.d.effect.config.gradient, i: -1 };
                            }
                        }
                        ;
                    }
                    else if ((pR.d.effect.config.hasOwnProperty('color_lows') || pR.d.effect.config.hasOwnProperty('lows_color')) && (pR.d.effect.config.hasOwnProperty('color_mids') || pR.d.effect.config.hasOwnProperty('mids_color')) && (pR.d.effect.config.hasOwnProperty('color_high') || pR.d.effect.config.hasOwnProperty('high_color'))) {
                        rEIObj.rgb.type = 'colors';
                        pR.d.effect.config.hasOwnProperty('color_lows') ? rEIObj.rgb.data = [pR.d.effect.config.color_lows, pR.d.effect.config.color_mids, pR.d.effect.config.color_high] : rEIObj.rgb.data = [pR.d.effect.config.lows_color, pR.d.effect.config.mids_color, pR.d.effect.config.high_color];
                    }
                    else {
                        rEIObj = { isSupported: false, dtlfxIndex: -1, id: '-', name: '-', rgb: { type: null, data: null } };
                    }
                    ;
                    rendEffectInfo = rEIObj;
                }
            }
        }
        ;
        if (pReqErrs > 0) {
            return Promise.resolve(false);
        }
        else {
            return Promise.resolve(true);
        }
        ;
    });
}
;
//--------------------------------------------
function changeLFXColors(colorStr) {
    return __awaiter(this, void 0, void 0, function* () {
        //----------
        const gR = yield lfxAPIReq('get', 'effects', null);
        if (!gR.r || !gR.d || gR.d.status !== 'success') {
            availCons('changeLFXColors|GET', 'ERROR - GETing existing Device Effect Configs');
            return Promise.resolve(false);
        }
        else {
            let devCfgsArr = [];
            for (const [k, v] of Object.entries(gR.d.effects)) {
                const devEff = v;
                devCfgsArr.push({ dId: k, effectConfig: { config: devEff.effect_config, type: devEff.effect_type } });
            }
            ;
            currentLFXEConfigs = devCfgsArr;
        }
        ;
        //----------
        let devPutGrads = [];
        for (let eci = 0; eci < currentLFXEConfigs.length; eci++) {
            let devPut = currentLFXEConfigs[eci];
            if (devPut.effectConfig.config.gradient !== colorStr) {
                devPut.effectConfig.config.gradient = colorStr;
                devPutGrads.push({ id: devPut.dId, putObj: devPut.effectConfig });
            }
        }
        ;
        //---------
        let pReqErrs = 0;
        for (let pdi = 0; pdi < devPutGrads.length; pdi++) {
            availCons('changeLFXColors|putObj', devPutGrads[pdi].putObj);
            const pR = yield lfxAPIReq('put', 'virtuals/' + devPutGrads[pdi].id + '/effects', devPutGrads[pdi].putObj);
            if (!pR.r || !pR.d || pR.d.status !== 'success') {
                availCons('changeLFXColors|PUT', 'ERROR - PUTing new Gradient for ' + devPutGrads[pdi].id);
                pReqErrs++;
            }
            else {
                if (devPutGrads[pdi].id === ledFXDeviceId) {
                    if (pR.d.effect.config.gradient.startsWith('#')) {
                        rendEffectInfo.rgb.type = 'color';
                        rendEffectInfo.rgb.data = pR.d.effect.config.gradient;
                    }
                    else {
                        rendEffectInfo.rgb.type = 'gradient';
                        const matchGradRes = (matchGStr(pR.d.effect.config.gradient));
                        if (matchGradRes) {
                            rendEffectInfo.rgb.data = matchGradRes;
                        }
                        else {
                            availCons('changeLFXColors', 'ERROR: FAILED to match New Gradient Str to Object!');
                            rendEffectInfo.rgb.data = { n: 'NK', g: pR.d.effect.config.gradient, i: -1 };
                        }
                    }
                }
            }
        }
        ;
        if (pReqErrs > 0) {
            return Promise.resolve(false);
        }
        else {
            return Promise.resolve(true);
        }
        ;
    });
}
;
//--------------------------------------------
function sendVizInf2Z1Box() {
    return __awaiter(this, void 0, void 0, function* () {
        yield z1BoxSendViz('FX', rendEffectInfo.name);
        let colGradStr = '';
        if (rendEffectInfo.rgb.type === 'color' && typeof rendEffectInfo.rgb.data === 'string') {
            colGradStr = rendEffectInfo.rgb.data;
        }
        else if (rendEffectInfo.rgb.type === 'colors' && typeof rendEffectInfo.rgb.data === 'object' && Array.isArray(rendEffectInfo.rgb.data)) {
            colGradStr = String(rendEffectInfo.rgb.data.length) + ' Colors';
        }
        else if (rendEffectInfo.rgb.type === 'gradient' && typeof rendEffectInfo.rgb.data === 'object' && !Array.isArray(rendEffectInfo.rgb.data)) {
            colGradStr = rendEffectInfo.rgb.data.n;
        }
        ;
        yield z1BoxSendViz('grad', colGradStr);
        return Promise.resolve(true);
    });
}
//--------------------------------------------
function nextPrevLedFXEffect(nextPrev) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('nextPrevLedFXEffect', '(' + nextPrev + ')...');
        let defEI = dtlfxSupportedFX.findIndex((eId) => eId === 'power'), newEI = defEI;
        const oldEI = dtlfxSupportedFX.findIndex((eId) => eId === rendEffectInfo.id);
        if (oldEI !== -1) {
            if (nextPrev === 'next') {
                if ((oldEI + 1) > (dtlfxSupportedFX.length - 1)) {
                    newEI = 0;
                }
                else {
                    newEI = (oldEI + 1);
                }
            }
            else {
                if ((oldEI - 1) < 0) {
                    newEI = (dtlfxSupportedFX.length - 1);
                }
                else {
                    newEI = (oldEI - 1);
                }
            }
            ;
        }
        ;
        const newE = dtlfxSupportedFX[newEI];
        const cLEffectRes = yield changeLFXEffect(newE);
        if (cLEffectRes) {
            rM('lfxEffectUpdate', rendEffectInfo);
            rM('showStatusMsg', 'LFX Type Changed (' + rendEffectInfo.name + ')');
            z1BoxSendViz('FX', rendEffectInfo.name);
            rebuildCMs();
        }
        else {
            availCons('nextPrevLedFXEffect', 'ERROR: Change Effect to ' + newE + ' FAILED!');
        }
        ;
    });
}
;
//--------------------------------------------
function selectLedFXEffect(lfxEffectId) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('selectLedFxEffect', '(' + lfxEffectId + ')...');
        const cLEffectRes = yield changeLFXEffect(lfxEffectId);
        if (cLEffectRes) {
            rM('lfxEffectUpdate', rendEffectInfo);
            rM('showStatusMsg', 'LFX Type Changed (' + rendEffectInfo.name + ')');
            rebuildCMs();
        }
        else {
            availCons('nextPrevLedFXEffect', 'ERROR: Change Effect to ' + lfxEffectId + ' FAILED!');
        }
        ;
    });
}
;
//--------------------------------------------
function nextPrevGradient(nextPrev) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('nextPrevGradient', '(' + nextPrev + ')...');
        let newGI = 0;
        if (rendEffectInfo.rgb.type === 'gradient' && typeof rendEffectInfo.rgb.data === 'object' && !Array.isArray(rendEffectInfo.rgb.data) && rendEffectInfo.rgb.data.i !== -1) {
            const oldGI = rendEffectInfo.rgb.data.i;
            if (nextPrev === 'next') {
                if ((oldGI + 1) > (dtlfxDefGradsArr.length - 1)) {
                    newGI = 0;
                }
                else {
                    newGI = (oldGI + 1);
                }
            }
            else {
                if ((oldGI - 1) < 0) {
                    newGI = (dtlfxDefGradsArr.length - 1);
                }
                else {
                    newGI = (oldGI - 1);
                }
            }
            ;
        }
        ;
        const newG = dtlfxDefGradsArr[newGI];
        const cLCGradRes = yield changeLFXColors(newG.gradient);
        if (cLCGradRes) {
            rM('lfxEffectUpdate', rendEffectInfo);
            let colGradStr = '';
            if (rendEffectInfo.rgb.type === 'color' && typeof rendEffectInfo.rgb.data === 'string') {
                colGradStr = rendEffectInfo.rgb.data;
            }
            else if (rendEffectInfo.rgb.type === 'colors' && typeof rendEffectInfo.rgb.data === 'object' && Array.isArray(rendEffectInfo.rgb.data)) {
                colGradStr = String(rendEffectInfo.rgb.data.length) + ' Colors';
            }
            else if (rendEffectInfo.rgb.type === 'gradient' && typeof rendEffectInfo.rgb.data === 'object' && !Array.isArray(rendEffectInfo.rgb.data)) {
                colGradStr = rendEffectInfo.rgb.data.n;
            }
            ;
            rM('showStatusMsg', 'LFX Color Changed (' + colGradStr + ')');
            z1BoxSendViz('grad', colGradStr);
            rebuildCMs();
        }
        ;
    });
}
;
//--------------------------------------------
function selectLedFXGradient(gradArrIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('selectLedFXGradient', '(' + String(gradArrIndex) + ')...');
        const newGradData = { n: dtlfxDefGradsArr[gradArrIndex].name, g: dtlfxDefGradsArr[gradArrIndex].gradient, i: gradArrIndex };
        const cLCGradRes = yield changeLFXColors(newGradData.g);
        if (cLCGradRes) {
            rM('lfxEffectUpdate', rendEffectInfo);
            rM('showStatusMsg', 'LFX Color Changed (' + newGradData.n + ')');
            rebuildCMs();
        }
        ;
    });
}
//--------------------------------------------
function setNewGradientColor(colHex) {
    return __awaiter(this, void 0, void 0, function* () {
        availCons('setNewGradient', '(' + colHex + ')...');
        if (rendEffectInfo !== null && rendEffectInfo.isSupported && !lowMidHighEffects.includes(rendEffectInfo.id) && typeof colHex === 'string') {
            const cLEColRes = yield changeLFXColors(colHex);
            if (cLEColRes) {
                rM('lfxEffectUpdate', rendEffectInfo);
                let colGradStr = '';
                if (rendEffectInfo.rgb.type === 'color' && typeof rendEffectInfo.rgb.data === 'string') {
                    colGradStr = rendEffectInfo.rgb.data;
                }
                else if (rendEffectInfo.rgb.type === 'colors' && typeof rendEffectInfo.rgb.data === 'object' && Array.isArray(rendEffectInfo.rgb.data)) {
                    colGradStr = String(rendEffectInfo.rgb.data.length) + ' Colors';
                }
                else if (rendEffectInfo.rgb.type === 'gradient' && typeof rendEffectInfo.rgb.data === 'object' && !Array.isArray(rendEffectInfo.rgb.data)) {
                    colGradStr = rendEffectInfo.rgb.data.n;
                }
                ;
                rM('showStatusMsg', 'LFX Color Changed (' + colGradStr + ')');
                rebuildCMs();
            }
        }
    });
}
;
//////////////////////////////////////////////
// ICUE FUNCTIONS
//////////////////////////////////////////////
const SSD2VerStr = (ds) => {
    let newVs = { clientVersion: '', serverVersion: '', serverHostVersion: '' };
    for (const [k, v] of Object.entries(ds)) {
        const ve = v;
        newVs[k] = String(ve.major) + '.' + String(ve.minor) + '.' + String(ve.patch);
    }
    ;
    return newVs;
};
exports.SSD2VerStr = SSD2VerStr;
//--------------------------------------------
function CUESS2Status(sdkStatus, sSEvent) {
    let newStatus = sdkStatus;
    if (sSEvent.hasOwnProperty('error') && !_.isEmpty(sSEvent.error) && Number(sSEvent) !== sdkStatus.error.code) {
        newStatus.error = getCUESess(Number(sSEvent.error));
    }
    ;
    if (sSEvent.hasOwnProperty('data') && !_.isEmpty(sSEvent.data)) {
        if (sSEvent.data.hasOwnProperty('details') && !_.isEmpty(sSEvent.data.details)) {
            const nD = (0, exports.SSD2VerStr)(sSEvent.data.details);
            if (!_.isEqual(nD, sdkStatus.versions)) {
                newStatus.versions = nD;
            }
        }
        ;
        if (sSEvent.data.hasOwnProperty('state') && sSEvent.data.state !== sdkStatus.session.code) {
            newStatus.session = getCUESess(Number(sSEvent.data.state));
        }
        ;
    }
    ;
    return Promise.resolve(newStatus);
}
;
//--------------------------------------------
function getCUEConn() {
    return __awaiter(this, void 0, void 0, function* () {
        const strV = (vO) => { return String(vO.major) + '.' + String(vO.minor) + '.' + String(vO.patch); };
        const discoVs = (sVO, sVHO) => { if (Object.values(sVO).every((sV) => Number(sV) === 0) && Object.values(sVHO).every((sVH) => Number(sVH) === 0)) {
            return true;
        }
        else {
            return false;
        } };
        let resCodes = [-1, -1], vStrs = ['0.0.0', '0.0.0', '0.0.0'];
        try {
            const { error, data } = yield sdk.CorsairGetSessionDetails();
            if (Number(error) === 0 && (discoVs(data.serverVersion, data.serverHostVersion))) {
                resCodes = [1, 0];
            }
            else {
                resCodes = [0, 0];
            }
            ;
            vStrs = [strV(data.clientVersion), strV(data.serverVersion), strV(data.serverHostVersion)];
        }
        catch (e) {
            resCodes = [0, 69];
            console.log(e);
        }
        ;
        cueSDKStatus = { session: (getCUESess(resCodes[0])), error: (getCUEErr(resCodes[1])), versions: { clientVersion: vStrs[0], serverVersion: vStrs[1], serverHostVersion: vStrs[2] } };
        return Promise.resolve(cueSDKStatus);
    });
}
//--------------------------------------------
function initCUESDK() {
    return __awaiter(this, void 0, void 0, function* () {
        yield getCUEConn();
        if (cueSDKStatus.session.code === 0 && cueSDKStatus.error.code === 69) {
            return Promise.resolve(false);
        }
        ;
        if (cueSDKStatus.session.code === 2) {
            yield doW(3);
        }
        ;
        if ((cueSDKStatus.error.code === 0 || cueSDKStatus.error.code === 1) && cueSDKStatus.session.code !== 6) {
            sdk.CorsairConnect((sS) => __awaiter(this, void 0, void 0, function* () {
                cueSDKStatus = yield CUESS2Status(cueSDKStatus, sS);
                rM('showStatusMsg', 'ICUE SDK: ' + (cueSDKStatus.error.code !== 0 ? cueSDKStatus.error.msg : cueSDKStatus.session.msg));
                if (cueSDKStatus.error.code === 0 && cueSDKStatus.session.code === 6) {
                    cueDevsData = yield getCUEDevs();
                }
            }));
        }
        return Promise.resolve(true);
    });
}
;
//--------------------------------------------
electron_1.ipcMain.handle('dType2Str', (e, args) => { return sdk.CorsairDeviceTypeToString(args[0]); });
//--------------------------------------------
function getCUEDevs() {
    return __awaiter(this, void 0, void 0, function* () {
        let newCDevs = { count: 0, devices: [] };
        const cGDRes = sdk.CorsairGetDevices({ deviceTypeMask: sdk.CorsairDeviceType.CDT_All });
        if (Number(cGDRes.error) !== 0) {
            cueSDKStatus.error = getCUEErr(Number(cGDRes.error));
            return Promise.resolve(false);
        }
        ;
        if (cGDRes.data.length < 1) {
            return Promise.resolve(false);
        }
        ;
        const devices = cGDRes.data;
        for (let rdI = 0; rdI < devices.length; rdI++) {
            newCDevs.count++;
            let thisDev = { info: devices[rdI], pos: [], colors: [] };
            const { data: ledPositions } = sdk.CorsairGetLedPositions(devices[rdI].id);
            thisDev.pos = ledPositions;
            let rdLEDBC = ledPositions.map((p) => ({ id: p.id, r: 0, g: 0, b: 0, a: 0 }));
            sdk.CorsairGetLedColors(devices[rdI].id, rdLEDBC);
            sdk.CorsairRequestControl(devices[rdI].id, sdk.CorsairAccessLevel.CAL_ExclusiveLightingControlAndKeyEventsListening);
            thisDev.colors = rdLEDBC;
            newCDevs.devices.push(thisDev);
        }
        ;
        cueDevsData = newCDevs;
        //----------
        let newSetDefDevList = [];
        for (let cdi = 0; cdi < cueDevsData.devices.length; cdi++) {
            const cD = cueDevsData.devices[cdi];
            newSetDefDevList.push({ id: cD.info.id, colors: cD.colors });
        }
        ;
        cueSetDevsLEDList = newSetDefDevList;
        //----------
        return Promise.resolve(newCDevs);
    });
}
;
//--------------------------------------------
function convertPayload4ICUE(p) {
    if (p) {
        const getRGBChunks = (a) => {
            let rgbChunks = [];
            for (let ai = 0; ai < a.length; ai += 3) {
                const rgbArr = a.slice(ai, ai + 3);
                if (rgbArr.length === 3) {
                    rgbChunks.push({ r: Math.round(255 * (rgbArr[0] / 100)), g: Math.round(255 * (rgbArr[1] / 100)), b: Math.round(255 * (rgbArr[2] / 100)) });
                }
                else {
                    rgbChunks.push({ r: rgbChunks[0].r, g: rgbChunks[0].g, b: rgbChunks[0].b });
                }
                ;
            }
            ;
            return rgbChunks;
        };
        //----------
        let newPLArr = new Array(36).fill(0);
        for (const [k, v] of Object.entries(p)) {
            newPLArr[(Number(k) - 1)] = Math.floor(v);
        }
        ;
        sacnRGBArr = getRGBChunks(newPLArr);
        animICUEDevs(sacnRGBArr);
    }
    ;
}
;
//--------------------------------------------
function animICUEDevs(setRGBArr) {
    for (let sdi = 0; sdi < cueSetDevsLEDList.length; sdi++) {
        cueSetDevsLEDList[sdi].colors = cueSetDevsLEDList[sdi].colors.map((ledCO, index) => {
            const rgbIndex = index % setRGBArr.length;
            return { id: ledCO.id, r: setRGBArr[rgbIndex].r, g: setRGBArr[rgbIndex].g, b: setRGBArr[rgbIndex].b, a: 255 };
        });
        availCons('animICUE|' + cueSetDevsLEDList[sdi].id, cueSetDevsLEDList[sdi].colors);
        sdk.CorsairSetLedColors(cueSetDevsLEDList[sdi].id, cueSetDevsLEDList[sdi].colors);
    }
    ;
}
;
//////////////////////////////////////////////
//////////////////////////////////////////////
//////////////////////////////////////////////
//# sourceMappingURL=main.js.map