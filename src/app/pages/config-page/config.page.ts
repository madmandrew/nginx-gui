import {Component, OnDestroy, OnInit} from '@angular/core';
import {NginxService} from '../../services/nginx.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-config-page',
  templateUrl: './config.page.html',
  styleUrls: ['./config.page.css']
})
export class ConfigPage implements OnInit, OnDestroy {

  public config: string;

  private destroySubject: Subject<void> = new Subject();

  constructor(private nginxService: NginxService) { }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  ngOnInit(): void {
    this.nginxService.nginxConfig$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(config => this.config = config);

    this.refresh();
  }

  refresh()
  {
    this.nginxService.triggerNginxConfigLoad();
  }

}
