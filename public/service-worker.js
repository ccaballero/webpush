self.addEventListener('push',function(event){
    if(!(self.Notification&&self.Notification.permission==='granted')){
        return;
    }

    var data={};

    if(event.data){
        data=event.data.json();
    }

    var title=data.title
      , message=data.message
      , icon="img/FM_logo_2013.png"

    self.clickTarget=data.clickTarget;

    event.waitUntil(self.registration.showNotification(title,{
        icon:icon
      , badge:icon
      , body:message
    }));
});

self.addEventListener('notificationclick',function(event){
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    if(clients.openWindow){
        event.waitUntil(clients.openWindow(self.clickTarget));
    }
});

