var async = require('async');
var express = require('express');
var morgan = require('morgan');
var WebSocket = require('ws');
var r = require('rethinkdb');

var app = express();

// Apache style request / response logging.
app.use(morgan('combined'));

var genId = require('gen-id')('xxxxx')
var http = require('http').Server(app);
var io = require('socket.io')(http);
var controller = io.of('/controller');
var game = io.of('/game');

const PORT = 80;

var con;
var gameIDs = [];

async.series([
  function(next) {
    r.connect({ host: 'localhost', db: 'battleatsea' }).then(function(_con) {
      console.log('CONNECTED: RethinkDB');
      con = _con;
      next();
    }).catch(function(err) {
      next(err);
    });
  },
  function(next) {
    r.db('battleatsea').table('players').delete().run(con, function(err, cur) {
      next(err);
    });
  },
  function(next) {

    app.use('/static', express.static('static'));

    app.get('/', function(req, res) {
      res.sendFile('templates/index.html', { root: __dirname });
    });

    app.get('/controller', function(req, res) {
      res.sendFile('templates/touch_controller.html', { root: __dirname });
    });

    app.get('/game/closed', function(req, res) {
      res.sendFile('templates/game_closed.html', { root: __dirname });
    });

    app.get('/game', function(req, res) {
      res.sendFile('templates/game.html', { root: __dirname });
    });

    app.get('/games', function(req, res) {
      res.json(gameIDs);
    });

    controller.on('connection', function(socket) {
      // Player id,
      var id;
      // Happens once per connection. Creates player and saves id.
      socket.on('init', function(player) {
        r.table('players').insert(player).run(con, function(err, res) {
          id = res.generated_keys[0];
          // Watches for existence of game record. If removed on game
          // disconnect from server, then sends 'game closed' event to
          // controller clients attached to that game.
          r.db('battleatsea').table('players').filter({ id: id }).pluck('id').changes().run(con, function(err, cur) {
            cur.each(function(player) {
              if (player === null) {
                socket.emit('game closed');
              }
            })
          });
        });
      });
      // All player action events.
      ['up', 'right', 'down', 'left', 'fire', 'stop'].forEach(function(action) {
        socket.on(action, function() {
          r.table('players').get(id).update({
            direction: action !== 'stop' ? action : ''
          }).run(con);
        });
      });
      // Event for requesting available games.
      socket.on('get games available', function() {
        socket.emit('games available', gameIDs);
      });
      // Deletes player object.
      socket.on('disconnect', function() {
        if (id) {
          r.table('players').get(id).delete().run(con);
        }
      });
      socket.on('error', function(err) {
        console.log(err);
      });
    });

    // The /game page connects to this websocket in order to recieve controller
    // events.
    game.on('connection', function(socket) {
      var playersInit = [];

      // 'gameId' identifies this game session. This code insures that the
      // gameId is unique.
      var gameId = (function() {
        while (true) {
          var _gameId = genId.generate();
          // If 'indexOf' returns -1, then -1 + 1 === 0 (falsy); id unused.
          if (!Boolean(gameIDs.indexOf(_gameId) + 1)) {
            console.log(gameIDs);
            gameIDs.push(_gameId);
            socket.emit('game init', _gameId);
            return _gameId;
          }
        }
      })();

      // Subscribes to all changes to players table that
      r.table('players').filter({ gameId: gameId }).changes().run(con, function(err, cursor) {
        cursor.each(function(err, _player) {
          player = _player.new_val;
          if (player === null) {
            if (_player.old_val && typeof(_player.old_val) === 'object') {
              socket.emit('player remove', _player.old_val.id);
            }
          } else if (player.direction !== undefined) {
            var action = player.direction !== '' ? player.direction : 'stop';
            socket.emit(action, player.id);
          } else {
            socket.emit('player init', player);
          }
        });
      });

      socket.on('disconnect', function() {
        console.log('disconnect');
        // TODO: Fix. Not doing anything.
        r.table('players').filter({ gameId: gameId }).delete().run(con, function(err, res) {
          var newGameIDs = [];
          // Removes gameID from gameIDs list.
          gameIDs.forEach(function(_gameID) {
            if (_gameID !== gameId) newGameIDs.push(_gameID);
            return newGameIDs;
          });
          gameIDs = newGameIDs;
        });
      });

      socket.on('error', function(err) {
        console.log(err);
      });

    });

    http.listen(PORT);

    next();

  }
], function(err) {
  if (err) {
    console.error(
      'Darn! The server failed to start. Well ... here\'s the error:',
      err
    );
  }
});
