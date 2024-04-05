import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatsPage } from './chats.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { ChatsPageRoutingModule } from './chats-routing.module';
import { FilteredChatsComponent } from '../filtered-chats/filtered-chats.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    ChatsPageRoutingModule
  ],
  declarations: [ChatsPage, FilteredChatsComponent]
})
export class ChatsPageModule {}
