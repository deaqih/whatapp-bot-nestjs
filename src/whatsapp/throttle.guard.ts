import { Injectable, Inject } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorage, ThrottlerModuleOptions } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ShortThrottleGuard extends ThrottlerGuard {
  constructor(
    @Inject('short') options: ThrottlerModuleOptions,
    @Inject(ThrottlerStorage) storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }
}

@Injectable()
export class MediumThrottleGuard extends ThrottlerGuard {
  constructor(
    @Inject('medium') options: ThrottlerModuleOptions,
    @Inject(ThrottlerStorage) storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }
}

@Injectable()
export class LongThrottleGuard extends ThrottlerGuard {
  constructor(
    @Inject('long') options: ThrottlerModuleOptions,
    @Inject(ThrottlerStorage) storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }
}
