
 $(function(){

    //Show chat room interface
    let showChatRoom = () => {
        /** 
        * 1. Hide the login box and cancel the event bound to it
          * 2. Display the chat interface
         */ 
        $('#loginbox').hide('slow');
        _$loginButton.off('click');
        /** 
        * Display the chat interface and display a line of text to welcome the user 
        */
        $(`<div class="title">Welcome${_username}to Alex's Chatroom</div>`).insertBefore($("#content"));  
        $("#chatbox").show('slow');
    }

    const url = 'http://127.0.0.1:3000';
    let _username = '';
    let _password = '';
    let _$inputname = $('#name');
    let _$inputpassword = $('#password');
    let _$loginButton = $('#loginbutton');
    let _$chattextarea = $('#chatmessage');

    let socket = io.connect(url);

    //Set the username, which is triggered when the user logs in
    let setUsername = () => {
        
        _username = _$inputname.val().trim();    //Get the user name entered by the user in the input box
        _password = _$inputpassword.val();  //Get the password entered by the user in the input box
        //Determine whether the username or password is empty
        if(_username && _password) {
            socket.emit('login',{
                username: _username,
                password: _password
            });   //Passing the username and password to the server is equivalent to telling the server that we are going to log in
        }
        else{
            alert('Please enter your userID or password!');
        }
    };

    
    //send messages
    let sendMessage = function () {  
        /** 
         * Get the chat message of the input box, if it is not empty, trigger sendMessage
          * Send information and username
         */  
        let _message = _$chattextarea.val();  
      
        if(_message) {  
            socket.emit('sendMessage',{username: _username, message: _message});  
        }
        else{
            alert('Please enter to send a message!');
        }  
    }; 
    let showMessage = function (data) {  
        //First determine whether the message is sent by yourself, and then display it in a different style
        if(data.username === _username){  
            $("#content").append(`<p class='self-message'><span class='msg'>${data.message}</span><span class='name'> :${data.username}</span></p>`);  
        }else {  
            $("#content").append(`<p class='other-message'><span class='name'>${data.username}: </span><span class='msg'>${data.message}</span></p>`);  
        }  
    };   
    /*Front-end event*/
    _$loginButton.on('click',function (event) {    //Monitor the click event of the button. 
                                                    //If clicked, it means that the user wants to log in and execute the setUsername function
        setUsername();
    });

   /*Chat event*/ 
    _$chattextarea.on('keyup',function (event) {  
        if(event.keyCode === 13) {  
            sendMessage();  
            _$chattextarea.val('');  
        }  
    });
     
    socket.on('loginResult',(data)=>{  
        /** 
         * If the username returned by the server is the same as the one just sent, log in
          * Otherwise, there is something wrong, and login is refused
         */  
        if(data.code === 0) {  
            showChatRoom();       //Successful login, show chat room 
        }
        else if(data.code ===1){  
            alert('wrong password');  
        }
        else if(data.code ==='2-0'){
            alert('registration success');
            showChatRoom();       //Successful login, show chat room
        }
        else if(data.code ==='2-1'){
            alert('registration failed');
        }
        else if(data.code ===3){  
            alert('The user is already logged in');  
        }
        else{
            alert('Login failed!');
        }
    })  

    socket.on('receiveMessage',(data)=>{  
        /** 
         * 
         * Listen for messages broadcast by the server
         */  
        showMessage(data);
    })
    
    
});

   

