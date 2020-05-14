import {Component, OnDestroy, OnInit} from '@angular/core';
import {NginxService} from '../../services/nginx.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {GridApi} from 'ag-grid-community';

export interface LogEntry {
  entry: string;
}
@Component({
  selector: 'app-logs-page',
  templateUrl: './logs.page.html',
  styleUrls: ['./logs.page.css']
})
export class LogsPage implements OnInit, OnDestroy {
  private destroySubject: Subject<void> = new Subject();

  public columns = [{headerName: 'Log Entry', field:"entry", sortable: true, filter: true, sort: 'desc'}];

  public accessLog: LogEntry[] = [];
  public accessLastUpdated: Date = new Date();
  private accessGridApi: GridApi;

  public errorLog: LogEntry[] = [];
  public errorLastUpdated: Date = new Date();
  private errorGridApi: GridApi;

  constructor(private nginxService: NginxService) { }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  ngOnInit(): void {
    this.nginxService.errorFile$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(data => {
        this.errorLog = data.map(row => {
          return {entry: row};
        });
        this.errorLastUpdated = new Date();
        if (this.errorGridApi)
        {
          this.errorGridApi.sizeColumnsToFit();
        }
      });

    this.nginxService.accessFile$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(data => {
        this.accessLog = data.map(row => {
          return {entry: row};
        });
        this.accessLastUpdated = new Date();
        if (this.accessGridApi)
        {
          this.accessGridApi.sizeColumnsToFit();
        }
      })
  }

  accessGridReady(event)
  {
    this.accessGridApi = event.api;
    this.accessGridApi.sizeColumnsToFit();
  }

  errorGridReady(event)
  {
    this.errorGridApi = event.api;
    this.errorGridApi.sizeColumnsToFit();
  }

  refreshFiles()
  {
    this.nginxService.triggerLogFileCheck();
  }
}
