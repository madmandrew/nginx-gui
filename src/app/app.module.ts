import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {FormsModule} from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDividerModule} from '@angular/material/divider';
import {MatMenuModule} from '@angular/material/menu';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { LandingPage } from './pages/landing-page/landing.page';
import { LogsPage } from './pages/logs-page/logs.page';
import {RouterModule, Routes} from '@angular/router';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {AgGridModule} from 'ag-grid-angular';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { ConfigPage } from './pages/config-page/config.page';

const routes: Routes = [
  {path: 'landing', component: LandingPage},
  {path: 'logs', component: LogsPage},
  {path: 'config', component: ConfigPage},
  {path: '**', redirectTo: '/landing', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
  declarations: []
})
export class AppRoutingModule {}

@NgModule({
  declarations: [
    AppComponent,
    ToolbarComponent,
    LandingPage,
    LogsPage,
    ConfigPage,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    RouterModule,
    AppRoutingModule,
    AgGridModule,

    MatFormFieldModule,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatExpansionModule,
    MatDividerModule,
    MatTableModule,
    MatIconModule,
    MatInputModule,
    MatCardModule,
    MatCheckboxModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
