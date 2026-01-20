
const LOCIZE_PROJECT_ID = 'b0b098f2-ad99-46c8-840d-f01dbc330e9a';
const LOCIZE_API_KEY = 'cc85c60c-0e44-4009-bc33-7a60c5f399ae';

async function test() {
    const endpoint = `https://api.locize.io/update/${LOCIZE_PROJECT_ID}/latest/es/translation`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOCIZE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "test_key": "test_value" })
        });
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

test();
