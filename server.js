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

    jsonData.forEach((data, index) => {
        const businessName = data['Name'];
        const phoneNumber = data['Phone_Standard_format'];

        if (!businessName || !phoneNumber) {
            console.error(`Skipping row ${index + 1}: businessName (${businessName}) or phoneNumber (${phoneNumber}) is undefined or invalid`);
            return;
        }

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
            "path": `/instance108584/messages/chat`,
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
            });
        });

        req.on("error", (e) => {
            console.error(`Error sending message to ${phoneNumber}: ${e.message}`);
        });

        req.write(postData);
        req.end();
    });

    res.send('Messages sent successfully');
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${process.env.PORT || 3000}`);
});