import test from 'ava'
import {Observable} from 'rxjs'
import {TestScheduler} from 'rxjs/testing/TestScheduler'
import {genDirection$} from '../src/actors'

test('should get a stream of directions', t => {
  const scheduler = new TestScheduler(t.deepEqual.bind(t))
  const keyCodes = {
    U: {keyCode: 119},
    L: {keyCode: 97},
    D: {keyCode: 115},
    R: {keyCode: 100}
  }
  const keypress$ = scheduler.createHotObservable('--U--L--L--R--D--U--R--', keyCodes)
  const direction$ = genDirection$(keypress$)
  const expected$ = '--U--L--------D-----R--'

  scheduler.expectObservable(direction$).toBe(expected$, {U: 119, L: 97, D: 115, R: 100})
  scheduler.flush()
})
