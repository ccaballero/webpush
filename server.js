const express=require("express")
  , webPush=require("web-push")
  , atob=require('atob')
  , bodyParser=require('body-parser')
  , fs=require('fs')
  , util=require('util')
  , app=express()
  , VAPID_SUBJECT='mailto:info@pentest365.io'
  , VAPID_PUBLIC_KEY='BEBnK_ol_SRger2W0b-t4PTLVdDT_XVRFv0N6nxYgSuuV27PKFte5AtjjHk-uOZAVTwmWYyuXpaFTqtW2YvP7XE'
  , VAPID_PRIVATE_KEY='brVBsklf0-SfO58tJ4ieFEB7BVTf0ZgwIPxp-OtTn5Y'
  , AUTH_SECRET='secret'

var subscribers=require('./subscribers.json')
console.log('SUBSCRIBERS',JSON.stringify(subscribers,null,'\t'));

app.use(bodyParser.json());

webPush.setVapidDetails(VAPID_SUBJECT,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY);
app.use(express.static('public'));

app.post('/subscribe',function(request,response){
    let subscribe={
        endpoint:request.body.notificationEndPoint
      , keys:{
            p256dh:request.body.publicKey
          , auth:request.body.auth
        }
    };

    subscribers.push(subscribe);
    fs.writeFile('./subscribers.json',JSON.stringify(subscribers,null,'    '),
        (error)=>{
        if(error){
            console.log(error);
        }

        console.log('ADDED',JSON.stringify(subscribe,null,'\t'));
        response.send('Subscription accepted!');
    });
});

app.post('/unsubscribe',function(request,response){
    var index=subscribers.findIndex((subscriber)=>{
        return subscriber.endpoint==request.body.endpoint;
    });

    if(index>=0){
        console.log('REMOVED',JSON.stringify(subscribers[index],null,'\t'));
        subcribers.splice(index,1);
    }

    response.send('Subscription removed!');
});

app.get('/notify',function(request,response){
    subscribers.forEach((pushSubscription)=>{
        webPush.sendNotification(pushSubscription,JSON.stringify({
            clickTarget:'https://www.google.com.bo'
          , title:'Hello'
          , message:'Hello world!'
        }),{})
        .then((response)=>{
            console.log("Status: "+util.inspect(response.statusCode));
            console.log("Headers: "+JSON.stringify(response.headers));
            console.log("Body: "+JSON.stringify(response.body));
        })
        .catch((error)=>{
            console.log(error);
        });
    });

    response.send('Notification sent!');
});

app.listen(3000,()=>{
    console.log('started');
});

