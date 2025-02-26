const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const qs = require('querystring');
const https = require('https');
const app = express();
const upload = multer({ dest: 'uploads/' });

// UltraMsg API credentials
const ULTRAMSG_TOKEN = 'zjjrxi0zb4ecnxnk';
const ULTRAMSG_INSTANCE_ID = 'instance108584';

// Array to store Excel data
let messageQueue = [];

// Function to send WhatsApp message (using your UltraMsg config)
function sendWhatsAppMessage(businessName, phoneNumber) {
    return new Promise((resolve, reject) => {
        const messageTemplate = `Hey ${businessName},\n\nDid you know 85% of customers check a business online before visiting? If you don’t have a website, you’re losing 3X more customers to competitors who do!\n\n📉 No Website? Here’s What You’re Missing:\n❌ 50% fewer inquiries – Customers can’t find you\n❌ Lower trust – 75% of people judge a business by its website\n❌ Less revenue – Businesses with websites earn 2X more sales\n\n📈 A Website Will Help You:\n✅ Get More Customers – Be visible 24/7 on Google\n✅ Boost Trust – 10X stronger brand image\n✅ Easy Contact – WhatsApp chat, direct calls & bookings\n\n🚀 Website Plans (One-Time Cost, No Hidden Fees!):\n🔹 Basic Plan – ₹2,999 (1-Page Website – Simple & Professional)\n🔹 Business Plan – ₹5,999 (Multi-Page Website + Contact Form)\n🔹 Premium Plan – ₹9,999 (Full Website + SEO + WhatsApp Chat)\n\n💻 Check out my portfolio here: https://rachitpatel.netlify.app/\n\n🔥 Limited Offer: First 5 clients get ₹1,000 OFF any plan!\n🎁 Bonus: Free Google My Business setup (worth ₹2,000)!\n\n💡 A website isn’t an expense – it’s an investment. 1 website = 10X more trust & sales.\n📞 Let’s discuss how we can grow ${businessName} online. Reply “Interested” to start!\n\nBest,\nRachit Patel\n📩 rampateluni@gmail.com  | 📞 +91-9408272121`;

        const postData = qs.stringify({
            "token": ULTRAMSG_TOKEN,
            "to": phoneNumber,
            "body": messageTemplate
        });

        const options = {
            "method": "POST",
            "hostname": "api.ultramsg.com",
            "port": null,
            "path": `/${ULTRAMSG_INSTANCE_ID}/messages/chat`, // Uses instance108584
            "headers": {
                "content-type": "application/x-www-form-urlencoded",
                "content-length": Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let chunks = [];
            res.on("data", (chunk) => {
                chunks.push(chunk);
            });
            res.on("end", () => {
                const body = Buffer.concat(chunks);
                console.log(`Message sent to ${phoneNumber}: ${body.toString()}`);
                resolve();
            });
        });

        req.on("error", (e) => {
            console.error(`Error sending message to ${phoneNumber}: ${e.message}`);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Store valid contacts in the queue
    messageQueue = jsonData
        .map((data, index) => {
            const businessName = data['Name'];
            const phoneNumber = data['Phone_Standard_format'];
            if (!businessName || !phoneNumber) {
                console.error(`Skipping row ${index + 1}: businessName (${businessName}) or phoneNumber (${phoneNumber}) is undefined or invalid`);
                return null;
            }
            return { businessName, phoneNumber };
        })
        .filter(contact => contact !== null);

    console.log(`Loaded ${messageQueue.length} contacts into the queue`);

    // Send success response immediately with green text styling
    res.send('<span style="color: green;">Success: Campaign started! Messages will be sent one by one every minute.</span>');

    // Start sending messages if queue is populated and no timer is running
    if (messageQueue.length > 0 && !global.messageTimer) {
        let currentIndex = 0;
        global.messageTimer = setInterval(() => {
            if (currentIndex < messageQueue.length) {
                const { businessName, phoneNumber } = messageQueue[currentIndex];
                sendWhatsAppMessage(businessName, phoneNumber)
                    .then(() => console.log(`Sent message ${currentIndex + 1}/${messageQueue.length}`))
                    .catch(err => console.error(`Failed to send message ${currentIndex + 1}: ${err.message}`));
                currentIndex++;
            } else {
                // Stop timer when all messages are sent
                clearInterval(global.messageTimer);
                global.messageTimer = null;
                console.log('All messages sent. Queue cleared.');
                messageQueue = [];
            }
        }, 60000); // 1 minute = 60,000 milliseconds
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${process.env.PORT || 3000}`);
});
