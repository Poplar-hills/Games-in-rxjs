import * as c from './config.js'

const gameCanvas = document.querySelector('#game-canvas'),
      ctx = gameCanvas.getContext('2d')

gameCanvas.width = c.w
gameCanvas.height = c.h

export const renderDot = (color, radius = c.dot_size / 2) => {
  return ({x, y}) => {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }
}

export const renderSnake = snake => {
  snake.forEach(renderDot('orange'))
}

export const renderFood = renderDot('#A0C800', c.dot_size / 2 + 2)

export const renderSence = actors => {
  ctx.clearRect(0, 0, c.w, c.h) // clear the canvas first
  renderSnake(actors.snake)
  renderFood(actors.food)
}

export const renderGameText = (text, color) => {
  ctx.font = '50px Arial'
  const textWidth = ctx.measureText(text).width
  ctx.fillStyle = color
  ctx.fillText(text, (c.w - textWidth) / 2, c.h / 2 - 40)
}
