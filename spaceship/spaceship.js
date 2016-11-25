const SPEED = 40,
      STAR_NUMBER = 250

const canvas = document.querySelector('#game-canvas'),
      ctx = canvas.getContext('2d')

const w = canvas.width = window.innerWidth,
      h = canvas.height = window.innerHeight

/*
  Stars
*/
const stars$ = Rx.Observable.range(0, STAR_NUMBER)
  .map(() => ({
    x: randomBetween(0, w),
    y: randomBetween(0, h),
    size: randomBetween(1, 3)
  }))
  .toArray()
  .mergeMap(stars => Rx.Observable.interval(SPEED)
    .map(() => {
      stars.forEach(_ => {
        _.y = _.y <= h ? _.y + 3 : 0
      })
      return stars
    })
  )

/*
  Game
*/
const gameSubscription = Rx.Observable.combineLatest(
    stars$,
    (stars) => ({ stars })
  )
  .subscribe(renderSense)

function renderSense (actors) {
  renderStars(actors.stars)
}

function renderStars (stars) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#fff'
  stars.forEach(({ x, y, size }) => {
    ctx.fillRect(x, y, size, size)
  })
}

/*
  Utils
*/
function randomBetween (min, max) {
  return ~~(Math.random() * (max - min + 1)) + min
}
