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

## List to keep track of current users on the server
users = []   

## List to keep track of currently available channels on the server
channels = []

## Dictonary to keep track of messages with their associated channels
messages = {}

## just to track the login status
status = {'key':True}


## Home route
@app.route("/")
def index():

## checking if the user is already logged in or not 
## if user already logged in then redirect user to chatroom
## else show the signup form

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

## once the user filled the signup form the form authentication takes place at this route
## if the username already exist then user is prompted to choose another
## else the username gets registered and the user will be added to seesion 
## to keep track of users activities

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


## when the user presses the logout button then this route is triggerd
## and the user is removed from the session and again redirected to the
## signup page

@app.route("/logout",methods=["GET"])
def logout():
    try:
        users.remove(session.get("user"))
    except ValueError:
        return redirect(url_for('index'))
    session.clear()
    return redirect(url_for('index'))


## once the user signed up then this chatroom page is triggered

@app.route("/chatrooms")
def chatrooms():
    if session.get("user"):
        user = session.get("user")
        if session.get("user") in users:
            return render_template("chatrooms.html",user=user,channels=channels)
        else:
            session.clear()
    return redirect(url_for('index'))


## when someone created a channel on the chatrooms page then this socked is triggered
## the created channel is added to the server channel variable and
## the newly created channel is announced to every member of the server

@socketio.on("channel created")
def channel(data):
    channelname = data["channelname"]
    if channelname in channels:
       emit("announce",{'status':False,'channelname':channelname})
    else:
        channels.append(channelname)
        messages[channelname] = ["#start"]
        emit("announce" , {'status':True,'channelname':channelname}, broadcast=True)


## once the user chooses a channel and sends any message then this route is trigered
## the newly send message is saved to the server message list with the associated channel name
## and finnaly the newly message is announced to all the members of that channel

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



## when the user chooses a channel then a chatroom box is created
## the chatroom box is created by this route


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