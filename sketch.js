const NORTH = 1
const SOUTH = 2
const EAST = 4
const WEST = 8
const ALLDIRECTIONS = [NORTH, SOUTH, EAST, WEST]

const CELLSIZE = 30
let cellcount= 0

function setup(){
   createCanvas(innerWidth, innerHeight)
   background(256)
   strokeWeight(6)

   let myMaze = new Maze(10, 10)
   myMaze.updateImage()
}

class Maze{
   constructor(xSize, ySize){
      this.cells = Array(xSize).fill().map(()=>Array(ySize).fill(0))

      this.expand(int(random(xSize)), int(random(ySize)))
   }

   //dfs
   expand(x, y){
      let randomDirections = shuffle([...ALLDIRECTIONS])
      let newX, newY, opposite

      //for all neighbors
      for(const dir of randomDirections){
         switch(dir){
            case NORTH:
               newX = x
               newY = y + 1
               opposite = SOUTH
               break;
            case SOUTH:
               newX = x
               newY = y - 1
               opposite = NORTH
               break;
            case EAST:
               newX = x + 1
               newY = y
               opposite = WEST
               break;
            case WEST:
               newX = x - 1
               newY = y
               opposite = EAST
               break;
         }

         //are we out of bounds?
         if(newX < 0 || newX >= this.cells.length || newY < 0 || newY >= this.cells[x].length){
            continue
         }

         //is the neighbor empty?
         if(!this.cells[newX][newY]){
            this.cells[x][y] |= dir
            this.cells[newX][newY] |= opposite
            this.expand(newX, newY)
         }
      }
   }

   updateImage(){
      line(0, 0, CELLSIZE*this.cells.length, 0)
      line(0, 0, 0, CELLSIZE*this.cells.length)
      for(let x of Array(this.cells.length).keys()){
         for(let y of Array(this.cells[x].length).keys()){
            //debuggin
            console.log(this.cells[x][y] + " at (" + x + ", " + y + ")")
            if(this.cells[x][y] & SOUTH){
               line(CELLSIZE*x, CELLSIZE*(y+1), CELLSIZE*(x+1), CELLSIZE*(y+1))
            }
            if(this.cells[x][y] & EAST){
               line(CELLSIZE*(x+1), CELLSIZE*y, CELLSIZE*(x+1), CELLSIZE*(y+1))
            }
         }
      }
   }
}

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
