const {Expo} = require('expo-server-sdk');

module.exports = (pushTokens, title, body, data) => {

	console.log('pushToken', pushTokens);
	const expo = new Expo();
	const messages = [];

	for(const pushToken of pushTokens){

		if(!Expo.isExpoPushToken(pushToken.data)){
			console.error(`Push token ${pushToken} is not a valid Expo push token`)
			continue;
		}

		messages.push({
			to: pushToken.data,
      sound: "default",
      title,
      body,
      data: { withSome: 'data' },
		});

		let chunks = expo.chunkPushNotifications(messages);
		let tickets = [];

		(async () => {
			for(chunk of chunks){
				try{
					console.log('before', chunk);
					let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
					console.log('chunk', ticketChunk);
					console.log(ticketChunk);
					tickets.push(...ticketChunk);
				}catch(e){
					console.error(e);
				}
			}
		})()

		let receiptIds = [];
		for(let ticket of tickets){
			console.log('tikets ===>>>', ticket);
			if(ticket.id){
				receiptIds.push(ticket.id)
			}
		}

		const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
		(async () => {
			for(const chunk of receiptIdChunks){
				try {
					const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
					console.log(receipts);

					for(const receiptId in receipts){
						const {status, message, details} = receipts[receiptId]
						if(status === 'ok'){
							console.log('ok', message, details);
							continue;
						}else if(status === 'error'){
							console.error(
								`There was an error sending a notification: ${message}`
							)
							if(details && details.error){
								console.error(`The error code is ${details.error}`);
							}
						}
					}
				}catch(e){
					console.error(e)
				}
			}
		})()

	}

}