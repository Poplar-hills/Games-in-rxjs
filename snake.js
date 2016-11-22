const canvas = document.querySelector('#game-canvas'),
      ctx = canvas.getContext('2d'),
      w = canvas.width = 615,
      h = canvas.height = 405,
      d = 15,           // dot's diameter
      MOVE_SPEED = 100,
      INIT_SNAKE_LENGTH = 5

const LEFT_KEY = 97,    // a
      UP_KEY = 119,     // w
      RIGHT_KEY = 100,  // d
      DOWN_KEY = 115,   // s
      INIT_DIRECTION = RIGHT_KEY

const direction$ = Rx.Observable.fromEvent(document, 'keypress')
  .sampleTime(MOVE_SPEED) // prevent the sanke from reversing its direction caused by pressing R->T->L very fast (faster than the MOVE_SPEED)
  .map(R.prop('keyCode'))
  .filter(keyCode => [LEFT_KEY, UP_KEY, RIGHT_KEY, DOWN_KEY].includes(keyCode))
  .scan((prev, curr) => {
    const inSuccession = (...arr) => [prev, curr].every(_ => arr.includes(_))
    return (inSuccession(LEFT_KEY, RIGHT_KEY) || inSuccession(UP_KEY, DOWN_KEY)) ? prev : curr
  }, INIT_DIRECTION)
  .distinctUntilChanged()

/*
----U----L----L----R----D----U----R----
                 scan                    snake cannot reverse its direction (L->R, R->L, U->D or D->U)
----U----L----L----L----D----D----R----
         distinctUntilChanged
----U----L--------------D---------R----
*/

const snake$ = Rx.Observable.range(1, INIT_SNAKE_LENGTH)
  .map(i => ({ x: w / 2 + i * d, y: h / 2 }))
  .toArray()
  .mergeMap(snake => Rx.Observable.interval(MOVE_SPEED)
    .withLatestFrom(direction$, (i, direction) => ({ direction, snake }))
    .scan((prev, curr) => crawl(curr.direction, prev), snake)
  )
  .share()

/*
---------0---------1---------2---------3---------  interval$
R-----------U---------------------L--------------  direction$
                 withLatestFrom
-------[0,R]-----[1,U]-----[2,U]-----[3,L]-------
                      map
-----{R,snake}-{U,snake}-{U,snake}-{L,snake}-----  direction and the sanke itself are the two things required for updating the snake's position
                      scan                         update each dot's position of the snake
-------snake0----snake1----snake2----snake3------
*/

const snakeSubject = new Rx.Subject()   // Q: can we derive a new stream from an existing stream without using Subject ????
snake$.subscribe(snakeSubject)
const food$ = snakeSubject
  .map(R.last)
  .scan(hasCaughtFood, randomPosition())
  .distinctUntilChanged()

/*
----------snake0----snake1----snake2----snake3------  snake$
                         map
----------{x0,y0}---{x1,y1}---{x2,y2}---{x3,y3}-----  snakeHead$
                         scan
{x9,y2}---{x9,y2}---{x9,y2}---{x4,y6}---{x4,y6}-----  food$
                 distinctUntilChanged       
{x9,y2}-----------------------{x4,y6}---------------  food$ with unique elements
*/

const game$ = Rx.Observable.combineLatest(
    snake$, food$,
    (snake, food) => ({ snake, food })
  )
  .takeWhile(({ snake }) => !isGameOver(snake))
  .subscribe(renderSence, null, renderGameOverText)

function hasCaughtFood (latestFood, snakeHead) {
  return samePosition(latestFood, snakeHead)
    ? randomPosition()  // generate new food
    : latestFood
}

function randomPosition () {
  const randomCoordinate = max => rangeRandom(1, max) * d - d / 2
  return {
    x: randomCoordinate(w / d - 1),
    y: randomCoordinate(h / d - 1)
  }
}

function crawl (direction, snake) {
  const oldSnakeHead = R.last(snake),
        newSnakeHead = moveDot(oldSnakeHead, direction),
        newSnakeBody = snake.slice(1)
  return newSnakeBody.concat(newSnakeHead)
}

function moveDot ({ x, y }, direction) {  // update a dot's position according to the direction
  const validateMove = ({ x, y }) => ({ x: circulate(w, x), y: circulate(h, y) }),
        nextMove = new Map([
          [LEFT_KEY,  { y, x: x - d }],
          [RIGHT_KEY, { y, x: x + d }],
          [UP_KEY,    { x, y: y - d }],
          [DOWN_KEY,  { x, y: y + d }]
        ]).get(direction)

  return validateMove(nextMove)
}

function isGameOver (snake) {
  const snakeHead = R.last(snake),
        snakeBody = snake.slice(0, snake.length - 4)  // the first 4 dots of the snake cannot be bitten by the snake head
  return snakeBody.some(bodyDot => samePosition(bodyDot, snakeHead))
}

function renderSence (actors) {
  ctx.clearRect(0, 0, w, h)   // clear the canvas first
  renderSnake(actors.snake)
  renderFood(actors.food)
}

function renderSnake (snake) {
  snake.forEach(renderDot('orange'))
}

function renderDot (color, radius = d / 2) {
  return ({ x, y }) => {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }
}

function renderFood (food) {
  renderDot('#A0C800', d / 2 + 2)(food)
}

function renderGameOverText () {
  const text = 'GAME OVER'
  ctx.font = '50px Arial'
  const textWidth = ctx.measureText(text).width
  ctx.fillStyle = '#ff6946'
  ctx.fillText(text, w / 2 - textWidth / 2, h / 2 - 40)
}

/*
  Utils
*/
function circulate (max, value) {
  return R.cond([
    [R.lt(max), R.always(0 + d / 2)],   // return d/2 if greater than max
    [R.gt(0), R.always(max - d / 2)],   // return max - d/2 if less than 0
    [R.T, R.identity]
  ])(value)
}

function rangeRandom (min, max) {
  return ~~(Math.random() * (max - min + 1)) + min
}

function samePosition (dotA, dotB) {
  return dotA.x === dotB.x && dotA.y === dotB.y
}
