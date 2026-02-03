const axios = require('axios');

async function registerUser() {
    try {
        const rand = Math.floor(Math.random() * 1000);
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            name: `Debug User ${rand}`,
            email: `debug${rand}@example.com`,
            password: 'password123',
            role: 'staff'
        });
        console.log('Registration Success:', res.data);
    } catch (err) {
        console.error('Registration Failed:', err.response ? err.response.data : err.message);
    }
}

registerUser();
