/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable no-case-declarations */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-extra-semi */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-unsafe-return */
//////////////////////////////////////////////////
import {Component,OnInit,ChangeDetectorRef,ViewChild,ElementRef} from '@angular/core';
import {IpcRendererEvent, Rectangle, Size, ipcRenderer} from 'electron';
import {DomSanitizer,SafeResourceUrl} from '@angular/platform-browser';
import {format,fromUnixTime,getTime,getUnixTime,isValid,parse,subDays} from 'date-fns';
import * as _ from 'lodash';
import * as sacn from 'sacn';
//////////////////////////////////////////////////
@Component({selector:'app-home',templateUrl: './home.component.html',styleUrls: ['./home.component.scss']})
//////////////////////////////////////////////////
export class HomeComponent implements OnInit {
//////////////////////////////////////////////////
@ViewChild('statusWrap') statusWrap:ElementRef<HTMLDivElement>;
@ViewChild('imagesCanvasWrap') imagesCanvasWrap:ElementRef<HTMLDivElement>;
@ViewChild('imagesCanvas') imagesCanvas:ElementRef<HTMLCanvasElement>;
@ViewChild('bandsCanvasWrap') bandsCanvasWrap:ElementRef<HTMLDivElement>;
@ViewChild('bandsCanvas') bandsCanvas:ElementRef<HTMLCanvasElement>;
@ViewChild('blocksCanvasWrap') blocksCanvasWrap:ElementRef<HTMLDivElement>;
@ViewChild('blocksCanvas') blocksCanvas:ElementRef<HTMLCanvasElement>;
@ViewChild('platesCanvasWrap') platesCanvasWrap:ElementRef<HTMLDivElement>;
@ViewChild('platesCanvas') platesCanvas:ElementRef<HTMLCanvasElement>;
//////////////////////////////////////////////////
  // Window/State Vars
  dtlfxWinStates:any={monSize:<Rectangle>{x:0,y:0,width:0,height:0},useSize:<Size>{height:0,width:0},sizePos:<Rectangle>{x:0,y:0,width:0,height:0},viz:<'showing'|'hidden'>'hidden',fullscreen:false,unresponsive:false};
  ledFXCurrentEffect:{isSupported:boolean,dtlfxIndex:number,id:string,name:string,rgb:{type:'color'|'colors'|'gradient',data:string|string[]|{n:string,g:string,i:number}}}|null=null;
  dtlfxAnimSpeed:number=50;
  dtlfxWindowIsReady:boolean=false;
  dtlfxShowStatsBar:boolean=true;
  // Status/Msg Vars
  doConsPLI:boolean=true;
  dtlfxStatus:{msg:string|null,to:any,prog:null|{i:string,d:number,p:string}}={msg:null,to:null,prog:null};
  // DMX Data Vars
  dtlfxRAW:number[]=[];
  dtlfxAMP:number=0;
  dtlfxRGB:{r:number,g:number,b:number}[]=[];
  dtlfxIsOn:boolean=false;
  dtlfxIsPaused:boolean=false;
  // Media List Vars
  showBlockProg:boolean=false;
  newBlockLoading:{[key:string]:boolean}={images:false,plates:false};
  blockLimits:{[key:string]:number}={images:200,plates:200};
  uMediaListsData:{[key:string]:{active:boolean,list:string[],block:{i:number,d:string}[]}}={
    images:{active:false,list:[],block:[]},
    plates:{active:false,list:[],block:[]}
  };
  usedM:{[key:string]:number}={images:0,plates:0};
  // Layer Toggles
  dtlfxLayerToggles:{[key:string]:boolean}={subbeat:true,bands:true,blocks:true,images:true,plates:true};
  actLayersCount:number=1;
  // Framerate Vars
  dtlfxMainFilterFPS:number=30;
  dtlfxMainFPSLimit:number=100;
  dtlfxRenderTargetFPS:number=30;
  dtlfxLastFrameTime:number=0;
  dtlfxReqFrame:boolean=false;
  dtlfxFrameId:number=0;
  // Anim Vars
  animGlobals:{dms:{w:number,h:number},zIs:{[key:string]:number}}={dms:{w:0,h:0},zIs:{subbeat:4,bands:3,blocks:2,plates:5,images:1}};
  zIsFrameCount:number=0;
  zIsIsShuff:boolean=false;
  // SubBeat Layer
  subH:number=0;
  subBG:string='black';
  subRadBG:string='transparent';
  subRot:number=0;
  subTrans:number=0.5;
  subRadTrans:number=0.5;
  // Bands Canvas Layer
  bandsCTX:CanvasRenderingContext2D|null=null;
  bandsDataArr:number[]=[];
  bandsColorArr:string[]=[];
  bandsColorArrCount:number=0;
  sbYPos:number[]=[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
  sbYDir:number[]=[4,-4,4,-4,4,-4,4,-4,4,-4,4,-4];
  // Blocks Canvas Layer
  blocksCTX:CanvasRenderingContext2D|null=null;
  blocksPass:number=0;
  blocksRot:number=0;
  // Plates Canvas Layer
  platesCTX:CanvasRenderingContext2D|null=null;
  platesImgInst:HTMLImageElement|null=null;
  platesAnimDone:boolean=true;
  // Images Canvas Layer
  imagesCTX:CanvasRenderingContext2D|null=null;
  imagesImgInst:HTMLImageElement|null=null;
  imagesAnimDone:boolean=true;
  // Performance
  perfINT:any=null;
  perfST:number=0;
  perfPacketCount:number=0;
  perfFrameCount:number=0;
  perfAnimSbCount:number=0;
  perfAnimBaCount:number=0;
  perfAnimBlCount:number=0;
  perfAnimImCount:number=0;
  perfAnimPlCount:number=0;
  perfLastResult:any={p:0,f:0,a:{sb:0,ba:0,bl:0,i:0,p:0}};
  // Calcs
  nowPacket:any;
  calcsAccArr:number[]=[];
  calcsMeanArr:number[]=[];
  calcsSDevArr:number[]=[];
  calcsMeanV:number=0;
  calcsSDevV:number=0;
  calcsTHHigh:number=0;
  calcsTHMid:number=0;
  calcsTHLow:number=0;
  // Preloads
  mbLoadTimes:{[key:string]:{avg:number,times:number[]}}={images:{avg:0,times:[]},plates:{avg:0,times:[]}};
  mbRunTimes:{[key:string]:{st:number,rt:number}}={images:{st:0,rt:0},plates:{st:0,rt:0}};
  mbPreloadNo:{[key:string]:number}={images:-1,plates:-1};
//////////////////////////////////////////////////
  constructor(
    private changeDet:ChangeDetectorRef,
    private sanitizer:DomSanitizer
    ){}
//////////////////////////////////////////////////
// LIFECYCLE FUNCTIONS
//////////////////////////////////////////////////
  ngOnInit():void{this.preInit()}
//------------------------------------------------
  preInit(){
    this.cCons('preInit','()...');
    //------------
    ipcRenderer.on('dtlfxWindowIsReady',async(e:any,args:any[])=>{
      ipcRenderer.send('dtlfxDoShowWindow',true);
      await this.initFunctions();
      this.dtlfxWindowIsReady=true;
      this.pDOM();
      ipcRenderer.send('homeInitsDone',true);
    });
    ipcRenderer.on('animSpeedUpdate',(e:any,args:any[])=>{this.dtlfxAnimSpeed=args[0]});
    ipcRenderer.on('showStatsBarUpdate',(e:any,args:any[])=>{this.dtlfxShowStatsBar=args[0];this.pDOM()});
    ipcRenderer.on('winStateUpdate',(e:IpcRendererEvent,args:any[])=>{
      this.dtlfxWinStates=args[0];
      this.cCons('IPC|Home|winStateUpdate',args[0]);
      this.animGlobals.dms={w:this.dtlfxWinStates.sizePos.width,h:this.dtlfxWinStates.sizePos.height};
      if(this.dtlfxWinStates.unresponsive){this.cCons('dtlfxWindow|EVENT|unresponsive','!!!WARNING!!! Window Unresponsive')};
      this.pDOM();
    });
    ipcRenderer.on('lfxEffectUpdate',(e:any,args:any)=>{console.log('lfxEffectUpdate|HOME Listen');console.log(args[0]);this.ledFXCurrentEffect=args[0]});
    ipcRenderer.on('mainFilterFPSUpdate',(e:any,args:any[])=>{this.dtlfxMainFilterFPS=args[0];this.pDOM()});
    ipcRenderer.on('showStatusMsg',(e:IpcRendererEvent,args:any[])=>{this.statusText(args[0])});
    ipcRenderer.on('uMediaListData',(e:any,args:any[])=>{this.uMediaListsData=args[0]});
    ipcRenderer.on('startStopDTLFX',(e:any,args:any[])=>{this.startStopDTLFX(args[0])});
    ipcRenderer.on('sendAvailCons',(e:any,args:any[])=>{this.availCons(args[0],args[1])});
    ipcRenderer.on('getRandUBlockProg',(e:IpcRendererEvent,args:any[])=>{if(this.showBlockProg){this.statusText('Loading '+this.capd(args[0]),{i:String(args[1])+'/'+String(args[2]),d:Number((args[1]/args[2]).toFixed(2)),p:((args[1]/args[2])*100).toFixed(0)+'%'})}});
    ipcRenderer.on('toggleDTLFXLayer',(e:any,args:any[])=>{
      if(this.dtlfxLayerToggles[args[0]]!==args[1]){
        this.dtlfxLayerToggles[args[0]]=args[1];
        this.actLayersCount=Object.values(this.dtlfxLayerToggles).filter((v:boolean)=>(v)).length;
        this.statusText(this.capd(args[0])+' Layer Toggled: '+(args[1]?'ON':'OFF'));
        this.pDOM();
      };
    });
    ipcRenderer.on('soloDTLFXLayer',(e:any,args:any[])=>{
      this.dtlfxLayerToggles=args[1];
      this.pDOM();
      this.statusText('Activate '+this.capd(args[0])+' Layer Solo');
    });
  }
//-------------------------------------------------
  async initFunctions():Promise<boolean>{
    this.cCons('initFunctions','()...');
    this.dtlfxAnimSpeed=await ipcRenderer.invoke('getDTLFXAnimSpeed');
    this.dtlfxShowStatsBar=await ipcRenderer.invoke('getDTLFXShowStatsBar');
    if(!this.ledFXCurrentEffect){
      const getLCE:false|{isSupported:boolean,dtlfxIndex:number,id:string,name:string,rgb:{type:'color'|'colors'|'gradient',data:string|string[]|{n:string,g:string,i:number}}}=await ipcRenderer.invoke('getLFXCurrentEffect');
      if(getLCE){this.ledFXCurrentEffect=getLCE};
    };
    await this.refreshMediaBlocks(true);
    this.imagesCTX=this.imagesCanvas.nativeElement.getContext('2d');
    this.bandsCTX=this.bandsCanvas.nativeElement.getContext('2d');
    this.blocksCTX=this.blocksCanvas.nativeElement.getContext('2d');
    this.platesCTX=this.platesCanvas.nativeElement.getContext('2d');
    this.statusText('DTLFX Initiated');
    return Promise.resolve(true);
  }
//------------------------------------------------
  async refreshMediaBlocks(p2Cons?:boolean):Promise<boolean>{
    this.cCons('refreshMediaBLocks','()...');
    const freshUMediaList:any=await ipcRenderer.invoke('getUMediaListsData');
    this.uMediaListsData=freshUMediaList;
    if(p2Cons&&p2Cons===true){this.showBlockProg=true;this.cCons('initFunctions|uMediaLists','------------------------| MEDIA LISTS |---------------------')};
    for(const[k,v]of Object.entries(this.uMediaListsData)){
      if(v.active&&v.list.length>0){
        this.uMediaListsData[k].block=[];
        await this.loadRandUMediaBlock(k);
        if(p2Cons&&p2Cons===true){this.cCons('initFunctions|uMediaLists','['+k.toUpperCase()+'] - Active: '+String(v.active)+', List(C*): '+String(v.list.length)+', Block(C*): '+String(v.block.length))};
      };
    };
    if(p2Cons&&p2Cons===true){this.showBlockProg=false;this.cCons('initFunctions|uMediaLists','-----------------------------------------------------------')};
    return Promise.resolve(true);
  }
//------------------------------------------------
  async calcMBPreloadNo(type:string){
    this.cCons('calcMBPreloadIndex','('+type+')...');
    const lastRT:number=this.mbRunTimes[type].rt;
    const avgLT:number=this.mbLoadTimes[type].avg;
    if(avgLT>lastRT){this.mbPreloadNo[type]=-1;return}
    else{
      const rtPI:number=Math.floor((lastRT/this.blockLimits[type]));
      const irtPALT:number=Math.floor(avgLT/rtPI);
      const plI:number=this.blockLimits[type]-irtPALT;
      this.mbPreloadNo[type]=plI;
    };
  }
//------------------------------------------------
  getFXGradBG():string{
    if(this.ledFXCurrentEffect.rgb.type==='color'&&typeof this.ledFXCurrentEffect.rgb.data==='string'){return this.ledFXCurrentEffect.rgb.data}
    else if(this.ledFXCurrentEffect.rgb.type==='gradient'&&typeof this.ledFXCurrentEffect.rgb.data==='object'&&!Array.isArray(this.ledFXCurrentEffect.rgb.data)&&this.ledFXCurrentEffect.rgb.data.i!==-1){return this.ledFXCurrentEffect.rgb.data.g}else{return 'black'};
  }
//------------------------------------------------
  consolePreloadInfo(){
    this.cCons('consolePreloadInfo','---------------------------------------------------------------------------------------');
    this.cCons('consolePreloadInfo','| MEDIA BLOCK PRELOAD INFO:');
    this.cCons('consolePreloadInfo','---------------------------------------------------------------------------------------');
    this.cCons('consolePreloadInfo','| > RUN-Time  - (images): '+(this.mbRunTimes.images.rt>0?String(this.mbRunTimes.images.rt)+'ms':'N/A')+' | (plates): '+(this.mbRunTimes.plates.rt>0?String(this.mbRunTimes.plates.rt)+'ms':'N/A'));
    this.cCons('consolePreloadInfo','| > LOAD-Time - (images): '+(this.mbLoadTimes.images.avg>0?String(this.mbLoadTimes.images.avg)+'ms':'N/A')+' | (plates): '+(this.mbLoadTimes.plates.avg>0?String(this.mbLoadTimes.plates.avg)+'ms':'N/A'));
    this.cCons('consolePreloadInfo','| > PLOAD-No  - (images): '+(this.mbPreloadNo.images!==-1?String(this.mbPreloadNo.images):'N/A')+' | (plates): '+(this.mbPreloadNo.plates!==-1?String(this.mbPreloadNo.plates):'N/A'));
    this.cCons('consolePreloadInfo','---------------------------------------------------------------------------------------');
    this.doConsPLI=false;
  }
//------------------------------------------------
  addMBRunTime(type:string,newTime:number){
    const oldRT:number=this.mbRunTimes[type].rt;
    this.mbRunTimes[type].rt=newTime;
    const newPI:number=Math.floor(newTime/this.blockLimits[type]);
    if(Math.abs(oldRT-newTime)>newPI){
      if(this.mbLoadTimes[type].avg!==0){this.calcMBPreloadNo(type)};
    }
  }
//------------------------------------------------
  addMBLoadTime(type:string,newTime:number){
    this.cCons('addMBLoadTimes','('+type+','+String(newTime)+')...');
    this.mbLoadTimes[type].times.push(newTime);
    if(this.mbLoadTimes[type].times.length>10){this.mbLoadTimes[type].times.splice(0,5)};
    const newAvg:number=Math.ceil((this.meanArr(this.mbLoadTimes[type].times)));
    let doUpdAvg:boolean;
    if(this.mbLoadTimes[type].avg===0){doUpdAvg=true}
    else if((Math.floor(Math.abs(this.mbLoadTimes[type].avg-newAvg)))>100){doUpdAvg=true}
    else{doUpdAvg=false};
    if(doUpdAvg){
      this.mbLoadTimes[type].avg=newAvg;
      if(this.mbRunTimes[type].rt!==0){this.calcMBPreloadNo(type)};
    }
  }
//------------------------------------------------
  async loadRandUMediaBlock(type:string):Promise<boolean>{
    if(this.uMediaListsData[type].active&&this.uMediaListsData[type].list.length>0){
      const lmbST:number=Date.now();
      const fetchR:{i:number,d:string}[]=await ipcRenderer.invoke('getRandUMediaDataBlock',[type]);
      if(fetchR.length>0){
        this.usedM[type]=0;
        this.uMediaListsData[type].block=fetchR;
        this.pDOM();
        const lmbTT:number=(Date.now()-lmbST);
        this.addMBLoadTime(type,lmbTT);
      };
    }else{this.cCons('loadRandUMediaBlock','SKIPPED - '+type.toUpperCase()+' !== ACTIVE')};
    return Promise.resolve(true);
  }
//------------------------------------------------
  togglePerfCounts(action:'start'|'stop'):Promise<boolean>{
    this.cCons('togglePerfCounts','('+action+')...');
    const zeroPLR:{[key:string]:number|{[key:string]:number}}={p:0,f:0,a:{sb:0,ba:0,bl:0,i:0,p:0}};
    const zeroCountArr:string[]=['perfST','perfPacketCount','perfFrameCount','perfAnimSbCount','perfAnimBaCount','perfAnimBlCount','perfAnimImCount','perfAnimPlCount'];
    if(action==='start'){
      this.perfINT=setInterval(()=>{
        if(this.perfST!==0){
          const eTSecs:number=((Date.now())-this.perfST)/1000;
          this.perfLastResult={p:Number((this.perfPacketCount/eTSecs).toFixed(0)),f:Number((this.perfFrameCount/eTSecs).toFixed(0)),a:{sb:Number((this.perfAnimSbCount/eTSecs).toFixed(0)),ba:Number((this.perfAnimBaCount/eTSecs).toFixed(0)),bl:Number((this.perfAnimBlCount/eTSecs).toFixed(0)),i:Number((this.perfAnimImCount/eTSecs).toFixed(0)),p:Number((this.perfAnimPlCount/eTSecs).toFixed(0))}};
          this.pDOM();
        };
        for(let zi=0;zi<zeroCountArr.length;zi++){this[zeroCountArr[zi]]=0};
        this.checkMain2RenderPacketFPS();
        this.perfST=Date.now();
        //----------
        if(this.doConsPLI){
          let rOCC:number=0,rOCR:number=0;
          if(this.uMediaListsData.images.block.length===this.blockLimits.images){rOCC++;if(this.mbPreloadNo.images!==-1){rOCR++}};
          if(this.uMediaListsData.plates.block.length===this.blockLimits.plates){rOCC++;if(this.mbPreloadNo.plates!==-1){rOCR++}};
          if(rOCR===rOCC){this.consolePreloadInfo()};
        };
        //----------
      },6000);
    }else{
      if(this.perfINT!==null){clearInterval(this.perfINT);this.perfINT=null};
      for(let zi=0;zi<zeroCountArr.length;zi++){this[zeroCountArr[zi]]=0};
      this.perfLastResult=zeroPLR;
    };
    return Promise.resolve(true)
  }
//------------------------------------------------
  checkMain2RenderPacketFPS(){
    const actFPS:number=this.perfLastResult.p,tarFPS:number=this.dtlfxRenderTargetFPS;
    if(actFPS===tarFPS){return}
    else{
      let incDec:string,adjFPS:number;
      if(actFPS<tarFPS){incDec='inc';adjFPS=(this.dtlfxMainFilterFPS+1)}else{incDec='dec';adjFPS=(this.dtlfxMainFilterFPS-1)};
      if(incDec==='inc'&&this.dtlfxMainFilterFPS===this.dtlfxMainFPSLimit){return};
      if(incDec==='dec'&&this.dtlfxMainFilterFPS===tarFPS){return};
      ipcRenderer.send('changeMainFilterFPS',[adjFPS]);
    };
  }
//------------------------------------------------
  async startStopDTLFX(action:'start'|'stop'){
    this.cCons('startStopDTLFX','('+action+')...');
    if(action==='start'){
      ipcRenderer.on('dmxRecData',(e:any,args:any[])=>{
        if(this.dtlfxIsOn){this.perfPacketCount++};
        this.nowPacket=args[0];
      });
      this.dtlfxAnimStart();
    }else{
      this.dtlfxIsOn=false;
      ipcRenderer.removeAllListeners('dmxRecData');
      await this.togglePerfCounts('stop');
      this.dtlfxAnimStop();
    };
  }
//------------------------------------------------
  doCalcs(m:number){
    const calcsNs:{a:string,v:string}[]=[{a:'calcsMeanArr',v:'calcsMeanV'},{a:'calcsSDevArr',v:'calcsSDevV'}];
    this.calcsAccArr.push(m);
    if(this.calcsAccArr.length>=300){
      const aMV:number=this.meanArr(this.calcsAccArr);this.calcsMeanArr.push(aMV);
      const aSDV:number=this.sdevArr(this.calcsAccArr,aMV);this.calcsSDevArr.push(aSDV);
      this.calcsAccArr=[];let updTHs:boolean=false;
      for(let ci=0;ci<calcsNs.length;ci++){
        if(this[calcsNs[ci].a].length>=3){
          if(this[calcsNs[ci].a].length>30){this[calcsNs[ci].a].splice(0,15)};
          this[calcsNs[ci].v]=Math.floor((this.meanArr(this[calcsNs[ci].a])));
          updTHs=true;
        };
      };
      if(updTHs){
        this.calcsTHLow=(this.calcsMeanV-this.calcsSDevV);
        this.calcsTHMid=this.calcsMeanV;
        this.calcsTHHigh=(this.calcsMeanV+this.calcsSDevV);
      };
      this.pDOM();
    };
  }
//------------------------------------------------
  hasTHVs():boolean{if(this.calcsTHLow&&typeof this.calcsTHLow==='number'&&this.calcsTHLow>0&&this.calcsTHMid&&typeof this.calcsTHMid==='number'&&this.calcsTHMid>0&&this.calcsTHHigh&&typeof this.calcsTHHigh==='number'&&this.calcsTHHigh>0){return true}else{return false}}
//------------------------------------------------
  thRange(v:number):0|1|2|3{
    if(v>this.calcsTHHigh){return 3}
    else if(v<=this.calcsTHHigh&&v>this.calcsTHMid){return 2}
    else if(v<=this.calcsTHMid&&v>this.calcsTHLow){return 1}
    else if(v<=this.calcsTHLow){return 0};
  }
//------------------------------------------------
  processPacket(p:{[key:string]:number}):Promise<boolean>{
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
      this.dtlfxRAW=newPLArr;
      this.dtlfxAMP=this.meanArr(this.dtlfxRAW);
      this.dtlfxRGB=getRGBChunks(this.dtlfxRAW);
      this.doCalcs(this.dtlfxAMP);
    };
    return Promise.resolve(true);
  }
//------------------------------------------------
  async dtlfxAnimStart():Promise<boolean>{
    this.cCons('dtlfxAnimStart','STARTED...');
    await this.refreshMediaBlocks();
    if(!this.dtlfxReqFrame){this.dtlfxReqFrame=true};
    await this.togglePerfCounts('start');
    this.dtlfxIsOn=true;
    this.dtlfxAnimStep();
    return Promise.resolve(true);
  }
//------------------------------------------------
  async dtlfxAnimStop():Promise<boolean>{
    this.cCons('dtlfxAnimStop','STOPPED.');
    this.dtlfxReqFrame=false;this.dtlfxFrameId=0;this.perfFrameCount=0;
    this.clrCanvas(this.bandsCTX);this.clrCanvas(this.blocksCTX);this.clrCanvas(this.imagesCTX);this.clrCanvas(this.platesCTX);
    this.bandsDataArr=[];this.bandsColorArr=[];
    this.animGlobals={dms:{w:this.dtlfxWinStates.sizePos.width,h:this.dtlfxWinStates.sizePos.height},zIs:{images:1,bands:3,blocks:2,plates:4}};
    for(const[k,v]of Object.entries(this.uMediaListsData)){if(v.active&&v.list.length===this.blockLimits[k]&&v.block.length>0){this.uMediaListsData[k].block=[]}};
    this.pDOM();
    return Promise.resolve(true);
  }
//------------------------------------------------
  async dtlfxAnimStep(){
    if(!this.dtlfxReqFrame){window.cancelAnimationFrame(this.dtlfxFrameId);this.dtlfxFrameId=0;this.perfFrameCount=0}
    else{
      const dmxNowFrameTime:number=Date.now();
      if((dmxNowFrameTime-this.dtlfxLastFrameTime)>=(1000/this.dtlfxRenderTargetFPS)){
        this.dtlfxLastFrameTime=dmxNowFrameTime;
        await this.processPacket(this.nowPacket);
        this.doDTLFXFrameLoop({raw:this.dtlfxRAW,amp:this.dtlfxAMP,rgb:this.dtlfxRGB});
        if(this.dtlfxIsOn){this.perfFrameCount++};
      };
      this.dtlfxFrameId=window.requestAnimationFrame(async()=>await this.dtlfxAnimStep());
    }
  }
//------------------------------------------------
  doAni(type:string,data:{raw:number[],amp:number,rgb:{r:number,g:number,b:number}[]}){if(this.dtlfxLayerToggles[type]){if(!['images','plates'].includes(type)){this['do'+this.capd(type)+'Anim'](data)}else{if(this.uMediaListsData[type].active&&this.uMediaListsData[type].block.length>0&&this[type+'AnimDone']){this['do'+this.capd(type)+'Anim'](data)}}}}
//------------------------------------------------
  async doDTLFXFrameLoop(lD:{raw:number[],amp:number,rgb:{r:number,g:number,b:number}[]}){
    if(this.dtlfxAnimSpeed>0){
      for(const t of Object.keys(this.dtlfxLayerToggles)){this.doAni(t,lD)};
      this.shuffleLayerIs(lD.amp);
    }
  };
//------------------------------------------------
  shuffleLayerIs(amp:number){
    const doShuff=(isKick?:true)=>{
      if(!this.zIsIsShuff){
        this.zIsIsShuff=true;
        if(!isKick){
          let zIsArr:number[]=[1,2,3,4,5],remLs:string[]=['subbeat','bands','blocks','images'];
          this.animGlobals.zIs.plates!==5?this.animGlobals.zIs.plates=5:this.animGlobals.zIs.plates=this.randArr(zIsArr);
          zIsArr=zIsArr.filter((l:number)=>l!==this.animGlobals.zIs.plates);
          for(let rli=0;rli<remLs.length;rli++){this.animGlobals.zIs[remLs[rli]]=(this.randArr(zIsArr));zIsArr=zIsArr.filter((l:number)=>l!==this.animGlobals.zIs[remLs[rli]])};
        }else{this.animGlobals.zIs={subbeat:5,bands:4,blocks:3,images:2,plates:1}};
        this.pDOM();
        this.zIsIsShuff=false;
      };
    };
    //----------
    if(this.dtlfxAnimSpeed===100){doShuff()}
    else if((this.hasTHVs())&&(this.thRange(amp))===3){doShuff()}
    else{if(this.zIsFrameCount>=(10-(this.dtlfxAnimSpeed/10))){doShuff();this.zIsFrameCount=0};this.zIsFrameCount++}
  }
//------------------------------------------------
  doSubbeatAnim(baLD:{raw:number[],amp:number,rgb:{r:number,g:number,b:number}[]}){
    const subOArr:number[]=[0,0.5,0.75,1],subRadOArr:number[]=[0,0.25,0.5,0.75];
    this.subH=Math.floor(baLD.amp);
    if(this.dtlfxRGB.length===12){
      if(this.perfAnimSbCount%6===0){
        const randColObj:{r:number,g:number,b:number}=(this.randArr(this.dtlfxRGB));
        this.subBG='rgb('+String(randColObj.r)+' '+String(randColObj.g)+' '+String(randColObj.b)+')';
      };
      const rgbArr:{r:number,g:number,b:number}[]=this.dtlfxRGB,incPerc:number=(100/(rgbArr.length-1));
      let gradStr:string='';
      for(let gi=0;gi<rgbArr.length;gi++){
          if(gi===0){gradStr+='radial-gradient(ellipse at center,'};
          gradStr+='rgba('+rgbArr[gi].r+','+rgbArr[gi].g+','+rgbArr[gi].b+',1) '+String(Math.round(gi*incPerc))+'%';
          if(gi!==(rgbArr.length-1)){gradStr+=','};
          if(gi===(rgbArr.length-1)){gradStr+=')'};
      };
      this.subRadBG=gradStr;
    };
    if((this.hasTHVs())){const thR:number=this.thRange(baLD.amp);this.subTrans=subOArr[thR];this.subRadTrans=subRadOArr[thR]};
    let newRot:number=Math.floor(this.subRot+(1+(8*(baLD.amp/100))));
    if(newRot>=360){newRot=0};
    this.subRot=newRot;
    this.pDOM();
    if(this.dtlfxIsOn){this.perfAnimSbCount++};
  }
//------------------------------------------------
  doBandsAnim(baLD:{raw:number[],amp:number,rgb:{r:number,g:number,b:number}[]}){
    const nBandsArr:{r:number,g:number,b:number}[]=baLD.rgb,
    nBandsLen:number=nBandsArr.length,
    nBandsBarW:number=(Math.floor(this.animGlobals.dms.w/nBandsLen)-8),
    nBandsMainBarW:number=Math.floor(nBandsBarW/2),
    nBandsSubAreaW:number=nBandsMainBarW,
    nBandsSubBarMinPad:number=16,
    nBandsSubAreaH:number=(this.animGlobals.dms.h-16),
    nBandsSubBarH:number=Math.round((nBandsSubAreaH/12)),
    nBandsSubBarYMin:number=8,
    nBandsSubBarYMax:number=(this.animGlobals.dms.h-8-nBandsSubBarH);
    //-----------
    let nBandsMainBarX:number=0;
    this.clrCanvas(this.bandsCTX);
    let nBandsColorArr:string[]=[];
    for(let nbai=0;nbai<nBandsLen;nbai++){
      const nBandsBarCAvg:number=Math.floor((nBandsArr[nbai].r+nBandsArr[nbai].g+nBandsArr[nbai].b)/3),
      nBandsBarVel:number=nBandsBarCAvg/255,
      nBandsMainBarH:number=Math.floor((this.animGlobals.dms.h*0.95)*nBandsBarVel),
      nBandsMainBarY:number=Math.floor((this.animGlobals.dms.h-nBandsMainBarH)/2),
      nBandsMainBarC:string='rgba('+String(nBandsArr[nbai].r)+','+String(nBandsArr[nbai].g)+','+String(nBandsArr[nbai].b);
      nBandsColorArr.push(nBandsMainBarC+',1)');
      let nBandsMainBarGrad:CanvasGradient=this.bandsCTX.createLinearGradient(nBandsMainBarX,nBandsMainBarY,(nBandsMainBarX+nBandsMainBarW),(nBandsMainBarY+nBandsMainBarH));
      nBandsMainBarGrad.addColorStop(0,nBandsMainBarC+',0)');nBandsMainBarGrad.addColorStop(0.25,nBandsMainBarC+',1)');nBandsMainBarGrad.addColorStop(0.5,nBandsMainBarC+',1)');nBandsMainBarGrad.addColorStop(0.75,nBandsMainBarC+',1)');nBandsMainBarGrad.addColorStop(1,nBandsMainBarC+',0)');
      this.bandsCTX.fillStyle=nBandsMainBarGrad;
      this.bandsCTX.fillRect(nBandsMainBarX,nBandsMainBarY,nBandsMainBarW,nBandsMainBarH);
      nBandsMainBarX+=(nBandsMainBarW+4);
      //-----------
      const nBandsSubBarW:number=Math.floor((nBandsSubAreaW-nBandsSubBarMinPad)*(baLD.amp/100)),
      nBandsSubBarXtraPadW:number=(nBandsSubAreaW-nBandsSubBarW-nBandsSubBarMinPad)/2,
      nBandsSubBarX:number=nBandsMainBarX+8+nBandsSubBarXtraPadW;
      if(this.sbYPos[nbai]===-1){this.sbYPos[nbai]=nBandsSubBarYMin+(nBandsSubBarH*nbai)}
      else{this.sbYPos[nbai]+=Math.floor((this.sbYDir[nbai]*(32*nBandsBarVel)))};
      if(this.sbYPos[nbai]>=nBandsSubBarYMax){this.sbYPos[nbai]=nBandsSubBarYMax;if(this.sbYDir[nbai]===4){this.sbYDir[nbai]=-4}};
      if(this.sbYPos[nbai]<=nBandsSubBarYMin){this.sbYPos[nbai]=nBandsSubBarYMin;if(this.sbYDir[nbai]===-4){this.sbYDir[nbai]=4}};
      let nBandsSubBarColor:string;
      this.bandsColorArr.length===12?nBandsSubBarColor=(this.randArr(this.bandsColorArr)):nBandsSubBarColor=nBandsMainBarC+',1)';
      this.bandsCTX.fillStyle=nBandsSubBarColor;
      this.bandsCTX.fillRect(nBandsSubBarX,this.sbYPos[nbai],nBandsSubBarW,nBandsSubBarH);
      //-----------
      nBandsMainBarX+=(nBandsSubAreaW+4);
    };
    this.bandsColorArrCount++;
    if(this.bandsColorArrCount>=1024){this.bandsColorArrCount=0;this.bandsColorArr=nBandsColorArr};
    this.pDOM();
    if(this.dtlfxIsOn){this.perfAnimBaCount++};
  }
//------------------------------------------------
  doBlocksAnim(blLD:{raw:number[],amp:number,rgb:{r:number,g:number,b:number}[]}){
    const opacBVArr:string[]=['0.5','0.6','0.7','0.8','0.9','1'];
    if(blLD.rgb.length===12&&blLD.raw.length===36){
      const nBlocksColArr:{r:number,g:number,b:number}[]=blLD.rgb,
      nBlocksArr:number[]=blLD.raw,
      nBlocksLen:number=nBlocksArr.length,
      nBlocksH:number=Math.floor(this.animGlobals.dms.h/4),
      nBlocksW:number=Math.floor(this.animGlobals.dms.w/9);
      let nBlocksHPad:number=Math.floor(nBlocksH*(1-(blLD.amp/100))),nBlocksWPad:number=Math.floor(nBlocksW*(1-(blLD.amp/100)));
      let nBlocksBX:number=0,nBlocksBY:number=0;
      this.clrCanvas(this.blocksCTX);
      const oArr:number[]=[0,0.25,0.5,1];let opacV:number=0.5;
      if((this.hasTHVs())){opacV=oArr[(this.thRange(blLD.amp))]};
      this.imagesCTX.globalAlpha=opacV;
      let altOpacInc:number=0;
      let altVSize:boolean=false;
      for(let nbli=0;nbli<nBlocksLen;nbli++){
        if(nbli===0||nbli%9===0){nBlocksBX=0};
        nBlocksBY=Math.floor(nbli/9)*nBlocksH;
        const randColObj:{r:number,g:number,b:number}=(this.randArr(nBlocksColArr));
        let newRot:number;
        if(nbli%2===0){newRot=(nbli*10)+this.blocksRot}else{newRot=-((nbli*10)+this.blocksRot)};
        if((nbli%2===0&&this.blocksPass===0)||(nbli%2!==0&&this.blocksPass===1)){
          const randVBColStr:string='rgba('+String(randColObj.r)+','+String(randColObj.g)+','+String(randColObj.b)+','+(this.randArr(opacBVArr))+')';
          this.blocksCTX.fillStyle=randVBColStr;
          let thisHPad:number,thisWPad:number;
          if(altVSize){thisHPad=nBlocksHPad*2;thisWPad=nBlocksWPad*2}else{thisHPad=nBlocksHPad;thisWPad=nBlocksWPad};
          const ctrX:number=((nBlocksBX+Math.floor(thisWPad/2))+((nBlocksW-thisWPad)/2));
          const ctrY:number=((nBlocksBY+Math.floor(thisHPad/2))+((nBlocksH-thisHPad)/2));
          this.blocksCTX.save();
          this.blocksCTX.translate(ctrX,ctrY);
          this.blocksCTX.rotate((newRot*Math.PI)/180);
          this.blocksCTX.fillRect(-(nBlocksH-thisHPad)/2,-(nBlocksH-thisHPad)/2,(nBlocksW-thisWPad),(nBlocksH-thisHPad));
          this.blocksCTX.restore();
        }else{
          let bbOpacVStr:string;
          altOpacInc+=0.05;
          if(this.blocksPass===0){bbOpacVStr=String(altOpacInc)}else{bbOpacVStr=String((1-altOpacInc))};
          this.blocksCTX.fillStyle='rgba('+String(randColObj.r)+','+String(randColObj.g)+','+String(randColObj.b)+','+bbOpacVStr+')';
          this.blocksCTX.fillRect((nBlocksBX+2),(nBlocksBY+2),(nBlocksW-4),(nBlocksH-4));
        };
        nBlocksBX+=nBlocksW;
      };
      let ampRotV:number=10;
      if((this.hasTHVs())){ampRotV=(10+(1*(this.thRange(blLD.amp))))};
      this.blocksRot+=ampRotV;
      this.blocksPass===0?this.blocksPass=1:this.blocksPass=0;
      this.pDOM();
      if(this.dtlfxIsOn){this.perfAnimBlCount++};
    }
  };
//------------------------------------------------
  async loadCanvImg(type:string,data:string):Promise<HTMLImageElement|ImageBitmap|false>{
    return new Promise(async(resolve,reject)=>{
      let newImgEle:HTMLImageElement=new Image();
      newImgEle.loading='eager';
      newImgEle.decoding='async';
      newImgEle.onload=async()=>{
        await newImgEle.decode();
        if(newImgEle.complete){if(newImgEle.width&&newImgEle.height){if(_.isEqual({w:newImgEle.width,h:newImgEle.height},this.animGlobals.dms)){resolve(newImgEle)}else{const nImgBMap:ImageBitmap=await createImageBitmap(newImgEle,0,0,newImgEle.width,newImgEle.height,{resizeWidth:this.animGlobals.dms.w,resizeHeight:this.animGlobals.dms.h,resizeQuality:'low'});resolve(nImgBMap)}}else{reject(false)}}else{this.cCons('loadCanvImg|ERROR',type.toUpperCase()+' - !complete');reject(false)};
      };
      newImgEle.onerror=()=>{this.cCons('loadCanvImg|EVENT',type.toUpperCase()+' - [ERROR]');reject(false)};
      newImgEle.src=data;
    });
  }
  //------------------------------------------------
  getSpdWaitSecs():number{
    const nowSpd:number=this.dtlfxAnimSpeed;
    if(nowSpd===90){return 0.01};
    if(nowSpd===80){return 0.0325};
    if(nowSpd===70){return 0.055}
    if(nowSpd===60){return 0.0775};
    if(nowSpd===50){return 0.1};
    if(nowSpd===40){return 0.2575};
    if(nowSpd===30){return 0.325};
    if(nowSpd===20){return 0.775};
    if(nowSpd===10){return 1};
  }
//------------------------------------------------
  doPLBlock(type:string):boolean{
    if(this.mbPreloadNo[type]===-1&&this.uMediaListsData[type].block.length<this.blockLimits[type]){return false}
    else if(this.mbPreloadNo[type]===-1&&this.usedM[type]===this.uMediaListsData[type].block.length){return true}
    else if(this.mbPreloadNo[type]!==-1&&(this.usedM[type]+3)===this.mbPreloadNo[type]){return true}
    else{return false};
  }
//------------------------------------------------
  async doImagesAnim(iLD:{raw:number[],amp:number,rgb:{r:number,g:number,b:number}[]}){
    this.imagesAnimDone=false;
    if(this.usedM.images===0){this.mbRunTimes.images.st=Date.now()};
    const nImageObj:{i:number,d:string}=this.randArr(this.uMediaListsData.images.block);
    const lniRes:HTMLImageElement|ImageBitmap|false=await this.loadCanvImg('image',nImageObj.d);
    if(lniRes){
      const oArr:number[]=[0,0.25,0.5,0.75];let opacV:number=0.25;
      if((this.hasTHVs())){opacV=oArr[(this.thRange(iLD.amp))]};
      this.imagesCTX.globalAlpha=opacV;
      await this.clrCanvas(this.imagesCTX);
      this.imagesCTX.drawImage(lniRes,0,0);
      if(lniRes instanceof ImageBitmap){lniRes.close()};
      if(this.dtlfxAnimSpeed<100){
        const wTime:number=this.getSpdWaitSecs();
        await this.doW(wTime);
      };
    };
    //----------
    this.usedM.images++;
    //----------
    if((this.doPLBlock('images'))){
      this.loadRandUMediaBlock('images');
      if(this.mbPreloadNo.images===-1){this.addMBRunTime('images',((Date.now())-this.mbRunTimes.images.st))}
      else{this.addMBRunTime('images',(((Date.now())+(Math.floor((Math.floor(this.mbRunTimes.images.rt/this.blockLimits.images))*(this.blockLimits.images-this.usedM.images))))-this.mbRunTimes.images.st))}
    };
    //----------
    if(this.dtlfxIsOn){this.perfAnimImCount++};
    this.imagesAnimDone=true;
  }
//------------------------------------------------
  async doPlatesAnim(pLD:{raw:number[],amp:number,rgb:{r:number,g:number,b:number}[]}){
    this.platesAnimDone=false;
    if(this.usedM.plates===0){this.mbRunTimes.plates.st=Date.now()};
    let nPlateObj:{i:number,d:string}=this.randArr(this.uMediaListsData.plates.block);
    const lniRes:HTMLImageElement|ImageBitmap|false=await this.loadCanvImg('plates',nPlateObj.d);
    if(lniRes){
      const oArr:number[]=[0,1,1,1];let opacV:number=1;
      if((this.hasTHVs())){opacV=oArr[(this.thRange(pLD.amp))]};
      this.platesCTX.globalAlpha=opacV;
      await this.clrCanvas(this.platesCTX);
      this.platesCTX.drawImage(lniRes,0,0);
      if(lniRes instanceof ImageBitmap){lniRes.close()};
      if(this.dtlfxAnimSpeed<100){
        const wTime:number=this.getSpdWaitSecs();
        await this.doW(wTime);
      };
    };
    //----------
    this.usedM.plates++;
    //----------
    if((this.doPLBlock('plates'))){
      this.loadRandUMediaBlock('plates');
      if(this.mbPreloadNo.plates===-1){this.addMBRunTime('plates',((Date.now())-this.mbRunTimes.plates.st))}
      else{this.addMBRunTime('plates',(((Date.now())+(Math.floor((Math.floor(this.mbRunTimes.plates.rt/this.blockLimits.plates))*(this.blockLimits.plates-this.usedM.plates))))-this.mbRunTimes.plates.st))}
    };
    //----------
    if(this.dtlfxIsOn){this.perfAnimPlCount++};
    this.platesAnimDone=true;
  }
//////////////////////////////////////////////////
// HELPER FUNCTIONS
//////////////////////////////////////////////////
  meanArr(arr:number[]):number{return arr.reduce((a,v)=>a+v,0)/arr.length||0};
  sdevArr(arr:number[],mean?:number):number{
    let m:number;!mean?m=(arr.reduce((a,v)=>a+v,0)/arr.length)||0:m=mean;
    const v:number=arr.reduce((a,v)=>a+Math.pow(v-m,2),0)/arr.length||0,
    sd:number=Math.sqrt(v)||0;
    return (sd);
  }
//------------------------------------------------
  randArr(array:any[]):any{const rI=Math.floor(Math.random()*array.length);return array[rI]}
//------------------------------------------------
  clrCanvas(canvasCTX:CanvasRenderingContext2D):Promise<boolean>{canvasCTX.clearRect(0,0,this.animGlobals.dms.w,this.animGlobals.dms.h);return Promise.resolve(true)}
//-------------------------------------------------
  statusText(m:string,p?:{i:string,d:number,p:string}){
    if(this.dtlfxStatus.to!==null){clearTimeout(this.dtlfxStatus.to);this.dtlfxStatus.to=null};
    this.dtlfxStatus.msg=m;
    if(p){this.dtlfxStatus.prog=p;if(p.d===1){this.dtlfxStatus.to=setTimeout(()=>{this.dtlfxStatus={msg:null,to:null,prog:null};this.pDOM()},1500)}}
    else{this.dtlfxStatus.prog=null;this.dtlfxStatus.to=setTimeout(()=>{this.dtlfxStatus={msg:null,to:null,prog:null};this.pDOM();},1500)};
    this.pDOM();
  }
//-------------------------------------------------
  cCons(fn:string,msg:any){const tStr:string=format(new Date(),'HH:mm:ss.SS');let m:string=tStr+' - [DTLFX|'+fn+'] (Log): ';if(typeof msg==='string'){console.log(m+msg)}else{console.log(m);console.log(msg)}}
//------------------------------------------------
  availCons(fn:string,msg:any){
    const tStr:string=format(new Date(),'HH:mm:ss.SS');
    let m:string=tStr+' - [MAIN->HOME|'+fn+'] (Log): ';
    if(typeof msg==='string'){console.log(m+msg)}
    else{console.log(m);console.log(msg)}
  }
//------------------------------------------------
  pDOM(skip?:string){this.changeDet.detectChanges()}
//------------------------------------------------
  doW(s:number):Promise<boolean>{return new Promise(async(resolve)=>{setTimeout(async()=>{resolve(true)},(s*1000))})}
//------------------------------------------------
  sanitizeURL(url:string):SafeResourceUrl{return (this.sanitizer.bypassSecurityTrustResourceUrl(url))}
//------------------------------------------------
  capd(s:string):string{return s.charAt(0).toUpperCase()+s.slice(1)}
//////////////////////////////////////////////////
}
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
