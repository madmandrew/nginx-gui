import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {AppError, NginxService} from '../../services/nginx.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {GridApi} from 'ag-grid-community';

export interface TaskRow {
  taskName: string;
  PID: string;
  session: string;
  sessionNum: string;
  memory: string;
}

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.css']
})
export class LandingPage implements OnInit, OnDestroy {
  nginxPath: string;

  public taskColumns = [
    {field: 'taskName', sortable: true, filter: true},
    {field: 'PID', sortable: true, filter: true},
    {field: 'session', sortable: true, filter: true},
    {field: 'sessionNum', sortable: true, filter: true},
    {field: 'memory', sortable: true, filter: true},
  ];
  public tasks: TaskRow[] = [];
  public tasksLastUpdated: Date = new Date();
  private taskGridApi: GridApi;

  public errorColumns = [
    {field: 'error', sortable: true, filter: true},
    {field: 'timestamp', sortable: true, filter: true},
  ];
  public errors: AppError[] = [];
  public errorsLastUpdated: Date = new Date();
  private errorGridApi: GridApi;

  private destroySubject: Subject<void> = new Subject();

  constructor(
    private nginxService: NginxService,
    private cd: ChangeDetectorRef) {
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  ngOnInit(): void {
    setInterval(() => {
      this.refreshTasks();
      this.refreshErrors();
    }, 10000);

    this.nginxService.nginxStatus$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(status => {
        status.shift();
        this.tasks = status.map(s => {
          s = s.replace('"', '');
          const cols = s.split(',');
          return {
            taskName: cols[0],
            PID: cols[1],
            session: cols[2],
            sessionNum: cols[3],
            memory: cols[4]
          };
        });
        this.tasksLastUpdated = new Date();
        if (this.taskGridApi) {
          this.taskGridApi.sizeColumnsToFit();
        }
        this.cd.detectChanges();
      });

    this.nginxService.errors$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(errors => {
        this.errors = errors;
        this.errorsLastUpdated = new Date();
        if (this.errorGridApi) {
          this.errorGridApi.sizeColumnsToFit();
        }
        this.cd.detectChanges();
      });

    this.nginxPath = this.nginxService.getNginxPath();

    this.refreshErrors();
    this.refreshTasks();
  }

  public taskGridReady(event) {
    this.taskGridApi = event.api;
    this.taskGridApi.sizeColumnsToFit();
  }

  public errorGridReady(event) {
    this.errorGridApi = event.api;
    this.errorGridApi.sizeColumnsToFit();
  }

  setPath() {
    this.nginxService.setNginxDir(this.nginxPath);
  }

  refreshTasks() {
    this.nginxService.triggerStatusCheck();
  }

  refreshErrors() {
    this.nginxService.triggerErrorCheck();
  }

  clearErrors() {
    this.nginxService.clearErrors();
    this.refreshErrors();
  }
}
