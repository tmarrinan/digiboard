function DigiBoard(canvas) {
	this.ctx = canvas.getContext("2d");

	this.paths = [];
	this.events = {mouse: -1};
	this.bgcolor = "#111111";
	this.colors = {white: "#FFFFFF", red: "#BA1A35", green: "#38A525", blue: "#3052B5", black: this.bgcolor};
	this.sizes = {large: 72, medium: 28, small: 10};
	this.currentColor = this.colors.white;
	this.currentSize = this.sizes.medium;

	this.render();
}

DigiBoard.prototype.render = function() {
	var i, j;
	this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

	this.ctx.fillStyle = this.bgcolor;
	this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

	for (i=0; i<this.paths.length; i++) {
		this.ctx.strokeStyle = this.paths[i].color;
		this.ctx.lineWidth = this.paths[i].width;
		this.ctx.lineCap = "round";

		this.ctx.beginPath();
		this.ctx.moveTo(this.paths[i].path[0].x, this.paths[i].path[0].y);
		for (j=1; j<this.paths[i].path.length; j++) {
			this.ctx.lineTo(this.paths[i].path[j].x, this.paths[i].path[j].y);
		}
		this.ctx.stroke();
	}
};

DigiBoard.prototype.updateColor = function(color) {
	this.currentColor = this.colors[color]
};

DigiBoard.prototype.updateSize = function(size) {
	this.currentSize = this.sizes[size];
};

DigiBoard.prototype.clear = function() {
	this.paths = [];
	this.events = {mouse: -1};
};

DigiBoard.prototype.mousepress = function(x, y) {
	this.paths.push({color: this.currentColor, width: this.currentSize, path: [{x: x, y: y}]});
	this.events.mouse = this.paths.length - 1;
};

DigiBoard.prototype.mousemove = function(x, y) {
	if (this.events.mouse >= 0) {
		this.paths[this.events.mouse].path.push({x: x, y: y});
	}
};

DigiBoard.prototype.mouserelease = function() {
	this.events.mouse = -1;
};

DigiBoard.prototype.touchstart = function(id, x, y) {
	this.paths.push({color: this.currentColor, width: this.currentSize, path: [{x: x, y: y}]});
	this.events[id] = this.paths.length - 1;
};

DigiBoard.prototype.touchmove = function(id, x, y) {
	if (this.events[id] !== undefined) {
		this.paths[this.events[id]].path.push({x: x, y: y});
	}
};

DigiBoard.prototype.touchend = function(id) {
	delete this.events[id];
};