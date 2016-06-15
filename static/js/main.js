var socket = io('/game');

var con;
var changed;
var gameId;
var repositionScores = false;

var ships = [];
var shipgroup;

var oceanUp = true;
var oceanMoveCount = 0;

var width = window.innerWidth;
var height = window.innerHeight;

var game = new Phaser.Game(
  width,
  height,
  Phaser.AUTO,
  '',
  {
    preload: preload,
    create: create,
    update: update
  }
);

function preload() {
  this.stage.disableVisibilityChange = true;
  game.load.image('ocean', '/static/images/ocean.png');
  game.load.image('canonball', '/static/images/canonball.png');
  game.load.spritesheet('ship', '/static/sprites/ships.png', 32, 32);
  game.load.spritesheet('explosion', '/static/sprites/explosion.png', 128, 128);

  socket.on('game init', function(id) {
    gameId = id;
  });

  socket.on('player init', function(player) {
    ships[player.id] = new Ship(player.name, player.color, game, shipgroup);
  });

  socket.on('player remove', function(id) {
    ships[id].remove();
    delete ships[id];
    repositionScores = true;
  });

  socket.on('up', function(id) { ships[id].direction = 'up'; });
  socket.on('right', function(id) { ships[id].direction = 'right'; });
  socket.on('down', function(id) { ships[id].direction = 'down'; });
  socket.on('left', function(id) { ships[id].direction = 'left'; });
  socket.on('stop', function(id) { ships[id].direction = ''; });
  socket.on('fire', function(id) { ships[id].fireCanon = true; });

};

function create() {
  ocean = game.add.tileSprite(0, 0, width, height, 'ocean');
  shipgroup = game.add.group();
  canonballs = game.add.group();
  canonballs.enableBody = true;
  canonballs.physicsBodyType = Phaser.Physics.ARCADE;

  gameIdLabel = game.add.text(width - 150, 50, gameId, { fontSize: '25px', fill: '#fff' });
  gameIdLabel.alpha = 0.75;

  for (var i = 0; i < 50; i++) {
    var b = canonballs.create(0, 0, 'canonball');
    b.name = 'canonball' + i;
    b.exists = false;
    b.visible = false;
    b.checkWorldBounds = true;
    b.events.onOutOfBounds.add(function(canonball) {
      canonball.kill();
    }, this);
  }

};

function update() {

  if (repositionScores) {
    Object.keys(ships).forEach(function(id, i) {
      var ship = ships[id];
      ship.repositionScore(i);
    });
    repositionScores = false;
  }

  game.physics.arcade.overlap(canonballs, shipgroup, function(canonball, ship) {
    canonball.kill();
    Object.keys(ships).forEach(function(id) {
      var s = ships[id];
      console.log(ship, s._object);
      if (ship === s._object) {
        canonball.attacker.incScore();
        s.exploding = true;
      }
    });
  }, null, this);

  // Animates ocean.
  if (oceanMoveCount == 30) {
    if (oceanUp) {  ocean.tilePosition.y = ocean.tilePosition.y + 10; }
    else { ocean.tilePosition.y = ocean.tilePosition.y - 10; }
    oceanUp = !oceanUp;
    oceanMoveCount = 0;
  }
  oceanMoveCount++;
  // ---------------

  Object.keys(ships).forEach(function(id) {
    var ship = ships[id];
    ship.move(ship.direction);
    if (ship.fireCanon) {
      ship.fireCanon = false;
      ship.fire();
    }
    if (ship.exploding) {
      ship.explode();
    }
  });

};

function Ship(_name, color, game, shipgroup) {
  var that = this;

  that.exploding = false;
  var canonTime = 0;
  var score;
  var start_x = game.rnd.integerInRange(100, width - 100);
  var start_y = game.rnd.integerInRange(100, height - 100);

  // Chosen sprite beginning point.
  var s = {
    'white': 0,
    'black': 3,
    'grey': 6,
    'red': 9,
    'blue': 48,
    'yellow': 51,
    'green': 54,
    'strip': 57
  }[color];

  var c = {
    'white': '#fff',
    'black': '#000',
    'grey': '#555',
    'red': '#f00',
    'blue': '#00f',
    'yellow': '#ff0',
    'green': '#0f0',
    'strip': '#800'
  }[color];

  var ship = shipgroup.create(start_x, start_y, 'ship');
  this._object = ship;

  //  We need to enable physics on the ship
  game.physics.arcade.enable(ship);

  ship.animations.add('down', [s+0, s+1, s+2], 10, true);
  ship.animations.add('left', [s+12, s+13, s+14], 10, true);
  ship.animations.add('right', [s+24, s+25, s+26], 10, true);
  ship.animations.add('up', [s+36, s+37, s+38], 10, true);
  ship.animations.play('down');

  // cursors = game.input.keyboard.createCursorKeys();

  this.repositionScore = function(m, s) {
    score && score.destroy();
    score = game.add.text(
      16,
      ((20 * (m + 1)) * 1.5),
      _name + ': ' + (s ? s : (score ? score.text.split(": ")[1] : 0)),
      { fontSize: '25px', fill: c }
    );
    score.alpha = 0.75;
  };

  // Next tick.
  //setTimeout(function() {
  this.repositionScore(Object.keys(ships).length, 0);
  //}, 0);

  var name = game.add.text(start_x, start_y - 20, _name, { fontSize: '15px', fill: c });

  var velocity = 200;
  var move = {
    left: { velocity: -(velocity), axis: 'x' },
    right: { velocity: velocity, axis: 'x' },
    down: { velocity: velocity, axis: 'y' },
    up: { velocity: -(velocity), axis: 'y' }
  };

  var lastDirection = 'down';
  this.move = function(direction) {
    //  Reset the ships velocity (movement)
    ship.body.velocity.x = 0;
    ship.body.velocity.y = 0;

    if (direction && direction.length) {
      lastDirection = direction;
      // Gets which axis the ship is travelling in and the velocity.
      var axis = move[direction].axis;
      var velocity = move[direction].velocity;
      ship.body.velocity[axis] = velocity;
      ship.animations.play(direction);
      // Moves label with player's ship.
      name.position.x = ship.body.position.x;
      name.position.y = ship.body.position.y - 20;
      // Relavent metric to axis.
      var metric = (axis == 'x' ? width : height);
      // Causes ship to appear on opposite side of screen.
      if (ship.body.position[axis] < 0) {
        ship.body.position[axis] = metric;
      } else if (ship.body.position[axis] > metric) {
        ship.body.position[axis] = 0;
      }
    } else {
      ship.animations.stop();
    }

  };

  this.fire = function() {
    console.log(game.time.now, canonTime);
    if (game.time.now > canonTime) {
      console.log("fire");
      canonball = canonballs.getFirstExists(false);
      if (canonball) {
        canonball.attacker = that;
        console.log("fire2", lastDirection);
        canonball.reset(ship.x + 6, ship.y - 8);
        if (lastDirection === "up") {
          canonball.body.velocity.y = -300;
        } else if (lastDirection === "down") {
          canonball.body.velocity.y = 300;
        } else if (lastDirection === "left") {
          canonball.body.velocity.x = -300;
        } else if (lastDirection === "right") {
          canonball.body.velocity.x = 300;
        }
        canonTime = game.time.now + 150;
      }
    }
  };

  this.remove = function() {
    ship.kill();
    score.destroy();
    name.destroy();
  };

  this.sink = function() {
    ship.body.position.x = game.rnd.integerInRange(100, width - 100);
    ship.body.position.y = game.rnd.integerInRange(100, height - 100);
    name.position.x = ship.body.position.x;
    name.position.y = ship.body.position.y - 20;
  };

  this.incScore = function() {
    score.text = name.text + ": " + (++score.text.split(": ")[1]);
  };

  var explosion = game.add.sprite(ship.body.position.x, ship.body.position.y, "explosion");
  game.physics.arcade.enable(explosion);
  explosion.animations.add("explode", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 10, true)
  explosion.exists = false;
  explosion.visible = false;
  var explodeInc = 10;
  var explodeTime = 0;

  this.explode = function() {
      if (explodeInc == 10) {
        explosion.reset(ship.x - 50, ship.y - 50);
      }

      if (game.time.now > explodeTime) {
        explodeTime = game.time.now + 60;
        if (--explodeInc) {
          explosion.animations.play("explode");
        } else {
          explodeInc = 10;
          explosion.exists = false;
          explosion.visible = false;
          that.exploding = false;
          that.sink();
        }
      }
  };

};
