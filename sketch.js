//#region cell bit data
const NORTH = 0x1
const SOUTH = 0x2
const EAST = 0x4
const WEST = 0x8
const ALLDIRECTIONS = [NORTH, SOUTH, EAST, WEST]
const OPPOSITE = {} // {NORTH:SOUTH} would actually be {NORTH:2} because javascipt :(
OPPOSITE[NORTH] = SOUTH
OPPOSITE[SOUTH] = NORTH
OPPOSITE[EAST] = WEST
OPPOSITE[WEST] = EAST

const RED = 0x10
const GREEN = 0x20
const BLUE = 0x40
const ALLCOLORS = [RED, GREEN, BLUE]

const GOAL = 0x80
//#endregion

//#region maze settings
const CELLSIZE = 30
const WALLTHICKNESS = 8
const COLORSATURATION = 100
const SPEEDMOD = 10
//#endregion

//#region globals
let myMaze
let racers
//#endregion

//#region events
function setup(){
   createCanvas(innerWidth, innerHeight)

   let mazeWidth = int(width/CELLSIZE) - 1 //dont know why I need the - 1 but I do
   let mazeHeight = int(height/CELLSIZE)
   //calculate speed, we scale off the average length of a side rather than the area
   frameRate(SPEEDMOD * (mazeWidth+mazeHeight)/2 / CELLSIZE)
   myMaze = new Maze(mazeWidth, mazeHeight)
   racers = []
   for(const color of ALLCOLORS){
      racers.push(new Racer(myMaze, int(random(mazeWidth)), int(random(mazeHeight)), color))
   }

   myMaze.updateImage()
}

function draw(){
   for(let r of racers){
      r.update()
   }
   myMaze.updateImage()
}
//#endregion

//#region helpers
//fisher-yates
function shuffle(arr){
   let randomIndex, tmp

   for(let index = arr.length; index > 0; index--){
      randomIndex = random(index)

      tmp = arr[randomIndex]
      arr[randomIndex] = arr[index]
      arr[index] = tmp
   }

   return arr
}

//dfs cause im lazy
function pathfind(x, y, maze, _backwards){ //if you see a _ before a variable name it means treat it as private
   //base case
   if(maze.cells[x][y] & GOAL){
      return (_backwards ? [OPPOSITE[_backwards]] : null) //if no backwards then thers no path since we started on the goal
   }

   let randomDirections = shuffle([...ALLDIRECTIONS])
   let result

   //for all neighbors
   for(const dir of randomDirections){
      if(dir == _backwards || !(maze.cells[x][y] & dir)){
         continue
      }
      switch(dir){
         case NORTH:
            result = pathfind(x, y-1, maze, OPPOSITE[dir])
            break;
         case SOUTH:
            result = pathfind(x, y+1, maze, OPPOSITE[dir])
            break;
         case EAST:
            result = pathfind(x+1, y, maze, OPPOSITE[dir])
            break;
         case WEST:
            result = pathfind(x-1, y, maze, OPPOSITE[dir])
            break;
      }
      if(result){
         if(_backwards){
            result.push(OPPOSITE[_backwards])
         }
         return result
      }
   }

   //no path
   return null
}
//#endregion

class Maze{
   constructor(xSize, ySize){
      this.cells = Array(xSize).fill().map(()=>Array(ySize).fill(0))

      this.expand(int(random(xSize)), int(random(ySize)))

      this.cells[int(random(xSize))][int(random(ySize))] |= GOAL
   }

   //dfs
   expand(x, y){
      let randomDirections = shuffle([...ALLDIRECTIONS])
      let newX, newY

      //for all neighbors
      for(const dir of randomDirections){
         switch(dir){
            case NORTH:
               newX = x
               newY = y - 1
               break;
            case SOUTH:
               newX = x
               newY = y + 1
               break;
            case EAST:
               newX = x + 1
               newY = y
               break;
            case WEST:
               newX = x - 1
               newY = y
               break;
         }

         //are we out of bounds?
         if(newX < 0 || newX >= this.cells.length || newY < 0 || newY >= this.cells[x].length){
            continue
         }

         //is the neighbor empty?
         if(!this.cells[newX][newY]){
            this.cells[x][y] |= dir
            this.cells[newX][newY] |= OPPOSITE[dir]
            this.expand(newX, newY)
         }
      }
   }

   updateImage(){
      //colors and goal
      noStroke()
      let cellRed, cellGreen, cellBlue
      for(let x of Array(this.cells.length).keys()){
         for(let y of Array(this.cells[x].length).keys()){
            //colors
            cellRed = 256 - COLORSATURATION * Math.sign(this.cells[x][y] & RED)
            cellGreen = 256 - COLORSATURATION * Math.sign(this.cells[x][y] & GREEN)
            cellBlue = 256 - COLORSATURATION * Math.sign(this.cells[x][y] & BLUE)
            fill(cellRed, cellGreen, cellBlue)
            square(CELLSIZE*x, CELLSIZE*y, CELLSIZE)

            //goal
            if(this.cells[x][y] & GOAL){
               fill('black')
               circle(CELLSIZE*(x+1/2), CELLSIZE*(y+1/2), CELLSIZE)
            }
         }
      }

      //now we can do the walls since we didnt want them to overlap
      stroke(WALLTHICKNESS)
      //north and west border
      line(0, 0, CELLSIZE*this.cells.length, 0)
      line(0, 0, 0, CELLSIZE*this.cells.length)
      //run through each individual cell and check for a south and east wall
      for(let x of Array(this.cells.length).keys()){
         for(let y of Array(this.cells[x].length).keys()){
            if(!(this.cells[x][y] & SOUTH)){
               line(CELLSIZE*x, CELLSIZE*(y+1), CELLSIZE*(x+1), CELLSIZE*(y+1))
            }
            if(!(this.cells[x][y] & EAST)){
               line(CELLSIZE*(x+1), CELLSIZE*y, CELLSIZE*(x+1), CELLSIZE*(y+1))
            }
         }
      }
   }
}

class Racer{
   constructor(maze, x, y, color){
      this.maze = maze //fun fact, this is only a reference to the maze not an actual copy
      this.x = x
      this.y = y
      this.color = color
      this.colorCell()

      this.path = pathfind(x, y, maze)
   }

   update(){
      if(this.path.length){
         this.move(this.path.pop())
      }
   }

   move(dir){
      switch(dir){
         case NORTH:
            this.y--
            break;
         case SOUTH:
            this.y++
            break;
         case EAST:
            this.x++
            break;
         case WEST:
            this.x--
            break;
      }

      this.colorCell()
   }

   colorCell(){
      this.maze.cells[this.x][this.y] |= this.color
   }
}