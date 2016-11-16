const canvas = document.querySelector('#game-canvas'),
      ctx = canvas.getContext('2d'),
      w = canvas.width = 600,
      h = canvas.height = 405,
      r = 7.5,
      MOVE_SPEED = 50,
      INIT_SNAKE_LENGTH = 5

const LEFT_KEY = 97,
      UP_KEY = 119,
      RIGHT_KEY = 100,
      DOWN_KEY = 115

const direction$ = Rx.Observable.fromEvent(document, 'keypress')
  .map(e => e.keyCode)
  .filter(keyCode => [LEFT_KEY, UP_KEY, RIGHT_KEY, DOWN_KEY].includes(keyCode))
  .startWith(RIGHT_KEY)

const snake$ = Rx.Observable.range(1, INIT_SNAKE_LENGTH)
  .map(() => ({ x: w / 2, y: h / 2 }))
  .toArray()
  .mergeMap(snake => Rx.Observable.interval(MOVE_SPEED)
    .withLatestFrom(direction$)
    .map(([i, direction]) => ({ direction, snake }))
    .scan((prev, curr) => prev.map(move(curr.direction)), snake)
  )

const game$ = Rx.Observable.combineLatest(
    snake$,
    (snake) => ({
      snake
    })
  )
  .do(x => console.log(x))
  .subscribe(renderSence)

function move (direction) {
  return dot => {
    if (direction === LEFT_KEY) {
      return {
        x: dot.x - r * 2,
        y: dot.y
      }
    }

    if (direction === RIGHT_KEY) {
      return {
        x: dot.x + r * 2,
        y: dot.y
      }
    }

    if (direction === UP_KEY) {
      return {
        x: dot.x,
        y: dot.y - r * 2
      }
    }

    if (direction === DOWN_KEY) {
      return {
        x: dot.x,
        y: dot.y + r * 2
      }
    }
  }
}

function renderSence (actors) {
  ctx.clearRect(0, 0, w, h)
  renderSnake(actors.snake)
}

function renderSnake (snake) {
  snake.forEach(renderDot)
}

function renderDot (d) {
  ctx.beginPath()
  ctx.arc(d.x, d.y, r, 0, Math.PI * 2)
  ctx.fillStyle = 'orange'
  ctx.fill()
}
