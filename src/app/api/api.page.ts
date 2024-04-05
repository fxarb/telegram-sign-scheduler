import { Component } from '@angular/core';
import { StorageService } from '../svc/storage.service';
import { Subscription, of, switchMap, timer } from 'rxjs';
import { TgService } from '../svc/tg.service';

@Component({
  selector: 'app-api',
  templateUrl: 'api.page.html',
  styleUrls: ['api.page.scss']
})
export class ApiPage {

  constructor(private storageSvc: StorageService,
    private tgSvc: TgService
  ) {

  }

  apiIdSub: Subscription | null = null;
  apiHashSub: Subscription | null = null;
  ngOnInit() {
    this.apiIdSub = this.storageSvc.getApiId()
      .subscribe(it => this.apiId = it || 1);
    this.apiHashSub = this.storageSvc.getApiHash()
      .subscribe(it => this.apiHash = it || '');
  }

  ngOnDestroy() {
    this.apiIdSub?.unsubscribe();
    this.apiHashSub?.unsubscribe();
  }

  apiId = 0;
  apiHash = '';


  initAirTg() {
    this.tgSvc.initAirTg(this.apiId, this.apiHash);
  }

  onInputId(ev: any) {
    const value: number = ev.target!.value;
    this.apiId = value;

  }

  onInputHash(ev: any) {
    const value: string = ev.target!.value;
    this.apiHash = value;
  }

  saveApiIdHash() {
    this.storageSvc.setApiId(this.apiId).subscribe(it => console.warn('setApiId: ', it));
    this.storageSvc.setApiHash(this.apiHash).subscribe(it => console.warn('setApiHash: ', it));
  }
  
}
