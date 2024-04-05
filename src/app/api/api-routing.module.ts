import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApiPage } from './api.page';

const routes: Routes = [
  {
    path: '',
    component: ApiPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApiPageRoutingModule {}
