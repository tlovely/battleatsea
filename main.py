from flask import Flask, render_template
from flask_sockets import Sockets

import rethinkdb as r

import json

app = Flask(__name__)
sockets = Sockets(app)

@sockets.route('/controller')
def ws_controller(ws):
    print ws
    _id = None
    player = None

    con = r.connect()
    players = r.db('bas').table('players')

    message = False
    while not message:
        message = ws.receive()
        print message

    player = json.loads(message)

    _id = players.insert(player).run(con)["generated_keys"][0]

    try:
        while not ws.closed:
            message = json.loads(ws.receive())
            print message
            players.get(_id).update(message).run(con)
    except:
        pass

    players.get(_id).update({ "remove": True }).run(con)
    players.get(_id).delete().run(con)
    con.close()

@sockets.route('/players')
def ws_players(ws):
    con = r.connect()
    players = r.db('bas').table('players')
    while not ws.closed:
        for player in players.changes().run(con):
            ws.send(json.dumps(player['new_val']))

@app.route('/')
def root():
    return render_template('index.html')

@app.route('/game')
def game():
    return render_template('game.html')

@app.route('/con')
def controller():
    return render_template('controller.html')


if __name__ == "__main__":
    # app.run(debug=True, host="0.0.0.0", port=8001)
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler
    server = pywsgi.WSGIServer(('0.0.0.0', 8001), app, handler_class=WebSocketHandler)
    server.serve_forever()
