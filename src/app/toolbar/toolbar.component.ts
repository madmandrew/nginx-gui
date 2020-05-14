import { Component, OnInit } from '@angular/core';
import {NginxService} from '../services/nginx.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {

  public runOnStartup: boolean = true;

  constructor(private nginxService: NginxService) { }

  ngOnInit(): void {
    const run = localStorage.getItem('runOnStartup');
    if (run == null)
    {
      this.runOnStartupChange();
    }
    else
    {
      this.runOnStartup = run === 'true';
    }
  }

  runOnStartupChange()
  {
    localStorage.setItem('runOnStartup', this.runOnStartup.toString());
    this.nginxService.setRunOnStartup(this.runOnStartup);
  }

  start()
  {
    this.nginxService.startNginx();
  }

  stop()
  {
    this.nginxService.stopNginx();
  }

  reload()
  {
    this.nginxService.reloadNginx();
  }

}
