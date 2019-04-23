const socket = io()
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#location')
const $message = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sideBarTemplate = document.querySelector('#sideBar-template').innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () =>{
    // Height of the new message
    const $newMessage = $message.lastElementChild
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    // Visible height
    const visibleHeight = $message.offsetHeight
    // Container msg height
    const contentMsgHeight = $message.scrollHeight
    //How far I have scrolled
    const scrollOffset = $message.scrollTop + visibleHeight
    console.log(newMessageStyle)
    console.log(visibleHeight)
    console.log(contentMsgHeight)
    console.log(scrollOffset)
    if(contentMsgHeight - newMessageHeight <= scrollOffset) {
        $message.scrollTop = $message.scrollHeight
    }
}
socket.on('anyMessage',(message,username)=>{
    const html = Mustache.render(messageTemplate,{
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username
    })
    $message.insertAdjacentHTML('beforeend',html)
    //console.log(message)
})
socket.on('locationMessage',(url)=>{
    const html = Mustache.render(locationTemplate,{
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoScroll()
})
socket.emit('join',{username, room},(error)=>{
    if(error) {
        alert(error)
        location.href('/')
    }
    
})
socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sideBarTemplate,{
        room,
        users   
    })
    document.querySelector('#sidebar').innerHTML = html
})
// socket.on('countUpdated', (count)=>{
//     console.log("Count updated", count)
// })
// document.querySelector("#increment").addEventListener('click',()=>{
//     socket.emit('increment')
// })
$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    $messageFormButton.setAttribute('disabled','disabled')
    //console.log(document.getElementById('message').value)
    socket.emit('sendMessage',e.target.elements.message.value,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        autoScroll()
    })
})
$locationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        alert('this facility not available')
    }
    $locationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        },(msg)=>{
            $locationButton.removeAttribute('disabled')
            console.log(msg)
        })
        //console.log(position.coords.latitude)
    })
})