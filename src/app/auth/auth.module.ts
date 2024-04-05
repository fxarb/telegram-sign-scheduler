import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthPage } from './auth.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { AuthPageRoutingModule } from './auth-routing.module';

import { QRCodeModule } from 'angularx-qrcode';


@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    AuthPageRoutingModule,
    QRCodeModule
  ],
  declarations: [AuthPage]
})
export class AuthPageModule {}
