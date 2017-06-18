import test from 'ava'
import {TestScheduler} from 'rxjs/testing/TestScheduler'
import {genDirection$} from '../src/actors'

const testData = [
  {
    desc: 'should only emit keycode values W, A, S and D and nothing else',
    upstream:   '--S--T--D--B--T--W--',
    downstream: '--S-----D--------W--'
  },
  {
    desc: 'should only emit the first if two same directions occur in a row',
    upstream:   '--W--A--A--S--D--D--',
    downstream: '--W--A-----S--D-----'
  },
  {
    desc: 'should emit an initial direction as specified',
    initDirection: 97,  // left
    upstream:   '----D----',
    downstream: '----A----'
  },
  {
    desc: 'should only emit the first if two opposite directions occur in a row',
    upstream:   '--W--A--D--A--W--S--S--',
    downstream: '--W--A--------W--------'
  }
]

const keypressValues = {
  W: {keyCode: 119},
  A: {keyCode: 97},
  S: {keyCode: 115},
  D: {keyCode: 100},
  T: {keyCode: 84},
  B: {keyCode: 66},
}
const directionValues = {W: 119, A: 97, S: 115, D: 100, T: 84, B: 66}

testData.forEach(_ => {
  test(_.desc, t => {
    const scheduler = new TestScheduler(t.deepEqual.bind(t))
    const initDirection = _.initDirection || directionValues.D
    const keypress$ = scheduler.createHotObservable(_.upstream, keypressValues)
    const direction$ = genDirection$(keypress$, initDirection)
    scheduler.expectObservable(direction$).toBe(_.downstream, directionValues)
    scheduler.flush()
  })  
})
