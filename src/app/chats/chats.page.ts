import { Component } from '@angular/core';
import { TgService } from '../svc/tg.service';
import { Subscription } from 'rxjs';
import { ChatFilterInfo } from '@airgram/core';

@Component({
  selector: 'app-chats',
  templateUrl: 'chats.page.html',
  styleUrls: ['chats.page.scss']
})
export class ChatsPage {

  constructor(private tgSvc: TgService) { }

  chatFoldersSub: Subscription | null = null;
  chatFolders: ChatFilterInfo[] = [];
  ngOnInit() {
    this.chatFoldersSub = this.tgSvc.chatFolders.subscribe(it => {
      console.warn('chatFolders: ', it);
      this.chatFolders = it;
    });
  }

  ngOnDestroy() {
    this.chatFoldersSub?.unsubscribe();
  }
}
