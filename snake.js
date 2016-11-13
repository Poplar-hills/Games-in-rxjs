var canvas = document.querySelector('#game-canvas'),
    ctx = canvas.getContext('2d')

// display snake
const snake = {
  direction: '',
  length: 5,
  x: '',
  y: ''
}
  
function renderSense (actors) {
  renderSnake(actors.snake)
}


// snake can move in a specific direction
// snake can change direction in response to arrow key press
// display candy at a ramdom position
// eating candy increases the snake's length