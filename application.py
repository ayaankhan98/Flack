import os
import requests
import datetime
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_session import Session
from flask_socketio import SocketIO, emit


app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
Session(app)
socketio = SocketIO(app)


users = []
channels = []
messages = {}
status = {'key':True}

@app.route("/")
def index():
    if session.get("user"):
        if session.get("user") in users:
            return redirect(url_for('chatrooms'))
        else:
            session.clear()
        return render_template('index.html',text="Your Previous Session Expired :(")
    
    if not status['key']:
        status['key'] = True  
        return render_template("index.html",text="Username Already In Use !")

    return render_template("index.html")


@app.route("/login", methods = ["POST"])
def login():
    username = request.form.get('username')
    if not username:
        return redirect(url_for('index'))
    if username not in users:
        session["user"] = username
        users.append(username)
        return redirect(url_for('chatrooms'))
    status['key'] = False
    return redirect(url_for('index'))

@app.route("/logout",methods=["GET"])
def logout():
    try:
        users.remove(session.get("user"))
    except ValueError:
        return redirect(url_for('index'))
    session.clear()
    return redirect(url_for('index'))

@app.route("/chatrooms")
def chatrooms():
    if session.get("user"):
        user = session.get("user")
        if session.get("user") in users:
            return render_template("chatrooms.html",user=user,channels=channels)
        else:
            session.clear()
    return redirect(url_for('index'))

@socketio.on("channel created")
def channel(data):
    channelname = data["channelname"]
    if channelname in channels:
       emit("announce",{'status':False,'channelname':channelname})
    else:
        channels.append(channelname)
        messages[channelname] = ["#start"]
        emit("announce" , {'status':True,'channelname':channelname}, broadcast=True)

@socketio.on("new message")
def chat(data):
    channelname = data["channelname"]
    user = data["user"]
    typed_msg = data["newmessage"]
    instant = str(datetime.datetime.now())
    if len(messages[channelname]) > 100:
        messages[channelname].pop(0)
        messages[channelname].append(f"{instant} / {user} ==> {typed_msg}")
    else:
        messages[channelname].append(f"{instant} / {user} ==> {typed_msg}")
    emit("message saved",{'savedmessage':f"{instant} / {user} ==> {typed_msg}",'channelname':channelname}, broadcast=True)


@app.route('/chatroom', methods = ["POST"])
def chatroom():
    choosed_channel = str(request.form.get('choosed_channel'))
    if session.get("user"):
        user = session.get("user")
        if session.get("user") in users:
            if choosed_channel in channels:
                session["channel"] = choosed_channel
                return jsonify({'messages':messages[choosed_channel],'channelname':choosed_channel,'user':user})
            else:
                 return redirect(url_for('index'))
          #  return render_template("chatroom.html",user=session.get("user"))
        else:
            session.clear()
    return redirect(url_for('index'))


if __name__ == "__main__":
    socketio.run(app, debug=True)