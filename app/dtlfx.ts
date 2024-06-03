//////////////////////////////////////////////

//////////////////////////////////////////////
export type LFXCore={
  configuration_version:string,
  host:string,
  port:number,
  port_s:number,
  dev_mode:boolean,
  visualisation_fps:number,
  visualisation_maxlen:number,
  global_transitions:boolean,
  scan_on_startup:boolean,
  create_segments:boolean,
  global_brightness:number,
  //------------
  melbanks:any,
  scenes:any,
  user_colors:any,
  user_gradients:any,
  integrations:any,
  //------------
  wled_preferences:LFXWLEDPrefs,
  audio:LFXAudio,
  user_presets:any,
  devices:(LFXDeviceWLED|LFXDeviceE131)[],
  virtuals:LFXVirtual[]
}
//--------------------------------------------
export type LFXVirtual={
  id:string,
  is_device:string,
  segments:[[string,number,number,boolean]],
  auto_generated:boolean,
  config:{
    name:string,
    mapping:'span'|'copy',
    icon_name:string,
    max_brightness:number,
    center_offset:number,
    preview_only:boolean,
    transition_time:number,
    transition_mode:'Add'|'Dissolve'|'Push'|'Slide'|'Iris'|'Through White'|'Through Black'|'None',
    frequency_min:number,
    frequency_max:number,
    rows:number
  },
  effects:LFXPowerEffects,
  effect:LFXPowerEffect
}
//--------------------------------------------
export type LFXPowerEffect={
  type:string,
  config:{
    blur:number,
    flip:boolean,
    mirror:boolean,
    brightness:number,
    background_color:string,
    background_brightness:number,
    sparks_color:string,
    bass_decay_rate:number,
    sparks_decay_rate:number,
    gradient:string,
    gradient_roll:number
  }
}
//--------------------------------------------
export type LFXPowerEffects={
  power:{
    type:string,
    config:{
      blur:number,
      flip:boolean,
      mirror:boolean,
      brightness:number,
      background_color:string,
      background_brightness:number,
      sparks_color:string,
      bass_decay_rate:number,
      sparks_decay_rate:number,
      gradient:string,
      gradient_roll:number
    }
  }
}
//--------------------------------------------
export type LFXWLEDPrefs={
  wled_preferred_mode:{setting:string,user_enabled:boolean},
  realtime_gamma_enabled:{setting:boolean,user_enabled:boolean},
  force_max_brightness:{setting:boolean,user_enabled:boolean},
  realtime_dmx_mode:{setting:string,user_enabled:boolean},
  start_universe_setting:{setting:number,user_enabled:boolean},
  dmx_address_start:{setting:number,user_enabled:boolean},
  inactivity_timeout:{setting:number,user_enabled:boolean}
}
//--------------------------------------------
export type LFXAudio={
  sample_rate:number,
  mic_rate:number,
  fft_size:number,
  min_volume:number,
  audio_device:number,
  delay_ms:number
}
//--------------------------------------------
export type LFXDeviceWLED={
  config:{
    name:string,
    ip_address:string,
    center_offset?:number,
    refresh_rate?:10|12|16|21|32|64,
    sync_mode?:'DDP'|'UDP'|'E131',
    timeout?:number,
    create_segments?:boolean,
    icon_name?:string,
    //------
    pixel_count?:number,
    rgbw_led?:boolean,
  },
  id:string,
  type:'wled'|'e131'
}
//--------------------------------------------
export type LFXDeviceE131={
  config:{
    name:string,
    ip_address:string,
    pixel_count:number,
    icon_name?:string,
    center_offset?:number
    refresh_rate?:10|12|16|21|32|64,
    universe?:number,
    universe_size?:number
    channel_offset?:number
    packet_priority?:number,
    //------
    channel_count?:number,
    universe_end?:number
  },
  id:string,
  type:'wled'|'e131'
}
//////////////////////////////////////////////
export const defLFXCore:LFXCore={
  configuration_version:'2.2.0',
  host:'0.0.0.0',
  port:6699,
  port_s:8443,
  dev_mode:true,
  visualisation_fps:30,
  visualisation_maxlen:32,
  global_transitions:false,
  scan_on_startup:false,
  create_segments:false,
  global_brightness:1.0,
  melbanks:{},
  scenes:{},
  user_colors:{},
  user_gradients:{},
  integrations:{},
  //------------
  wled_preferences:{
    wled_preferred_mode:{setting:'UDP',user_enabled:true},
    realtime_gamma_enabled:{setting:false,user_enabled:true},
    force_max_brightness:{setting:true,user_enabled:true},
    realtime_dmx_mode:{setting:'MultiRGB',user_enabled:true},
    start_universe_setting:{setting:1,user_enabled:true},
    dmx_address_start:{setting:1,user_enabled:true},
    inactivity_timeout:{setting:1,user_enabled:true}
  },
  audio:{sample_rate:60,mic_rate:44100,fft_size:4096,min_volume:0.2,audio_device:21,delay_ms:0},
  user_presets:{
    power:{
      zt22:{name:'ZT22',config:{background_brightness:0.5,background_color:'#000000',bass_decay_rate:0.08,blur:0,brightness:1,flip:false,gradient:'linear-gradient(90deg,#00ff000.00%,#ffc80025.00%,#ff780050.00%,#ff280075.00%,#ff0000100.00%)',gradient_roll:5,mirror:false,sparks_color:'#ffffff',sparks_decay_rate:0.16}}
    }
  },
  devices:[
    {
      config:{name:'Zer0Desktop',ip_address:'192.168.0.3',pixel_count:32,icon_name:'mdi:led-strip',center_offset:0,refresh_rate:32,universe:1,universe_size:32,universe_end:3,channel_offset:0,channel_count:96,packet_priority:200},
      id:'zer0desktop',
      type:'e131'
    },
    {
      config:{name:'Zer0WLED1',ip_address:'Zer0neWLED1.local',center_offset:0,refresh_rate:32,sync_mode:'UDP',timeout:1,create_segments:false,icon_name:'wled',pixel_count:470,rgbw_led:true},
      id:'zer0wled1',
      type:'wled'
    },
    {
      config:{name:'Zer0WLED2',ip_address:'Zer0neWLED2.local',center_offset:0,refresh_rate:32,sync_mode:'UDP',timeout:1,create_segments:false,icon_name:'wled',pixel_count:300,rgbw_led:true},
      id:'zer0wled2',
      type:'wled'
    },
    {
      config:{name:'Zer0WLED3',ip_address:'Zer0neWLED3.local',center_offset:0,refresh_rate:32,sync_mode:'UDP',timeout:1,create_segments:false,icon_name:'wled',pixel_count:69,rgbw_led:true},
      id:'zer0wled3',
      type:'wled'
    },
    {
      config:{name:'Zer0WLED4',ip_address:'Zer0neWLED4.local',center_offset:0,refresh_rate:32,sync_mode:'UDP',timeout:1,create_segments:false,icon_name:'wled',pixel_count:108,rgbw_led:true},
      id:'zer0wled4',
      type:'wled'
    },
    {
      config:{name:'Zer0WLED5',ip_address:'Zer0neWLED5.local',center_offset:0,refresh_rate:32,sync_mode:'UDP',timeout:1,create_segments:false,icon_name:'wled',pixel_count:192,rgbw_led:true},
      id:'zer0wled5',
      type:'wled'
    }
  ],
  virtuals:[
    {
      auto_generated:false,
      config:{
        center_offset:0,
        frequency_max:15000,
        frequency_min:20,
        icon_name:'mdi:led-strip',
        mapping:'span',
        max_brightness:1,
        name:'Zer0Desktop',
        preview_only:false,
        rows:1,
        transition_mode:'None',
        transition_time:0
      },
      effect:{
        config:{
          background_brightness:0.5,
          background_color:'#000000',
          bass_decay_rate:0.08,
          blur:0,
          brightness:1,
          flip:false,
          gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
          gradient_roll:5,
          mirror:false,
          sparks_color:'#ffffff',
          sparks_decay_rate:0.16
        },
        type:'power'
      },
      effects:{
        power:{
          type:'power',
          config:{
            background_brightness:0.5,
            background_color:'#000000',
            bass_decay_rate:0.08,
            blur:0,
            brightness:1,
            flip:false,
            gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
            gradient_roll:5,
            mirror:false,
            sparks_color:'#ffffff',
            sparks_decay_rate:0.16
          }
        }
      },
      id:'zer0desktop',
      is_device:'zer0desktop',
      segments:[['zer0desktop',0,31,false]]
    },
    {
      id:'zer0wled1',
      config:{
        name:'Zer0WLED1',
        icon_name:'wled',
        transition_mode:'None',
        frequency_max:15000,
        center_offset:0,
        preview_only:false,
        rows:1,
        transition_time:0,
        max_brightness:1,
        frequency_min:20,
        mapping:'span'
      },
      segments:[['zer0wled1',0,469,false]],
      is_device:'zer0wled1',
      auto_generated:false,
      effects:{
        power:{
          type:'power',
          config:{
            background_brightness:0.5,
            background_color:'#000000',
            bass_decay_rate:0.08,
            blur:0,
            brightness:1,
            flip:false,
            gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
            gradient_roll:5,
            mirror:false,
            sparks_color:'#ffffff',
            sparks_decay_rate:0.16
          }
        }
      },
      effect:{
        type:'power',
        config:{
          background_brightness:0.5,
          background_color:'#000000',
          bass_decay_rate:0.08,
          blur:0,
          brightness:1,
          flip:false,
          gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
          gradient_roll:5,
          mirror:false,
          sparks_color:'#ffffff',
          sparks_decay_rate:0.16
        }
      }
    },
    {
      id:'zer0wled2',
      config:{
        name:'Zer0WLED2',
        icon_name:'wled',
        transition_mode:'None',
        frequency_max:15000,
        center_offset:0,
        preview_only:false,
        rows:1,
        transition_time:0,
        max_brightness:1,
        frequency_min:20,
        mapping:'span'
      },
      segments:[['zer0wled2',0,299,false]],
      is_device:'zer0wled2',
      auto_generated:false,
      effects:{
        power:{
          type:'power',
          config:{
            background_brightness:0.5,
            background_color:'#000000',
            bass_decay_rate:0.08,
            blur:0,
            brightness:1,
            flip:false,
            gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
            gradient_roll:5,
            mirror:false,
            sparks_color:'#ffffff',
            sparks_decay_rate:0.16
          }
        }
      },
      effect:{
        type:'power',
        config:{
          background_brightness:0.5,
          background_color:'#000000',
          bass_decay_rate:0.08,
          blur:0,
          brightness:1,
          flip:false,
          gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
          gradient_roll:5,
          mirror:false,
          sparks_color:'#ffffff',
          sparks_decay_rate:0.16
        }
      }
    },
    {
      id:'zer0wled3',
      config:{
        name:'Zer0WLED3',
        icon_name:'wled',
        transition_mode:'None',
        frequency_max:15000,
        center_offset:0,
        preview_only:false,
        rows:1,
        transition_time:0,
        max_brightness:1,
        frequency_min:20,
        mapping:'span'
      },
      segments:[['zer0wled3',0,68,false]],
      is_device:'zer0wled3',
      auto_generated:false,
      effects:{
        power:{
          type:'power',
          config:{
            background_brightness:0.5,
            background_color:'#000000',
            bass_decay_rate:0.08,
            blur:0,
            brightness:1,
            flip:false,
            gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
            gradient_roll:5,
            mirror:false,
            sparks_color:'#ffffff',
            sparks_decay_rate:0.16
          }
        }
      },
      effect:{
        type:'power',
        config:{
          background_brightness:0.5,
          background_color:'#000000',
          bass_decay_rate:0.08,
          blur:0,
          brightness:1,
          flip:false,
          gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
          gradient_roll:5,
          mirror:false,
          sparks_color:'#ffffff',
          sparks_decay_rate:0.16
        }
      }
    },
    {
      id:'zer0wled4',
      config:{
        name:'Zer0WLED4',
        icon_name:'wled',
        transition_mode:'None',
        frequency_max:15000,
        center_offset:0,
        preview_only:false,
        rows:1,
        transition_time:0,
        max_brightness:1,
        frequency_min:20,
        mapping:'span'
      },
      segments:[['zer0wled4',0,107,false]],
      is_device:'zer0wled4',
      auto_generated:false,
      effects:{
        power:{
          type:'power',
          config:{
            background_brightness:0.5,
            background_color:'#000000',
            bass_decay_rate:0.08,
            blur:0,
            brightness:1,
            flip:false,
            gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
            gradient_roll:5,
            mirror:false,
            sparks_color:'#ffffff',
            sparks_decay_rate:0.16
          }
        }
      },
      effect:{
        type:'power',
        config:{
          background_brightness:0.5,
          background_color:'#000000',
          bass_decay_rate:0.08,
          blur:0,
          brightness:1,
          flip:false,
          gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
          gradient_roll:5,
          mirror:false,
          sparks_color:'#ffffff',
          sparks_decay_rate:0.16
        }
      }
    },
    {
      id:'zer0wled5',
      config:{
        name:'Zer0WLED5',
        icon_name:'wled',
        transition_mode:'None',
        frequency_max:15000,
        center_offset:0,
        preview_only:false,
        rows:1,
        transition_time:0,
        max_brightness:1,
        frequency_min:20,
        mapping:'span'
      },
      segments:[['zer0wled5',0,191,false]],
      is_device:'zer0wled5',
      auto_generated:false,
      effects:{
        power:{
          type:'power',
          config:{
            background_brightness:0.5,
            background_color:'#000000',
            bass_decay_rate:0.08,
            blur:0,
            brightness:1,
            flip:false,
            gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
            gradient_roll:5,
            mirror:false,
            sparks_color:'#ffffff',
            sparks_decay_rate:0.16
          }
        }
      },
      effect:{
        type:'power',
        config:{
          background_brightness:0.5,
          background_color:'#000000',
          bass_decay_rate:0.08,
          blur:0,
          brightness:1,
          flip:false,
          gradient:'linear-gradient(90deg, #00ff00 0.00%,#ffc800 25.00%,#ff7800 50.00%,#ff2800 75.00%,#ff0000 100.00%)',
          gradient_roll:5,
          mirror:false,
          sparks_color:'#ffffff',
          sparks_decay_rate:0.16
        }
      }
    }
  ]
}
//--------------------------------------------
export interface UserGradients {
  type: string
  title: string
  default: {}
}
//--------------------------------------------
export interface ScanOnStartup {
  type: string
  title: string
  default: boolean
}
//--------------------------------------------
export interface CreateSegments {
  type: string
  title: string
  default: boolean
}
//--------------------------------------------
export interface WledPreferences {
  type: string
  title: string
  default: {}
}
//--------------------------------------------
export interface ConfigurationVersion {
  type: string
  title: string
  default: string
}
//--------------------------------------------
export interface GlobalBrightness {
  type: string
  minimum: number
  maximum: number
  title: string
  default: number
}
//////////////////////////////////////////////
//////////////////////////////////////////////
//////////////////////////////////////////////
