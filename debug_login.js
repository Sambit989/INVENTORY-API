const axios = require('axios');

async function debugLogin() {
    try {
        console.log('Attempting Login...');
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            // Registered user_id 10
            user_id: 10,
            password: 'password123'
        });
        console.log('Login Success!', res.data);
    } catch (err) {
        if (err.response) {
            console.error('Login Failed with Status:', err.response.status);
            console.error('Response Data:', err.response.data);
        } else {
            console.error('Login Failed (Network/Other):', err.message);
        }
    }
}

debugLogin();
