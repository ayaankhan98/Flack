// This Channels.js file deals with the functioning of channels
// such as the creation of new channels using socketio ,
// or what happens when someone chooses a channel ?,
// the drawing of the chatbox on the webpage,
// the loading of old messages or saving the new messages
// this all is defined in this file.


// when the Document Object Model is done loading the run the following function
document.addEventListener('DOMContentLoaded', () => {

      
    // just to keep the chatbox on the screen always
    if (window.innerHeight < document.body.offsetHeight) {
        window.scrollTo(0,document.body.scrollHeight);
    }

    // connecting web socket to the server

    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port,{resource: 'socket/socket.io', 'force new connection': true});
    
    // when a user clicks the add channel button to create a new channel
    document.querySelector('#add-channel-button').onclick = () => {

        // getting the channel name fromt the form
        const channelname = document.querySelector('#channel-name').value       
        if (channelname.length > 0)
        {
            // emmiting the event of creation of channel to the server so that all of 
            // the curretly active users knows that a new channel is created
            socket.emit('channel created', {'channelname':channelname})
        }  
        else
        {
            alert('Please Type Channel Name')
        } 
    }


    // the newly created channel is plugged into the webpage from this socket
    socket.on('announce', data => {
        // if data.status is true that means the channel creation is successful
        if(data.status)
        {
            document.querySelector('#flaskmsg').innerHTML = ""
            document.querySelector('#errormsg').className = 'text-primary form-group'
            document.querySelector('#errormsg').innerHTML = `channel ${data.channelname} Successfully Created!`
            const url = `<a href="#" style="text-decoration:none;"><li id="${data.channelname}" class="current-channels" data-channelname="${data.channelname}">${data.channelname}</li></a>`
            document.querySelector('#current-channels').innerHTML += url
        }
        // if data.status is false that means the channel creation is unsuccessfull
        if (!data.status)
        {
            document.querySelector('#errormsg').className = 'text-danger form-group'
            document.querySelector('#errormsg').innerHTML = `channel ${data.channelname} already exist !`
        }

     // reset the add channel form
     document.querySelector('#channel-name').value=""
    })

    // identifies when someone clicks on the currently available channel list
    document.querySelector('#current-channels').addEventListener('click', event => {

        // creating a new AJAX request for loading the chatbox corrosponding to the channel
        // which is chooses by the user
        const request = new XMLHttpRequest()
        request.open('POST','/chatroom')
        request.onload = () => {

            // getting the response data from the server
            const data = JSON.parse(request.responseText)   

            // compiling the chatbox Handlebar template to plug it into the webpage

            const chatroom_template = Handlebars.compile(document.querySelector('#chatroom').innerHTML)
            document.querySelector('#chatbox').innerHTML = chatroom_template({'channelname':data.channelname,'messages':data.messages,'user':data.user})
           
           // for focusing on the chatbox
            document.querySelector('#chatbox').scrollIntoView()

            // selecting the send button of that chatbox
            document.querySelector('#sendbtn').onclick = () => {

                // getting the message which is typed by the user
                const typed_msg = document.querySelector('#typed-msg').value

                // if the message is empty then alert the user
                if (typed_msg.length <= 0)
                {
                    alert("Please type Something !")
                }
                // else emmit the changes to the server for the new message
                else
                {
                    socket.emit("new message",{'newmessage':typed_msg,'channelname':data.channelname,'user':data.user})
                }
        }
    }

    // getting the channel which is choosed by the  user for chatting
    const choosed_channel = event.target.id
    const data = new FormData()
    data.append('choosed_channel',choosed_channel)

    // sending the data to the server using AJAX
    request.send(data);  
    })

    // when new message is recived then the message is announces to all those who are on that channel
    socket.on('message saved',data => {

        // if the choosed channel matches with the channel on which message is send
        // only then emit the new message so that the message is not emitted to
        // all the channels but only emmited to the channel to which it is associated
        if (document.querySelector('#chat-name').innerHTML === data.channelname)
        {
            document.querySelector('.card-body').innerHTML += `<li>${data.savedmessage}</li>`
            document.querySelector('#typed-msg').value = ""
        }
    })

    
})
