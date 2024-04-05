import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { TgService } from '../svc/tg.service';
import { ActivatedRoute } from '@angular/router';
import { ApiResponse, BasicGroupFullInfo, BotCommand, BotCommandScopeChatInput, BotCommands, Chat, ChatFilter, ChatListFilterInput, Error, FormattedTextInput, GetBasicGroupFullInfoParams, GetChatFilterParams, GetCommandsParams, GetSupergroupFullInfoParams, GetUserFullInfoParams, InputMessageContentInputUnion, InputMessageContentUnion, InputMessageTextInput, Message, MessageSchedulingStateInputUnion, MessageSchedulingStateSendAtDateInput, MessageSendOptionsInput, SendMessageParams, SupergroupFullInfo, UserFullInfo } from '@airgram/web';
import { EMPTY, Observable, OperatorFunction, Subscription, filter, from, map, mergeMap, of, switchMap, tap } from 'rxjs';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone);
const fmt = 'YYYY-MM-DDTHH:mm:ssZ';

@Component({
  selector: 'app-filtered-chats',
  templateUrl: './filtered-chats.component.html',
  styleUrls: ['./filtered-chats.component.scss'],
})
export class FilteredChatsComponent implements OnInit, OnDestroy {

  constructor(private tgSvc: TgService,
    private route: ActivatedRoute,
    private ngZone: NgZone) { }

  filter: ChatFilter | null = null;

  timeMap: Map<number, string> = new Map();

  disabledMap: Map<number, boolean> = new Map();

  getDisable(chatId: number) {
    return this.disabledMap.get(chatId) || false;
  }

  toggle(chatId: number, ev: any) {
    console.warn('toggle chatId: ', chatId, ev);
    this.disabledMap.set(chatId, !ev.target.checked);
  }


  initTime = dayjs().add(1, 'month').startOf('month').add(1, 'minute');





  getTitle(): string {
    return this.filter?.title || '';
  }

  ngOnDestroy(): void {
    this.subs.forEach(it => it.unsubscribe());
  }

  chats: Chat[] = [];

  subs: Subscription[] = [];


  chatCmds: Map<number, UserFullInfo | BasicGroupFullInfo | SupergroupFullInfo> = new Map();

  ngOnInit() {
    const filterId = Number(this.route.snapshot.paramMap.get('filterId'));

    let chatList: ChatListFilterInput = {
      _: 'chatListFilter',
      chatFilterId: filterId
    }
    if (this.tgSvc.airgram == null) {
      return;
    }
    from(this.tgSvc.airgram.api.loadChats({ limit: 10, chatList: chatList }))
      .subscribe(it => console.warn('loadChats: ', it));

    const getChatFilterParams: GetChatFilterParams = {
      chatFilterId: filterId
    }
    from(this.tgSvc.airgram.api.getChatFilter(getChatFilterParams))
      .pipe(
        map(it => it.response),
        tap(it => {
          console.warn('chatFilter: ', it)
          if (it._ === 'chatFilter') {
            this.filter = it
          }
        }),
        map(it => {
          if (it._ === 'error') {
            return [];
          } else {
            return this.tgSvc.getChatsByFilter(it);
          }
        }),
        tap(it => this.chats = it),
        mergeMap(it => from(it)),
        tap(it => console.log('filtered chat: ', it)),
      )
      .subscribe({
        next: it => {
          const sub = this.tgSvc.getChatFullInfo(it).subscribe(info => {
            this.ngZone.run(() => {
              console.warn('info: ', info, Zone.current);
              this.chatCmds.set(it.id, info);
              this.initDefaultSelect(it.id);
            })
          });
          this.subs.push(sub);
          this.chats.forEach(it => this.tgSvc.newChats.next(it))
        },
        error: e => console.log(e, 'error'),
        complete: () => console.log('complete')
      });

  }


  getCmds(chatId: number): string[] {
    const info = this.chatCmds.get(chatId);
    let commands: BotCommand[] = [];
    if (info?._ === 'userFullInfo') {
      commands = info.commands;
    } else if (info?._ === 'basicGroupFullInfo') {
      const cmdset = new Set<BotCommand>();
      info.botCommands.forEach(it => {
        it.commands.forEach(iti => {
          cmdset.add(iti);
        })
      })
      commands = Array.from(cmdset);
    } else if (info?._ === 'supergroupFullInfo') {
      const cmdset = new Set<BotCommand>();
      info.botCommands.forEach(it => {
        it.commands.forEach(iti => {
          cmdset.add(iti);
        })
      })
      commands = Array.from(cmdset);
    }
    return commands.map(it => it.command);
  }
  currentSelect: Map<number, string | undefined> = new Map();

  getSelect(chatId: number) {
    const cmd = this.currentSelect.get(chatId);
    console.warn('getSelect: ', chatId, cmd);
    return cmd;
  }

  initDefaultSelect(chatId: number): string | undefined {
    if (this.currentSelect.has(chatId)) {
      return this.currentSelect.get(chatId);
    }
    const signCmds = this.getCmds(chatId).filter(it => it === 'sign' || it === 'qd' || it === 'check');
    let cmd = undefined;
    if (signCmds.length !== 0) {
      cmd = signCmds[0];
    }
    console.warn('initDefaultSelect: ', chatId, cmd);
    this.currentSelect.set(chatId, cmd);
    return cmd;
  }

  handleChange(chatId: number, event: any) {
    console.warn('handleChange: ', chatId, event);
    this.currentSelect.set(chatId, event.target.value);
  }


  updateTime(chatId: number, event: any) {
    console.warn('updateTime: ', chatId, event);
    this.timeMap.set(chatId, event.target.value);
  }

  getTime(chatId: number) {
    return this.timeMap.get(chatId) || this.initTime.format(fmt);
  }

  scheduleMessage() {
    const now = dayjs();
    const fns: OperatorFunction<unknown, number | ApiResponse<SendMessageParams, Message>>[] = [];
    this.chats.forEach(chat => {
      if (this.getDisable(chat.id)) {
        return;
      }
      const firstTime = dayjs(this.getTime(chat.id));
      const omf = firstTime.add(1, 'month').startOf('month');
      for (let day = 0; day < 35; day++) {
        const schefuleFn = () => {
          const time = firstTime.add(day, 'days');
          if (!time.isBefore(omf) || now.isAfter(time)) {
            return of(0);
          }
          const msgSchedule: MessageSchedulingStateSendAtDateInput = {
            _: 'messageSchedulingStateSendAtDate',
            sendDate: time.unix()
          }
          const opt: MessageSendOptionsInput = {
            _: 'messageSendOptions',
            schedulingState: msgSchedule
          }
          const fmtT: FormattedTextInput = {
            _: 'formattedText',
            text: '/' + this.getSelect(chat.id)
          }
          const cnt: InputMessageTextInput = {
            _: 'inputMessageText',
            text: fmtT
          }
          const param: SendMessageParams = {
            chatId: chat.id,
            options: opt,
            inputMessageContent: cnt
          }
          if (!this.tgSvc.airgram) {
            return EMPTY;
          }
          return from(this.tgSvc.airgram.api.sendMessage(param))
            .pipe(tap(it => console.warn('scheduleMessage: ', chat.id, ' ', time.format(fmt), it)));
        }
        fns.push(mergeMap(it => schefuleFn()));
      }
      let pre: Observable<any> = of(0);
      fns.forEach(it => pre = pre.pipe(it));
      pre.subscribe();

    })

  }

}
