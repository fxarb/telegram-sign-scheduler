import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiPage } from './api.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { ApiPageRoutingModule } from './api-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    ApiPageRoutingModule
  ],
  declarations: [ApiPage]
})
export class ApiPageModule {}
