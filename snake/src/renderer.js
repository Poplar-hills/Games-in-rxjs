import * as c from './config'

const canvas = document.querySelector('#game-canvas')
const scoreboard = document.querySelector('#scoreboard')
const ctx = canvas.getContext('2d')
const dot_r = c.dot_size / 2

canvas.width = c.w
canvas.height = c.h

const renderDot = (color, radius = dot_r) => ({x, y}) => {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}

const renderSnake = snake => {
  snake.forEach(renderDot('orange'))
}

const renderFood = renderDot('#A0C800', dot_r)

const renderScoreboard = score => {
  scoreboard.innerText = score
}

const clearCanvas = () => {
  ctx.clearRect(0, 0, c.w, c.h)
}

export const renderGame = actors => {
  clearCanvas()
  renderSnake(actors.snake)
  renderFood(actors.food)
  renderScoreboard(actors.scoreboard)
}

const renderText = (font, color, text, offsetY) => {
  const getTextWidth = text => ctx.measureText(text).width
  ctx.font = font
  ctx.fillStyle = color
  ctx.fillText(text, (c.w - getTextWidth(text)) / 2, c.h / 2 + offsetY)
}

export const renderScene = type => {
  if (!type) return
  const sceneText = {
    opening: ["Let's play some Snake", '🐍 Press W/A/S/D to start 🐍'],
    victorious: ['Just Amazing!', '👉 Press W/A/S/D to restart 👈'],
    defeated: ['Woops...', '👉 Press W/A/S/D to restart 👈']
  }
  renderText('40px Arial', '#FF6946', sceneText[type][0], -40)
  renderText('25px fantasy', '#61ADF8', sceneText[type][1], 40)
}
