import { TestBed } from '@angular/core/testing';

import { TgService } from './tg.service';

describe('TgService', () => {
  let service: TgService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TgService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
