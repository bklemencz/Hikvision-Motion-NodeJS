#!/usr/bin/nodejs
var     ipcamera	= require('node-hikvision-api');
var 	mqttclient	= require('mqtt');
var		motionenabled = true;

// mqtt server options
var mqttoptions = {
    keepalive: 30,
    clientId: 'ipcam1',
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    will: {                       //in case of any abnormal client close this message will be fired
        topic: '/ipcam/1/online/status',
        payload: 'OFF',
        qos: 0,
        retain: false
    },
}
// Camera Options:
var options = {
	host	: '192.168.1.64',
	port 	: '80',
	user 	: 'openhab',
	pass 	: 'openhab2',
	log 	: false,
};

var hikvision 	= new ipcamera.hikvision(options);
var client  = mqttclient.connect('mqtt://192.168.1.104',mqttoptions)

// Inform online status and subscibe to enable message
client.on('connect', () => {
	// Inform controllers that we are connected
	client.publish('/ipcam/1/online/status', 'ON')
	client.subscribe('/ipcam/1/motion/command/enabled')
})

// Message receive to enable or disable Alarms
client.on('message', (topic, message) => {
	if(topic === '/ipcam/1/motion/command/enabled') {
	  	if(message.toString() === 'ON') { 
		 	motionenabled = true; 
		  	console.log('Motion Det Enabled!');
		}
	  	else {
		  	motionenabled=false; 
		  	console.log('Motion Det Disabled!');
		  	client.publish('/ipcam/1/motion/status','OFF');
		}
	}
})

// Monitor Camera Alarms
hikvision.on('alarm', function(code,action,index) {
	if (code === 'VideoMotion'   && action === 'Start')  if(motionenabled === true) client.publish('/ipcam/1/motion/status','ON')//console.log(getDateTime() + ' Channel ' + index + ': Video Motion Detected')
	if (code === 'VideoMotion'   && action === 'Stop')   if(motionenabled === true) client.publish('/ipcam/1/motion/status','OFF')//console.log(getDateTime() + ' Channel ' + index + ': Video Motion Ended')
	//	if (code === 'LineDetection' && action === 'Start')  console.log(getDateTime() + ' Channel ' + index + ': Line Cross Detected')
	//	if (code === 'LineDetection' && action === 'Stop')   console.log(getDateTime() + ' Channel ' + index + ': Line Cross Ended')
	//	if (code === 'AlarmLocal'    && action === 'Start')  console.log(getDateTime() + ' Channel ' + index + ': Local Alarm Triggered: ' + index)
	//	if (code === 'AlarmLocal'    && action === 'Stop')   console.log(getDateTime() + ' Channel ' + index + ': Local Alarm Ended: ' + index)
	//	if (code === 'VideoLoss'     && action === 'Start')  console.log(getDateTime() + ' Channel ' + index + ': Video Lost!')
	//	if (code === 'VideoLoss'     && action === 'Stop')   console.log(getDateTime() + ' Channel ' + index + ': Video Found!')
	//	if (code === 'VideoBlind'    && action === 'Start')  console.log(getDateTime() + ' Channel ' + index + ': Video Blind!')
	//	if (code === 'VideoBlind'    && action === 'Stop')   console.log(getDateTime() + ' Channel ' + index + ': Video Unblind!')
});

function getDateTime() {
	var date = new Date();
	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;
	var min  = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;
	var sec  = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;
	var day  = date.getDate();
	day = (day < 10 ? "0" : "") + day;
	return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
}
