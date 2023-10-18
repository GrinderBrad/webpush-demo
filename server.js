const express = require("express");
const bodyParser = require("body-parser");
const webPush = require("web-push");
const path = require('path');
const cors = require('cors')
const stream = require('getstream');


const app = express();
const port = 3020;

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use(cors())

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

app.get("/stream-token", (req, res) => {
  const api_key = 'e4g9mt75dakw'
  const api_secret = 'rfh937b5awgy3c2ue2tvubrj7zqhyjx6fcpz3tk8nb9bff7kzuv9t3ay4q2c7uks'
  // const user_id = 'john'
  let firstName = req.query.firstName;
  let lastName = req.query.lastName;
  // Initialize a Server Client
  // const serverClient = StreamChat.getInstance(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET);
  const client = stream.connect(api_key, api_secret, '1268153', {location: 'us-east'});
  
  // const serverClient = StreamChat.getInstance(api_key, api_secret);
  // Create User Token
  const token = client.createUserToken(`${firstName}${lastName}`, {});
  console.log(`${firstName} ${lastName}`, token)
  res.status(200).json({token: token});
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
