import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatsPage } from './chats.page';
import { FilteredChatsComponent } from '../filtered-chats/filtered-chats.component';

const routes: Routes = [
  {
    path: ':filterId',
    component: FilteredChatsComponent
  },
  {
    path: '',
    component: ChatsPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatsPageRoutingModule {}
