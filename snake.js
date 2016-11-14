const canvas = document.querySelector('#game-canvas'),
      ctx = canvas.getContext('2d'),
      w = canvas.width = 600,
      h = canvas.height = 405,
      dotRadius = 7.5,
      speed = 200,
      initalSnakeLength = 5

const snake$ = Rx.Observable.range(1, initalSnakeLength)
  .map(() => ({ x: w / 2, y: h / 2 }))
  .toArray()

const game$ = Rx.Observable.combineLatest(
    snake$,
    (snake) => ({
      snake
    })
  )
  .do(x => console.log(x))
  .subscribe(renderSence)

function renderSence (actors) {
  renderSnake(actors.snake)
}

function renderSnake (snake) {
  snake.forEach(renderDot)
}

function renderDot (d) {
  ctx.beginPath()
  ctx.arc(d.x, d.y, dotRadius, 0, Math.PI * 2)
  ctx.fillStyle = 'orange'
  ctx.fill()
}
