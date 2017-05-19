import test from 'ava'
import {TestScheduler} from 'rxjs/testing/TestScheduler'
import {genDirection$} from '../src/actors'

const testData = [
  {
    desc: 'should only emit the keycode values of W, A, S and D',
    upStream:   '--S--T--D--B--T--W--',
    downStream: '--S-----D--------W--'
  },
  {
    desc: 'should only emit the first if two same directions occur in a row',
    upStream:   '--W--A--A--S--D--D--',
    downStream: '--W--A-----S--D-----'
  },
  {
    desc: 'should omit the second dircetion if it is opposite to the initial direction',
    upStream:   '--A--S--',
    downStream: '--D--S--'
  },
  {
    desc: 'should only emit the first if two opposite directions occur in a row',
    upStream:   '--W--A--D--A--W--S--S--',
    downStream: '--W--A--------W--------'
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
    const initDirection = directionValues.D
    const keypress$ = scheduler.createHotObservable(_.upStream, keypressValues)
    const direction$ = genDirection$(keypress$, initDirection)
    scheduler.expectObservable(direction$).toBe(_.downStream, directionValues)
    scheduler.flush()
  })  
})
