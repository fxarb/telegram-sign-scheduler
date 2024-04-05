import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Observable, from, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storageObs:  Observable<Storage>

  constructor(private storage: Storage) {
    const storagePrms = this.storage.create();
    this._storageObs = from(storagePrms);
  }

  // Create and expose methods that users of this service can
  // call, for example:
  public set(key: string, value: any) {
    return this._storageObs.pipe(
      switchMap(s => s.set(key, value) )
    );
  }

  public get(key: string): Observable<any> {
    return this._storageObs.pipe(
      switchMap(s => s.get(key) )
    );
  }

  public setApiId(value: number): Observable<any> {
    return this.set('apiId', value);
  }

  public getApiId(): Observable<number> {
    return this.get('apiId');
  }

  public setApiHash(value: string): Observable<any> {
    return this.set('apiHash', value);
  }

  public getApiHash(): Observable<string> {
    return this.get('apiHash');
  }
}