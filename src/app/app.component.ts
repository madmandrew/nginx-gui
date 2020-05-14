import {ChangeDetectorRef, Component} from '@angular/core';
import {IpcRenderer} from 'electron';
import * as _ from 'lodash'

export enum ELECTRON_COMMANDS {
  GET_NGINX_STATUS = 'getNginxStatus',
  REPLY_NGINX_STATUS = 'replyNginxStatus',
  KILL_NGINX = 'killNginx',
  START_NGINX = 'startNginx',
  RELOAD_NGINX = 'reloadNginx',
  SET_NGINX_DIR = 'setNginxDir'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private ipc: IpcRenderer;

  public nginxDir: string;
  public tasks: string[];

  constructor(private cd: ChangeDetectorRef) {
    if ((<any> window).require) {
      try {
        this.ipc = (<any> window).require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.warn('not running electron');
    }

    if (this.ipc)
    {
      this.ipc.send(ELECTRON_COMMANDS.SET_NGINX_DIR, localStorage.getItem('nginxDir'));
      this.ipc.on(ELECTRON_COMMANDS.REPLY_NGINX_STATUS, (event, arg) => {
        if (arg)
        {
          this.tasks = arg.trim().split('\n');
          this.cd.detectChanges()
        }
      });
    }
    this.nginxDir = localStorage.getItem('nginxDir');
  }

  testRead() {
    this.ipc.send(ELECTRON_COMMANDS.GET_NGINX_STATUS);
  }

  testKill()
  {
    this.ipc.send(ELECTRON_COMMANDS.KILL_NGINX)
  }

  start()
  {
    this.ipc.send(ELECTRON_COMMANDS.START_NGINX)
  }

  reload()
  {
    this.ipc.send(ELECTRON_COMMANDS.RELOAD_NGINX);
  }

  savePath()
  {
    localStorage.setItem('nginxDir', this.nginxDir);
    this.ipc.send(ELECTRON_COMMANDS.SET_NGINX_DIR, this.nginxDir);
  }
}
