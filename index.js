var express = require('express');
var WebSocket = require('ws');
var r = require('rethinkdb');

var app = express();

var genId = require('gen-id')('xxxxx')
var http = require('http').Server(app);
var io = require('socket.io')(http);
var controller = io.of('/controller');
var game = io.of('/game');

const PORT = 3000;

r.connect({ db: 'bas' }).then(function(con) {

  app.use('/static', express.static('static'));

  app.get('/', function(req, res, next) {
    res.sendFile('templates/index.html', { root: __dirname });
  });

  app.get('/controller', function(req, res, next) {
    res.sendFile('templates/controller.html', { root: __dirname });
  });

  app.get('/game', function(req, res, next) {
    res.sendFile('templates/game.html', { root: __dirname });
  });

  controller.on('connection', function(socket) {
    var id;
    socket.on('action', function(action) {
      r.table('players').get(id).update(action).run(con);
    });
    socket.on('init', function(player) {
      r.table('players').insert(player).run(con, function(err, res) {
        id = res.generated_keys[0];
      });
    });
    socket.on('close', function() {
      r.table('players').get(id).remove().run(con);
    });
  });

  var games = [];

  game.on('connection', function(socket) {
    var playersInit = [];

    // 'gameId' identifies this instance
    var gameId = (function() {
      while (true) {
        var gameId = genId.generate();
        if (games.indexOf(gameId) - 1) {
          games.push(gameId);
          socket.emit('game init', gameId);
          console.log(gameId);
          return gameId;
        }
      }
    })();

    r.table('players').filter({ gameId: gameId }).changes().run(con, function(err, cursor) {
      cursor.each(function(err, player) {
        player = player.new_val;
        if (player.direction !== undefined) {
          socket.emit('action', { id: player.id, direction: player.direction });
        } else {
          socket.emit('player init', player);
        }
      });
    });

    socket.on('close', function() {
      r.table('players').filter({ gameId: gameId }).delete().run(con, function(err, res) {
        games = games.filter(function(g) {
          return g !== gameId;
        });
      });
    });

  });

  http.listen(PORT);

});
