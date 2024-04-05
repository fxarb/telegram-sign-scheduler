import { UPDATE } from '@airgram/constants';
import { Airgram, ApiResponse, BasicGroupFullInfo, Chat, ChatFilter, ChatFilterInfo, ChatTypeBasicGroup, ChatTypePrivate, ChatTypeSecret, ChatTypeUnion, GetBasicGroupFullInfoParams, GetSupergroupFullInfoParams, GetUserFullInfoParams, SupergroupFullInfo, UserFullInfo } from '@airgram/web';
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, EMPTY, NEVER, Observable, ReplaySubject, Subject, debounce, empty, filter, first, from, map, mergeMap, never, of, single, tap, throwError } from 'rxjs';
import { ToastController } from '@ionic/angular';

type ChatFullInfo<T extends ChatTypeUnion> = T extends ChatTypePrivate | ChatTypeSecret ? UserFullInfo : 
T extends ChatTypeBasicGroup ? BasicGroupFullInfo : SupergroupFullInfo;


type ConditionalGenericize<T, Key extends keyof T, G extends T[Key]> = {
  [P in keyof T]: P extends Key ? G : T[P]
}

// Usage akin to GABC (academic illustration)
type Gchat<T extends ChatTypeUnion> = ConditionalGenericize<Chat, 'type', T>;



@Injectable({
  providedIn: 'root'
})
export class TgService {


  airgram: Airgram | null = null;


  constructor(private toastCtlr: ToastController, private ngZone: NgZone) { }

  createQr() {
    if (this.airgram === null) {
      from(this.toastCtlr.create({ message: 'Sdk not Init', duration: 1500, position: 'bottom' }))
        .subscribe(it => it.present());
      return;
    }
    from(this.airgram.api.requestQrCodeAuthentication())
      .subscribe(it => console.warn(it));
  }

  initAirTg(apiId: number, apiHash: string) {
    this.ngZone.runOutsideAngular(() => {
      this.airgram = new Airgram({
        apiId: apiId,
        apiHash: apiHash,
        logVerbosityLevel: 2,
        instanceName: 'TdClient1',
        systemLanguageCode: 'en-US',
        useTestDc: false,
        deviceModel: 'Chrome',
        systemVersion: 'Mac/iOS',
        applicationVersion: '0.1.2',
        useSecretChats: false,
        useMessageDatabase: false,
        useFileDatabase: false,
        databaseDirectory: '/db',
        filesDirectory: '/'
      });

      this.subAuth(this.airgram);
      this.subChatFilters(this.airgram);
      this.subNewChat(this.airgram);
      this.subUpdateChatFullInfo();
    });
  }

  authLinkSbj = new BehaviorSubject('');

  subAuth(airgram: Airgram) {
    airgram.on(UPDATE.updateAuthorizationState, ({ update }) => {
      console.warn("updateAuthorizationState: ", update, " zone: ", Zone.current);

      let updateAuthorizationState = update;
      switch (updateAuthorizationState.authorizationState._) {
        case 'authorizationStateWaitTdlibParameters': break;
        case 'authorizationStateWaitEncryptionKey': break;
        case 'authorizationStateWaitPhoneNumber': break;
        case 'authorizationStateWaitCode': break;
        case 'authorizationStateWaitOtherDeviceConfirmation': {
          const authLk = updateAuthorizationState.authorizationState.link;
          console.warn('authLk: ', authLk)
          this.authLinkSbj.next(authLk);
          break;
        };
        case 'authorizationStateWaitRegistration': break;
        case 'authorizationStateWaitPassword': {
          from(this.toastCtlr.create({ message: 'Wait Password', duration: 1500, position: 'bottom' }))
            .subscribe(it => it.present());
          break;
        };
        case 'authorizationStateReady': {
          from(this.toastCtlr.create({ message: 'Login Success', duration: 1500, position: 'bottom' }))
            .subscribe(it => it.present());
          break;
        };
        case 'authorizationStateLoggingOut': break;
        case 'authorizationStateClosing': break;
        case 'authorizationStateClosed': break;
      }
    });
  }

  chatFolders: BehaviorSubject<ChatFilterInfo[]> = new BehaviorSubject<ChatFilterInfo[]>([]);
  subChatFilters(airgram: Airgram) {
    airgram.on(UPDATE.updateChatFilters, ({ update }) => {
      console.warn('updateChatFilters: ', update, " zone: ", Zone.current);
      const updateChatFilters = update;
      const info = updateChatFilters.chatFilters;
      this.chatFolders.next(info);
    });
  }

  allChats: Set<Chat> = new Set();

  newChats: Subject<Chat> = new Subject<Chat>();

  userFullInfoMap: Map<number, ReplaySubject<UserFullInfo>> = new Map();
  userFullInfoInit: Set<number> = new Set();

  basicGroupFullInfoMap: Map<number, ReplaySubject<BasicGroupFullInfo>> = new Map();
  basicGroupFullInfoInit: Set<number> = new Set();

  supergroupFullInfoMap: Map<number, ReplaySubject<SupergroupFullInfo>> = new Map();
  supergroupFullInfoInit: Set<number> = new Set();



  getChatFullInfoRs<T extends ChatTypeUnion>(chat: Gchat<T>): ReplaySubject<ChatFullInfo<T>> {
    
    if (chat.type._ === 'chatTypePrivate' || chat.type._ === 'chatTypeSecret') {
      const t: ChatTypeSecret | ChatTypePrivate = chat.type;
      if (this.userFullInfoMap.has(chat.id)) {
        return this.userFullInfoMap.get(chat.id)! as any;
      } else {
        const rs = new ReplaySubject<UserFullInfo>();
        this.userFullInfoMap.set(chat.id, rs);
        return rs as any;
      }
    } else if (chat.type._ === 'chatTypeBasicGroup') {
      if (this.basicGroupFullInfoMap.has(chat.id)) {
        return this.basicGroupFullInfoMap.get(chat.id)! as any;
      } else {
        const rs = new ReplaySubject<BasicGroupFullInfo>();
        this.basicGroupFullInfoMap.set(chat.id, rs);
        return rs as any;
      }
    } else if (chat.type._ === 'chatTypeSupergroup') {
      if (this.supergroupFullInfoMap.has(chat.id)) {
        return this.supergroupFullInfoMap.get(chat.id)! as any;
      } else {
        const rs = new ReplaySubject<SupergroupFullInfo>();
        this.supergroupFullInfoMap.set(chat.id, rs);
        return rs as any;
      }
    }
    throw Error("Bad Request");
  }

  subUpdateChatFullInfo() {
    this.newChats.pipe(mergeMap(it => {
        let obs: Observable<UserFullInfo | BasicGroupFullInfo | SupergroupFullInfo> = EMPTY;
        if (it.type._ === 'chatTypePrivate' || it.type._ === 'chatTypeSecret') {
          if (this.userFullInfoInit.has(it.id)) {
            obs = EMPTY;
          } else {
            this.userFullInfoInit.add(it.id);
            const param: GetUserFullInfoParams = {
              userId: it.type.userId
            }
            obs = from(this.airgram!.api.getUserFullInfo(param))
              .pipe(
                tap(info => {
                  console.warn('getUserFullInfo: ', info);
                  if (info.response._ === 'userFullInfo') {
                    this.getChatFullInfoRs(it).next(info.response);
                  } else {
                    this.userFullInfoInit.delete(it.id);
                  }
                }),
                filter(info => info.response._ === 'userFullInfo'),
                map(into => into.response as UserFullInfo));
          }
        } else if (it.type._ === 'chatTypeBasicGroup') {
          if (this.basicGroupFullInfoInit.has(it.id)) {
            obs = EMPTY;
          } else {
            this.basicGroupFullInfoInit.add(it.id);
            const param: GetBasicGroupFullInfoParams = {
              basicGroupId: it.type.basicGroupId
            }
            obs = from(this.airgram!.api.getBasicGroupFullInfo(param))
              .pipe(
                tap(info => {
                  console.warn('getBasicGroupFullInfo: ', info);
                  if (info.response._ === 'basicGroupFullInfo') {
                    this.getChatFullInfoRs(it).next(info.response);
                  } else {
                    this.basicGroupFullInfoInit.delete(it.id);
                  }
                }),
                filter(info => info.response._ === 'basicGroupFullInfo'),
                map(into => into.response as BasicGroupFullInfo));
          }
        } else if (it.type._ === 'chatTypeSupergroup') {
          if (this.supergroupFullInfoMap.has(it.id)) {
            obs = EMPTY;
          } else {
            this.supergroupFullInfoInit.add(it.id);
            const param: GetSupergroupFullInfoParams = {
              supergroupId: it.type.supergroupId
            }
            obs = from(this.airgram!.api.getSupergroupFullInfo(param))
              .pipe(
                tap(info => {
                  console.warn('getSupergroupFullInfo: ', info);
                  if (info.response._ === 'supergroupFullInfo') {
                    this.getChatFullInfoRs(it).next(info.response);
                  } else {
                    this.supergroupFullInfoInit.delete(it.id);
                  }
                }),
                filter(info => info.response._ === 'supergroupFullInfo'),
                map(into => into.response as SupergroupFullInfo));
          }
        }
        return obs;
      })).subscribe();
  }

  getChatFullInfo(chat: Chat) {
    return this.getChatFullInfoRs(chat).asObservable();
  }

  subNewChat(airgram: Airgram) {
    airgram.on(UPDATE.updateNewChat, ({ update }) => {
      this.ngZone.runOutsideAngular(() => {
        console.warn('updateNewChat: ', update, " zone: ", Zone.current);
        const updateNewChat = update;
        const chat: Chat = updateNewChat.chat;
        this.allChats.add(chat);
        this.newChats.next(chat);
      });
    });
  }

  getChatsByFilter(chatFilter: ChatFilter): Chat[] {
    const chatArray = Array.from(this.allChats);
    return chatArray.filter(it => chatFilter.includedChatIds.includes(it.id));
  }

}
