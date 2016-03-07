/***************************************************************
 * DigiBoard.js - A Digital Multi-touch Whiteboard Application *
 *                                                             *
 * Copyright (c) 2016, Thomas Marrinan                         *
 *                                                             *
 * Distributed under the BSD 3-Clause License. See LICENSE     *
 * file for details.                                           *
 *                                                             *
 ***                                                         ***
 *                                                             *
 * Paper.js (functions utilized for path simplification)       *
 * https://github.com/paperjs/paper.js/                        *
 *                                                             *
 * Distributed under the MIT license                           *
 *                                                             *
 ***************************************************************/

function DigiBoard(canvas, close, fill, erase) {
	this.ctx = canvas.getContext("2d");

	this.error = 7.5;
	this.paths = [];
	this.selections = [];
	this.events = {draw: {mouse: -1}, selection: {mouse: -1}};
	this.bgcolor = "#111111";
	this.colors = {white: "#FFFFFF", red: "#BA1A35", green: "#38A525", blue: "#3052B5", black: this.bgcolor};
	this.sizes = {large: 72, medium: 28, small: 10};
	this.currentColor = this.colors.white;
	this.currentSize = this.sizes.medium;
	this.toolType = "pen";
	this.closeImg = close;
	this.fillImg = fill;
	this.eraseImg = erase;

	this.render();
}

DigiBoard.prototype.render = function() {
	var i, j;
	this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

	this.ctx.fillStyle = this.bgcolor;
	this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

	// draw pen paths
	this.ctx.lineCap = "round";
	for (i=0; i<this.paths.length; i++) {
		if (this.paths[i].type === "rect") {
			this.ctx.fillStyle = this.paths[i].color;
			this.ctx.fillRect(this.paths[i].left, this.paths[i].top, this.paths[i].width, this.paths[i].height);
		}
		else {
			this.ctx.strokeStyle = this.paths[i].color;
			this.ctx.lineWidth = this.paths[i].width;

			this.ctx.beginPath();
			if (this.paths[i].path.type === "line") {
				this.ctx.moveTo(this.paths[i].path.points[0].x, this.paths[i].path.points[0].y);
				for (j=1; j<this.paths[i].path.points.length; j++) {
					this.ctx.lineTo(this.paths[i].path.points[j].x, this.paths[i].path.points[j].y);
				}
			}
			else if (this.paths[i].path.type === "curve") {
				this.ctx.moveTo(this.paths[i].path.points[0][0].x, this.paths[i].path.points[0][0].y);
				for (j=0; j<this.paths[i].path.points.length; j++) {
					this.ctx.bezierCurveTo(this.paths[i].path.points[j][1].x, this.paths[i].path.points[j][1].y, this.paths[i].path.points[j][2].x, this.paths[i].path.points[j][2].y, this.paths[i].path.points[j][3].x, this.paths[i].path.points[j][3].y);
				}
			}
			this.ctx.stroke();
		}
	}

	// draw selection rectangles
	this.ctx.setLineDash([48, 28]);
	this.ctx.lineCap = "butt";
	var iconX, iconY;
	for (i=0; i<this.selections.length; i++) {
		this.ctx.strokeStyle = "#A8A8A8";
		this.ctx.fillStyle = "rgba(168, 168, 168, 0.7)";
		this.ctx.lineWidth = 8;
		this.ctx.strokeRect(this.selections[i].left, this.selections[i].top, this.selections[i].width, this.selections[i].height);
		this.ctx.fillRect(this.selections[i].left + this.selections[i].width - 60, this.selections[i].top + this.selections[i].height - 60, 64, 64);

		iconX = this.selections[i].left - 5;
		iconY = this.selections[i].top - 70;
		if (this.selections[i].top < 70) { iconY += 76; iconX += 11; }

		this.ctx.fillStyle = "#888888";
		this.ctx.fillRect(iconX +   0, iconY, 64, 64);
		this.ctx.fillRect(iconX +  70, iconY, 64, 64);
		this.ctx.fillRect(iconX + 140, iconY, 64, 64);
		this.ctx.drawImage(this.closeImg, iconX +   0, iconY, 64, 64);
		this.ctx.drawImage(this.fillImg,  iconX +  70, iconY, 64, 64);
		this.ctx.drawImage(this.eraseImg, iconX + 140, iconY, 64, 64);
	}
	this.ctx.setLineDash([]);
};

DigiBoard.prototype.updateColor = function(color) {
	this.currentColor = this.colors[color];
};

DigiBoard.prototype.updateSize = function(size) {
	this.currentSize = this.sizes[size];
};

DigiBoard.prototype.setToolType = function(type) {
	this.toolType = type;
};

DigiBoard.prototype.clear = function() {
	this.paths = [];
	this.selections = [];
	this.events = {draw: {mouse: -1}, selection: {mouse: -1}};
};

DigiBoard.prototype.closeSelection = function(index) {
	this.selections.splice(index, 1);
};

DigiBoard.prototype.fillSelection = function(index) {
	this.paths.push({type: "rect", color: this.currentColor, left: this.selections[index].left, top: this.selections[index].top, width: this.selections[index].width, height: this.selections[index].height});
};

DigiBoard.prototype.eraseSelection = function(index) {
	this.paths.push({type: "rect", color: this.bgcolor, left: this.selections[index].left-1, top: this.selections[index].top-1, width: this.selections[index].width+2, height: this.selections[index].height+2});
};

DigiBoard.prototype.simplifyPath = function(pathId) {
	if (this.paths[pathId].path.type !== "line") return;

	var i, j, t, px, py;
	var cleanPoints = [this.paths[pathId].path.points[0]];
	for (i=1; i<this.paths[pathId].path.points.length; i++) {
		if (!this.paths[pathId].path.points[i].isEqual(this.paths[pathId].path.points[i-1])) {
			cleanPoints.push(this.paths[pathId].path.points[i]);
		}
	}
	if (cleanPoints.length == 1) {
		cleanPoints.push(cleanPoints[0].add(new Vec2(-1, 1)));
	}
	if (cleanPoints.length <= 4) {
		this.paths[pathId].path.points = cleanPoints;
		return;
	}
	var tan1 = cleanPoints[1].subtract(cleanPoints[0]).normalize();
	var tan2 = cleanPoints[cleanPoints.length-2].subtract(cleanPoints[cleanPoints.length-1]).normalize();
	var curves = this.fitCubic(cleanPoints, 0, cleanPoints.length-1, tan1, tan2);
	this.paths[pathId].path.type = "curve";
	this.paths[pathId].path.points = curves;
};

DigiBoard.prototype.fitCubic = function(path, first, last, tan1, tan2) {
	var curves = [];

	if (last - first == 1) {
		var pt1 = path[first];
		var pt2 = path[last];
		var dist = pt2.subtract(pt1).length() / 3.0;

		curves.push([pt1, pt1.add(tan1.normalize(dist)), pt2.add(tan2.normalize(dist)), pt2]);
		return curves;
	}

	var i;
	var uPrime = this.chordLengthParameterize(path, first, last);
	var maxError = Math.max(this.error, this.error*this.error);
	var split;
	var parametersInOrder = true;
	for (i=0; i<=4; i++) {
		var curve =this.generateBezier(path, first, last, uPrime, tan1, tan2);
		var max = this.findMaxError(path, first, last, curve, uPrime);
		if (max.error < this.error && parametersInOrder) {
			curves.push(curve);
			return curves;
		}
		split = max.index;
		if (max.error >= maxError) {
			break;
		}
		parametersInOrder = this.reparameterize(path, first, last, uPrime, curve);
		maxError = max.error;
	}
	var v1 = path[split - 1].subtract(path[split]);
	var v2 = path[split].subtract(path[split + 1]);
	var tanC = v1.add(v2).normalize();
	curves.push.apply(curves, this.fitCubic(path, first, split, tan1, tanC));
	curves.push.apply(curves, this.fitCubic(path, split, last, tanC.negate(), tan2));
	return curves;
};

DigiBoard.prototype.chordLengthParameterize = function(path, first, last) {
	var i;
	var u = [0];
	for (i=first+1; i<=last; i++) {
		u.push(u[i - first - 1] + path[i].subtract(path[i-1]).length());
	}
	var m = last - first;
	for (i=1; i<=m; i++) {
		u[i] /= u[m];
	}
	return u;
};

DigiBoard.prototype.reparameterize = function(path, first, last, u, curve) {
	var i;
	for (i=first; i<=last; i++) {
		u[i - first] = this.findRoot(curve, path[i], u[i - first]);
	}
	var l = u.length;
	for (i=1; i<l; i++) {
		if (u[i] <= u[i - 1]){
			return false;
		}
	}
	return true;
};

DigiBoard.prototype.findRoot = function(curve, point, u) {
	var i;
	var curve1 = [];
	var curve2 = [];
	for (i=0; i<3; i++) {
		curve1.push(curve[i + 1].subtract(curve[i]).multiply(3.0));
	}
	for (i=0; i<2; i++) {
		curve2.push(curve1[i + 1].subtract(curve1[i]).multiply(2.0));
	}
	var pt = this.evaluate(3, curve, u);
	var pt1 = this.evaluate(2, curve1, u);
	var pt2 = this.evaluate(1, curve2, u);
	var diff = pt.subtract(point);
	var df = pt1.dot(pt1) + diff.dot(pt2);
	if (Math.abs(df) < 0.000001) {
		return u;
	}
	return u - diff.dot(pt1) / df;
};

DigiBoard.prototype.evaluate = function(degree, curve, t) {
	var i;
	var j;
	var tmp = curve.slice();
	for (i=1; i<=degree; i++) {
		for (j=0; j<=degree-i; j++) {
			tmp[j] = tmp[j].multiply(1.0 - t).add(tmp[j + 1].multiply(t));
		}
	}
	return tmp[0];
};

DigiBoard.prototype.generateBezier = function(path, first, last, uPrime, tan1, tan2) {
	var i;
	var epsilon = 1e-12;
	var pt1 = path[first];
	var pt2 = path[last];
	var C = [[0, 0], [0, 0]];
	var X = [0, 0];
	var l = last - first + 1;

	var u, t, b, b0, b1, b2, b3, a1, a2, tmp;

	for (i=0; i<l; i++) {
		u = uPrime[i];
		t = 1 - u;
		b = 3 * u * t;
		b0 = t * t * t;
		b1 = b * t;
		b2 = b * u;
		b3 = u * u * u;
		a1 = tan1.normalize(b1);
		a2 = tan2.normalize(b2);
		tmp = path[first + i].subtract(pt1.multiply(b0 + b1)).subtract(pt2.multiply(b2 + b3));
		C[0][0] += a1.dot(a1);
		C[0][1] += a1.dot(a2);
		C[1][0] = C[0][1];
		C[1][1] += a2.dot(a2);
		X[0] += a1.dot(tmp);
		X[1] += a2.dot(tmp);
	}

	var detC0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1];
	var alpha1, alpha2;
	if (Math.abs(detC0C1) > epsilon) {
		var detC0X = C[0][0] * X[1] -    C[1][0] * X[0];
		var detXC1 = X[0]    * C[1][1] - X[1]    * C[0][1];
		alpha1 = detXC1 / detC0C1;
		alpha2 = detC0X / detC0C1;
	}
	else {
		var c0 = C[0][0] + C[0][1];
		var c1 = C[1][0] + C[1][1];
		if (Math.abs(c0) > epsilon) {
			alpha1 = alpha2 = X[0] / c0;
		}
		else if (Math.abs(c1) > epsilon) {
			alpha1 = alpha2 = X[1] / c1;
		}
		else {
			alpha1 = alpha2 = 0;
		}
	}

	var segLength = pt2.subtract(pt1).length();
	var eps = epsilon * segLength;
	var handle1, handle2;
	if (alpha1 < eps || alpha2 < eps) {
		alpha1 = alpha2 = segLength / 3;
	}
	else {
		var line = pt2.subtract(pt1);
		handle1 = tan1.normalize(alpha1);
		handle2 = tan2.normalize(alpha2);
		if (handle1.dot(line) - handle2.dot(line) > segLength * segLength) {
			alpha1 = alpha2 = segLength / 3;
			handle1 = handle2 = null;
		}
	}
	
	return [pt1, pt1.add(handle1 || tan1.normalize(alpha1)), pt2.add(handle2 || tan2.normalize(alpha2)), pt2];
};

DigiBoard.prototype.findMaxError = function(path, first, last, curve, u) {
	var i;
	var p;
	var v;
	var dist;
	var index = Math.floor((last - first + 1) / 2);
	var maxDist = 0;
	for (i=first + 1; i<last; i++) {
		p = this.evaluate(3, curve, u[i - first]);
		v = p.subtract(path[i]);
		dist = v.x*v.x + v.y*v.y;
		if (dist >= maxDist) {
			maxDist = dist;
			index = i;
		}
	}
	return {error: maxDist, index: index};
};

DigiBoard.prototype.mousepress = function(x, y) {
	var i;
	var iconX, iconY;
	for (i=this.selections.length-1; i>=0; i--) {
		iconX = this.selections[i].left - 5;
		iconY = this.selections[i].top - 70;
		if (this.selections[i].top < 70) { iconY += 76; iconX += 11; }

		// click on button for selection box
		if (x >= iconX + 0 && x <= iconX + 64 && y >= iconY && y <= iconY + 64) {
			this.closeSelection(i);
			return;
		}
		else if (x >= iconX + 70 && x <= iconX + 134 && y >= iconY && y <= iconY + 64) {
			this.fillSelection(i);
			return;
		}
		else if (x >= iconX + 140 && x <= iconX + 204 && y >= iconY && y <= iconY + 64) {
			this.eraseSelection(i);
			return;
		}

		// press inside selection box
		if (x >= this.selections[i].left && x <= this.selections[i].left + this.selections[i].width && y >= this.selections[i].top && y <= this.selections[i].top + this.selections[i].height) {
			if (x >= this.selections[i].left + this.selections[i].width - 60 && y >= this.selections[i].top + this.selections[i].height - 60) {
				this.events.selection.mouse = i;
			}
			else {
				this.selections[i].selected.mouse.move = true;
				this.selections[i].selected.mouse.origin.x = x
				this.selections[i].selected.mouse.origin.y = y;
			}
			return;
		}
	}

	if (this.toolType === "pen") {
		this.paths.push({color: this.currentColor, width: this.currentSize, path: {type: "line", points: [new Vec2(x, y)]}});
		this.events.draw.mouse = this.paths.length - 1;
	}
	else if (this.toolType === "eraser") {
		this.paths.push({color: this.bgcolor, width: this.currentSize, path: {type: "line", points: [new Vec2(x, y)]}});
		this.events.draw.mouse = this.paths.length - 1;
	}
	else { // toolType === "selection"
		this.selections.push({origin: new Vec2(x, y), left: x, top: y, width: 0, height: 0, selected: {mouse: {move: false, origin: new Vec2(0, 0)}}});
		this.events.selection.mouse = this.selections.length - 1;
	}
};

DigiBoard.prototype.mousemove = function(x, y) {
	if (this.events.draw.mouse >= 0) {
		this.paths[this.events.draw.mouse].path.points.push(new Vec2(x, y));
	}
	else if (this.events.selection.mouse >= 0) {
		var origin = this.selections[this.events.selection.mouse].origin;
		this.selections[this.events.selection.mouse].width = Math.abs(origin.x - x);
		this.selections[this.events.selection.mouse].height = Math.abs(origin.y - y);
		this.selections[this.events.selection.mouse].left = origin.x <= x ? origin.x : x;
		this.selections[this.events.selection.mouse].top = origin.y <= y ? origin.y : y;
	}
	else {
		var i;
		for (i=this.selections.length-1; i>=0; i--) {
			if (this.selections[i].selected.mouse.move === true) {
				var translate = (new Vec2(x, y)).subtract(this.selections[i].selected.mouse.origin);

				this.selections[i].left += translate.x;
				this.selections[i].top += translate.y;

				this.selections[i].selected.mouse.origin.x = x;
				this.selections[i].selected.mouse.origin.y = y;
			}
		}
	}
};

DigiBoard.prototype.mouserelease = function() {
	if (this.events.draw.mouse >= 0) {
		this.simplifyPath(this.events.draw.mouse);
		this.events.draw.mouse = -1;
	}
	else if (this.events.selection.mouse >= 0) {
		this.selections[this.events.selection.mouse].origin.x = this.selections[this.events.selection.mouse].left;
		this.selections[this.events.selection.mouse].origin.y = this.selections[this.events.selection.mouse].top;
		if (this.selections[this.events.selection.mouse].width <= 8 && this.selections[this.events.selection.mouse].height <= 8) {
			this.closeSelection(this.events.selection.mouse);
		}
		this.events.selection.mouse = -1;
	}
	else {
		var i;
		for (i=this.selections.length-1; i>=0; i--) {
			if (this.selections[i].selected.mouse.move === true) {
				this.selections[i].origin.x = this.selections[i].left;
				this.selections[i].origin.y = this.selections[i].top;
				this.selections[i].selected.mouse.move = false;
			}
		}
	}
};

DigiBoard.prototype.touchstart = function(id, x, y) {
	var i;
	var iconX, iconY;
	for (i=this.selections.length-1; i>=0; i--) {
		iconX = this.selections[i].left - 5;
		iconY = this.selections[i].top - 70;
		if (this.selections[i].top < 70) { iconY += 76; iconX += 11; }

		if (x >= iconX + 0 && x <= iconX + 64 && y >= iconY && y <= iconY + 64) {
			this.closeSelection(i);
			return;
		}
		else if (x >= iconX + 70 && x <= iconX + 134 && y >= iconY && y <= iconY + 64) {
			this.fillSelection(i);
			return;
		}
		else if (x >= iconX + 140 && x <= iconX + 204 && y >= iconY && y <= iconY + 64) {
			this.eraseSelection(i);
			return;
		}

		// press inside selection box
		if (x >= this.selections[i].left && x <= this.selections[i].left + this.selections[i].width && y >= this.selections[i].top && y <= this.selections[i].top + this.selections[i].height) {
			if (x >= this.selections[i].left + this.selections[i].width - 60 && y >= this.selections[i].top + this.selections[i].height - 60) {
				this.events.selection[id] = i;
			}
			else {
				this.selections[i].selected[id] = {move: true, origin: new Vec2(x, y)};
			}
			return;
		}
	}

	if (this.toolType === "pen") {
		this.paths.push({color: this.currentColor, width: this.currentSize, path: {type: "line", points: [new Vec2(x, y)]}});
		this.events.draw[id] = this.paths.length - 1;
	}
	else if (this.toolType === "eraser") {
		this.paths.push({color: this.bgcolor, width: this.currentSize, path: {type: "line", points: [new Vec2(x, y)]}});
		this.events.draw[id] = this.paths.length - 1;
	}
	else { // toolType === "selection"
		this.selections.push({origin: new Vec2(x, y), left: x, top: y, width: 0, height: 0, selected: {mouse: {move: false, origin: new Vec2(0, 0)}}});
		this.events.selection[id] = this.selections.length - 1;
	}
};

DigiBoard.prototype.touchmove = function(id, x, y) {
	if (this.events.draw[id] !== undefined) {
		this.paths[this.events.draw[id]].path.points.push(new Vec2(x, y));
	}
	else if (this.events.selection[id] !== undefined) {
		var origin = this.selections[this.events.selection[id]].origin;
		this.selections[this.events.selection[id]].width = Math.abs(origin.x - x);
		this.selections[this.events.selection[id]].height = Math.abs(origin.y - y);
		this.selections[this.events.selection[id]].left = origin.x <= x ? origin.x : x;
		this.selections[this.events.selection[id]].top = origin.y <= y ? origin.y : y;
	}
	else {
		var i;
		for (i=this.selections.length-1; i>=0; i--) {
			if (this.selections[i].selected[id] && this.selections[i].selected[id].move === true) {
				var translate = (new Vec2(x, y)).subtract(this.selections[i].selected[id].origin);

				this.selections[i].left += translate.x;
				this.selections[i].top += translate.y;

				this.selections[i].selected[id].origin.x = x;
				this.selections[i].selected[id].origin.y = y;
			}
		}
	}
};

DigiBoard.prototype.touchend = function(id) {
	if (this.events.draw[id] !== undefined) {
		this.simplifyPath(this.events.draw[id]);
		delete this.events.draw[id];
	}
	else if (this.events.selection[id] >= 0) {
		this.selections[this.events.selection[id]].origin.x = this.selections[this.events.selection[id]].left;
		this.selections[this.events.selection[id]].origin.y = this.selections[this.events.selection[id]].top;
		if (this.selections[this.events.selection[id]].width <= 8 && this.selections[this.events.selection[id]].height <= 8) {
			this.closeSelection(this.events.selection[id]);
		}
		delete this.events.selection[id];
	}
	else {
		var i;
		for (i=this.selections.length-1; i>=0; i--) {
			if (this.selections[i].selected[id] && this.selections[i].selected[id].move === true) {
				this.selections[i].origin.x = this.selections[i].left;
				this.selections[i].origin.y = this.selections[i].top;
				this.selections[i].selected[id].move = false;
				delete this.selections[i].selected[id];
			}
		}
	}
};


/***************************************************************/
function Vec2(x, y) {
	this.x = 0;
	this.y = 0;
	if (x instanceof Array && x.length >=2) {
		this.x = x[0];
		this.y = x[1];
	}
	else if (typeof x === "number" && typeof y === "number") {
		this.x = x;
		this.y = y;
	}
}

Vec2.prototype.length = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
};

Vec2.prototype.normalize = function(length) {
	length = length || 1.0;
	var currentLength = this.length();
	var scale = currentLength !== 0.0 ? length / currentLength : 0.0;
	return new Vec2(this.x * scale, this.y * scale);
};

Vec2.prototype.add = function(other) {
	return new Vec2(this.x + other.x, this.y + other.y);
};

Vec2.prototype.subtract = function(other) {
	return new Vec2(this.x - other.x, this.y - other.y);
};

Vec2.prototype.multiply = function(scalar) {
	return new Vec2(scalar * this.x, scalar * this.y);
};

Vec2.prototype.negate = function() {
	return new Vec2(-1.0 * this.x, -1.0 * this.y);
};

Vec2.prototype.dot = function(other) {
	return new Vec2(this.x * other.x, this.y * other.y);
}

Vec2.prototype.isEqual = function(other) {
	if (this.x === other.x && this.y === other.y)
		return true;
	return false;
};
