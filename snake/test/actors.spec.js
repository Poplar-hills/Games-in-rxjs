import test from 'ava'
import {Observable} from 'rxjs'
import {TestScheduler} from 'rxjs/testing/TestScheduler'
import {genDirection$} from '../src/actors'

const keypressValues = {
  W: {keyCode: 119},
  A: {keyCode: 97},
  S: {keyCode: 115},
  D: {keyCode: 100},
  T: {keyCode: 84},
  B: {keyCode: 66},
}
const directionValues = {W: 119, A: 97, S: 115, D: 100, T: 84, B: 66}

const runTest = (scheduler, upStream, downStream, initDirection) => {
  const keypress$ = scheduler.createHotObservable(upStream, keypressValues)
  const direction$ = genDirection$(keypress$, initDirection)
  scheduler.expectObservable(direction$).toBe(downStream, directionValues)
  scheduler.flush()
}

test('direction$ should only emit the keycode values of W, A, S and D', t => {
  const scheduler = new TestScheduler(t.deepEqual.bind(t))
  const upStream =   '--S--T--D--B--T--W--'
  const downStream = '--S-----D--------W--'
  const initDirection = directionValues.D
  runTest(scheduler, upStream, downStream, initDirection)
})

test('direction$ should emit the first if two same directions occur in a row', t => {
  const scheduler = new TestScheduler(t.deepEqual.bind(t))
  const upStream =   '--W--A--A--S--D--D--'
  const downStream = '--W--A-----S--D-----'
  const initDirection = directionValues.D
  runTest(scheduler, upStream, downStream, initDirection)
})

test('direction$ should omit the second dircetion if it is opposite to the initial direction', t => {
  const scheduler = new TestScheduler(t.deepEqual.bind(t))
  const upStream =   '--A--S--'
  const downStream = '--D--S--'
  const initDirection = directionValues.D
  runTest(scheduler, upStream, downStream, initDirection)
})

test('direction$ should emit the first if two opposite directions occur in a row', t => {
  const scheduler = new TestScheduler(t.deepEqual.bind(t))
  const upStream =   '--W--A--D--A--W--S--S--'
  const downStream = '--W--A--------W--------'
  const initDirection = directionValues.D
  runTest(scheduler, upStream, downStream, initDirection)
})
