const https = require('https');

const API_KEY = 'AIzaSyAwCnJgbzoFKnd74JvAClEvi_eJVemsjdc';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('--- MODELS LIST RESPONSE ---');
        console.log(data);
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log('Available Models:');
                json.models.forEach(m => console.log(` - ${m.name}`));
            } else {
                console.log('No models found in the list.');
            }
        } catch (e) {
            console.log('Failed to parse response.');
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
