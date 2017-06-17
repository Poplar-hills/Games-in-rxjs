import test from 'ava'
import {Subject} from 'rxjs'
import {TestScheduler} from 'rxjs/testing/TestScheduler'
import {genSnake$} from '../src/actors'
import * as defaultConfig from '../src/config'

const testData = [
  {
    desc: 'should make its debut at the center of the canvas',
    config: {w: 20, h: 20, dot_size: 4},
    expected: '----(a|)',
    values: {
      a: [
        {x: 10, y: 10, color: ''},
        {x: 14, y: 10, color: ''}
      ]
    },
    take: 1
  },
  {
    desc: 'should make its debut with initial length and color as specified',
    config: {init_length: 4, init_snake_color: 'red'},
    expected: '----(a|)',
    values: {
      a: [
        {x: 50, y: 50, color: 'red'},
        {x: 60, y: 50, color: 'red'},
        {x: 70, y: 50, color: 'red'},
        {x: 80, y: 50, color: 'red'},
      ],
    },
    take: 1
  },
  {
    desc: 'should slither at the specified speed',
    config: {snake_speed: 20},
    expected: '--a-b-(c|)',
    values: {
      a: [{x: 50, y: 50, color: ''}, {x: 60, y: 50, color: ''}],
      b: [{x: 60, y: 50, color: ''}, {x: 70, y: 50, color: ''}],
      c: [{x: 70, y: 50, color: ''}, {x: 80, y: 50, color: ''}]
    },
    take: 3
  },
  {
    desc: 'should slither forward according to its direction',
    direction: 'D-------W-----A---S---',
    expected:  '----a---b---c---d---(e|)',
    values: {
      a: [{x: 50, y: 50, color: ''}, {x: 60, y: 50, color: ''}],
      b: [{x: 60, y: 50, color: ''}, {x: 60, y: 40, color: ''}],
      c: [{x: 60, y: 40, color: ''}, {x: 60, y: 30, color: ''}],
      d: [{x: 60, y: 30, color: ''}, {x: 50, y: 30, color: ''}],
      e: [{x: 50, y: 30, color: ''}, {x: 50, y: 40, color: ''}]
    },
    take: 5
  },
  {
    desc: 'should grow up by one dot after eating a piece of food',
    firstFood: {x: 70, y: 50, color: ''},
    foodValues: {f: {x: 0, y: 0, color: ''}},  // 'f' will be the new food when the first food is eaten
    food:     '------------f-----',
    expected: '----a---b---c---(d|)',
    values: {
      a: [{x: 50, y: 50, color: ''}, {x: 60, y: 50, color: ''}],
      b: [{x: 60, y: 50, color: ''}, {x: 70, y: 50, color: ''}],
      c: [{x: 60, y: 50, color: ''}, {x: 70, y: 50, color: ''}, {x: 80, y: 50, color: ''}],
      d: [{x: 70, y: 50, color: ''}, {x: 80, y: 50, color: ''}, {x: 90, y: 50, color: ''}],
    },
    take: 4
  },
  {
    desc: 'should start to change color after eating a piece of food',
    config: {init_snake_color: 'red'},
    firstFood: {x: 70, y: 50, color: 'blue'},
    foodValues: {f: {x: 0, y: 0, color: ''}},  // 'f' will be the new food when the first food is eaten
    food:     '------------f-----',
    expected: '----a---b---c---(d|)',
    values: {
      a: [{x: 50, y: 50, color: 'red'}, {x: 60, y: 50, color: 'red'}],
      b: [{x: 60, y: 50, color: 'red'}, {x: 70, y: 50, color: 'blue'}],
      c: [{x: 60, y: 50, color: 'red'}, {x: 70, y: 50, color: 'blue'}, {x: 80, y: 50, color: 'blue'}],
      d: [{x: 70, y: 50, color: 'blue'}, {x: 80, y: 50, color: 'blue'}, {x: 90, y: 50, color: 'blue'}],
    },
    take: 4
  }
]

const keypressValues = {W: 119, A: 97, S: 115, D: 100}
const baseConfig = {
  w: 100,
  h: 100,
  dot_size: 10,
  init_length: 2,
  snake_speed: 40,
  init_snake_color: ''
}

testData.forEach(_ => {
  test(_.desc, t => {
    const scheduler = new TestScheduler(t.deepEqual.bind(t))
    const dircetion$ = scheduler.createHotObservable(_.direction || 'D-----------', keypressValues)
    const foodProxy$ = scheduler.createHotObservable(_.food || '------------', _.foodValues)
    const firstFood = _.firstFood || {x: 0, y: 0, color: ''}
    const config = Object.assign({}, defaultConfig, baseConfig, _.config)
    const snake$ = genSnake$(dircetion$, foodProxy$, firstFood, config, scheduler).take(_.take)
    scheduler.expectObservable(snake$).toBe(_.expected, _.values)
    scheduler.flush()
  })  
})
