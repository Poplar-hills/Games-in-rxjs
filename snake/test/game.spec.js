import {assert} from 'chai'
import {Observable} from 'rxjs'
import {TestScheduler} from 'rxjs/testing/TestScheduler'
// import {getDirection$} from '../src/game'

describe('Game', () => {
  it('tring out TestScheduler', () => {
    const scheduler = new TestScheduler(assert.deepEqual.bind(assert))
    const up$ = scheduler.createHotObservable(  '--x---x--').mapTo('y')
    const down$ = scheduler.createHotObservable('----x---x--')
    const expected$ = '--y-x-y-x--'
    scheduler.expectObservable(Observable.merge(up$, down$)).toBe(expected$)
    scheduler.flush()
  })

  // it('should get a stream of directions', () => {
  //   const scheduler = new TestScheduler(assert.deepEqual.bind(assert))
  //   const values = {
  //     U: {keyCode: 119},
  //     L: {keyCode: 97},
  //     B: {keyCode: 115},
  //     R: {keyCode: 100}
  //   }
  //   const keypress$ = scheduler.createHotObservable('--U--L--L--R--D--U--R--', values)
  //   const direction$ = getDirection$(keypress$)
  //   const expected$ = '--U--L--------D-----R--'

  //   scheduler.expectObservable(direction$).toBe(expected$, values)
  //   scheduler.flush()
  // })
})
