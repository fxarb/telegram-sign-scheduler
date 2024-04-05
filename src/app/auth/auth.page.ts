import { Component } from '@angular/core';
import { TgService } from '../svc/tg.service';
import { Subscription, from } from 'rxjs';
import { CheckAuthenticationPasswordParams } from '@airgram/web';

@Component({
  selector: 'app-auth',
  templateUrl: 'auth.page.html',
  styleUrls: ['auth.page.scss']
})
export class AuthPage {

  constructor(private tgSvc: TgService) {}

  authLink = '';


  authLinkSub: Subscription | null = null;
  ngOnInit() {
    this.tgSvc.authLinkSbj.subscribe(it => {
      console.warn('on sub auth lk: ', it)
      this.authLink = it;
    })
  }

  createQr() {
    this.tgSvc.createQr();
  }

  password = '';

  onInputPassword(ev: any) {
    const value: string = ev.target!.value;
    this.password = value;
  }

  providePassword() {
    const param: CheckAuthenticationPasswordParams = {
      password: this.password
    }
    if (this.tgSvc.airgram === null) {
      console.warn('airgram not init');
      return;
    }
    from(this.tgSvc.airgram.api.checkAuthenticationPassword(param))
    .subscribe(it => {
      it.response
      console.warn('providePassword', it);
    })
  }

  loadChats() {

  }

  ngOnDestroy() {
    this.authLinkSub?.unsubscribe();
  }
}
