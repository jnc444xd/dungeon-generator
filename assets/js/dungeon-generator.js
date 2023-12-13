document.addEventListener('DOMContentLoaded', () => {
    init();
});

let canvas;
let ctx;

let grid = [];

let gridWidth = 63;
let gridHeight = 63;

let cellSize;

function setSize() {
    let navbarHeight = document.querySelector('.navbar').offsetHeight;
    document.body.querySelector('.container').style.paddingTop = (navbarHeight + 20) + 'px';

    let verticalSpace = Math.floor(window.innerHeight - document.getElementById('canvas-col').offsetTop) - Math.max(window.innerHeight - document.querySelector('footer').offsetTop + 20, 20);
    document.getElementById('canvas-col').style.height = verticalSpace + 'px';

    let canvasWidth = Math.min(Math.floor(document.getElementById('canvas-col').offsetWidth / gridWidth) * gridWidth, Math.floor(document.getElementById('canvas-col').offsetHeight / gridHeight) * gridWidth);
    let canvasHeight = Math.min(Math.round(canvasWidth * (gridHeight / gridWidth)), Math.floor(document.getElementById('canvas-col').offsetHeight / gridHeight) * gridHeight);

    cellSize = Math.min(canvasWidth / gridWidth, canvasHeight / gridHeight);

    canvas.width = canvasWidth || 1;
    canvas.height = canvasHeight || 1;
    canvas.style.width = canvasWidth + 'px' || 1;
    canvas.style.height = canvasHeight + 'px' || 1;

    document.getElementById('canvas-col').style.height = canvasHeight + 'px';
}

let seed = '';
let minRoomDim = 5;
let maxRoomDim = 13;
let roomPlacementAttempts = 256;
let extraConnectionVal = 0.125;
let drawLines = false;

let rooms, connectionList;

function init() {
    canvas = document.getElementById('view');
    ctx = canvas.getContext('2d');
    if (!canvas || !ctx) {
        alert("Unable to initialize 2d drawing context. Your browser or machine may not support it.");
        return;
    }

    // set the canvas element's size
    setSize();
    window.addEventListener('resize', () => {
        setSize();
        draw();
    });

    document.getElementById('seed').value = seed;
    document.getElementById('min-room-size').value = minRoomDim;
    document.querySelector('label[for=min-room-size] > .value').textContent = minRoomDim;
    document.getElementById('max-room-size').value = maxRoomDim;
    document.querySelector('label[for=max-room-size] > .value').textContent = maxRoomDim;
    document.getElementById('room-placement-attempts').value = roomPlacementAttempts;
    document.querySelector('label[for=room-placement-attempts] > .value').textContent = roomPlacementAttempts;
    document.getElementById('extra-room-connections').value = extraConnectionVal;
    document.querySelector('label[for=extra-room-connections] > .value').textContent = extraConnectionVal;
    document.getElementById('show-graph').checked = drawLines;

    document.getElementById('seed').addEventListener('input', event => {
        seed = document.getElementById('seed').value;
    });
    document.getElementById('min-room-size').addEventListener('input', event => {
        minRoomDim = document.getElementById('min-room-size').value;
        maxRoomDim = document.getElementById('max-room-size').value;
    });
    document.getElementById('max-room-size').addEventListener('input', event => {
        minRoomDim = document.getElementById('min-room-size').value;
        maxRoomDim = document.getElementById('max-room-size').value;
    });
    document.getElementById('room-placement-attempts').addEventListener('input', event => {
        roomPlacementAttempts = document.getElementById('room-placement-attempts').value;
    });
    document.getElementById('extra-room-connections').addEventListener('input', event => {
        extraConnectionVal = document.getElementById('extra-room-connections').value;
    });

    document.getElementById('generate').addEventListener('click', event => {
        generate();
    });

    document.getElementById('show-graph').addEventListener('click', event => {
        drawLines = document.getElementById('show-graph').checked;
        draw();
    });
    document.addEventListener('keypress', event => {
        if (event.key === 'l') {
            drawLines = !drawLines;
            document.getElementById('show-graph').checked = drawLines;
            draw();
        }
    });

	// Add event listener to canvas for rooms
	canvas.addEventListener('click', handleCanvasClick);

	// Add event listener for connectors
    canvas.addEventListener('click', handleConnectorClick);

    // generate a dungeon
    generate();
}

//////////

// Click handler for canvas
function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Check if the click is inside any room
    rooms.forEach((room, index) => {
        const roomX = room.x * cellSize;
        const roomY = room.y * cellSize;
        const roomWidth = room.width * cellSize;
        const roomHeight = room.height * cellSize;

        if (mouseX >= roomX && mouseX <= roomX + roomWidth && mouseY >= roomY && mouseY <= roomY + roomHeight) {
            // The click is inside the room
            displayRoomInfo(room, index);
        }
    });
}
// For the above click handler
function displayRoomInfo(room, roomIndex) {
	console.log(`Room ${roomIndex + 1}: ${JSON.stringify(room)}`);
    // Replace this with your logic to display information about the room
    alert(`Room ${roomIndex + 1}: ${JSON.stringify(room)}`);
}

// Click handler for connectors
// Click handler for connectors
function handleConnectorClick(event) {
    event.preventDefault(); // Prevent the default context menu

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Check if the click is inside any room
    for (let room of rooms) {
        const roomX = room.x * cellSize;
        const roomY = room.y * cellSize;
        const roomWidth = room.width * cellSize;
        const roomHeight = room.height * cellSize;

        if (mouseX >= roomX && mouseX <= roomX + roomWidth && mouseY >= roomY && mouseY <= roomY + roomHeight) {
            // The click is inside the room, so do nothing
            return;
        }
    }

    // Check if the click is inside any connector
    connectionList.forEach((i, j) => {
        const connectorPoints = getConnectorPoints(rooms[i], rooms[j]);
        const isInsideConnector = isPointInsideConnector(mouseX, mouseY, connectorPoints);

        if (isInsideConnector) {
            // The click is inside the connector
            displayConnectorInfo(rooms[i], rooms[j]);
        }
    });
}

// Function to get the points of a connector between two rooms
function getConnectorPoints(roomA, roomB) {
	const centerA = roomA.centerPoint();
	const centerB = roomB.centerPoint();
	return [centerA, centerB];
}

// Function to check if a point is inside a connector
function isPointInsideConnector(x, y, connectorPoints) {
	const [start, end] = connectorPoints;
	const minX = Math.min(start[0], end[0]);
	const minY = Math.min(start[1], end[1]);
	const maxX = Math.max(start[0], end[0]);
	const maxY = Math.max(start[1], end[1]);
	return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

// Function to display information about the connector
function displayConnectorInfo(roomA, roomB) {
    console.log(`Connector between Room ${rooms.indexOf(roomA) + 1} and Room ${rooms.indexOf(roomB) + 1}`);
    // Replace this with your logic to display information about the connector
    alert(`Connector between Room ${rooms.indexOf(roomA) + 1} and Room ${rooms.indexOf(roomB) + 1}`);
}

//////////

function generate() {
    // initialize or reset the grid
    for (let i = 0; i < gridHeight; i++) {
        grid[i] = [];
        for (let j = 0; j < gridWidth; j++) {
            grid[i][j] = 0;
        }
    }

    // set Math.random to use the predefined seed, or a random one
    let dungeonSeed = (seed && seed.length > 0) ? seed : (Date.now() + '');
    Math.seedrandom(dungeonSeed);

    // randomly place rooms on the grid
    rooms = randomRooms(roomPlacementAttempts, minRoomDim, maxRoomDim);

    let fullConnectionList = graphConnections(rooms);
    connectionList = processConnections(fullConnectionList, rooms);

    connectionList.forEach((a, b) => {
        carveCorridor(rooms[a], rooms[b]);
    });

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (grid[y][x] !== 0) grid[y][x] = 1;
        }
    }

    draw();

    canvas.setAttribute('title', 'Rooms: ' + rooms.length + '\n' + 'Connections: ' + connectionList.length() + '\n' + 'Seed: ' + dungeonSeed);
}

function draw() {
    drawGrid();
    if (drawLines === true) drawConnections(connectionList, rooms);
}

function carveCorridor(startRoom, endRoom) {
	var start = new Cell(Math.floor((startRoom.centerCell().x - 1) / 2), Math.floor((startRoom.centerCell().y - 1) / 2));
	var end = new Cell((endRoom.centerCell().x - 1) / 2, (endRoom.centerCell().y - 1) / 2);
	var graph = [];
	for (var y = 0; (y * 2) + 1 < gridHeight; y++) {
		graph[y] = [];
		for (var x = 0; (x * 2) + 1 < gridWidth; x++) {
			if ((x * 2) + 1 >= startRoom.x && (x * 2) + 1 < startRoom.x + startRoom.width && (y * 2) + 1 >= startRoom.y && (y * 2) + 1 < startRoom.y + startRoom.height) {
				// set cells inside the starting room to have a weight of 1
				graph[y][x] = 1.1;
			} else if ((x * 2) + 1 >= endRoom.x && (x * 2) + 1 < endRoom.x + endRoom.width && (y * 2) + 1 >= endRoom.y && (y * 2) + 1 < endRoom.y + endRoom.height) {
				// mark cells within the target room as destinations
				graph[y][x] = -1;
				let tempCell;
				//if (start.manhattanDistanceTo(tempCell = new Cell(x, y)) < start.manhattanDistanceTo(end)) end = tempCell;
			} else {
				// set the weight of empty space to 1, and filled space to 10
				graph[y][x] = ((grid[(y * 2) + 1][(x * 2) + 1] === 0) ? 1 : (grid[(y * 2) + 1][(x * 2) + 1] === 666) ? 10 : 100);
			}
		}
	}
	// stores active cells, sorted by their priority
	var frontier = new PriorityQueue();
	// stores visited cells by their flattened coordinate
	var visited = new Map();
	
	start.priority = 0;
	start.costSoFar = 0;
	frontier.put(start);
	visited.set(start.flatten(), start);
	
	var current;
	while (!frontier.isEmpty()) {
		current = frontier.next();
		if (graph[current.y][current.x] === -1) break;
		for (var dir = 0; dir < 4; dir++) {
			var next = current.offset(dir);
			if (next.x < 0 || next.x >= (gridWidth - 1) / 2 || next.y < 0 || next.y >= (gridHeight - 1) / 2) continue;
			if (graph[next.y][next.x] === 0) continue;
			var newCost = current.costSoFar + graph[next.y][next.x];
			if (!visited.has(next.flatten()) || newCost < visited.get(next.flatten()).costSoFar) {
				next.costSoFar = newCost;
				next.cameFrom = current;
				next.prevDir = dir;
				next.priority = newCost + next.manhattanDistanceTo(end) + (dir === current.prevDir ? 0 : 0);
				visited.set(next.flatten(), next);
				
				frontier.put(next, (a, b) => {
					if (a.x === b.x && a.y === b.y) return 'replace';
					return (a.priority < b.priority ? -1 : a.priority > b.priority ? 1 : 0);
				});
			}
		}
	}
	
	while (current.cameFrom) {
		let temp = new Cell((current.x * 2) + 1, (current.y * 2) + 1);
		if (grid[temp.y][temp.x] === 0) grid[temp.y][temp.x] = 666;
		temp = temp.offset((current.prevDir % 2 === 0 ? current.prevDir + 1 : current.prevDir - 1));
		if (grid[temp.y][temp.x] === 0) grid[temp.y][temp.x] = 666;
		
		current = current.cameFrom;
	}
}

class PriorityQueue {
    constructor() {
        this.queue = [];
    }

    put(obj, comparator) {
        for (let i = this.queue.length - 1; i >= 0; i--) {
            if (comparator) {
                if (comparator(this.queue[i], obj) === 'replace') {
                    this.queue[i] = obj;
                    this.queue.sort(comparator);
                    return;
                }
                if (comparator(this.queue[i], obj) < 0) return this.queue.splice(i + 1, 0, obj);
            } else {
                if (this.queue[i] < obj) return this.queue.splice(i + 1, 0, obj);
            }
        }
        return this.queue.unshift(obj);
    }

    next() {
        return this.queue.shift();
    }

    has(obj, comparator) {
        for (let i = 0; i < this.queue.length; i++) {
            if (comparator) {
                if (comparator(this.queue[i], obj)) return true;
            } else {
                if (this.queue[i] === obj) return true;
            }
        }
        return false;
    }

    isEmpty() {
        return this.queue.length === 0;
    }
}

function graphConnections(rooms) {
	var list = new EdgeList(rooms.length);
	var tempList = new EdgeList(rooms.length);
	var points = [];
	for (var i = 0; i < rooms.length; i++) {
		points.push(rooms[i].centerPoint());
	}
	// get a list of all the triangles in the Delaunay triangulation of the rooms' centers
	var triArray = triangulate(points);
	// convert the list of triangles into a list of edges, including only edges shared by more than one triangle
	for (var i = triArray.length - 3; i >= 0; i -= 3) {
		let a = triArray[i], b = triArray[i + 1], c = triArray[i + 2];
		if (tempList.connected(a, b)) list.connect(a, b);
		if (tempList.connected(b, c)) list.connect(b, c);
		if (tempList.connected(a, c)) list.connect(a, c);
		tempList.connect(a, b);
		tempList.connect(b, c);
		tempList.connect(a, c);
	}
	return list;
}

/* creates a rectilinear minimum spanning tree from the delaunay triangulation of all the rooms
 * then re-inserts some of the removed connections */
function processConnections(connectionList, rooms) {
    const list = new EdgeList(rooms.length);
    const availableEdges = new EdgeList(rooms.length);
    connectionList.forEach((a, b) => {
        availableEdges.connect(a, b);
    });
    const connectedNodes = new Set();
    const extraEdges = [];

    connectedNodes.add(randomInt(rooms.length));

    let loop = true;
    while (loop) {
        const possibleConnections = [];
        for (const i of connectedNodes) {
            for (const j of availableEdges.list[i]) {
                possibleConnections.push({ a: i, b: j, dist: dist(i, j) });
            }
        }
        possibleConnections.sort((a, b) => {
            return a.dist < b.dist ? -1 : a.dist > b.dist ? 1 : 0;
        });
        if (possibleConnections[0]) {
            const newEdge = possibleConnections[0];
            connectedNodes.add(newEdge.b);
            list.connect(newEdge.a, newEdge.b);
            for (const k of availableEdges.list[newEdge.b]) {
                if (connectedNodes.has(k)) {
                    availableEdges.disconnect(k, newEdge.b);
                    if (!list.connected(newEdge.b, k)) extraEdges.push({ a: newEdge.b, b: k, dist: dist(newEdge.b, k) });
                }
            }
            if (connectedNodes.size === rooms.length) loop = false;
        } else {
            loop = false;
        }
    }

    // sort the removed edges by length, then add some of them back
    extraEdges.sort((a, b) => {
        return a.dist < b.dist ? -1 : a.dist > b.dist ? 1 : 0;
    });
    for (let i = 0; i < extraEdges.length * extraConnectionVal; i++) {
        const j = randomInt(extraEdges.length * 0.4);
        list.connect(extraEdges[j].a, extraEdges[j].b);
        extraEdges.splice(j, 1);
    }

    return list;

    function dist(a, b) {
        const midA = rooms[a].centerCell(),
            midB = rooms[b].centerCell();
        return Math.hypot(midB.x - midA.x, midB.y - midA.y);
    }
}

class EdgeList {
    constructor(length) {
        this.list = new Array(length);
        for (let i = 0; i < length; i++) this.list[i] = new Set();
    }

    connected(a, b) {
        return this.list[a].has(b) || this.list[b].has(a);
    }

    connect(a, b) {
        this.list[a].add(b);
        this.list[b].add(a);
    }

    disconnect(a, b) {
        this.list[a].delete(b);
        this.list[b].delete(a);
    }

    length() {
        let length = 0;
        for (let a = 0; a < this.list.length; a++) {
            this.list[a].forEach(b => {
                if (a < b) length++;
            });
        }
        return length;
    }

    forEach(action) {
        for (let a = 0; a < this.list.length; a++) {
            this.list[a].forEach(b => {
                if (a < b) action(a, b);
            });
        }
    }
}

function randomOdd(range) {
	return (Math.floor(Math.random() * (range / 2)) * 2) + 1;
}

function randomInt(range) {
	return Math.floor(Math.random() * range);
}

function decToHex(dec, padding) {
    var hex = (dec).toString(16);
    padding = padding || 2;

    while (hex.length < padding) hex = "0" + hex;

    return hex;
}

const dir = {
	"north": 0,
	"south": 1,
	"west": 2,
	"east": 3,
};
const dirs = ["north", "south", "west", "east"];

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    offset(dir, amount = 1) {
        switch (dir) {
            case 0:
                return new Cell(this.x, this.y - amount);
            case 1:
                return new Cell(this.x, this.y + amount);
            case 2:
                return new Cell(this.x - amount, this.y);
            case 3:
                return new Cell(this.x + amount, this.y);
        }
    }

    flatten() {
        return gridWidth * this.y + this.x;
    }

    static unflatten(flattened) {
        const x = flattened % gridWidth;
        const y = Math.floor(flattened / gridWidth);
        return new Cell(x, y);
    }

    distanceTo(target) {
        return Math.hypot(target.x - this.x, target.y - this.y);
    }

    manhattanDistanceTo(target) {
        return Math.abs(target.x - this.x) + Math.abs(target.y - this.y);
    }
}

const colors = [
	"#1f1f1f",
	"#7f8faf",
	"#ff0000",
	"#0000ff",
];

function drawGrid() {
	for (var y = 0; y < gridHeight; y++) {
		for (var x = 0; x < gridWidth; x++) {
			ctx.fillStyle = colors[grid[y][x]] || "#ffffff";
			ctx.strokeStyle = "#000000";
			ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
			if (cellSize > 4) ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
		}
	}
}

// function drawGrid() {
//     for (var y = 0; y < gridHeight; y++) {
//         for (var x = 0; x < gridWidth; x++) {
//             ctx.fillStyle = colors[grid[y][x]] || "#ffffff";
//             ctx.strokeStyle = "#000000";
//             ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
//             if (cellSize > 4) ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

//             // Add room number text on top of each room
//             if (grid[y][x] === 1) {
// 				console.log('adding room number');
//                 ctx.fillStyle = "#ffff00";
//                 ctx.font = "40px Arial";
//                 ctx.fillText(rooms.find(room => room.x <= x && x < room.x + room.width && room.y <= y && y < room.y + room.height)?.index + 1 || "", x * cellSize + cellSize / 3, y * cellSize + cellSize / 2);
//             } else {
// 				console.log('could not add room number');
// 			}
//         }
//     }
// }

function drawConnections(connectionList, rooms) {
	ctx.strokeStyle = "#ff000088";
	connectionList.forEach((i, j) => {
		let a = rooms[i].centerPoint();
		let b = rooms[j].centerPoint();
		ctx.beginPath();
		ctx.moveTo(a[0], a[1]);
		ctx.lineTo(b[0], b[1]);
		ctx.closePath();
		ctx.stroke();
	});
}

function floodFill(cell, oldRegion, fillRegion) {
	if (cell && (cell.x < 0 || cell.x >= gridWidth || cell.y < 0 || cell.y >= gridHeight)) return;
	if (grid[cell.y][cell.x] != oldRegion) return;
	grid[cell.y][cell.x] = fillRegion;
	for (var dir = 0; dir < 4; dir++) {
		var adj = cell.offset(dir);
		if (grid[adj.y][adj.x] === oldRegion) {
			floodFill(adj, oldRegion, fillRegion);
		}
	}
}

function stackFloodFill(start, oldRegion, fillRegion) {
	var cellStack = [];
	
	if (oldRegion === fillRegion) return;
	
	if (fill(start, oldRegion, fillRegion)) cellStack.push(start);
	while (cellStack.length > 0) {
		var cell = cellStack[cellStack.length - 1];
		
		var adjCell;
		if (fill(adjCell = cell.offset(0), oldRegion, fillRegion)) cellStack.push(adjCell);
		else if (fill(adjCell = cell.offset(1), oldRegion, fillRegion)) cellStack.push(adjCell);
		else if (fill(adjCell = cell.offset(2), oldRegion, fillRegion)) cellStack.push(adjCell);
		else if (fill(adjCell = cell.offset(3), oldRegion, fillRegion)) cellStack.push(adjCell);
		else cellStack.pop();
	}
	
	function fill(toFill, old, fill) {
		if (grid[toFill.y][toFill.x] != old) return false;
		grid[toFill.y][toFill.x] = fill;
		return true;
	}
}

function forceFill(oldRegion, fillRegion) {
	grid.map((column, y, cols) => {
		column.map((cellRegion, x, col) => {col[x] = (cellRegion === oldRegion ? fillRegion : cellRegion);});
	});
}

function randomRooms(attempts, minWidth, maxWidth) {
	var rooms = [];
	
	for (var i = 0; i < attempts; i++) {
		var width = ((minWidth % 2 === 1) ? minWidth - 1 : minWidth) + randomOdd((maxWidth - minWidth) + 1);
		var height = ((minWidth % 2 === 1) ? minWidth - 1 : minWidth) + randomOdd((maxWidth - minWidth) + 1);
		var x = randomOdd(gridWidth);
		var y = randomOdd(gridHeight);
		
		var room = new Room(x, y, width, height);
		if (room.place()) {
			rooms.push(room);
		}
	}
	
	return rooms;
}

class Room {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.placed = false;
    }

    centerPoint() {
        return [(this.x + this.width / 2) * cellSize, (this.y + this.height / 2) * cellSize];
    }

    centerCell() {
        return new Cell(this.x + Math.ceil(this.width / 2), this.y + Math.ceil(this.height / 2));
    }

    place() {
        if (!this.placed) {
            for (let y = this.y; y < this.y + this.height; y++) {
                for (let x = this.x; x < this.x + this.width; x++) {
                    if (y < 0 || y >= gridHeight || x < 0 || x >= gridWidth || grid[y][x] !== 0) {
                        return false;
                    }
                }
            }
            for (let y = this.y; y < this.y + this.height; y++) {
                for (let x = this.x; x < this.x + this.width; x++) {
                    grid[y][x] = 1;
                }
            }
            this.placed = true;
            return true;
        }
    }

    remove() {
        if (this.placed) {
            for (let y = this.y; y < this.y + this.height; y++) {
                for (let x = this.x; x < this.x + this.width; x++) {
                    grid[y][x] = 0;
                }
            }
            this.placed = false;
            return true;
        }
    }
}