const axios = require('axios');

async function verify() {
    try {
        console.log('1. Attempting login...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@example.com',
            password: 'password123'
        });

        const token = loginRes.data.token;
        if (!token) {
            console.error('Login failed: No token received');
            process.exit(1);
        }
        console.log('Login successful. Token received.');

        console.log('2. Fetching products...');
        const productsRes = await axios.get('http://localhost:5000/api/products', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const count = productsRes.data.length || (productsRes.data.products && productsRes.data.products.length) || 0;
        console.log(`Success! Found ${count} products.`);

        if (count > 0) {
            console.log('Sample product:', JSON.stringify(productsRes.data[0] || productsRes.data.products[0], null, 2));
        }

    } catch (err) {
        console.error('Verification failed:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
        process.exit(1);
    }
}

verify();
