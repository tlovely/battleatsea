var Joystick;

;(function() {

var sign = function(p1, p2, p3) {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

// Function which returns true if the first argued point is within
// the subsequently describe triangle (following three points).
var pointInTriangle = function(pt, v1, v2, v3) {
  b1 = sign(pt, v1, v2) < 0;
  b2 = sign(pt, v2, v3) < 0;
  b3 = sign(pt, v3, v1) < 0;
  return ((b1 == b2) && (b2 == b3));
}

// Between points.
var distance = function(x2, x1, y2, y1) {
  return Math.sqrt(
    Math.round(Math.pow(x2 - x1, 2)) +
    Math.round(Math.pow(y2 - y1, 2))
  );
};

// var slope = function(x2, x1, y2, y1) {
//   return (y2 - y1) / (x2 - x1);
// };

// Function that returns the coordinant from origin at a certain radial
// distance given a second point.
var secondPointByDistance = function(x, y, r) {
  var atan = Math.atan(x / y);
  if (y < 0) {
    return {
      x: -(r * Math.sin(atan)),
      y: -(r * Math.cos(atan))
    }
  }
  else {
    return {
      x: r * Math.sin(atan),
      y: r * Math.cos(atan)
    }
  }
};

Joystick = function Joystick(events) {
  var that = this;
  // The radial limit of the joytsick.
  var limit = 65;
  var joystick = document.getElementById('joystick');
  var center = { x: 0, y: 0 };
  var fromCenter = { x: 0, y: 0 };
  var position = { x: 0, y: 0 };
  var zero = { x: 0, y: 0 };
  var direction = "";

  // Calculates the diagnoal length of a quarter of
  // a square, the whole of which could
  // fit exactly outside of the invisible circle which limits the
  // movement of the joystick. This number is used to create the
  // coordinates for the four triangles that delimit the up, right, down,
  // and left areas of the joysticks movement range. The `direction`
  // method uses these coordinates to determine which area the joystick
  // in.
  var quadrantDiagonalLimit = limit * Math.sqrt(2);
  var bottomLeft = { x: -quadrantDiagonalLimit, y: quadrantDiagonalLimit };
  var bottomRight = { x: quadrantDiagonalLimit, y: quadrantDiagonalLimit };
  var topLeft = { x: -quadrantDiagonalLimit, y: -quadrantDiagonalLimit };
  var topRight = { x: quadrantDiagonalLimit, y: -quadrantDiagonalLimit };
  // Calculates if
  this.direction = function(point) {
    if (pointInTriangle(point, zero, bottomLeft, bottomRight))
      return 'down';
    else if (pointInTriangle(point, zero, bottomLeft, topLeft))
      return'left';
    else if (pointInTriangle(point, zero, topRight, topLeft))
      return'up';
    else if (pointInTriangle(point, zero, topRight, bottomRight))
      return 'right';
  };

  this.move = function(x, y) {
    // The coordinates from the touchpoint (origin).
    fromCenter = {
      x: (x - center.x) - (joystick.offsetWidth / 2),
      y: (y - center.y) - (joystick.offsetHeight / 2)
    };
    // If touch point is less than 65 pixels from original touch
    // point (origin) location ...
    if (distance(0, fromCenter.x, 0, fromCenter.y) < limit) {
      position.x = (x - (joystick.offsetWidth / 2));
      position.y = (y - (joystick.offsetHeight / 2));
    }
    // ... otherwise, calculate the point along the line from origin to
    // the touch point that is 65 pixels from origin.
    else {
      fromCenter = secondPointByDistance(fromCenter.x, fromCenter.y, limit);
      position = { x: center.x + fromCenter.x, y: center.y + fromCenter.y };
    }
    // Produces box shadow that is 50% behind the joystick ball.
    joystick.style.boxShadow = [
      -fromCenter.x * 0.5, "px ",
      -fromCenter.y * 0.5, "px ",
      "0px rgb(0, 0, 100)"
    ].join('');
    // Moves the joystick to the touch point or calculated limit.
    joystick.style.left = position.x + "px";
    joystick.style.top = position.y + "px";
    // DIRECTION EVENT
    _direction = that.direction(fromCenter);
    if (_direction !== direction) {
      direction = _direction;
      events[direction] && events[direction]();
    }
  };

  this.getDirection = function() { return direction; };

  this.init = function(x, y) {
    direction = "";
    // Initialized relative joystick position.
    fromCenter = { x: 0, y: 0 };
    // Makes joystick visible.
    joystick.style.display = "inline-block";
    // Makes calculations to position element by it's center, and not
    // top left position.
    center = {
      x: x - (joystick.offsetWidth / 2),
      y: y - (joystick.offsetHeight / 2)
    };
    // Moves joystick.
    joystick.style.left = center.x + "px";
    joystick.style.top = center.y + "px";
    // Zeros box shadow.
    joystick.style.boxShadow = "0 0 0 black";
  };

  // Hides joystick.
  this.done = function() {
    joystick.style.display = "none";
  };

};

})()
