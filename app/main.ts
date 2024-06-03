//////////////////////////////////////////////////
// MODULES - IMPORTS/REQUIRES
//////////////////////////////////////////////////
import{app,BrowserWindow,screen,Size,BrowserWindowConstructorOptions,Menu,ipcMain,Tray,dialog,globalShortcut,MessageBoxOptions,nativeImage,NativeImage,Notification,MenuItem,desktopCapturer,shell,session,ContextMenuParams, Rectangle, Event, Details, WillResizeDetails, OpenDialogOptions} from'electron';
import * as contextMenu from 'electron-context-menu';
import{access,stat,readFile,writeFile,mkdir,unlink,readdir} from'fs/promises';
import{exec,execFile,spawn,ChildProcess} from'child_process';
const dtlfxCP=require('child_process').spawn;
import{format,fromUnixTime,getTime,getUnixTime,isValid,parse,subDays} from'date-fns';
import {createHttpTerminator} from 'http-terminator';
import axios,{AxiosRequestConfig,AxiosResponse} from 'axios';
import * as sdk from 'cue-sdk';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as http from 'http';
import * as sacn from 'sacn';
import { Server } from 'http';
//////////////////////////////////////////////////
// GLOBAL TYPES/DEFAULTS
//////////////////////////////////////////////////
type DTLFXData={
  paths:{
    dtlfxPaths:{baseDir:string,dataDir:string,dataFile:string},
    userPaths:{home:string,appData:string,documents:string,pictures:string},
    ledfxPaths:{exe:string,config:string},
    mediaPaths:{images:string,plates:string}
  },
  settings:{
    autostart:boolean,
    speed:number,
    showstatsbar:boolean,
    icuesync:boolean,
    z1bmode:boolean
  },
  lastUpdated:number
}
const genDefDataObj=():DTLFXData=>{
  const uDocsDirPath:string=path.normalize(path.join(app.getPath('home'),'Documents'));
  const uPicsDirPath:string=path.normalize(path.join(app.getPath('home'),'Pictures'));
  let baseData:DTLFXData={
    paths:{
      dtlfxPaths:{
        baseDir:path.normalize(path.join(uDocsDirPath,'dtlfx')),
        dataDir:path.normalize(path.join(uDocsDirPath,'dtlfx/dtlfxData')),
        dataFile:path.normalize(path.join(uDocsDirPath,'dtlfx/dtlfxData/dtlfxData.json'))
      },
      userPaths:{
        home:path.normalize(app.getPath('home')),
        appData:path.normalize(app.getPath('appData')),
        documents:uDocsDirPath,
        pictures:uPicsDirPath
      },
      ledfxPaths:{
        exe:path.normalize('C:\\Program Files (x86)\\LedFx\\data\\LedFx.exe'),
        config:path.normalize(path.join(app.getPath('appData'),'.ledfx/config.json'))
      },
      mediaPaths:{
        images:path.normalize(path.join(uPicsDirPath,'/dtlfxImages')),
        plates:path.normalize(path.join(uPicsDirPath,'/dtlfxImages/dtlfxPlates'))
      }
    },
    settings:{
      autostart:false,
      showstatsbar:false,
      speed:50,
      icuesync:true,
      z1bmode:true
    },
    lastUpdated:(getUnixTime(new Date()))
  };
  return baseData;
};
//---------------------------------------------
let z1bModeCFGName:'bu'|'all'|'dt&strips'|'dt&z1b'|'stripsonly'|'z1bonly'|null='z1bonly';
const selectLFXConfigsDirPath:string=path.normalize('C:\\Users\\owenl\\Desktop\\DopeUtils\\dtlfxConfigs');
const selectLFXConfig=async(configName:'bu'|'all'|'dt&strips'|'dt&z1b'|'stripsonly'|'z1bonly'):Promise<string|false>=>{
  const cfgDir:string=path.normalize('C:\\Users\\owenl\\Desktop\\DopeUtils\\dtlfxConfigs');
  const cfgFile:string=configName+'.json';
  const cfgPath:string=path.normalize(path.join(cfgDir,cfgFile));
  if((await exists(cfgPath))){return Promise.resolve(cfgPath)}
  else{return Promise.resolve(false)};
}
//---------------------------------------------
let doSendVizInf2Box:boolean=false;
//---------------------------------------------
type DTLFXUMLists={[key:string]:{active:boolean,list:string[],block:{i:number,d:string}[]}};
//---------------------------------------------
type CUEStatusObj={code:number,str:string,msg:string};
type CUEVersObj={clientVersion:string,serverVersion:string,serverHostVersion:string};
type CUESDKStatus={session:CUEStatusObj,error:CUEStatusObj,versions:CUEVersObj};
type CUEInfo={type:number,id:string,serial:string,model:string,ledCount:number,channelCount:number};
type CUEPos={id:number,cx:number,cy:number};
type CUEColor={id:number,r:number,g:number,b:number,a:number};
type CUEDeviceRaw={colors:CUEColor[],info:CUEInfo,pos:CUEPos[]};
type CUEDevicesRaw={count:number,devices:CUEDeviceRaw[]};
type CUESetDeviceLED={id:string,colors:CUEColor[]};
//---------------------------------------------
const genDefListsObj=():DTLFXUMLists=>{return {images:{active:false,list:[],block:[]},plates:{active:false,list:[],block:[]}}};
//---------------------------------------------
const dtlfxSupportedFX:string[]=['bands','bands_matrix','bar','blade_power_plus','block_reflections','blocks','crawler','energy','energy2','equalizer','fire','glitch','lava_lamp','magnitude','marching','melt','melt_and_sparkle','multiBar','pitchSpectrum','power','rain','real_strobe','scan','scan_and_flare','scan_multi','scroll','strobe','water','wavelength'];
const dtlfxDefGradsArr:{name:string,gradient:string}[]=[
  {name:'Rainbow',gradient:'linear-gradient(90deg,rgb(255,0,0) 0%,rgb(255,120,0) 14%,rgb(255,200,0) 28%,rgb(0,255,0) 42%,rgb(0,199,140) 56%,rgb(0,0,255) 70%,rgb(128,0,128) 84%,rgb(255,0,178) 98%)'},
  {name:'DFloor',gradient:'linear-gradient(90deg,rgb(255,0,0) 0%,rgb(255,0,178) 50%,rgb(0,0,255) 100%)'},
  {name:'Plasma',gradient:'linear-gradient(90deg,rgb(0,0,255) 0%,rgb(128,0,128) 25%,rgb(255,0,0) 50%,rgb(255,40,0) 75%,rgb(255,200,0) 100%)'},
  {name:'Ocean',gradient:'linear-gradient(90deg,rgb(0,255,255) 0%,rgb(0,0,255) 100%)'},
  {name:'Viridis',gradient:'linear-gradient(90deg,rgb(128,0,128) 0%,rgb(0,0,255) 25%,rgb(0,128,128) 50%,rgb(0,255,0) 75%,rgb(255,200,0) 100%)'},
  {name:'Jungle',gradient:'linear-gradient(90deg,rgb(0,255,0) 0%,rgb(34,139,34) 50%,rgb(255,120,0) 100%)'},
  {name:'Spring',gradient:'linear-gradient(90deg,rgb(255,0,178) 0%,rgb(255,40,0) 50%,rgb(255,200,0) 100%)'},
  {name:'Winter',gradient:'linear-gradient(90deg,rgb(0,199,140) 0%,rgb(0,255,50) 100%)'},
  {name:'Frost',gradient:'linear-gradient(90deg,rgb(0,0,255) 0%,rgb(0,255,255) 33%,rgb(128,0,128) 66%,rgb(255,0,178) 99%)'},
  {name:'Sunset',gradient:'linear-gradient(90deg,rgb(0,0,128) 0%,rgb(255,120,0) 50%,rgb(255,0,0) 100%)'},
  {name:'Borealis',gradient:'linear-gradient(90deg,rgb(255,40,0) 0%,rgb(128,0,128) 33%,rgb(0,199,140) 66%,rgb(0,255,0) 99%)'},
  {name:'Rust',gradient:'linear-gradient(90deg,rgb(255,40,0) 0%,rgb(255,0,0) 100%)'},
  {name:'Winamp',gradient:'linear-gradient(90deg,rgb(0,255,0) 0%,rgb(255,200,0) 25%,rgb(255,120,0) 50%,rgb(255,40,0) 75%,rgb(255,0,0) 100%)'}
];
const lowMidHighEffects:string[]=['energy','rain','scroll'];
//---------------------------------------------
function getCUEErr(e:number):CUEStatusObj{
  const eCodes:any={
    69:{code:69,str:'NIL_Response',msg:'ERROR: SDK is Dead'},
    0:{code:0,str:'CE_Success',msg:'No Errors'},
    1:{code:1,str:'CE_NotConnected',msg:'ERROR: Not Connected'},
    2:{code:2,str:'CE_NoControl',msg:'ERROR: No Control'},
    3:{code:3,str:'CE_IncompatibleProtocol',msg:'ERROR: Bad Protocol'},
    4:{code:4,str:'CE_InvalidArguments',msg:'ERROR: Bad Args/Params'},
    5:{code:5,str:'CE_InvalidOperation',msg:'ERROR: Bad Operation'},
    6:{code:6,str:'CE_DeviceNotFound',msg:'ERROR: Device Not Found'},
    7:{code:7,str:'CE_NotAllowed',msg:'ERROR: Not Allowed'}
  };
  if(eCodes.hasOwnProperty(e)){return eCodes[e]}else{return eCodes[69]};
};
//--------------------------------------------
function getCUESess(c:number):CUEStatusObj{
  const sSCodes:any={
    0:{code:0,str:'CSS_Invalid',msg:'No Status'},
    1:{code:1,str:'CSS_Closed',msg:'Disconnected'},
    2:{code:2,str:'CSS_Connecting',msg:'Connecting'},
    3:{code:3,str:'CSS_Timeout',msg:'Timeout'},
    4:{code:4,str:'CSS_ConnectionRefused',msg:'Refused'},
    5:{code:5,str:'CSS_ConnectionLost',msg:'Lost'},
    6:{code:6,str:'CSS_Connected',msg:'Connected'}
  };
  if(sSCodes.hasOwnProperty(c)){return sSCodes[c]}else{return sSCodes[0]};
};
//////////////////////////////////////////////////
// GLOBAL VARIABLES
//////////////////////////////////////////////////
let hostLANIP:string='192.168.0.3';
const hlIP=():string=>{return hostLANIP};
let dtlfxMode:'prod'|'dev'='prod';
let dtlfxWindow:BrowserWindow|null=null;
let dtlfxWindowState:any={
  monSize:<Rectangle>{x:0,y:0,width:0,height:0},
  useSize:<Size>{height:0,width:0},
  defSize:<Rectangle>{x:0,y:0,width:0,height:0},
  sizePos:<Rectangle>{x:0,y:0,width:0,height:0},
  viz:<'showing'|'hidden'>'showing',
  fullscreen:false,
  unresponsive:false
};
let dtlfxHomeActive:boolean=false;
let dtlfxDevTools:BrowserWindow|null=null;
let dtlfxCM:Menu|null=null;
let dtlfxDisposeAppCM:any=null;
let dtlfxTray:Tray|null=null;
let dtlfxCMBuildInProg:boolean=false;
let dtlfxData:DTLFXData|null=null;
let dtlfxSCsActive:boolean=false;
let dtlfxSCInProg:boolean=false;
let termDTLFXInProg:boolean=false;
let dtlfxKillNoPrompt:boolean=false;
//------------------------------------------------
let dtlfxWebSVR:Server|null=null;
let dtlfxWebSVRTerminate:any;
//------------------------------------------------
let mbLimits:{[key:string]:number}={images:200,plates:200};
let dmxRecOpts:sacn.ReceiverProps={universes:[1],port:5568,iface:'192.168.0.3',reuseAddr:true};
let dmxRecInst:sacn.Receiver|null=null;
let dmxLastPacketTime:number=0;
let dmxMainFilterFPS:number=30;
let dmxMainFPSLimit:number=100;
let dmxRecIsInit:boolean=false;
let dtlfxPlayState:'stopped'|'started'='stopped';
let dtlfxLayerStates:{[key:string]:boolean}={subbeat:true,bands:true,blocks:true,images:true,plates:true};
//------------------------------------------------
let ledFXCoreIsRunning:boolean=false;
let gettingLFXCoreData:boolean=false;
let ledFXCoreData:any={info:{host:(hlIP()),port:6699,version:'NK'},devices:{},virtuals:{},effects:{}};
let ledFXDeviceId:string|null=null;
let currentLFXEConfigs:{dId:string,effectConfig:any}[]=[];
let rendEffectInfo:{isSupported:boolean,dtlfxIndex:number,id:string,name:string,rgb:{type:'color'|'colors'|'gradient',data:string|string[]|{n:string,g:string,i:number}}}|null=null;
//------------------------------------------------
let cueSDKStatus:CUESDKStatus|null=null;
let cueDevsData:CUEDevicesRaw|false=false;
let sacnRGBArr:{r:number,g:number,b:number}[]=[];
let sacnAMPV:number=0;
let cueSetDevsLEDList:CUESetDeviceLED[]=[];
//------------------------------------------------
let wcIsRunning:boolean=false;
//------------------------------------------------
let uMediaLists:DTLFXUMLists=genDefListsObj();
//////////////////////////////////////////////////
// UTILITY FUNCTIONS
//////////////////////////////////////////////////
const availCons=async(fnName:string,msg:any)=>{if(termDTLFXInProg){return};try{if(dtlfxWindow&&dtlfxWindow.webContents){dtlfxWindow.webContents.send('sendAvailCons',[fnName,msg])}else{let tStr:string=format(new Date(),'HH:mm:ss.SS'),m:string=tStr+' - [MAIN|'+fnName+'] (Log): ';if(typeof msg==='string'){console.log(m+msg)}else{console.log(m);console.dir(msg,{depth:null})}}}catch(e){e=e;return}};
//-------------------------------------------------
const fxType2Name=(fxT:string):string=>{return fxT.split('_').map((w:string)=>(w.toLowerCase()==='and'?'&':capd(w))).join('')};
//-------------------------------------------------
const exists=async(path:string):Promise<boolean>=>{try{await access(path);return true}catch{return false}};
//-------------------------------------------------
const doW=async(s:number):Promise<boolean>=>{return new Promise(async(resolve)=>{setTimeout(async()=>{resolve(true)},(s*1000))})};
//-------------------------------------------------
const capd=(s:string):string=>{return s.charAt(0).toUpperCase()+s.slice(1)};
//-------------------------------------------------
const statSize=async(path:string):Promise<{r:boolean,d:number}>=>{try{const sRes:any=await stat(path);if(sRes&&sRes.size>0){return Promise.resolve({r:true,d:sRes.size})}else{return Promise.resolve({r:false,d:0})}}catch(e){return Promise.resolve({r:false,d:0})}};
//-------------------------------------------------
const icoP=(p:string):string=>{const iP:string=path.join(__dirname,'../dist/'+p);return iP};
//-------------------------------------------------
const natIco=(pngFileName:string)=>{return (nativeImage.createFromPath((icoP('assets/'+pngFileName))))};
//-------------------------------------------------
const isJSON=(data:any):Promise<boolean>=>{if(typeof data!=='string'){return Promise.resolve(false)};try{const result=JSON.parse(data);const type=Object.prototype.toString.call(result);return Promise.resolve(type==='[object Object]'||type==='[object Array]');}catch(err){return Promise.resolve(false)}};
//-------------------------------------------------
const s2T=(secs:number):string=>{let fStr:string='',tH:string|null,tM:string|null,tS:string|null,hours:number=Math.floor(secs/3600),mins:number=0;if(hours>=1){tH=String(hours);secs=secs-(hours*3600)}else{tH=null};mins=Math.floor(secs/60);if(mins>=1){tM=String(mins);secs=secs-(mins*60)}else{tM=null};if(secs<1){tS=null}else{tS=String(secs)};(tH&&tM&&tM.length===1)?tM='0'+tM:void 0;(tS&&tS.length===1)?tS='0'+tS:void 0;if(tH){fStr+=tH;tM=':'+tM};if(tM){fStr+=tM;tS=':'+tS}else{fStr+='00:'};if(tS){fStr+=tS};if(fStr.includes(':null')){const rX:RegExp=/:null/gi;fStr=fStr.replace(rX,':00')};if(fStr===''){fStr='-'};if(fStr===':00'){fStr='-'};return fStr};
//------------------------------------------------
function matchGStr(gStr:string):{n:string,g:string,i:number}|false{
  const hex2RGB=(hex:string):string|false=>{const h:string=(hex.startsWith('#')?hex.slice(1):hex);if(h.length!==6){return false};const r:number=parseInt(h.slice(0,2),16),g:number=parseInt(h.slice(2,4),16),b:number=parseInt(h.slice(4,6),16);return `rgb(${r},${g},${b})`};
  if(gStr.includes('#')){
    const hexStrArr:{c:string,p:string}[]=gStr.replace('linear-gradient(90deg, ','').replace(')','').split(',')
    .map((ca:string)=>{return {c:ca.split(' ')[0],p:ca.split(' ')[1].replace('.00%','%')}});
    let rgbStr:string='linear-gradient(90deg,';
    for(let hi=0;hi<hexStrArr.length;hi++){const rgbConv:string|false=hex2RGB(hexStrArr[hi].c);if(!rgbConv){return false}else{rgbStr+=rgbConv+' '+hexStrArr[hi].p;if(hi!==hexStrArr.length-1){rgbStr+=','}else{rgbStr+=')'}}};
    const mI:number=dtlfxDefGradsArr.findIndex((o:{name:string,gradient:string})=>o.gradient===rgbStr);
    if(mI!==-1){const gO:{name:string,gradient:string}=dtlfxDefGradsArr[mI];return {n:gO.name,g:gO.gradient,i:mI}}else{return false};
  }else{
    let mS:string=gStr.replace(/, /g,',');
    const mI:number=dtlfxDefGradsArr.findIndex((o:{name:string,gradient:string})=>o.gradient===mS);
    if(mI!==-1){const gO:{name:string,gradient:string}=dtlfxDefGradsArr[mI];return {n:gO.name,g:gO.gradient,i:mI}}else{return false};
  }
};
//------------------------------------------------
async function updateDTLFXDataPtys():Promise<boolean>{
  const mergeObjs=async(d:DTLFXData,s:DTLFXData)=>{
    for(const key in s){
      if(s.hasOwnProperty(key)){
        if(typeof s[key]==='object'&&s[key]!==null&&!Array.isArray(s[key])){
          if(!d.hasOwnProperty(key)||typeof d[key]!=='object'||d[key]===null||Array.isArray(d[key])){d[key]={}};
          mergeObjs(d[key],s[key])
        }else{if(!d.hasOwnProperty(key)){d[key]=s[key]}}
      }
    };
    for(const key in d){if(!s.hasOwnProperty(key)){delete d[key]}}
  };
  const freshDDObj:DTLFXData=genDefDataObj();
  await mergeObjs(dtlfxData,freshDDObj);
  return Promise.resolve(true);
};
//------------------------------------------------
const readDataFile=async():Promise<DTLFXData|false>=>{
  try{
    const rR:string=await fs.promises.readFile((path.normalize(path.join((app.getPath('documents')),'dtlfx/dtlfxData/dtlfxData.json'))),{encoding:'utf-8'});
    if(rR&&(await isJSON(rR))){
      const newDDObj:DTLFXData=JSON.parse(rR);
      dtlfxData=newDDObj;
      availCons('readDataFile','Data File [READ] - OK');
      return Promise.resolve(dtlfxData)
    }else{return Promise.resolve(false)};
  }catch(e){console.log(e);return Promise.resolve(false)}};
//-------------------------------------------------
const writeDataFile=async(data:DTLFXData|null):Promise<boolean>=>{
  if(data===null){return Promise.resolve(false)};
  let updData:DTLFXData=data;
  updData.lastUpdated=getUnixTime(new Date());
  const updDataStr:string=JSON.stringify(data);
  try{
    await fs.promises.writeFile((path.normalize(path.join((app.getPath('documents')),'dtlfx/dtlfxData/dtlfxData.json'))),updDataStr,{encoding:'utf-8'});
    availCons('writeDataFile','Data File [WRITE] - OK');
    await readDataFile();
    return Promise.resolve(true)
  }catch(e){console.log(e);return Promise.resolve(false)}
};
//------------------------------------------------
const createDir=async(p:string,r:boolean):Promise<boolean>=>{try{await fs.promises.mkdir(p,{recursive:r});return Promise.resolve(true)}catch(e){availCons('createDir','ERROR: '+e);return Promise.resolve(false)}}
//------------------------------------------------
const rM=(topic:string,data:any)=>{try{if(dtlfxHomeActive&&dtlfxWindow&&dtlfxWindow.webContents){dtlfxWindow.webContents.send(topic,[data])}}catch(e){e=e}};
//-------------------------------------------------
const popMediaList=async(type:string):Promise<boolean>=>{
  try{
    if(!(await exists(dtlfxData.paths.mediaPaths[type]))){
      availCons('popMediaList|'+type.toUpperCase(),'ERROR: Media Dir Path for ['+type.toUpperCase()+'] !exists');
      uMediaLists[type].list=[];uMediaLists[type].block=[];uMediaLists[type].active=false;
      if(dtlfxHomeActive){dtlfxWindow.webContents.send('uMediaListData',[uMediaLists])};
      return Promise.resolve(uMediaLists[type].active);
    }else{
      uMediaLists[type].list=await fs.promises.readdir(dtlfxData.paths.mediaPaths[type],{encoding:'utf-8'});
      if(uMediaLists[type].list.length<1){
        availCons('popMediaList|'+type.toUpperCase(),'NIL: '+capd(type)+' Media List EMPTY');
        uMediaLists[type].list=[];uMediaLists[type].block=[];uMediaLists[type].active=false;
      }else{
        availCons('popMediaList|'+type.toUpperCase(),'OK: '+capd(type)+' Media List Populated ('+String(uMediaLists[type].list.length)+')');
        uMediaLists[type].block=[];uMediaLists[type].active=true;
      };
      if(dtlfxHomeActive){dtlfxWindow.webContents.send('uMediaListData',[uMediaLists])};
      return Promise.resolve(uMediaLists[type].active);
    }
  }catch(e){
    availCons('popMediaList|'+type,e);uMediaLists[type].list=[];uMediaLists[type].active=false
    if(dtlfxHomeActive){dtlfxWindow.webContents.send('uMediaListData',[uMediaLists])};
    return Promise.resolve(uMediaLists[type].active);
  };
};
//-------------------------------------------------
const findLFXExe=async():Promise<string[]|false>=>{
  return new Promise(async(resolve)=>{
    exec('powershell.exe -Command "powershell.exe -Command Get-ChildItem -ErrorAction Ignore -Attributes !System -Path '+dtlfxData.paths.userPaths.home+',C:\\Program*\\ -Recurse ledfx.exe | Where{-NOT ($_.BaseName -cmatch "[a-z]")}"',async(error:any,stdout:any,stderr:any)=>{
      if(error||stderr||!stdout){resolve(false)}
      else{
        let exeFPs:string[]=[],exeDir:string|null=null,fnRX:RegExp=new RegExp('ledfx.exe','i'),rxOK=(s:string):boolean=>{return (fnRX.test(s))},rLs:any[]=stdout.split('\n');
        for(let li=0;li<rLs.length;li++){
          if(rLs[li].trim().replace(/\s+/gi,'').length>0){if(rLs[li].trim().startsWith('Directory:')){const dirStr:string=rLs[li].trim().split(' : ')[1].trim();if(dirStr&&dirStr.length>0&&((await exists(path.normalize(dirStr))))){exeDir=path.normalize(dirStr)}}
          else if((rxOK(rLs[li].trim()))&&exeDir!==null){const fnStr:string=rLs[li].trim().split('.exe')[0].split(' ')[rLs[li].trim().split('.exe')[0].split(' ').length-1]+'.exe';if(fnStr&&fnStr.length>0&&((await exists(path.normalize(path.join(exeDir,fnStr)))))){exeFPs.push(path.normalize(path.join(exeDir,fnStr)));exeDir=null}}}
        };
        if(exeFPs.length>0){resolve(exeFPs)}else{resolve(false)};
      }
    });
  });
};
//-------------------------------------------------
const findLFXConfig=async():Promise<string[]|false>=>{
  return new Promise(async(resolve)=>{
    exec('powershell.exe Get-ChildItem -ErrorAction Ignore -Attributes !System,Directory -Path '+dtlfxData.paths.userPaths.appData+' -Recurse ".ledfx"',async(error:any,stdout:any,stderr:any)=>{
      if(error||stderr||!stdout){resolve(false)}
      else{
        let configFPs:string[]=[],prevDir:string|null=null,rLs:any[]=stdout.split('\n');
        for(let li=0;li<rLs.length;li++){
          if(rLs[li].trim().replace(/\s+/gi,'').length>0){if(rLs[li].trim().startsWith('Directory:')){const dirStr:string=rLs[li].trim().split(' : ')[1].trim();if(dirStr&&dirStr.length>0&&((await exists(path.normalize(dirStr))))){prevDir=path.normalize(dirStr)}}
          else if(rLs[li].trim().endsWith(' .ledfx')&&prevDir!==null){const tryFPStr:string=path.normalize(path.join(prevDir,'.ledfx/config.json'));if((await exists(tryFPStr))){configFPs.push(tryFPStr);prevDir=null}}};
        };
        if(configFPs.length>0){resolve(configFPs)}else{resolve(false)};
      };
    });
  });
};
//-------------------------------------------------
async function setHostLANIP():Promise<boolean>{
  return new Promise(async(resolve)=>{
    exec('ipconfig | findstr IPv4',(err,stdout)=>{
      if(err){availCons('getHostLANIP',`ERROR: ${err.message}`);resolve(false)};
      const ip:string=stdout.split(':').pop()?.trim();
      if(ip){
        if(hostLANIP!==ip){hostLANIP=ip};
        availCons('getHostLANIP',`Host LAN IP: ${ip}`);
        resolve(true)
      }else{
        availCons('getHostLANIP','ERROR: Unknown IP/Format');
        resolve(false)
      }
    })
  })
};
//////////////////////////////////////////////////
// IPCMAIN LISTENERS/HANDLERS
//////////////////////////////////////////////////
ipcMain.on('openExtWebURL',(e:any,args:any[])=>{shell.openExternal(args[0])});
//////////////////////////////////////////////////
// ELECTRON MAIN FUNCTION
//////////////////////////////////////////////////
try{
  availCons('ElectronMainFn','()...');
  app.disableHardwareAcceleration();
  app.once('ready',async()=>{initDTLFX();scs(true)});
  app.on('browser-window-focus',()=>{availCons('App|EVENT','browser-window-focus');scs(true)});
  app.on('browser-window-blur',()=>{availCons('App|EVENT','browser-window-blur');scs(false)});
  app.on('web-contents-created',()=>{availCons('App|EVENT','web-contents-created')});
  app.on('window-all-closed',()=>{availCons('App|EVENT','window-all-closed');app.quit()});
  app.on('before-quit',async(e)=>{try{termDTLFXInProg=true;e.preventDefault();if(dtlfxKillNoPrompt){app.exit()}else{if((await closeConf())){app.exit()}}}catch(e){e=e}});
  app.on('quit',()=>{return});
  app.on('will-quit',()=>{app.exit()});
}catch(e){availCons('ElectronMainFn','ERROR: '+e)};
//------------------------------------------------
async function initDTLFX(){
  availCons('InitDTLFX','()...');
  await checkAppFS();
  if(!dtlfxWindow){
    ipcMain.on('homeInitsDone',async()=>{
      await setHostLANIP();
      await checkWCRunning();
      await rebuildCMs();
      delayedInits();
    });
    initDTLFXWindow();
  };
}
//////////////////////////////////////////////////
async function delayedInits(){
  availCons('delayedInits','()...');
  await doW(3);
  await dtlfxInitWebSVR();
  await startRestartAll();
  if(dtlfxData.settings.icuesync){await initCUESDK()};
  await rebuildCMs();
};
//////////////////////////////////////////////////
// MAIN CLOSE/EXIT FUNCTIONS
//////////////////////////////////////////////////
async function closeConf():Promise<boolean>{
  availCons('closeConf','()...');
  await writeDataFile(dtlfxData);
  const doQuitConf=async():Promise<boolean>=>{
    const doQuit:number=(await dialog.showMessageBox(BrowserWindow.getFocusedWindow(),{icon:natIco('wcicon.png'),title:'DTLFX',message:'Kill/Exit DTLFX - Are you sure?',type:'question',buttons:['Cancel','Exit'],defaultId:0,cancelId:1})).response;if(doQuit===1){return Promise.resolve(false)}else{return Promise.resolve(true)}
  };
  dtlfxHomeActive=false;
  const quitConfRes:boolean=await doQuitConf();
  dtlfxHomeActive=true;
  if(quitConfRes){return Promise.resolve(false)}
  else{
    if(dtlfxPlayState==='started'){dtlfxPlayControlFn('stop')};
    await killDMXReceiver();
    await ledfx2Kill();
    if(cueSDKStatus&&cueSDKStatus.session&&cueSDKStatus.session.code===6){sdk.CorsairDisconnect()};
    await doKillWebSVR();
    if(wcIsRunning){await reqWifiCUE('get','stopped')};
    return Promise.resolve(true);
  };
}
//////////////////////////////////////////////////
// DTlFX FS FUNCTIONS
//////////////////////////////////////////////////
async function checkAppFS():Promise<boolean>{
  availCons('checkAppFS','()...');
  // DTLFX Paths
  let baseAppPaths:string[]=Object.values((genDefDataObj()).paths.dtlfxPaths);
  for(let bapi=0;bapi<baseAppPaths.length;bapi++){
    if(!(await exists(baseAppPaths[bapi]))){
      if(bapi<2){
        const cdRes:boolean=await createDir(baseAppPaths[bapi],true);
        if(!cdRes){errorDTLFXDialog('appFS','exit',['core',baseAppPaths[bapi]])}
      }else{
        const wdfRes:boolean=await writeDataFile((genDefDataObj()));
        if(!wdfRes){errorDTLFXDialog('appFS','exit')}
      }
    }else{await readDataFile()}
  };
  // Add New Ptys
  await updateDTLFXDataPtys();
  // Media Paths
  for(let [k,v] of Object.entries(dtlfxData.paths.mediaPaths)){
    if(!(await exists(v))){
      const cdRes:boolean=await createDir(v,true);
      if(!cdRes){
        const sddRes:string|false=await openFileDTLFXDialog('folder',k,'DTLFX '+capd(k)+' Folder',dtlfxData.paths.dtlfxPaths.baseDir);
        if(!sddRes){errorDTLFXDialog('appFS','exit',['media',capd(k)])}
        else{dtlfxData.paths.mediaPaths[k]=path.normalize(sddRes)}
      }
    };
    await popMediaList(k);
  };
  // LedFX Paths
  if(!dtlfxData.paths.ledfxPaths.exe||!(await exists(dtlfxData.paths.ledfxPaths.exe))){
    const findExeRes:string[]|false=await findLFXExe();
    if(!findExeRes){
      const sfdRes:string|false=await openFileDTLFXDialog('file','ledfxExe','LedFx Core Executable',dtlfxData.paths.userPaths.home);
      if(!sfdRes){errorDTLFXDialog('ledfxExe','exit')}
      else{dtlfxData.paths.ledfxPaths.exe=sfdRes}
    }else{
      if(findExeRes.length===1){dtlfxData.paths.ledfxPaths.exe=findExeRes[0]}
      else{
        const cODRes:string|false=await confirmOptsDTLFXDialog('ledfxFiles','LedFx Core Executable',findExeRes);
        if(!cODRes){dtlfxData.paths.ledfxPaths.config=findExeRes[0]}
        else{dtlfxData.paths.ledfxPaths.exe=cODRes}
      }
    }
  };
  if(!dtlfxData.paths.ledfxPaths.config||!(await exists(dtlfxData.paths.ledfxPaths.config))){
    const findConfigRes:string[]|false=await findLFXConfig();
    if(!findConfigRes){
      const sfdRes:string|false=await openFileDTLFXDialog('file','ledfxConfig','LedFx Config File',dtlfxData.paths.userPaths.home);
      if(sfdRes){dtlfxData.paths.ledfxPaths.config=sfdRes}
    }else{
      if(findConfigRes.length===1){dtlfxData.paths.ledfxPaths.config=findConfigRes[0]}
      else{
        const cODRes:string|false=await confirmOptsDTLFXDialog('ledfxFiles','LedFx Config File',findConfigRes);
        if(cODRes){dtlfxData.paths.ledfxPaths.config=cODRes}
      }
    }
  };
  // Save & Load
  await writeDataFile(dtlfxData);
  return Promise.resolve(true);
}
//////////////////////////////////////////////////
// DTLFX DIALOG FUNCTIONS
//////////////////////////////////////////////////
async function confirmOptsDTLFXDialog(type:string,title:string,options:any[]):Promise<string|false>{
  availCons('confirmOptsDTLFXDialog','('+type+','+title+',options[])...');
  let codMsgs:string='',codBtns:string[]=[];if(type==='ledfxFiles'){codMsgs='Multiple LedFx '+(title.includes('Core')?'Executables':'Configs')+' Found!\nSELECT preferred '+title+':\n'};
  for(let oi=0;oi<options.length;oi++){codMsgs+='('+String(oi+1)+') - '+options[oi]+(oi!==(options.length-1)?'\n':'');codBtns.push('Option '+String(oi+1))};codBtns.push('Cancel');
  let codOpts:MessageBoxOptions={title:'DTLFX Select Option',message:codMsgs,type:'question',buttons:codBtns,defaultId:0,cancelId:(codBtns.length-1)}
  const{response}=await dialog.showMessageBox(BrowserWindow.getFocusedWindow(),codOpts);
  if(response===(codBtns.length-1)){return Promise.resolve(false)}else{return Promise.resolve(options[response])};
}
//------------------------------------------------
async function errorDTLFXDialog(type:string,then:string,data?:any):Promise<boolean>{
  availCons('errorDTLFXDialog','('+type+','+then+','+data+')...');
  const errTMs:{[key:string]:any}={
    appData:{t:'DTLFX Error - Config',m:'Failed to READ Core DTLFX Data file:\n'+dtlfxData.paths.dtlfxPaths.dataFile},
    appFS:{t:'DTLFX Error - '+capd(data[0])+' Folder',m:'Failed to CREATE'+(data[0]==='media'?' or SELECT '+capd(data[1]):'')+' '+capd(data[0])+' folder'+(data[0]==='core'?':\n'+data[1]:'')},
    ledfxExe:{t:'DTLFX Error - LedFx.exe',m:'Failed to FIND or SELECT LedFx Core Executable'},
    gen:{t:'DTLFX Error - '+data[0],m:data[1]}
  };
  const doErrMB=async(t:string,m:string):Promise<void>=>{return new Promise(async(resolve)=>{await dialog.showMessageBox(BrowserWindow.getFocusedWindow(),{title:t,message:m,type:'error',buttons:[(then==='exit'?'Exit':'OK')],defaultId:0});resolve()})};
  await doErrMB(errTMs[type].t,errTMs[type].m);
  if(then==='exit'){dtlfxKillNoPrompt=true;app.quit()}else{return Promise.resolve(true)};
}
//------------------------------------------------
async function openFileDTLFXDialog(type:'file'|'folder',key:string,title:string,startDir:string):Promise<string|false>{
  availCons('openFileDTLFXDialog','('+type+','+key+','+title+','+startDir+')...');
  const fFilters:any={ledfxExe:[{name:'LedFxCoreExe',extensions:['exe']}],ledfxConfig:[{name:'LedFxConfig',extensions:['json']}]};
  let sfdOpts:OpenDialogOptions={title:title,defaultPath:(startDir&&(await exists(startDir))?startDir:(app.getPath('home'))),buttonLabel:'Select '+(type==='file'?'File':'Folder'),properties:[(type==='file'?'openFile':'openDirectory'),'showHiddenFiles']};
  if(type==='file'){sfdOpts['filters']=fFilters[key]};
  const{canceled,filePaths}=await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(),sfdOpts);
  if(canceled||filePaths.length===0){return Promise.resolve(false)}else{return Promise.resolve(filePaths[0])}
};
//////////////////////////////////////////////////
// DTLFX WINDOW FUNCTIONS
//////////////////////////////////////////////////
async function initDTLFXWindow():Promise<boolean>{
  availCons('initDTLFXWindow','()...');
  return new Promise(async(resolve)=>{
      if(dtlfxWindow===null){
        try{
          dtlfxWindowState.useSize=(screen.getPrimaryDisplay()).workAreaSize;
          dtlfxWindowState.monSize=(screen.getPrimaryDisplay()).bounds;
          const defW:number=(dtlfxWindowState.useSize.width-600);//2840
          const defX:number=(dtlfxWindowState.useSize.width-defW)/2;//300
          const defH:number=Math.ceil((defW/21)*9);//1217
          const defY:number=Math.ceil((dtlfxWindowState.useSize.height-defH)/2);//92
          dtlfxWindowState.defSize={x:defX,y:defY,width:defW,height:defH};
          let dtLFXWinOpts:BrowserWindowConstructorOptions={x:defX,y:defY,width:defW,maxWidth:dtlfxWindowState.monSize.width,height:defH,maxHeight:dtlfxWindowState.monSize.height,title:'DTLFX',darkTheme:true,frame:false,transparent:true,icon:path.join(__dirname,'../dist/assets/32x32pngico.png'),movable:false,resizable:false,minimizable:false,maximizable:false,fullscreenable:true,fullscreen:false,show:false,webPreferences:{nodeIntegration:true,nodeIntegrationInWorker:true,nodeIntegrationInSubFrames:true,webSecurity:false,allowRunningInsecureContent:true,webgl:true,plugins:true,backgroundThrottling:false,sandbox:false,contextIsolation:false,spellcheck:false,defaultFontFamily:{sansSerif:'Arial'},defaultFontSize:14}};
          dtlfxWindow=new BrowserWindow(dtLFXWinOpts);
          let pathIndex='./index.html';if(fs.existsSync(path.join(__dirname,'../dist/index.html'))){pathIndex='../dist/index.html'};
          const url=new URL(path.join('file:',__dirname,pathIndex));
          dtlfxWindow.webContents.on('did-finish-load',async()=>{
            ipcMain.on('dtlfxDoShowWindow',async(e:any,args:any[])=>{
              try{
                if(dtlfxWindow&&dtlfxWindow.webContents){
                  dtlfxHomeActive=true;
                  dtlfxWindowState.sizePos=dtlfxWindow.getBounds();
                  rM('winStateUpdate',dtlfxWindowState);
                  if(!dtlfxData.settings.z1bmode){
                    dtlfxWindow.show();
                    if(!dtlfxDevTools&&dtlfxMode==='dev'){
                      try{
                        dtlfxDevTools=new BrowserWindow;
                        dtlfxWindow.webContents.setDevToolsWebContents(dtlfxDevTools.webContents);
                        dtlfxWindow.webContents.openDevTools({mode:'detach',activate:false});
                        dtlfxDevTools.on('ready-to-show',()=>{
                          dtlfxDevTools.setPosition(375,115,false);
                          dtlfxDevTools.setSize(1460,900,false);
                          dtlfxDevTools.minimize();
                        });
                        dtlfxWindow.webContents.on('devtools-closed',()=>{app.quit()});
                      }catch(e){e=e}
                    };
                  }else{await doZ1BModeWindowHide()}
                  resolve(true);
                }else{dtlfxHomeActive=false};
              }catch(e){e=e;resolve(false)};
            });
            dtlfxWindow.webContents.send('dtlfxWindowIsReady',true);
          });
          dtlfxWindow.loadURL(url.href);
          dtlfxWindow.on('show',()=>{dtlfxWindowState.viz='showing';rM('winStateUpdate',dtlfxWindowState);rebuildCMs()});
          dtlfxWindow.on('hide',()=>{dtlfxWindowState.viz='hidden';;rM('winStateUpdate',dtlfxWindowState);rebuildCMs()});
          dtlfxWindow.on('enter-full-screen',()=>{
            dtlfxWindowState.fullscreen=true;
            dtlfxWindowState.sizePos=dtlfxWindowState.monSize;
            rM('winStateUpdate',dtlfxWindowState);
            rebuildCMs();
          });
          dtlfxWindow.on('leave-full-screen',()=>{
            dtlfxWindowState.fullscreen=false;
            dtlfxWindowState.sizePos=dtlfxWindowState.defSize;
            rM('winStateUpdate',dtlfxWindowState);
            rebuildCMs();
          });
          dtlfxWindow.on('unresponsive',()=>{dtlfxWindowState.unresponsive=true;rM('winStateUpdate',dtlfxWindowState);rebuildCMs()});
          dtlfxWindow.on('responsive',()=>{dtlfxWindowState.unresponsive=false;rM('winStateUpdate',dtlfxWindowState);rebuildCMs()});
        }catch(e){e=e;availCons('initDTLFXWindow',e);resolve(false)};
      }else{availCons('initDTLFXWindow','SKIPPED - DTLFXWindow Already Created');resolve(false)};
  });
};
//--------------------------------------------------
function doZ1BModeWindowHide():Promise<boolean>{
  if(dtlfxWindow){
    if(dtlfxWindow.isFullScreen){winCtrl('fullscreen',false)};
    winCtrl('hide');
  };
  return Promise.resolve(true);
}
//--------------------------------------------------
function winCtrl(action:string,param?:any){
  availCons('winCtrl','('+action+''+(param!==undefined?','+String(param):'')+')...');
  if(!app||!dtlfxWindow){return}
  else{
    switch(action){
      case 'show':dtlfxWindow.show();break;
      case 'hide':dtlfxWindow.hide();break;
      case 'fullscreen':dtlfxWindow.setFullScreen(param);break;
      case 'exit':app.quit();break;
      default:break;
    };
  }
};
//--------------------------------------------------
async function loadIcon(nameDotPng:string):Promise<NativeImage|null> {
  let iconObject:NativeImage|null=null;
  let iconPath:string='';if(dtlfxMode==='prod'){iconPath=path.join(__dirname,'assets/'+nameDotPng)}
  else{iconPath=path.join(__dirname,'../dist/assets/'+nameDotPng)};
  if((await exists(iconPath))){iconObject=nativeImage.createFromPath(iconPath)}
  else{console.log('No ICO Available');availCons('loadIcon','No ICO Available')};
  return Promise.resolve(iconObject);
}
//------------------------------------------------
async function cmUpdateMediaDir(mkey:string){
  availCons('cmUpdateMediaDir','('+mkey+')...');
  const sfdIRes:string|false=await openFileDTLFXDialog('folder',mkey,'DTLFX '+capd(mkey)+' Folder',dtlfxData.paths.mediaPaths[mkey]);
  if(sfdIRes!==false){
    dtlfxData.paths.mediaPaths[mkey]=sfdIRes;
    await writeDataFile(dtlfxData);
    popMediaList(mkey);
  };
}
//------------------------------------------------
function cmUpdateLayerToggles(lkey:string){
  availCons('cmUpdateLayerToggles','('+lkey+')...');
  dtlfxLayerStates[lkey]?dtlfxLayerStates[lkey]=false:dtlfxLayerStates[lkey]=true;
  if(dtlfxHomeActive){dtlfxWindow.webContents.send('toggleDTLFXLayer',[lkey,dtlfxLayerStates[lkey]])};
  rebuildCMs();
}
//------------------------------------------------
function cmDoSoloLayer(lkey:string){
  availCons('cmDoSoloLayer','('+lkey+')...');
  for(const[k,v]of Object.entries(dtlfxLayerStates)){if(k!==lkey){dtlfxLayerStates[k]=false}else{dtlfxLayerStates[k]=true}};
  if(dtlfxHomeActive){dtlfxWindow.webContents.send('soloDTLFXLayer',[lkey,dtlfxLayerStates])};
  rebuildCMs();
}
//------------------------------------------------
async function toggleShowStatsBar(){
  availCons('toggleShowStatsBar','()...');
  if(dtlfxData.settings.showstatsbar){dtlfxData.settings.showstatsbar=false}else{dtlfxData.settings.showstatsbar=true};
  rM('showStatsBarUpdate',dtlfxData.settings.showstatsbar);
  rM('showStatusMsg','Toggled Status Bar: '+(dtlfxData.settings.showstatsbar?'SHOW':'HIDE'));
  await writeDataFile(dtlfxData);
  await rebuildCMs();
}
//------------------------------------------------
async function toggleAutoStartSetting(){
  availCons('toggleAutoStartSetting','()...');
  if(dtlfxData.settings.autostart){dtlfxData.settings.autostart=false}else{dtlfxData.settings.autostart=true};
  rM('showStatusMsg','Toggled Autostart: '+(dtlfxData.settings.autostart?'ON':'OFF'));
  await writeDataFile(dtlfxData);
  await rebuildCMs();
}
//------------------------------------------------
async function toggleICUESync(){
  availCons('toggleICUESync','()...');
  if(dtlfxData.settings.icuesync){dtlfxData.settings.icuesync=false}else{dtlfxData.settings.icuesync=true};
  rM('showStatusMsg','Toggled LedFX > iCUE: '+(dtlfxData.settings.icuesync?'ON':'OFF'));
  if(!dtlfxData.settings.icuesync&&cueSDKStatus&&cueSDKStatus.session&&cueSDKStatus.session.code===6){sdk.CorsairDisconnect()};
  if(dtlfxData.settings.icuesync){await initCUESDK()};
  await writeDataFile(dtlfxData);
  await rebuildCMs();
}
//------------------------------------------------
async function toggleZ1BModeSetting(){
  availCons('toggleZ1BModeSetting','()...');
  if(dtlfxData.settings.z1bmode){dtlfxData.settings.z1bmode=false}else{dtlfxData.settings.z1bmode=true};
  rM('showStatusMsg','Toggled Z1Box Mode: '+(dtlfxData.settings.z1bmode?'ON':'OFF'));
  await writeDataFile(dtlfxData);
  await rebuildCMs();
  if(dtlfxData.settings.z1bmode){await doZ1BModeWindowHide()}
  else{winCtrl('show')};
  await doW(1);
  startRestartAll();
}
//////////////////////////////////////////////////
// DTLFX TRAY/CM FUNCTIONS
//////////////////////////////////////////////////
async function rebuildCMs():Promise<boolean>{
  if(dtlfxCMBuildInProg){availCons('rebuildCMs','SKIPPED - Already In Prog');return Promise.resolve(false)};
  dtlfxCMBuildInProg=true;
  if(dtlfxDisposeAppCM!==null){dtlfxDisposeAppCM();dtlfxDisposeAppCM=null};
  if(dtlfxTray){dtlfxTray.destroy();dtlfxTray=null};
  //------------
  let speedLevelsArr:any[]=[];
  for(let soi=0;soi<11;soi++){
    const setPerc:string=(soi*10).toString()+'%',setNo:number=(soi*10);
    speedLevelsArr.push({label:setPerc,visible:true,enabled:(dtlfxData.settings.speed!==setNo),type:'checkbox',checked:(dtlfxData.settings.speed===setNo),click:()=>{modDTLFXSpeedSetting(setNo)}});
  };
  let layerTogglesArr:any[]=[],layersSumArr:string[]=[],layerIsActive:string[]=[],layerSoloArr:any[]=[],layerSoloNowStr:string='None',soloL:string|null=null;
  for(const[k,v]of Object.entries(dtlfxLayerStates)){
    if(v){layersSumArr.push((capd(k)));layerIsActive.push(k)};
    layerTogglesArr.push({label:(capd(k))+' > ['+(v?'OFF':'ON')+']',visible:true,enabled:(k==='bands'||k==='blocks'||k==='subbeat'?true:uMediaLists[k].active),type:'checkbox',checked:v,click:()=>{cmUpdateLayerToggles(k)}});
  };
  if(layerIsActive.length===1){layerSoloNowStr=capd(layerIsActive[0]);soloL=layerIsActive[0]};
  for(const[k,v]of Object.entries(dtlfxLayerStates)){
    layerSoloArr.push({label:(capd(k)),visible:true,enabled:(k==='bands'||k==='blocks'||k==='subbeat'?soloL===k?false:true:!uMediaLists[k].active?false:soloL!==k?true:false),type:'checkbox',checked:soloL===k,click:()=>{cmDoSoloLayer(k)}});
  };
  let selLFXEffectArr:any[]=[],selLFXGradientArr:any[]=[];
  if(rendEffectInfo!==null){
    for(let efi=0;efi<dtlfxSupportedFX.length;efi++){
      selLFXEffectArr.push({label:(fxType2Name(dtlfxSupportedFX[efi])),visible:true,enabled:(rendEffectInfo.id!==dtlfxSupportedFX[efi]),type:'checkbox',checked:(rendEffectInfo.id===dtlfxSupportedFX[efi]),click:()=>{selectLedFXEffect(dtlfxSupportedFX[efi])}});
    };
    for(let gi=0;gi<dtlfxDefGradsArr.length;gi++){
      selLFXGradientArr.push({label:dtlfxDefGradsArr[gi].name,visible:true,enabled:(typeof rendEffectInfo.rgb.data!=='object'||Array.isArray(rendEffectInfo.rgb.data)||(typeof rendEffectInfo.rgb.data==='object'&&!Array.isArray(rendEffectInfo.rgb.data)&&rendEffectInfo.rgb.data.n!==dtlfxDefGradsArr[gi].name)),type:'checkbox',checked:(typeof rendEffectInfo.rgb.data==='object'&&!Array.isArray(rendEffectInfo.rgb.data)&&rendEffectInfo.rgb.data.n===dtlfxDefGradsArr[gi].name),click:()=>{selectLedFXGradient(gi)}});
    };
  };
  //------------
  let baseAppCMArr:any[]=[
    {icon:(await loadIcon('dtlfx-cm-sacn-ico-'+(dmxRecIsInit?'on':'off')+'.png')),label:'𝘀𝗔𝗖𝗡 𝗥𝗲𝗰𝗲𝗶𝘃𝗲𝗿 ('+(dmxRecIsInit?dmxRecOpts.iface+':'+String(dmxRecOpts.port):'Not Initiated')+')',visible:true,enabled:false,click:()=>{return}},
    {type:'separator'},
    {label:(dtlfxPlayState==='stopped'?'Start':'Stop')+' sACN Receiver',visible:true,enabled:ledFXCoreIsRunning,icon:(dtlfxPlayState==='stopped'?(await loadIcon('dtlfx-ctrlbtn-play-ico.png')):(await loadIcon('dtlfx-ctrlbtn-stop-ico.png'))),type:'normal',click:()=>{dtlfxPlayControlFn((dtlfxPlayState==='stopped'?'start':'stop'))}},
    {label:'Z1Box Mode',visible:true,enabled:true,type:'checkbox',checked:(dtlfxData.settings.z1bmode),click:()=>{toggleZ1BModeSetting()}},
    {label:'Autoplay on Launch',visible:true,enabled:true,type:'checkbox',checked:(dtlfxData.settings.autostart),click:()=>{toggleAutoStartSetting()}},
    {label:'LedFX > iCUE',visible:true,enabled:true,type:'checkbox',checked:(dtlfxData.settings.icuesync),click:()=>{toggleICUESync()}},
    {label:'Restart All (LedFx+sACN)',visible:true,enabled:(ledFXCoreIsRunning||dmxRecIsInit),icon:(await loadIcon('dtlfx-cm-restartlfx-ico.png')),type:'normal',click:()=>{startRestartAll()}},
    {label:'Show Stats Bar',visible:true,enabled:true,type:'checkbox',checked:(dtlfxData.settings.showstatsbar),click:()=>{toggleShowStatsBar()}},
    {label:'Media Folders',visible:true,enabled:true,icon:(await loadIcon('dtlfx-cm-sub-dirpaths-ico.png')),submenu:
      [
        {label:'Select Images Dir',visible:true,enabled:true,icon:(await loadIcon('dtlfx-cm-sub-imgdir-ico.png')),click:()=>{cmUpdateMediaDir('images')}},
        {label:'Select Plates Dir',visible:true,enabled:true,icon:(await loadIcon('dtlfx-cm-sub-platedir-ico.png')),click:()=>{cmUpdateMediaDir('plates')}}
      ]
    },
    {type:'separator'},
    {icon:(await loadIcon('dtlfx-cm-ledfx-ico-'+(ledFXCoreIsRunning?'on':'off')+'.png')),label:'𝗟𝗲𝗱𝗙𝗫 𝗖𝗼𝗿𝗲 '+(ledFXCoreIsRunning?'v'+ledFXCoreData.info.version+' ('+String(Object.keys(ledFXCoreData.devices).length)+' Devices)':'Not Running'),visible:true,enabled:false,click:()=>{return}},
    {type:'separator'},
    {label:'𝗘𝗳𝗳𝗲𝗰𝘁 𝗧𝘆𝗽𝗲: '+(!rendEffectInfo?'NK':rendEffectInfo.isSupported?rendEffectInfo.name:'Unsupported'),visible:(rendEffectInfo!==null),enabled:false,type:'normal',icon:(await loadIcon('dtlfx-cm-effect-current-ico.png')),click:()=>{return}},
    {label:'Set Effect',visible:ledFXCoreIsRunning,enabled:(ledFXDeviceId!==null&&rendEffectInfo!==null&&rendEffectInfo.isSupported),icon:(await loadIcon('dtlfx-cm-effect-select-ico.png')),submenu:selLFXEffectArr},
    {label:'Next Effect >',visible:ledFXCoreIsRunning,enabled:(ledFXDeviceId!==null&&rendEffectInfo!==null),icon:(await loadIcon('dtlfx-cm-effect-next-ico.png')),type:'normal',accelerator:'Shift+Alt+Up',click:()=>{nextPrevLedFXEffect('next')}},
    {label:'< Prev Effect',visible:ledFXCoreIsRunning,enabled:(ledFXDeviceId!==null&&rendEffectInfo!==null),icon:(await loadIcon('dtlfx-cm-effect-prev-ico.png')),type:'normal',accelerator:'Shift+Alt+Down',click:()=>{nextPrevLedFXEffect('prev')}},
    {type:'separator'},
    {label:'𝗘𝗳𝗳𝗲𝗰𝘁 𝗚𝗿𝗮𝗱𝗶𝗲𝗻𝘁: '+(!rendEffectInfo||!rendEffectInfo.isSupported?'NK':(rendEffectInfo.rgb.type==='gradient'&&typeof rendEffectInfo.rgb.data==='object'&&!Array.isArray(rendEffectInfo.rgb.data)&&rendEffectInfo.rgb.data.n?rendEffectInfo.rgb.data.n:rendEffectInfo.rgb.type)),visible:(rendEffectInfo!==null),enabled:false,type:'normal',icon:(await loadIcon('dtlfx-cm-currentgrad-ico.png')),click:()=>{return}},
    {label:'Set Gradient',visible:ledFXCoreIsRunning,enabled:(ledFXDeviceId!==null&&rendEffectInfo!==null&&rendEffectInfo.isSupported),icon:(await loadIcon('dtlfx-cm-selectgrad-ico.png')),submenu:selLFXGradientArr},
    {label:'Next Gradient >',visible:ledFXCoreIsRunning,enabled:(ledFXDeviceId!==null&&rendEffectInfo!==null&&!lowMidHighEffects.includes(rendEffectInfo.id)),icon:(await loadIcon('dtlfx-cm-grad-next-ico.png')),type:'normal',accelerator:'Shift+Alt+Right',click:()=>{nextPrevGradient('next')}},
    {label:'< Prev Gradient',visible:ledFXCoreIsRunning,enabled:(ledFXDeviceId!==null&&rendEffectInfo!==null&&!lowMidHighEffects.includes(rendEffectInfo.id)),icon:(await loadIcon('dtlfx-cm-grad-prev-ico.png')),type:'normal',accelerator:'Shift+Alt+Left',click:()=>{nextPrevGradient('prev')}},
    {type:'separator'},
    {label:'𝗔𝗻𝗶𝗺𝗮𝘁𝗶𝗼𝗻 𝗦𝗽𝗲𝗲𝗱: '+String(dtlfxData.settings.speed)+'%',visible:true,enabled:false,type:'normal',icon:(await loadIcon('dtlfx-cm-current-spd-ico.png')),click:()=>{return}},
    {label:'Set Speed',visible:true,enabled:true,icon:(await loadIcon('dtlfx-cm-spd-ico.png')),submenu:speedLevelsArr},
    {label:'Inc > Speed (+10%)',visible:true,enabled:(dtlfxData.settings.speed!==100),icon:(await loadIcon('dtlfx-cm-speed-inc-ico.png')),type:'normal',accelerator:'Shift+Alt+I',click:()=>{modDTLFXSpeedSetting('inc')}},
    {label:'Dec < Speed (-10%)',visible:true,enabled:(dtlfxData.settings.speed!==0),icon:(await loadIcon('dtlfx-cm-speed-dec-ico.png')),type:'normal',accelerator:'Shift+Alt+D',click:()=>{modDTLFXSpeedSetting('dec')}},
    {type:'separator'},
    {label:'𝗔𝗰𝘁𝗶𝘃𝗲 𝗟𝗮𝘆𝗲𝗿𝘀: '+(layerSoloNowStr==='None'?String(layersSumArr.length)+'/'+String(Object.keys(dtlfxLayerStates).length):layerSoloNowStr)+(layerSoloNowStr!=='None'?' (Solo)':''),visible:true,enabled:false,type:'normal',icon:(await loadIcon('dtlfx-cm-active-layers-ico.png')),click:()=>{return}},
    {label:'Toggle Layers',visible:true,enabled:true,icon:(await loadIcon('dtlfx-cm-layers-ico.png')),submenu:layerTogglesArr},
    {label:'Layer Solo',visible:true,enabled:true,icon:(await loadIcon('dtlfx-cm-solo-ico.png')),submenu:layerSoloArr},
    {type:'separator'},
    {label:'Show DTLFX',visible:(dtlfxWindowState.viz!=='showing'),enabled:true,type:'normal',icon:(await loadIcon('dtlfx-win-max-ico.png')),accelerator:'Shift+Alt+S',click:()=>{winCtrl('show')}},
    {label:'Hide in Tray',visible:(dtlfxWindowState.viz!=='hidden'),enabled:true,icon:(await loadIcon('dtlfx-connected-false.png')),type:'normal',accelerator:'Shift+Alt+H',click:()=>{winCtrl('hide')}},
    {label:'Fullscreen',visible:true,enabled:true,type:'checkbox',checked:dtlfxWindowState.fullscreen,accelerator:'Shift+Alt+F',click:()=>{winCtrl('fullscreen',(dtlfxWindowState.fullscreen?false:true))}},
    {label:'Exit DTLFX',visible:true,enabled:true,icon:(await loadIcon('dtlfx-win-exit-ico.png')),type:'normal',accelerator:'Shift+Alt+X',click:()=>{winCtrl('exit')}}
  ];
  //------------
  const updAppMenuObj:any={showSelectAll:false,showLookUpSelection:false,showSearchWithGoogle:false,showCopyImage:false,showCopyImageAddress:false,showSaveImage:false,showSaveImageAs:false,showSaveLinkAs:false,showInspectElement:false,showServices:false,prepend:()=>baseAppCMArr};
  dtlfxDisposeAppCM=contextMenu(updAppMenuObj);
  let dtlfxTrayIcon:string='';
  if(dtlfxMode==='prod'){dtlfxTrayIcon=path.join(__dirname,'assets/favicon.ico')}
  else{dtlfxTrayIcon=path.join(__dirname,'../dist/assets/favicon.ico')};
  dtlfxTray=new Tray(dtlfxTrayIcon);
  dtlfxCM=Menu.buildFromTemplate(baseAppCMArr);
  dtlfxTray.setToolTip('DTLFX - '+(dtlfxPlayState==='stopped'?'Stopped':'Running'));
  dtlfxTray.setContextMenu(dtlfxCM);
  dtlfxCMBuildInProg=false;
  return Promise.resolve(true);
};
//------------------------------------------------
  async function modDTLFXSpeedSetting(data:number|'inc'|'dec'):Promise<boolean>{
    availCons('modDTLFXSetting','('+(typeof data==='number'?Number(data):String(data))+')...');
    if(dtlfxSCInProg){return Promise.resolve(false)};
    dtlfxSCInProg=true;
    let existSetV:number=dtlfxData.settings.speed;
    let newSetV:number=0,chgStr:string='';
    if(typeof data==='string'){
      const notMax=():boolean=>{return (dtlfxData.settings.speed<100)},notMin=():boolean=>{return (dtlfxData.settings.speed>0)},ckCond:boolean=(data==='inc'?(notMax()):(notMin()));
      if(!ckCond){rM('showStatusMsg',(data==='inc'?'Max':'Min')+' Speed: '+String(dtlfxData.settings.speed)+'%');dtlfxSCInProg=false;return Promise.resolve(false)}
      else{if(data==='inc'){newSetV=(existSetV+10);chgStr='+10'}else{newSetV=(existSetV-10);chgStr='-10'}}
    }else{newSetV=data;chgStr=String(Math.abs(newSetV-existSetV));if(existSetV>newSetV){chgStr='-'+chgStr}else{chgStr='+'+chgStr}};
    dtlfxData.settings.speed=newSetV;
    rM('animSpeedUpdate',dtlfxData.settings.speed);
    rM('showStatusMsg','('+chgStr+') Speed: '+String(dtlfxData.settings.speed)+'%');
    await writeDataFile(dtlfxData);
    await rebuildCMs();
    dtlfxSCInProg=false;
  }
//////////////////////////////////////////////////
// SHORTCUTS
//////////////////////////////////////////////////
const scs=(tf:boolean):void=>{if(tf){if(!dtlfxSCsActive){shortCutRegs('register')}}else{if(dtlfxSCsActive){shortCutRegs('unregister')}}};
const shortCutRegs=(action:string):void=>{
  if(action==='register'){
    if(!dtlfxData.settings.z1bmode){
      globalShortcut.register('Alt+Shift+Up',()=>{if(dtlfxWindow.isFocused){if(ledFXCoreIsRunning&&rendEffectInfo){nextPrevLedFXEffect('next')}}});
      globalShortcut.register('Alt+Shift+Down',()=>{if(dtlfxWindow.isFocused){if(ledFXCoreIsRunning&&rendEffectInfo){nextPrevLedFXEffect('prev')}}});
      globalShortcut.register('Alt+Shift+Right',()=>{if(dtlfxWindow.isFocused){if(ledFXCoreIsRunning&&rendEffectInfo){nextPrevGradient('next')}}});
      globalShortcut.register('Alt+Shift+Left',()=>{if(dtlfxWindow.isFocused){if(ledFXCoreIsRunning&&rendEffectInfo){nextPrevGradient('prev')}}});
      globalShortcut.register('Alt+Shift+I',()=>{if(dtlfxWindow.isFocused){modDTLFXSpeedSetting('inc')}});
      globalShortcut.register('Alt+Shift+D',()=>{if(dtlfxWindow.isFocused){modDTLFXSpeedSetting('dec')}});
      globalShortcut.register('Alt+Shift+S',()=>{if(dtlfxWindow.isFocused){winCtrl('show')}});
      globalShortcut.register('Alt+Shift+H',()=>{if(dtlfxWindow.isFocused){winCtrl('hide')}});
      globalShortcut.register('Alt+Shift+X',()=>{if(dtlfxWindow.isFocused){winCtrl('exit')}});
    };
    dtlfxSCsActive=true;
  }else{
    if(!dtlfxData.settings.z1bmode){
      globalShortcut.unregisterAll();
    };
    dtlfxSCsActive=false;
  };
};
//////////////////////////////////////////////
// LFXCORE FUNCTIONS
//////////////////////////////////////////////
ipcMain.handle('getLFXCurrentEffect',async(e:any,args:any[]):Promise<false|{isSupported:boolean,dtlfxIndex:number,id:string,name:string,rgb:{type:'color'|'colors'|'gradient',data:string|string[]|{n:string,g:string,i:number}}}>=>{
  let waitINT:any,waitTO:any;
  if(rendEffectInfo!==null){return Promise.resolve(rendEffectInfo)}
  else{
    if(!ledFXCoreIsRunning){return Promise.resolve(false)}
    else{
      if(gettingLFXCoreData){
        return new Promise((resolve)=>{
          waitTO=setTimeout(()=>{
            if(waitINT){clearInterval(waitINT)};
            if(rendEffectInfo!==null){resolve(rendEffectInfo)}
            else{availCons('getLFXCurrentEffect','ERROR: Timeout (5s) Waiting for LFXCoreData');resolve(false)};
          },5000);
          waitINT=setInterval(()=>{
            if(!gettingLFXCoreData&&rendEffectInfo!==null){
              clearInterval(waitINT);
              if(waitTO){clearTimeout(waitTO)};
              resolve(rendEffectInfo);
            };
          },500);
        });
      }else{
        const sLCDRes:boolean=await setLFXCoreData();
        if(sLCDRes&&rendEffectInfo!==null){return Promise.resolve(rendEffectInfo)}
        else{return Promise.resolve(false)};
      };
    }
  }
});
//--------------------------------------------
async function lfxAPIReq(m:'get'|'post'|'put',ep:string,d:any,to?:number):Promise<{r:boolean,d:any}>{
  availCons('lfxAPIReq','('+m+',data:any'+(to?','+String(to)+')':')')+'...');
  try{
    let defAPIReqOpts:AxiosRequestConfig={url:'http://192.168.0.3:6699/api/'+ep,method:m,responseType:'json',timeout:(to?to:10000)};
    if(m!=='get'){
      defAPIReqOpts['headers']={'Content-Type':'application/json'};
      if(typeof d==='object'){d=JSON.stringify(d)};
      if(!isJSON(d)){availCons('lfxAPIReq','ERROR: data -> JSON Failed');return Promise.resolve({r:false,d:'ERROR: data -> JSON Failed'})};
      defAPIReqOpts['data']=d;
    };
    const reqRes:AxiosResponse=await axios.request(defAPIReqOpts);
    if(reqRes&&reqRes.data&&reqRes.status===200){
      let resObj:{r:boolean,d:any}={r:true,d:null};
      if(typeof reqRes.data==='object'){resObj.d=reqRes.data}else{resObj.d=JSON.parse(reqRes.data)};
      return Promise.resolve(resObj);
    }else{availCons('lfxAPIReq','ERROR: ['+String(reqRes.status)+']');return Promise.resolve({r:false,d:'ERROR: ['+String(reqRes.status)+']'})}
  }catch(e){availCons('lfxAPIReq','ERROR:');console.log(e);return Promise.resolve({r:false,d:null})}
}
//--------------------------------------------
async function setLFXCoreData():Promise<boolean>{
  availCons('setLFXCoreData','()...');
  if(!ledFXCoreIsRunning){availCons('reqLFXCore','ERROR: ledFXCoreIsRunning=false');return Promise.resolve(false)};
  gettingLFXCoreData=true;
  let epsArr:string[]=['info','devices','virtuals','effects'];
  let errCount:number=0;
  for(let gri=0;gri<epsArr.length;gri++){
    const epKey:string=epsArr[gri];
    try{
      const rR:{r:boolean,d:any}=await lfxAPIReq('get',epKey,null);
      if(!rR.r||!rR.d){availCons('setLFXCoreData|'+epsArr[gri],'ERROR: '+(rR.d?rR.d:'Unknown Error'));errCount++}
      else{
        if(epsArr[gri]==='info'){
          const urlArr:string[]=rR.d.url.replace('http://','').split(':');
          ledFXCoreData.info.host=urlArr[0];
          ledFXCoreData.info.port=Number(urlArr[1]);
          ledFXCoreData.info.version=rR.d.version;
        }else{
          if(rR.d.hasOwnProperty('status')&&rR.d.status==='success'&&rR.d.hasOwnProperty(epsArr[gri])&&!_.isEmpty(rR.d[epsArr[gri]])){
            ledFXCoreData[epsArr[gri]]=rR.d[epsArr[gri]];
            if(epsArr[gri]==='devices'){
              for(const[k,v] of Object.entries(ledFXCoreData.devices)){
                const devInf:any=v;
                if(devInf.hasOwnProperty('config')&&devInf.config&&devInf.config.hasOwnProperty('ip_address')&&devInf.config.ip_address){
                  if(dtlfxData.settings.z1bmode){if(devInf.config.ip_address==='192.168.0.111'){ledFXDeviceId=k}}
                  else{if(devInf.config.ip_address===(hlIP())){ledFXDeviceId=k}};
                }
              };
            };
            if(epsArr[gri]==='effects'&&ledFXDeviceId!==null){
              if(ledFXCoreData.effects.hasOwnProperty(ledFXDeviceId)&&!_.isEmpty(ledFXCoreData.effects[ledFXDeviceId])){
                const dFXObj:any=ledFXCoreData.effects[ledFXDeviceId];availCons('setLFXCoreData',dFXObj);
                const fxT:string=dFXObj.effect_type;availCons('setLFXCoreData',fxT);
                let rEIObj:any={isSupported:true,dtlfxIndex:(dtlfxSupportedFX.findIndex((t:string)=>t===fxT)),id:fxT,name:(fxType2Name(fxT)),rgb:{type:null,data:null}};
                if(dtlfxSupportedFX.includes(fxT)){
                  if(dFXObj.effect_config.hasOwnProperty('gradient')&&dFXObj.effect_config.gradient){
                    if(dFXObj.effect_config.gradient.startsWith('#')){
                      rEIObj.rgb.data=ledFXCoreData.effects[ledFXDeviceId].effect_config.gradient;
                      rEIObj.rgb.type='color';
                    }else{
                      rEIObj.rgb.type='gradient';
                      const matchGradRes:{n:string,g:string,i:number}|false=(matchGStr(dFXObj.effect_config.gradient));
                      if(matchGradRes){rEIObj.rgb.data=matchGradRes}
                      else{
                        availCons('setLFXCoreData','ERROR: FAILED to match Gradient Str to Object!');
                        rEIObj.rgb.data={n:'NK',g:ledFXCoreData.effects[ledFXDeviceId].effect_config.gradient,i:-1};
                      }
                    };
                  }else if((dFXObj.effect_config.hasOwnProperty('color_lows')||dFXObj.effect_config.hasOwnProperty('lows_color'))&&(dFXObj.effect_config.hasOwnProperty('color_mids')||dFXObj.effect_config.hasOwnProperty('mids_color'))&&(dFXObj.effect_config.hasOwnProperty('color_high')||dFXObj.effect_config.hasOwnProperty('high_color'))){
                    rEIObj.rgb.type='colors';
                    dFXObj.effect_config.hasOwnProperty('color_lows')?rEIObj.rgb.data=[dFXObj.effect_config.color_lows,dFXObj.effect_config.color_mids,dFXObj.effect_config.color_high]:rEIObj.rgb.data=[dFXObj.effect_config.lows_color,dFXObj.effect_config.mids_color,dFXObj.effect_config.high_color];
                  }else{rEIObj={isSupported:false,dtlfxIndex:-1,id:'-',name:'-',rgb:{type:null,data:null}}};
                }else{rEIObj={isSupported:false,dtlfxIndex:-1,id:'-',name:'-',rgb:{type:null,data:null}};availCons('setLFXCoreData','dtlfxSupportedFX ! include ('+fxT+')');};
                rendEffectInfo=rEIObj;
                rM('lfxEffectUpdate',rendEffectInfo);
              }
            }
          }
        }
      }
    }catch(e){availCons('setLFXCoreData|'+epsArr[gri],'ERROR:');console.log(e);errCount++};
  };
  if(rendEffectInfo!==null){await sendVizInf2Z1Box()};
  if(errCount>0){gettingLFXCoreData=false;return Promise.resolve(false)}
  else{gettingLFXCoreData=false;return Promise.resolve(true)};
};
//////////////////////////////////////////////
// MAIN DTLFX FUNCTIONS
//////////////////////////////////////////////
async function dtlfxPlayControlFn(action:string,data?:any){
  availCons('dtlfxPlayControls','('+action+')...');
  if(ledFXCoreIsRunning){
    if(action==='start'){dtlfxPlayState='started';rM('startStopDTLFX','start')}
    else{dtlfxPlayState='stopped';rM('startStopDTLFX','stop')};
    rebuildCMs();
  }else{availCons('dtlfxPlayControlFn','SKIPPED ('+action+') - ledFXCoreIsRunning=false')};
};
//---------------------------------------------
ipcMain.handle('getDTLFXAnimSpeed',(e:any,args:any[]):Promise<number>=>{return Promise.resolve(dtlfxData.settings.speed)});
//---------------------------------------------
ipcMain.handle('getDTLFXShowStatsBar',(e:any,args:any[]):Promise<boolean>=>{return Promise.resolve(dtlfxData.settings.showstatsbar)});
//---------------------------------------------
ipcMain.on('ChangeMBLimit',(e:any,args:any[])=>{mbLimits[args[0]]=args[1]});
//--------------------------------------------
ipcMain.handle('getUMediaListsData',(e:any,args:any[]):Promise<DTLFXUMLists>=>{const uMO:any=uMediaLists;return Promise.resolve(uMO)});
//--------------------------------------------
function getFileAsBase64(filePath:string):Promise<string|false>{return new Promise((resolve)=>{fs.readFile(filePath,(err,data)=>{if(err){resolve(false)}else{const base64Data=Buffer.from(data).toString('base64');resolve(base64Data)}})})};
//--------------------------------------------
ipcMain.handle('getRandUMediaDataBlock',async(e:any,args:any[]):Promise<{i:number,d:string}[]>=>{
  if(!uMediaLists[args[0]].active||uMediaLists[args[0]].list.length<1){return Promise.resolve([])};
  if(uMediaLists[args[0]].list.length<=(mbLimits[args[0]])&&uMediaLists[args[0]].block.length>0){return Promise.resolve(uMediaLists[args[0]].block)};
  const blockLen:number=(uMediaLists[args[0]].list.length>(mbLimits[args[0]])?(mbLimits[args[0]]):uMediaLists[args[0]].list.length);
  const fullMediaList:string[]=uMediaLists[args[0]].list;
  let rUMDataBlock:{i:number,d:string}[]=[];
  while(rUMDataBlock.length<blockLen){
    const rListI:number=Math.floor(Math.random()*fullMediaList.length);
    const existRLI:number=rUMDataBlock.findIndex((rLO:{i:number,d:string})=>rLO.i===rListI);
    if(existRLI===-1){
      try{
        const umDirPath:string=dtlfxData.paths.mediaPaths[args[0]];
        const rIFName:string=uMediaLists[args[0]].list[rListI];
        const rIFPath:string=path.join(umDirPath,rIFName);
        const getRIData:string|false=await getFileAsBase64(rIFPath);
        if(getRIData!==false){
          const extTypeStr:string=(path.extname(rIFName)).replace('.','');
          const finalStr:string='data:image/'+extTypeStr+';base64,'+getRIData;
          const finalObj:{i:number,d:string}={i:rListI,d:finalStr};
          rUMDataBlock.push(finalObj);
          if(dtlfxHomeActive){dtlfxWindow.webContents.send('getRandUBlockProg',[args[0],rUMDataBlock.length,blockLen])};
        };
      }catch(e){availCons('getRandUMediaDataBlock',e)};
    };
  };
  return Promise.resolve(rUMDataBlock);
})
//--------------------------------------------
async function checkWCRunning():Promise<boolean>{const{r}=await reqWifiCUE('get','ping');wcIsRunning=r;return Promise.resolve(r)}
//--------------------------------------------
async function reqWifiCUE(method:'get'|'post',data:any,config?:any):Promise<{r:boolean,d?:any}>{
  availCons('notifyWifiCUE','('+method+',data)...');
  try{
    let defReqOpts:AxiosRequestConfig={url:'http://'+(hlIP())+':6666',method:method,timeout:3000};
    if(method==='get'){
      defReqOpts['headers']={dtlfx:data};
      defReqOpts['responseType']='text';
      if(config&&config.length>0){defReqOpts['headers']['dtlfxconfig']=config};
    }else{defReqOpts['headers']={'dtlfx':'post','Content-Type':'application/json'};defReqOpts['data']=data;defReqOpts['responseType']='json'};
    const reqRes:AxiosResponse=await axios.request(defReqOpts);
    if(reqRes.status!==200){availCons('reqWifiCUE','ERROR: '+reqRes.status)};
    if(method==='post'){return Promise.resolve(reqRes.data)}
    else{return Promise.resolve({r:(reqRes.status===200?true:false)})}
  }catch(e){return Promise.resolve({r:false,d:null})}
}
//--------------------------------------------
async function ledfx2IsRun():Promise<boolean>{
  availCons('ledfx2IsRun','()...');
  let cRInProg:boolean=false;
  return new Promise((resolve)=>{
    let irTO:any=null,irINT:any=null;
    const checkRun=():Promise<boolean>=>{
      if(!cRInProg){
        cRInProg=true;
        availCons('ledfx2IsRun|CheckRun','()...');
        return new Promise((resolve)=>{
          exec('tasklist | findstr "ledFX2.exe"',(error:any,stdout:any,stderr:any)=>{
            if(error||stderr||!stdout){cRInProg=false;resolve(false)}
            else{
              let rPIDs:string[]=[],rawLines:any[]=stdout.split('\n');
              if(rawLines.length>0){
                for(let i=0;i<rawLines.length;i++){
                  const rL:string=rawLines[i].trim();
                  if(rL.length>0&&rL.startsWith('ledFX2.exe')){
                    if(rL.split(/\s+/)[1].trim()&&!rPIDs.includes(rL.split(/\s+/)[1].trim())){
                      rPIDs.push(rL.split(/\s+/)[1].trim())
                    };
                  };
                };
                if(rPIDs.length>=2){
                  availCons('ledfx2IsRun','SUCCESS: Found 2x New-Run LedFx.exes - '+rPIDs.join(','));
                  cRInProg=false;resolve(true);
                }else if(rPIDs.length===1){
                  availCons('ledfx2IsRun','PROGRESS: Found 1x New-Run LedFx.exe - '+String(rPIDs[0]));
                  cRInProg=false;resolve(false);
                }else{
                  availCons('ledfx2IsRun','WAIT: Found 0x New-Run LedFx.exes');
                  cRInProg=false;resolve(false);
                }
              }else{
                availCons('ledfx2IsRun','WAIT: No STDOUT Reply Data');
                cRInProg=false;resolve(false);
              };
            }
          })
        });
      }else{return Promise.resolve(false)};
    };
    irTO=setTimeout(()=>{
      availCons('ledfx2IsRun','ERROR: Timeout Waiting for New-Run LedFx.exes!');
      if(irINT!==null){clearInterval(irINT);resolve(false)};
    },30000);
    irINT=setInterval(async()=>{
      const irRes:boolean=await checkRun();
      if(irRes){
        clearInterval(irINT);
        clearTimeout(irTO);
        resolve(true);
      };
    },1000);
  })
};
//--------------------------------------------
async function ledfx2Kill():Promise<string[]|false>{
  availCons('ledfx2Kill','()...');
  return new Promise((resolve)=>{
    exec('taskkill /F /IM ledFX2.exe /T',async(error:any,stdout:any,stderr:any)=>{
      if(error||stderr||!stdout){availCons('ledfx2Kill','ERROR @ ledfx2Kill');resolve(false)}
      else{
        let killdPIDs:string[]=[],rawLines:any[]=stdout.split('\n');
        if(rawLines.length>0){
          for(let i=0;i<rawLines.length;i++){
            const rL:string=rawLines[i].trim();
            if(rL.length>0&&rL.startsWith('SUCCESS: ')){
              killdPIDs.push(rL.split('The process with PID ')[1].split(/\s+/)[0])
            }
          }
        };
        if(killdPIDs.length>0){
          availCons('ledfx2Kill','OK - Killed '+killdPIDs.join(',')+' @ ledfx2Kill');
          resolve(killdPIDs);
        }else{
          availCons('ledfx2Kill','OK - None to Kill @ ledfx2Kill')
          resolve(false);
        };
      }
    })
  })
};
//--------------------------------------------
function ledfx2Run():Promise<boolean>{
  availCons('ledfx2Run','()...');
  return new Promise((resolve)=>{
    exec(dtlfxData.paths.ledfxPaths.exe,(error:any,stdout:any,stderr:any)=>{
      if(error||stderr||!stdout){availCons('ledfx2Run','ERROR @ ledfxRun()');resolve(false)}
      else{availCons('ledfx2Run','SUCCESS @ ledfx2Run()');resolve(true)}
    });
  });
};
//--------------------------------------------
async function delOldBUConfigs():Promise<boolean>{
  const allFiles:string[]=await fs.promises.readdir(selectLFXConfigsDirPath);
  const utsFiles=allFiles.filter((f:string)=>/^\d{13}.json$/.test(f));
  const utsNos:number[]=utsFiles.map((f:string)=>parseInt(f.slice(0,13)));
  utsNos.sort((a,b)=>b-a);
  const keepUTSFiles:number[]=utsNos.slice(0,3);
  const delUTSFiles:string[]=utsFiles.filter((f:string,i:number)=>!keepUTSFiles.includes(parseInt(f.slice(0,13))));
  for(const f of delUTSFiles){await fs.promises.unlink(path.join(selectLFXConfigsDirPath,f))};
  return Promise.resolve(true);
}
//--------------------------------------------
async function switchLFXConfigs(cfgName:'bu'|'all'|'dt&strips'|'dt&z1b'|'stripsonly'|'z1bonly'):Promise<boolean>{
  const newCFGPath:string|false=await selectLFXConfig(cfgName);
  if(!newCFGPath){availCons('switchLFXConfigs','ERROR - Failed to Find '+cfgName+'.json');return Promise.resolve(false)};
  await  delOldBUConfigs();
  const buCFGUTS:string=Date.now().toString();
  const buCFGSourcePath:string=dtlfxData.paths.ledfxPaths.config;
  const buCFGDestPath:string=path.normalize(path.join(selectLFXConfigsDirPath,buCFGUTS+'.json'));
  try{await fs.promises.copyFile(buCFGSourcePath,buCFGDestPath)}catch(e){availCons('switchLFXConfigs','ERROR: Failed to Backup Existing config.json');return Promise.resolve(false)};
  const z1bConfigSourcePath:string=newCFGPath;
  const z1bConfigDestPath:string=buCFGSourcePath;
  try{
    await fs.promises.copyFile(z1bConfigSourcePath,z1bConfigDestPath);
    if((await exists(buCFGDestPath))&&(await statSize(buCFGDestPath)).r&&(await exists(z1bConfigDestPath))&&(await statSize(z1bConfigDestPath)).r){return Promise.resolve(true)}
    else{availCons('switchLFXConfigs','ERROR: Missing/NIL Size backup or new config files!');return Promise.resolve(false)};
  }catch(e){availCons('switchLFXConfigs','ERROR: Failed to Copy/Replace config.json with '+cfgName+'.json');return Promise.resolve(false)};
}
//--------------------------------------------
async function restartLFXExes():Promise<boolean>{
  availCons('restartLFXExes','()...');
  const killRes:string[]|false=await ledfx2Kill();
  if(killRes!==false){
    rM('showStatusMsg','Killed '+String(killRes.length)+'x LedFx.exe ('+killRes.join(',')+')');
    if(wcIsRunning){reqWifiCUE('get','stopped')};
    availCons('restartLFXExes|WAIT','2s...');
    await doW(2);
  }else{availCons('restartLFXExes|ledfx2Kill|RESULT',killRes)};
  availCons('restartLFXExes|WAIT','1s...');
  await doW(1);
  //
  const configName:'bu'|'all'|'dt&strips'|'dt&z1b'|'stripsonly'|'z1bonly'=(dtlfxData.settings.z1bmode?z1bModeCFGName:'all');
  await switchLFXConfigs(configName);
  await doW(1);
  //
  ledfx2Run();
  availCons('restartLFXExes|ledfx2Run','Executed Here!');
  const ledfx2IsRunRes:boolean=await ledfx2IsRun();
  availCons('restartLFXExes|ledfx2IsRun|RESULT',String(ledfx2IsRunRes));
  if(!ledfx2IsRunRes){
    if(wcIsRunning){
      await reqWifiCUE('get','stopped');
      if(dtlfxData.settings.z1bmode){await reqWifiCUE('get','config',z1bModeCFGName)};
    }
  }else{
    if(wcIsRunning){
      if(dtlfxData.settings.z1bmode){await reqWifiCUE('get','config',z1bModeCFGName)};
      await reqWifiCUE('get','started')
    };
  };
  availCons('restartLFXExes|FINISHED','Final Result: '+String(ledfx2IsRunRes));
  return Promise.resolve(ledfx2IsRunRes);
};
//------------------------------------------------
ipcMain.on('changeMainFilterFPS',(e:any,args:any[])=>{if(args[0]<=dmxMainFPSLimit){dmxMainFilterFPS=args[0];rM('mainFilterFPSUpdate',dmxMainFilterFPS)}});
//------------------------------------------------
async function initDMXReceiver():Promise<boolean>{
  availCons('initDMXReceiver','()...');
  try{
    dmxRecInst=new sacn.Receiver({universes:[1],port:5568,iface:'0.0.0.0',reuseAddr:true});
    dmxRecInst.on('packet',(p:sacn.Packet)=>{
      if(!dtlfxData.settings.z1bmode){
        if(dtlfxPlayState==='started'){
        const dmxNowPacketTime:number=Date.now();
        if((dmxNowPacketTime-dmxLastPacketTime)>=(1000/dmxMainFilterFPS)){
          dmxLastPacketTime=dmxNowPacketTime;
          rM('dmxRecData',p.payload);
          if(dtlfxData.settings.icuesync&&cueSDKStatus.error.code===0&&cueSDKStatus.session.code===6){convertPayload4ICUE(p.payload)};
        }
       }
      }else{
        const dmxNowPacketTime:number=Date.now();
        if((dmxNowPacketTime-dmxLastPacketTime)>=(1000/dmxMainFilterFPS)){
          dmxLastPacketTime=dmxNowPacketTime;
          if(dtlfxData.settings.icuesync&&cueSDKStatus.error.code===0&&cueSDKStatus.session.code===6){convertPayload4ICUE(p.payload)};
        }
      }
    });
    dmxRecInst.on('error',(stdErr:Error)=>{console.log(stdErr);availCons('DMXRec|ERROR','[INTERNAL] - '+stdErr.name+': '+stdErr.message)});
    //----------
    dmxRecIsInit=true;
    availCons('initDMXReceiver','DMXReceiver RUNNING! - dmxRecIsInit='+String(dmxRecIsInit)+'|dtlfxPlayState='+dtlfxPlayState+'|ledFXCoreIsRunning='+String(ledFXCoreIsRunning));
    rM('mainFilterFPSUpdate',dmxMainFilterFPS);
    rM('showStatusMsg','Started DTLFX Receiver: SUCCESS');
    await doW(1);
    return Promise.resolve(true);
  }catch(e){dmxRecIsInit=false;rebuildCMs();rM('showStatusMsg','Started DTLFX Receiver: ERROR');availCons('initDMXReceiver|ERROR',e);return Promise.resolve(false)};
}
//------------------------------------------------
async function startRestartAll():Promise<boolean>{
  availCons('startRestartAll','()...');
  const initRecRes:boolean=await initDMXReceiver();
  availCons('startRestartAll|initDMXReceiver|RESULT',String(initRecRes));
  const rslfx2sRes:boolean=await restartLFXExes();
  if(!rslfx2sRes){
    rM('showStatusMsg','Restart LedFX.exe - FAILED');
    availCons('dtlfxInitReceiver','Restart LedFx.exe - FAILED');
    ledFXCoreIsRunning=false;
    rebuildCMs();
    return Promise.resolve(false);
  }else{
    rM('showStatusMsg','Restart LedFx.exe - SUCCESS');
    availCons('dtlfxInitReceiver','Restart LedFx.exe - SUCCESS');
    ledFXCoreIsRunning=true;
    availCons('startRestartAll|WAIT','2s...');
    await doW(2);
    const lfxCDRes:boolean=await setLFXCoreData();
    availCons('startRestartAll|setLFXCoreData|RESULT',String(lfxCDRes));
    if(rendEffectInfo!==null){await sendVizInf2Z1Box()};
    if(dtlfxData.settings.z1bmode&&dtlfxData.settings.autostart){await toggleAutoStartSetting()};
    if(dtlfxData.settings.z1bmode&&dtlfxData.settings.showstatsbar){await toggleShowStatsBar()};
    if(dtlfxData.settings.autostart||dtlfxPlayState==='started'){dtlfxPlayControlFn('start')};
    rebuildCMs();
    return Promise.resolve(true);
  };
};
//------------------------------------------------
async function killDMXReceiver():Promise<boolean>{
  availCons('killDMXReceiver','()...');
  if(dmxRecInst){dmxRecInst.removeAllListeners();dmxRecInst.close()};
  dmxRecInst=null,dmxRecIsInit=false;
  return Promise.resolve(true);
};
//////////////////////////////////////////////////
// Z1BOX FUNCTIONS
//////////////////////////////////////////////////
async function z1BoxSendViz(gradOrFX:string,vizValue:string):Promise<boolean>{
  let defZ1BVizOpts:AxiosRequestConfig={url:'http://192.168.0.111/get?z1box=true&z1Viz',method:'GET',timeout:10000};
  if(gradOrFX==='grad'){defZ1BVizOpts.url+='Grad='}else{defZ1BVizOpts.url+='FX='};
  defZ1BVizOpts.url+=vizValue;
  try{await axios.request(defZ1BVizOpts);return Promise.resolve(true)}
  catch(e){availCons('z1BoxSendViz',e);return Promise.resolve(false)};
}
//////////////////////////////////////////////////
// DTLFX API/SERVER FUNCTIONS
//////////////////////////////////////////////////
async function dtlfxInitWebSVR():Promise<boolean>{
  availCons('dtlfxInitWebSVR','()...');
  try{
    dtlfxWebSVR=http.createServer(async(req,res)=>{
      const reqIP4:string=req.socket.remoteAddress.replace('::ffff:','').trim();
      availCons('WebSVR|REQUEST','Received ['+req.method.toLocaleLowerCase()+'] from '+reqIP4);
      if(req.headers.dtlfxtoken.toString()==='*******'){
        if(req.headers.dtlfxfrom.toString()==='wificue'){
          if(req.headers.wificue.toString()==='sendvizinfo'){
            doSendVizInf2Box=true;
            if(rendEffectInfo!==null){await sendVizInf2Z1Box()}
            else{setTimeout(async()=>{if(rendEffectInfo!==null){sendVizInf2Z1Box()}},10000)}
            res.writeHead(200,'OK',{'Content-Type':'text/plain'});
            res.end('OK');
          }else if(req.headers.wificue.toString()==='getconfig'){
            if(dtlfxData.settings.z1bmode&&z1bModeCFGName!==null){res.writeHead(200,'OK',{'Content-Type':'application/json'});res.end(JSON.stringify({r:true,d:z1bModeCFGName}))}
            else{res.writeHead(200,'OK',{'Content-Type':'application/json'});res.end(JSON.stringify({r:false,d:null}))};
          }else if(req.headers.wificue.toString()==='started'){
            if(!wcIsRunning){wcIsRunning=true};
            if(ledFXCoreIsRunning){
              if(dtlfxData.settings.z1bmode){await reqWifiCUE('get','config',z1bModeCFGName)};
              await reqWifiCUE('get','started');
            };
            res.writeHead(200,'OK',{'Content-Type':'text/plain'});
            res.end('OK');
          }else if(req.headers.wificue.toString()==='stopped'){
            if(wcIsRunning){wcIsRunning=false};
            res.writeHead(200,'OK',{'Content-Type':'text/plain'});
            res.end('OK');
          }else if(req.headers.wificue.toString()==='setcolor'&&req.headers.wcdata.length>0){
            setNewGradientColor(req.headers.wcdata);
            res.writeHead(200,'OK',{'Content-Type':'text/plain'});
            res.end('OK');
          };
        }else if(req.headers.dtlfxfrom.toString()==='z1box'){
          const z1boxCMDStr:string=req.headers.z1box.toString();
          if(z1boxCMDStr.startsWith('grad')){
            const nOp:string=z1boxCMDStr.replace('grad','');
            nextPrevGradient(nOp);
            res.writeHead(200,'OK');
            res.end();
          }else if(z1boxCMDStr.startsWith('fx')){
            const nOp:string=z1boxCMDStr.replace('fx','');
            nextPrevLedFXEffect(nOp);
            res.writeHead(200,'OK');
            res.end();
          }else if(z1boxCMDStr==='vizgradfxinfo'){
            let vizGFStr:string=rendEffectInfo.name+'/';
            if(typeof rendEffectInfo.rgb.data==='object'&&!Array.isArray(rendEffectInfo.rgb.data)){vizGFStr+=rendEffectInfo.rgb.data.n}else{vizGFStr+='Color'};
            res.writeHead(200,'OK',{'Content-Type':'text/plain','Content-Length':Buffer.byteLength(vizGFStr)});
            res.end(vizGFStr);
          }
        }
      }else{res.writeHead(401,'Unauthorized',{'Content-Type':'application/json'});res.end(JSON.stringify({r:false,d:null}));availCons('WebSVR|RESPONSE','Sent 401 Response')}
    }).listen(9696);
    dtlfxWebSVRTerminate=createHttpTerminator({gracefulTerminationTimeout:1000,server:dtlfxWebSVR});
    availCons('dtlfxInitWebSVR','WebSVR Running @ '+(hlIP())+':9696');
    return Promise.resolve(true);
  }catch(e){availCons('startNotifListener','ERROR: '+e);return Promise.resolve(false)}
}
//--------------------------------------------
async function doKillWebSVR():Promise<boolean>{
  if(dtlfxWebSVR===null||dtlfxWebSVRTerminate===null){return Promise.resolve(true)};
  try{await dtlfxWebSVRTerminate.terminate();dtlfxWebSVRTerminate=null;dtlfxWebSVR=null;return Promise.resolve(true)}catch(e){return Promise.resolve(false)}
};
//////////////////////////////////////////////
// LEDFX FUNCTIONS
//////////////////////////////////////////////
async function changeLFXEffect(fxId:string):Promise<boolean>{
  //----------
  const eR:{r:boolean,d:any}=await lfxAPIReq('get','effects',null);
  if(!eR.r||!eR.d){availCons('changeLFXEffect|GET','ERROR - GETing existing Device Effect Configs');return Promise.resolve(false)}
  else{
    let devCfgsArr:{dId:string,effectConfig:any}[]=[];
    for(const[k,v]of Object.entries(eR.d.effects)){const devEff:any=v;devCfgsArr.push({dId:k,effectConfig:{config:devEff.effect_config}})};
    currentLFXEConfigs=devCfgsArr;
  };
  //----------
  let devPostEffs:{id:string,postObj:any}[]=[];
  for(let eci=0;eci<currentLFXEConfigs.length;eci++){
    let devPost:any={id:currentLFXEConfigs[eci].dId,postObj:{type:fxId}};
    if(!lowMidHighEffects.includes(fxId)){devPost.postObj['config']={gradient:currentLFXEConfigs[eci].effectConfig.config.gradient}};
    if(currentLFXEConfigs[eci].effectConfig.type!==fxId){devPostEffs.push(devPost)};
  };
  //---------
  let pReqErrs:number=0;
  for(let pdi=0;pdi<devPostEffs.length;pdi++){
    const pR:{r:boolean,d:any}=await lfxAPIReq('post','virtuals/'+devPostEffs[pdi].id+'/effects',devPostEffs[pdi].postObj);
    if(!pR.r||!pR.d||pR.d.status!=='success'){availCons('changeLFXEffect|POST','ERROR - POSTing new Type for '+devPostEffs[pdi].id);pReqErrs++}
    else{
      if(devPostEffs[pdi].id===ledFXDeviceId){
        let rEIObj:any={isSupported:true,dtlfxIndex:(dtlfxSupportedFX.findIndex((t:string)=>t===fxId)),id:fxId,name:(fxType2Name(fxId)),rgb:{type:null,data:null}};
        if(pR.d.effect.config.hasOwnProperty('gradient')&&pR.d.effect.config.gradient){
          if(pR.d.effect.config.gradient.startsWith('#')){
            rEIObj.rgb.data=pR.d.effect.config.gradient;
            rEIObj.rgb.type='color';
          }else{
            rEIObj.rgb.type='gradient';
            const matchGradRes:{n:string,g:string,i:number}|false=(matchGStr(pR.d.effect.config.gradient));
            if(matchGradRes){rEIObj.rgb.data=matchGradRes}
            else{
              availCons('setLFXCoreData','ERROR: FAILED to match Gradient Str to Object!');
              rEIObj.rgb.data={n:'NK',g:pR.d.effect.config.gradient,i:-1};
            }
          };
        }else if((pR.d.effect.config.hasOwnProperty('color_lows')||pR.d.effect.config.hasOwnProperty('lows_color'))&&(pR.d.effect.config.hasOwnProperty('color_mids')||pR.d.effect.config.hasOwnProperty('mids_color'))&&(pR.d.effect.config.hasOwnProperty('color_high')||pR.d.effect.config.hasOwnProperty('high_color'))){
          rEIObj.rgb.type='colors';
          pR.d.effect.config.hasOwnProperty('color_lows')?rEIObj.rgb.data=[pR.d.effect.config.color_lows,pR.d.effect.config.color_mids,pR.d.effect.config.color_high]:rEIObj.rgb.data=[pR.d.effect.config.lows_color,pR.d.effect.config.mids_color,pR.d.effect.config.high_color];
        }else{rEIObj={isSupported:false,dtlfxIndex:-1,id:'-',name:'-',rgb:{type:null,data:null}}};
        rendEffectInfo=rEIObj;
      }
    }
  };
  if(pReqErrs>0){return Promise.resolve(false)}
  else{return Promise.resolve(true)};
};
//--------------------------------------------
async function changeLFXColors(colorStr:string):Promise<boolean>{
  //----------
  const gR:{r:boolean,d:any}=await lfxAPIReq('get','effects',null);
  if(!gR.r||!gR.d||gR.d.status!=='success'){availCons('changeLFXColors|GET','ERROR - GETing existing Device Effect Configs');return Promise.resolve(false)}
  else{
    let devCfgsArr:{dId:string,effectConfig:any}[]=[];
    for(const[k,v]of Object.entries(gR.d.effects)){const devEff:any=v;devCfgsArr.push({dId:k,effectConfig:{config:devEff.effect_config,type:devEff.effect_type}})};
    currentLFXEConfigs=devCfgsArr;
  };
  //----------
  let devPutGrads:{id:string,putObj:any}[]=[];
  for(let eci=0;eci<currentLFXEConfigs.length;eci++){
    let devPut:any=currentLFXEConfigs[eci];
    if(devPut.effectConfig.config.gradient!==colorStr){
      devPut.effectConfig.config.gradient=colorStr;
      devPutGrads.push({id:devPut.dId,putObj:devPut.effectConfig});
    }
  };
  //---------
  let pReqErrs:number=0;
  for(let pdi=0;pdi<devPutGrads.length;pdi++){
    availCons('changeLFXColors|putObj',devPutGrads[pdi].putObj);
    const pR:{r:boolean,d:any}=await lfxAPIReq('put','virtuals/'+devPutGrads[pdi].id+'/effects',devPutGrads[pdi].putObj);
    if(!pR.r||!pR.d||pR.d.status!=='success'){availCons('changeLFXColors|PUT','ERROR - PUTing new Gradient for '+devPutGrads[pdi].id);pReqErrs++}
    else{
      if(devPutGrads[pdi].id===ledFXDeviceId){
        if(pR.d.effect.config.gradient.startsWith('#')){
          rendEffectInfo.rgb.type='color';
          rendEffectInfo.rgb.data=pR.d.effect.config.gradient;
        }else{
          rendEffectInfo.rgb.type='gradient';
          const matchGradRes:{n:string,g:string,i:number}|false=(matchGStr(pR.d.effect.config.gradient));
          if(matchGradRes){rendEffectInfo.rgb.data=matchGradRes}
          else{
            availCons('changeLFXColors','ERROR: FAILED to match New Gradient Str to Object!');
            rendEffectInfo.rgb.data={n:'NK',g:pR.d.effect.config.gradient,i:-1};
          }
        }
      }
    }
  };
  if(pReqErrs>0){return Promise.resolve(false)}
  else{return Promise.resolve(true)};
};
//--------------------------------------------
async function sendVizInf2Z1Box():Promise<boolean>{
  await z1BoxSendViz('FX',rendEffectInfo.name);
  let colGradStr:string='';
  if(rendEffectInfo.rgb.type==='color'&&typeof rendEffectInfo.rgb.data==='string'){colGradStr=rendEffectInfo.rgb.data}
  else if(rendEffectInfo.rgb.type==='colors'&&typeof rendEffectInfo.rgb.data==='object'&&Array.isArray(rendEffectInfo.rgb.data)){colGradStr=String(rendEffectInfo.rgb.data.length)+' Colors'}
  else if(rendEffectInfo.rgb.type==='gradient'&&typeof rendEffectInfo.rgb.data==='object'&&!Array.isArray(rendEffectInfo.rgb.data)){colGradStr=rendEffectInfo.rgb.data.n};
  await z1BoxSendViz('grad',colGradStr);
  return Promise.resolve(true);
}
//--------------------------------------------
async function nextPrevLedFXEffect(nextPrev:string){
  availCons('nextPrevLedFXEffect','('+nextPrev+')...');
  let defEI:number=dtlfxSupportedFX.findIndex((eId:string)=>eId==='power'),
  newEI:number=defEI;
  const oldEI:number=dtlfxSupportedFX.findIndex((eId:string)=>eId===rendEffectInfo.id);
  if(oldEI!==-1){
    if(nextPrev==='next'){if((oldEI+1)>(dtlfxSupportedFX.length-1)){newEI=0}else{newEI=(oldEI+1)}}
    else{if((oldEI-1)<0){newEI=(dtlfxSupportedFX.length-1)}else{newEI=(oldEI-1)}};
  };
  const newE:string=dtlfxSupportedFX[newEI];
  const cLEffectRes:boolean=await changeLFXEffect(newE);
  if(cLEffectRes){
    rM('lfxEffectUpdate',rendEffectInfo);
    rM('showStatusMsg','LFX Type Changed ('+rendEffectInfo.name+')');
    z1BoxSendViz('FX',rendEffectInfo.name);
    rebuildCMs();
  }else{availCons('nextPrevLedFXEffect','ERROR: Change Effect to '+newE+' FAILED!')};
};
//--------------------------------------------
async function selectLedFXEffect(lfxEffectId:string){
  availCons('selectLedFxEffect','('+lfxEffectId+')...');
  const cLEffectRes:boolean=await changeLFXEffect(lfxEffectId);
  if(cLEffectRes){
    rM('lfxEffectUpdate',rendEffectInfo);
    rM('showStatusMsg','LFX Type Changed ('+rendEffectInfo.name+')');
    rebuildCMs();
  }else{availCons('nextPrevLedFXEffect','ERROR: Change Effect to '+lfxEffectId+' FAILED!')};
};
//--------------------------------------------
async function nextPrevGradient(nextPrev:string){
  availCons('nextPrevGradient','('+nextPrev+')...');
  let newGI:number=0;
  if(rendEffectInfo.rgb.type==='gradient'&&typeof rendEffectInfo.rgb.data==='object'&&!Array.isArray(rendEffectInfo.rgb.data)&&rendEffectInfo.rgb.data.i!==-1){
    const oldGI:number=rendEffectInfo.rgb.data.i;
    if(nextPrev==='next'){if((oldGI+1)>(dtlfxDefGradsArr.length-1)){newGI=0}else{newGI=(oldGI+1)}}
    else{if((oldGI-1)<0){newGI=(dtlfxDefGradsArr.length-1)}else{newGI=(oldGI-1)}};
  };
  const newG:{name:string,gradient:string}=dtlfxDefGradsArr[newGI];
  const cLCGradRes:boolean=await changeLFXColors(newG.gradient);
  if(cLCGradRes){
    rM('lfxEffectUpdate',rendEffectInfo);
    let colGradStr:string='';
    if(rendEffectInfo.rgb.type==='color'&&typeof rendEffectInfo.rgb.data==='string'){colGradStr=rendEffectInfo.rgb.data}
    else if(rendEffectInfo.rgb.type==='colors'&&typeof rendEffectInfo.rgb.data==='object'&&Array.isArray(rendEffectInfo.rgb.data)){colGradStr=String(rendEffectInfo.rgb.data.length)+' Colors'}
    else if(rendEffectInfo.rgb.type==='gradient'&&typeof rendEffectInfo.rgb.data==='object'&&!Array.isArray(rendEffectInfo.rgb.data)){colGradStr=rendEffectInfo.rgb.data.n};
    rM('showStatusMsg','LFX Color Changed ('+colGradStr+')');
    z1BoxSendViz('grad',colGradStr);
    rebuildCMs();
  };
};
//--------------------------------------------
async function selectLedFXGradient(gradArrIndex:number){
  availCons('selectLedFXGradient','('+String(gradArrIndex)+')...');
  const newGradData:{n:string,g:string,i:number}={n:dtlfxDefGradsArr[gradArrIndex].name,g:dtlfxDefGradsArr[gradArrIndex].gradient,i:gradArrIndex};
  const cLCGradRes:boolean=await changeLFXColors(newGradData.g);
  if(cLCGradRes){
    rM('lfxEffectUpdate',rendEffectInfo);
    rM('showStatusMsg','LFX Color Changed ('+newGradData.n+')');
    rebuildCMs();
  };
}
//--------------------------------------------
async function setNewGradientColor(colHex:string|string[]){
  availCons('setNewGradient','('+colHex+')...');
  if(rendEffectInfo!==null&&rendEffectInfo.isSupported&&!lowMidHighEffects.includes(rendEffectInfo.id)&&typeof colHex==='string'){
    const cLEColRes:boolean=await changeLFXColors(colHex);
    if(cLEColRes){
      rM('lfxEffectUpdate',rendEffectInfo);
      let colGradStr:string='';
      if(rendEffectInfo.rgb.type==='color'&&typeof rendEffectInfo.rgb.data==='string'){colGradStr=rendEffectInfo.rgb.data}
    else if(rendEffectInfo.rgb.type==='colors'&&typeof rendEffectInfo.rgb.data==='object'&&Array.isArray(rendEffectInfo.rgb.data)){colGradStr=String(rendEffectInfo.rgb.data.length)+' Colors'}
    else if(rendEffectInfo.rgb.type==='gradient'&&typeof rendEffectInfo.rgb.data==='object'&&!Array.isArray(rendEffectInfo.rgb.data)){colGradStr=rendEffectInfo.rgb.data.n};
    rM('showStatusMsg','LFX Color Changed ('+colGradStr+')');
    rebuildCMs();
    }
  }
};
//////////////////////////////////////////////
// ICUE FUNCTIONS
//////////////////////////////////////////////
export const SSD2VerStr=(ds:any):CUEVersObj=>{
  let newVs:CUEVersObj={clientVersion:'',serverVersion:'',serverHostVersion:''};
  for(const[k,v]of Object.entries(ds)){const ve:any=v;newVs[k]=String(ve.major)+'.'+String(ve.minor)+'.'+String(ve.patch)};
  return newVs;
}
//--------------------------------------------
function CUESS2Status(sdkStatus:CUESDKStatus,sSEvent:any):Promise<CUESDKStatus>{
  let newStatus:CUESDKStatus=sdkStatus;
  if(sSEvent.hasOwnProperty('error')&&!_.isEmpty(sSEvent.error)&&Number(sSEvent)!==sdkStatus.error.code){newStatus.error=getCUESess(Number(sSEvent.error))};
  if(sSEvent.hasOwnProperty('data')&&!_.isEmpty(sSEvent.data)){
    if(sSEvent.data.hasOwnProperty('details')&&!_.isEmpty(sSEvent.data.details)){const nD:CUEVersObj=SSD2VerStr(sSEvent.data.details);if(!_.isEqual(nD,sdkStatus.versions)){newStatus.versions=nD}};
    if(sSEvent.data.hasOwnProperty('state')&&sSEvent.data.state!==sdkStatus.session.code){newStatus.session=getCUESess(Number(sSEvent.data.state))};
  };
  return Promise.resolve(newStatus);
};
//--------------------------------------------
async function getCUEConn():Promise<CUESDKStatus>{
  const strV=(vO:any):string=>{return String(vO.major)+'.'+String(vO.minor)+'.'+String(vO.patch)};
  const discoVs=(sVO:any,sVHO:any):boolean=>{if(Object.values(sVO).every((sV:any)=>Number(sV)===0)&&Object.values(sVHO).every((sVH:any)=>Number(sVH)===0)){return true}else{return false}};
  let resCodes:number[]=[-1,-1],vStrs:string[]=['0.0.0','0.0.0','0.0.0'];
  try{
    const{error,data}=await sdk.CorsairGetSessionDetails();
    if(Number(error)===0&&(discoVs(data.serverVersion,data.serverHostVersion))){resCodes=[1,0]}else{resCodes=[0,0]};
    vStrs=[strV(data.clientVersion),strV(data.serverVersion),strV(data.serverHostVersion)];
  }catch(e){resCodes=[0,69];console.log(e)};
  cueSDKStatus={session:(getCUESess(resCodes[0])),error:(getCUEErr(resCodes[1])),versions:{clientVersion:vStrs[0],serverVersion:vStrs[1],serverHostVersion:vStrs[2]}};
  return Promise.resolve(cueSDKStatus);
}
//--------------------------------------------
async function initCUESDK():Promise<boolean>{
  await getCUEConn();
  if(cueSDKStatus.session.code===0&&cueSDKStatus.error.code===69){return Promise.resolve(false)};
  if(cueSDKStatus.session.code===2){await doW(3)};
  if((cueSDKStatus.error.code===0||cueSDKStatus.error.code===1)&&cueSDKStatus.session.code!==6){
    sdk.CorsairConnect(async(sS:any)=>{
      cueSDKStatus=await CUESS2Status(cueSDKStatus,sS);
      rM('showStatusMsg','ICUE SDK: '+(cueSDKStatus.error.code!==0?cueSDKStatus.error.msg:cueSDKStatus.session.msg));
      if(cueSDKStatus.error.code===0&&cueSDKStatus.session.code===6){
        cueDevsData=await getCUEDevs();
      }
    });
  }
  return Promise.resolve(true);
};
//--------------------------------------------
ipcMain.handle('dType2Str',(e:any,args:any[])=>{return sdk.CorsairDeviceTypeToString(args[0])});
//--------------------------------------------
async function getCUEDevs():Promise<CUEDevicesRaw|false>{
  let newCDevs:CUEDevicesRaw={count:<number>0,devices:<CUEDeviceRaw[]>[]};
  const cGDRes:any=sdk.CorsairGetDevices({deviceTypeMask:sdk.CorsairDeviceType.CDT_All});
  if(Number(cGDRes.error)!==0){cueSDKStatus.error=getCUEErr(Number(cGDRes.error));return Promise.resolve(false)};
  if(cGDRes.data.length<1){return Promise.resolve(false)};
  const devices:CUEInfo[]=cGDRes.data;
  for(let rdI=0;rdI<devices.length;rdI++){
    newCDevs.count++;
    let thisDev:any={info:devices[rdI],pos:[],colors:[]};
    const{data:ledPositions}=sdk.CorsairGetLedPositions(devices[rdI].id);
    thisDev.pos=ledPositions;
    let rdLEDBC:any[]=ledPositions.map((p:any)=>({id:p.id,r:0,g:0,b:0,a:0}));
    sdk.CorsairGetLedColors(devices[rdI].id,rdLEDBC);
    sdk.CorsairRequestControl(devices[rdI].id,sdk.CorsairAccessLevel.CAL_ExclusiveLightingControlAndKeyEventsListening);
    thisDev.colors=rdLEDBC;
    newCDevs.devices.push(thisDev);
  };
  cueDevsData=newCDevs;
  //----------
  let newSetDefDevList:CUESetDeviceLED[]=[];
  for(let cdi=0;cdi<cueDevsData.devices.length;cdi++){
    const cD:CUEDeviceRaw=cueDevsData.devices[cdi];
    newSetDefDevList.push({id:cD.info.id,colors:cD.colors});
  };
  cueSetDevsLEDList=newSetDefDevList;
  //----------
  return Promise.resolve(newCDevs);
};
//--------------------------------------------
function convertPayload4ICUE(p:{[key:string]:number}){
  if(p){
    const getRGBChunks=(a:number[]):{r:number,g:number,b:number}[]=>{
      let rgbChunks:{r:number,g:number,b:number}[]=[];
      for(let ai=0;ai<a.length;ai+=3){
        const rgbArr:number[]=a.slice(ai,ai+3);
        if(rgbArr.length===3){rgbChunks.push({r:Math.round(255*(rgbArr[0]/100)),g:Math.round(255*(rgbArr[1]/100)),b:Math.round(255*(rgbArr[2]/100))})}
        else{rgbChunks.push({r:rgbChunks[0].r,g:rgbChunks[0].g,b:rgbChunks[0].b})};
      };
      return rgbChunks;
    };
    //----------
    let newPLArr:number[]=new Array(36).fill(0);
    for(const[k,v]of Object.entries(p)){newPLArr[(Number(k)-1)]=Math.floor(v)};
    sacnRGBArr=getRGBChunks(newPLArr);
    animICUEDevs(sacnRGBArr);
  };
};
//--------------------------------------------
function animICUEDevs(setRGBArr:{r:number,g:number,b:number}[]){
  for(let sdi=0;sdi<cueSetDevsLEDList.length;sdi++){
    cueSetDevsLEDList[sdi].colors=cueSetDevsLEDList[sdi].colors.map((ledCO:any,index:number)=>{
      const rgbIndex:number=index%setRGBArr.length;
      return {id:ledCO.id,r:setRGBArr[rgbIndex].r,g:setRGBArr[rgbIndex].g,b:setRGBArr[rgbIndex].b,a:255};
    });
    availCons('animICUE|'+cueSetDevsLEDList[sdi].id,cueSetDevsLEDList[sdi].colors);
    sdk.CorsairSetLedColors(cueSetDevsLEDList[sdi].id,cueSetDevsLEDList[sdi].colors);
  };
};
//////////////////////////////////////////////
//////////////////////////////////////////////
//////////////////////////////////////////////

