const path = require('path')
const http = require('http')
const express = require('express')
const app = express()
const server = http.createServer(app)
const socketio = require('socket.io')
const io = socketio(server)
const Filter = require('bad-words')
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

io.on('connection',(socket)=>{
    socket.on('join',({username, room},callback)=>{
        const id = socket.id
        const {error, user} = addUser({id,username,room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('anyMessage',generateMessage('Welcome!!'),'Admin')
        console.log(user.room)
        socket.broadcast.to(user.room).emit('anyMessage',generateMessage(`${user.username} has joined!`,user.username))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
        socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)    
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('anyMessage',generateMessage(message),user.username)
        callback()
    })
    socket.on('disconnect',()=>{
        const removedUser =  removeUser(socket.id)
        if (removedUser){
            io.to(removedUser.room).emit('anyMessage',generateMessage(`${removedUser.username} has left`),removedUser.username)
            io.to(removedUser.room).emit('roomData',{
                room: removedUser.room,
                users: getUsersInRoom(removedUser.room)
            })
        }
        
    })
    socket.on('sendLocation',(location,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(`https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback('location shared!')
        //socket.emit('locationMessage',`https://google.com/maps?q=${location.latitude},${location.longitude}`)
    })
    
    // socket.emit('countUpdated', count)
    // console.log('connected to socket')
    // socket.on('increment',()=>{
    //     count++
    //     io.emit('countUpdated', count)
    // })
})

const port = process.env.PORT || 3000
app.use(express.static(path.join(__dirname,'../public')))
server.listen(port,() =>{
    console.log('server is running in port ' + port)
})