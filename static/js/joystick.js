var Joystick;

;(function() {

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
  var ratio = r / Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
  return {
    x: x*ratio, 
    y: y*ratio
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

  // Calculates if
  this.direction = function(point) {
    if (Math.abs(point.x) > Math.abs(point.y)) { // if x is dominant
      if (point.x > 0)
        return 'right';
      else
        return 'left';
    } else {
      if (point.y > 0)
        return 'up';
      else
        return 'down';
    }
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
