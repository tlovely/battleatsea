var join;

(function() {

// Controller's connection to the server.
var socket = io('/controller');

var selectGame = document.getElementsByName('game')[0];
var shipColor = document.getElementsByName('color')[0];
var playerName = document.getElementsByName('name')[0];
var name = document.getElementById('name');

// (function() {
//   var handler = function() {
//     console.log('here');
//     // Not in full screen.
//     if (window.innerHeight !== screen.height) {
//       console.log('reload');
//       location.reload();
//     }
//   };
//   document.addEventListener("fullscreenchange", handler);
//   document.addEventListener("webkitfullscreenchange", handler);
//   document.addEventListener("mozfullscreenchange", handler);
//   document.addEventListener("MSFullscreenChange", handler);
// })();

// Function for requesting full screen across all popular browsers.
var requestFullscreen = function(e) {
  // go full-screen
  if (e.requestFullscreen) {
    e.requestFullscreen();
  } else if (e.webkitRequestFullscreen) {
    e.webkitRequestFullscreen();
  } else if (e.mozRequestFullScreen) {
    e.mozRequestFullScreen();
  } else if (e.msRequestFullscreen) {
    e.msRequestFullscreen();
  }
};

socket.on('games available', function(games) {
  var html = [];
  games.forEach(function(game) {
    html.push('<option value="'+game+'">'+game+'</option>');
  });
  selectGame.innerHTML = html.join('\n');
});

socket.on('game closed', function() {
  location.href = "/game/closed";
});

socket.emit('get games available');

join = function() {
  socket.emit('init', {
    'name': playerName.value,
    'color': shipColor.value,
    'gameId': selectGame.value
  });

  name.innerHTML = playerName.value;

  var joystick = new Joystick({
    up: function() { socket.emit('up'); console.log('up'); },
    right: function() { socket.emit('right'); console.log('right'); },
    down: function() { socket.emit('down'); console.log('down'); },
    left: function() { socket.emit('left'); console.log('left'); }
  });

  var controller = document.getElementById('controller');

  requestFullscreen(controller);

  document.getElementById('player-setup').style.display = "none";
  controller.style.display = "initial";

  // var fullscreen = false;
  var fire = false;
  controller.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      joystick.init(e.touches[0].clientX, e.touches[0].clientY);
    }
    fire = true;
    setTimeout(function() {
      fire = false;
    }, 250);
  });

  controller.addEventListener('touchmove', function(e) {
    joystick.move(e.touches[0].clientX, e.touches[0].clientY);
  });

  controller.addEventListener('touchend', function(e) {
    if (fire) {
      socket.emit('fire');
      socket.emit(joystick.getDirection());
    }
    if (!e.touches.length) {
      joystick.done();
      socket.emit('stop');
    }
  });
};

})()
