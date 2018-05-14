var url='http://localhost:3000/subscribe'
  , applicationServerPublicKey='BEBnK_ol_SRger2W0b-t4PTLVdDT_XVRFv0N6nxYgSuuV27PKFte5AtjjHk-uOZAVTwmWYyuXpaFTqtW2YvP7XE'
  , isSubscribed=false
  , swRegistration=null

$(document).ready(function(){
    Notification.requestPermission()
    .then(function(status){
        if(status==='denied'){
            console.log('[Notification.requestPermission] The user has blocked notifications.');
            disableAndSetBtnMessage('Notification permission denied');
        }else if(status==='granted'){
            console.log('[Notification.requestPermission] Initializing service worker.');

            if('serviceWorker' in navigator){
                navigator.serviceWorker.register('service-worker.js')
                .then(function(registration){
                    swRegistration=registration;

                    if(!(registration.showNotification)){
                        console.log('Notifications aren\'t supported on service workers.');
                        disableAndSetBtnMessage('Notifications unsupported');
                        return;
                    }

                    if(!('PushManager' in window)){
                        console.log('Push messaging isn\'t supported.');
                        disableAndSetBtnMessage('Push messaging unsupported');
                        return;
                    }

                    navigator.serviceWorker.ready
                    .then(function(registration){
                        registration.pushManager.getSubscription()
                        .then(async function(subscription){
                            if(!subscription){
                                isSubscribed=false;
                                makeButtonSubscribable();
                            }else{
                                isSubscribed=true;
                                makeButtonUnsubscribable();
                            }
                        })
                        .catch(function(err){
                            console.log('Error during getSubscription()',err);
                        });
                    });
                });
            }else{
                console.log('Service workers aren\'t supported in this browser.');
                disableAndSetBtnMessage('Service workers unsupported');
            }
        }
    });

    $('#btnPushNotifications').click(function(event){
        if(!isSubscribed){
            navigator.serviceWorker.ready.then(function(registration){
                var subscribeParams={userVisibleOnly:true}
                  , applicationServerKey=urlB64ToUint8Array(applicationServerPublicKey)

                subscribeParams.applicationServerKey=applicationServerKey;
                registration.pushManager.subscribe(subscribeParams)
                .then(function(subscription){
                    var endpoint=subscription.endpoint
                      , key=subscription.getKey('p256dh')
                      , auth=subscription.getKey('auth')
                      , encodedKey=btoa(String.fromCharCode.apply(null,new Uint8Array(key)))
                      , encodedAuth=btoa(String.fromCharCode.apply(null,new Uint8Array(auth)))

                    $.ajax({
                        url:url
                      , type:'post'
                      , contentType:'application/json'
                      , processData:false
                      , data:JSON.stringify({
                            publicKey:encodedKey
                          , auth:encodedAuth
                          , notificationEndPoint:endpoint
                        })
                      , success:function(response){
                            console.log('Subscribed successfully! '+JSON.stringify(response));
                        }
                    });

                    isSubscribed=true;
                    makeButtonUnsubscribable();
                })
                .catch(function(e){
                    console.log('Unable to subscribe to push.', e);
                });
            });
        }else{
            var endpoint=null

            swRegistration.pushManager.getSubscription()
            .then(function(subscription){
                if(subscription){
                    endpoint=subscription.endpoint;
                    return subscription.unsubscribe();
                }
            })
            .catch(function(error) {
                console.log('Error unsubscribing',error);
            })
            .then(function(){
                $.ajax({
                    url:'/unsubscribe'
                  , type:'post'
                  , contentType:'application/json'
                  , processDate:false
                  , data:JSON.stringify({
                        notificationEndPoint:endpoint
                    })
                  , success:function(response){
                        console.log('Unsubscribed successfully! '+JSON.stringify(response));
                    }
                });

                console.log('User is unsubscribed.');
                isSubscribed=false;
                makeButtonSubscribable(endpoint);
            });
        }
    });
});

function disableAndSetBtnMessage(message){
    setBtnMessage(message);
    $('#btnPushNotifications').attr('disabled','disabled');
}

function enableAndSetBtnMessage(message){
    setBtnMessage(message);
    $('#btnPushNotifications').removeAttr('disabled');
}

function makeButtonSubscribable(){
    enableAndSetBtnMessage('Subscribe to push notifications');
    $('#btnPushNotifications').addClass('btn-primary').removeClass('btn-danger');
}

function makeButtonUnsubscribable(){
    enableAndSetBtnMessage('Unsubscribe from push notifications');
    $('#btnPushNotifications').addClass('btn-danger').removeClass('btn-primary');
}

function setBtnMessage(message){
    $('#btnPushNotifications').text(message);
}

function urlB64ToUint8Array(base64String){
    const padding='='.repeat((4-base64String.length%4)%4)
      , base64=(base64String+padding)
            .replace(/\-/g,'+')
            .replace(/_/g,'/')
      , rawData=window.atob(base64)
      , outputArray=new Uint8Array(rawData.length)

    for(var i=0;i<rawData.length;++i){
        outputArray[i]=rawData.charCodeAt(i);
    }

    return outputArray;
}

