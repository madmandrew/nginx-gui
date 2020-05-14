import {Injectable} from '@angular/core';
import {IpcRenderer} from 'electron';
import {BehaviorSubject, Subject} from 'rxjs';
import * as _ from 'lodash';

export enum ELECTRON_COMMANDS {
  GET_NGINX_STATUS = 'getNginxStatus',
  REPLY_NGINX_STATUS = 'replyNginxStatus',
  KILL_NGINX = 'killNginx',
  START_NGINX = 'startNginx',
  RELOAD_NGINX = 'reloadNginx',
  SET_NGINX_DIR = 'setNginxDir',
  GET_ERRORS = 'getErrors',
  REPLY_ERRORS = 'replyErrors',
  CLEAR_ERRORS = 'clearErrors',
  ACCESS_FILE = 'accessFile',
  ERROR_FILE = 'errorFile',
  LOAD_LOG_FILES = 'loadLogFiles',
  RUN_ON_STARTUP = 'runOnStartup',
  READ_NGINX_CONFIG = 'readNginxConfig',
  REPLY_NGINX_CONFIG = 'replyNginxConfig',
}

export interface AppError {
  error: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NginxService {
  private ipc: IpcRenderer;
  private nginxPath: string = localStorage.getItem('nginxPath');

  public nginxStatus$: Subject<string[]> = new Subject();
  public errors$: Subject<AppError[]> = new Subject();
  public accessFile$: BehaviorSubject<string[]> = new BehaviorSubject([]);
  public errorFile$: BehaviorSubject<string[]> = new BehaviorSubject([]);
  public nginxConfig$: BehaviorSubject<string> = new BehaviorSubject('');

  constructor() {
    if ((<any> window).require) {
      try {
        this.ipc = (<any> window).require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.warn('not running electron');
    }

    if (this.ipc) {
      this.ipc.send(ELECTRON_COMMANDS.SET_NGINX_DIR, localStorage.getItem('nginxDir'));
      this.ipc.on(ELECTRON_COMMANDS.REPLY_NGINX_STATUS, (event, arg) => {
        if (arg) {
          this.nginxStatus$.next(_.cloneDeep(arg.trim().split('\n')));
        }
      });
      this.ipc.on(ELECTRON_COMMANDS.REPLY_ERRORS, (event, arg) => {
        if (arg) {
          this.errors$.next(_.cloneDeep(arg));
        }
      });

      this.ipc.on(ELECTRON_COMMANDS.ACCESS_FILE, (event, arg) => {
        if (arg)
        {
          this.accessFile$.next(arg);
        }
      });
      this.ipc.on(ELECTRON_COMMANDS.ERROR_FILE, (event, arg) => {
        this.errorFile$.next(arg);
      });

      this.ipc.on(ELECTRON_COMMANDS.REPLY_NGINX_CONFIG, (event, arg) => {
        this.nginxConfig$.next(arg);
      });
    }
  }

  public getNginxPath(): string
  {
    return _.cloneDeep(this.nginxPath);
  }

  public setNginxDir(dir: string) {
    this.nginxPath = dir;
    localStorage.setItem('nginxPath', dir);
    if (this.ipc) {
      this.ipc.send(ELECTRON_COMMANDS.SET_NGINX_DIR, dir);
    }
  }

  public triggerStatusCheck() {
    if (this.ipc) {
      this.ipc.send(ELECTRON_COMMANDS.GET_NGINX_STATUS);
    }
  }

  public stopNginx() {
    if (this.ipc) {
      this.ipc.send(ELECTRON_COMMANDS.KILL_NGINX);
    }
    this.triggerStatusCheck();
  }

  public startNginx() {
    if (this.ipc) {
      this.ipc.send(ELECTRON_COMMANDS.START_NGINX);
    }
    this.triggerStatusCheck();
  }

  public reloadNginx() {
    if (this.ipc) {
      this.ipc.send(ELECTRON_COMMANDS.RELOAD_NGINX);
    }
    this.triggerStatusCheck();
  }

  public clearErrors()
  {
    if (this.ipc)
    {
      this.ipc.send(ELECTRON_COMMANDS.CLEAR_ERRORS);
    }
  }

  public triggerErrorCheck()
  {
    if (this.ipc)
    {
      this.ipc.send(ELECTRON_COMMANDS.GET_ERRORS);
    }
  }

  public triggerLogFileCheck()
  {
    if (this.ipc)
    {
      this.ipc.send(ELECTRON_COMMANDS.LOAD_LOG_FILES);
    }
  }

  public setRunOnStartup(run: boolean)
  {
    if (this.ipc)
    {
      this.ipc.send(ELECTRON_COMMANDS.RUN_ON_STARTUP, run);
    }
  }

  public triggerNginxConfigLoad()
  {
    if (this.ipc)
    {
      this.ipc.send(ELECTRON_COMMANDS.READ_NGINX_CONFIG);
    }
  }
}
