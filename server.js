const express = require("express");
const bodyParser = require("body-parser");
const webPush = require("web-push");
const path = require("path");
const cors = require("cors");
const stream = require("getstream");
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

const Subscriptions = sequelize.define('Item', {
  registrantId: DataTypes.STRING,
  subscription: DataTypes.JSON
});

const app = express();
const port = 3020;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
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

app.post("/subscribe", async (req, res) => {
  const {subscription, registrantId} = req.body;
  const foundSubscription = await Subscriptions.findOne({registrantId})
  if (foundSubscription) {
    foundSubscription.subscription = subscription
    await foundSubscription.save()
    return res.status(201).json({});
  }
  const newSubscription = await Subscriptions.create({ registrantId, subscription });
  res.status(201).json({newSubscription});
});

app.get("/stream-token", async (req, res) => {
  const api_key = "e4g9mt75dakw";
  const api_secret =
    "rfh937b5awgy3c2ue2tvubrj7zqhyjx6fcpz3tk8nb9bff7kzuv9t3ay4q2c7uks";
  // const user_id = 'john'
  let firstName = req.query.firstName;
  let lastName = req.query.lastName;
  // Initialize a Server Client
  // const serverClient = StreamChat.getInstance(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET);
  const client = stream.connect(api_key, api_secret, "1268153", {
    location: "us-east",
  });
  let userToken = await client.createUserToken(`${firstName}${lastName}`);
  res.status(200).json({ token: userToken });
});

app.get('/list-all-subscriptions', async (req, res) => {
  try {
    const foundSubscriptions = await Subscriptions.findAll({
      raw: true
    });
    return res.status(200).json(foundSubscriptions)
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: error.message || error });
  }
})


app.post("/send-notification", async (req, res) => {
  try {
    const { title, body, registrantIds } = req.body;
    let parsedRegistrantIds;

    try {
      parsedRegistrantIds = registrantIds.split(',').map(item => item.trim()).filter(item => item !== '');
    } catch (error) {
      throw new Error("failed to parse registrantIds");
    }

    const foundSubscriptions = await Subscriptions.findAll({
      where: {
        registrantId: {
          [Sequelize.Op.in]: parsedRegistrantIds
        }
      },
      raw: true
    });

    console.log({foundSubscriptions})
    let sent = []
    let failed = []
    
    const notificationPayload = {
      notification: {
        title: title,
        body: body,
      },
    };
    for (let index = 0; index < foundSubscriptions.length; index++) {
      const subscriptionEntity = foundSubscriptions[index];
      console.log({subscriptionEntity})
      try {
        await webPush.sendNotification(
          subscriptionEntity?.subscription,
          JSON.stringify(notificationPayload)
        );
        sent.push(subscriptionEntity.registrantId)
      } catch (error) {
        failed.push(subscriptionEntity.registrantId)
        console.log(`failed for ${subscriptionEntity.registrantId}`, error);
      }
    }
    return res.status(200).json({ 
      'requested to send': parsedRegistrantIds,
      'from them opted for notifications (registrant ids)': foundSubscriptions.map((sub) => sub.registrantId).join(', ') || 'none',
      'opted in total count': foundSubscriptions.length,
      'sent to (registrant ids)': sent.join(', ') || 'none',
      'sent total count': sent.length,
      'failed (registrant ids)': failed.join(', ') || 'none',
      'failed total count': failed.length
    })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: error.message || error });
  }
});

app.listen(port, async () => {
  await sequelize.sync(); 
  console.log(`Server started on http://localhost:${port}`);
});
