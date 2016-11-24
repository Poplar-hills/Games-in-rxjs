const { prop, last, equals, cond, gt, lt, always, T, identity } = R,
      containedBy = R.flip(R.contains)

const canvas = document.querySelector('#game-canvas'),
      ctx = canvas.getContext('2d'),
      w = canvas.width = 615,
      h = canvas.height = 405,
      d = 15,           // dot's diameter
      MOVE_SPEED = 100,
      INIT_SNAKE_LENGTH = 5,
      INIT_FOOD_POSITION = randomPosition()

const LEFT_KEY = 97,    // a
      UP_KEY = 119,     // w
      RIGHT_KEY = 100,  // d
      DOWN_KEY = 115,   // s
      INIT_DIRECTION = RIGHT_KEY

const foodProxy$ = new Rx.Subject()   // food$ and snake$ forms a circular dependency, use subject to solve

const direction$ = Rx.Observable.fromEvent(document, 'keypress')
  .sampleTime(MOVE_SPEED) // prevent the sanke from reversing its direction caused by pressing R->T->L very fast (faster than the MOVE_SPEED)
  .map(prop('keyCode'))
  .filter(containedBy([LEFT_KEY, UP_KEY, RIGHT_KEY, DOWN_KEY]))
  .scan((prev, curr) => {
    const inSuccession = (...arr) => [prev, curr].every(containedBy(arr))
    return (inSuccession(LEFT_KEY, RIGHT_KEY) || inSuccession(UP_KEY, DOWN_KEY)) ? prev : curr
  }, INIT_DIRECTION)
  .distinctUntilChanged()

/*
----U----L----L----R----D----U----R----  keypress$
                 scan                    snake cannot reverse its direction (L->R, R->L, U->D or D->U)
----U----L----L----L----D----D----R----
         distinctUntilChanged
----U----L--------------D---------R----
*/

const snake$ = Rx.Observable.range(1, INIT_SNAKE_LENGTH)
  .map(i => ({ x: w / 2 + i * d, y: h / 2 }))
  .toArray()
  .mergeMap(snake => Rx.Observable.interval(MOVE_SPEED)
    .withLatestFrom(
      direction$, foodProxy$.startWith(INIT_FOOD_POSITION),
      (i, direction, food) => ({ direction, snake, food }))
    .scan(crawl, {snake, food: INIT_FOOD_POSITION})
  )
  .map(prop('snake'))
  .share()    // snake$ needs to be 'hot' as it is subscribed twice

/*
----------0------------1------------2------------3---------  interval$
R--------------U----------------------------L--------------  direction$
f1--------f1------------------------f2---------------------  foodProxy$
                        withLatestFrom
-------[0,R,f1]-----[1,U,f1]-----[2,U,f2]-----[3,L,f2]-----
               withLatestFrom's project function 
-----{R,snake,f1}-{U,snake,f1}-{U,snake,f2}-{L,snake,f2}---  direction and the sanke itself are the two things required for updating the snake's position
                            scan                             update each dot's position of the snake
-------snake0[]-----snake1[]-----snake2[]-----snake3[]-----  snake$
*/

const food$ = snake$
  .map(last)
  .scan((prevFood, snakeHead) => {
    return atSamePosition(prevFood, snakeHead) ? randomPosition() : prevFood
  }, INIT_FOOD_POSITION)
  .distinctUntilChanged()
  .share()    // food$ is also subscribed twice

const foodSubscription = food$.subscribe(food => foodProxy$.next(food))  // feed back each value of food$ into foodProxy$ to make snake$

/*
-----snake0[]--snake1[]--snake2[]--snake3[]----  snake$
                      map
-----{x0,y0}---{x0,y1}---{x0,y2}---{x0,y3}-----  snakeHead$
                      scan
-----{x0,y2}---{x0,y2}---{x4,y6}---{x4,y6}-----  food$
               distinctUntilChanged       
-----{x0,y2}-------------{x4,y6}---------------  food$ with unique elements
*/

function crawl (prev, curr) {
  const oldSnakeHead = last(prev.snake),
        newSnakeHead = moveDot(oldSnakeHead, curr.direction),
        hasCaughtFood = !equals(prev.food, curr.food),
        newSnakeBody = hasCaughtFood ? prev.snake : prev.snake.slice(1)

  return {
    snake: newSnakeBody.concat(newSnakeHead),
    direction: curr.direction,
    food: curr.food
  }
}

const gameSubscription = Rx.Observable.combineLatest(
    snake$, food$,
    (snake, food) => ({ snake, food })
  )
  .takeWhile(({ snake }) => !isGameOver(snake))
  .subscribe(renderSence, null, renderGameOverText)

function randomPosition () {
  const randomCoordinate = max => randomBetween(1, max) * d - d / 2
  return {
    x: randomCoordinate(w / d - 1),
    y: randomCoordinate(h / d - 1)
  }
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
  const snakeHead = last(snake),
        snakeBody = snake.slice(0, snake.length - 4)  // the first 4 dots of the snake cannot be bitten by the snake head
  return snakeBody.some(bodyDot => atSamePosition(bodyDot, snakeHead))
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
  gameSubscription.unsubscribe()
  foodSubscription.unsubscribe()
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
  return cond([
    [lt(max), always(0 + d / 2)],   // return d/2 if greater than max
    [gt(0), always(max - d / 2)],   // return max - d/2 if less than 0
    [T, identity]
  ])(value)
}

function randomBetween (min, max) {
  return ~~(Math.random() * (max - min + 1)) + min
}

function atSamePosition (dotA, dotB) {
  return dotA.x === dotB.x && dotA.y === dotB.y
}
