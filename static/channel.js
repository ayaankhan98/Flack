document.addEventListener('DOMContentLoaded', () => {

    if (window.innerHeight < document.body.offsetHeight) {
        window.scrollTo(0,document.body.scrollHeight);
    }
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port,{resource: 'socket/socket.io', 'force new connection': true});
         document.querySelector('#add-channel-button').onclick = () => {
            const channelname = document.querySelector('#channel-name').value
            socket.emit('channel created', {'channelname':channelname})
         }

    socket.on('announce', data => {
        if(data.status)
        {
            document.querySelector('#flaskmsg').innerHTML = ""
            document.querySelector('#errormsg').className = 'text-primary form-group'
            document.querySelector('#errormsg').innerHTML = `channel ${data.channelname} Successfully Created!`
            const url = `<a><li id="${data.channelname}" class="current-channels" data-channelname="${data.channelname}">${data.channelname}</li></a>`
            document.querySelector('#current-channels').innerHTML += url
        }
        if (!data.status)
        {
            document.querySelector('#errormsg').className = 'text-danger form-group'
            document.querySelector('#errormsg').innerHTML = `channel ${data.channelname} already exist !`
        }
        document.querySelector('#channel-name').value=""
    })
    document.querySelector('#current-channels').addEventListener('click', event => {
        const request = new XMLHttpRequest()
        request.open('POST','/chatroom')
        request.onload = () => {
         const data = JSON.parse(request.responseText)   
            const chatroom_template = Handlebars.compile(document.querySelector('#chatroom').innerHTML)
            document.querySelector('#chatbox').innerHTML = chatroom_template({'channelname':data.channelname,'messages':data.messages,'user':data.user})
            document.querySelector('#chatbox').scrollIntoView()

            document.querySelector('#sendbtn').onclick = () => {
            const typed_msg = document.querySelector('#typed-msg').value
            if (typed_msg.length <= 0)
            {
                alert("Please type Something !")
            }
            else
            {
                socket.emit("new message",{'newmessage':typed_msg,'channelname':data.channelname,'user':data.user})
            }
        }
    }
    const choosed_channel = event.target.id
    const data = new FormData()
    data.append('choosed_channel',choosed_channel)
    request.send(data);  
    })
    socket.on('message saved',data => {
        if (document.querySelector('#chat-name').innerHTML === data.channelname)
        {
            document.querySelector('.card-body').innerHTML += `<li>${data.savedmessage}</li>`
            document.querySelector('#typed-msg').value = ""
        }
    })

    
})