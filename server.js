const express = require("express");
const bodyParser = require("body-parser");
const webPush = require("web-push");
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



const subscriptions = []
// const vapidKeys = webPush.generateVAPIDKeys();
const vapidKeys = {
  publicKey:
    "BNu91O7BEuaA36R2ThADGftkc9vpq0Z3UmAX55UhdHZSCE-3m7Z9HWktYJsDEFGoWANrW3vyLzbjFE-krvVbjYo",
  privateKey: "ZfZNsx5nuIkbxkvkrcCzyZ9E1sAI5TF7OH8M_hyleD0",
};
// console.log(vapidKeys);
webPush.setVapidDetails(
  "mailto:example@yourdomain.org",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  if (!subscriptions.find((sub) => sub.endpoint === subscription.endpoint)) {
    subscriptions.push(subscription)
  }
  console.log({subscriptions})
  res.status(201).json({});
});

app.get('/send-notification', async (req, res) => {
    const notificationPayload = {
      notification: {
        title: 'New Notification',
        body: 'This is the body of the notification',
      }
    };
    for (let index = 0; index < subscriptions.length; index++) {
        const subscription = subscriptions[index];
        try {
            await webPush.sendNotification(subscription, JSON.stringify(notificationPayload))   
        } catch (error) {
            console.log(`failed for ${subscription.endpoint}`, error)
        }
    }
    return res.status(200).json({message: 'Notification sent successfully.'})
  });

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
