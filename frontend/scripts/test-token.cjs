const https = require('https');

const token = 'AQ.Ab8RN6JCsKM-079H3BZH728NNitrr6ZZPE618UK5vPv8SDFUDA';
const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const data = JSON.stringify({
    contents: [{ parts: [{ text: "Hola, responde solo 'OK' si recibes esto." }] }]
});

const options = {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

console.log('Testing Bearer Token...');

const req = https.request(url, options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${body}`);
    });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
