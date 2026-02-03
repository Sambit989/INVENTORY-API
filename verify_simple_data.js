const axios = require('axios');

async function verify() {
    try {
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;

        const productsRes = await axios.get('http://localhost:5000/api/products', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const products = productsRes.data.products || productsRes.data;
        console.log('--- Current Products ---');
        products.forEach(p => console.log(`- ${p.name} ($${p.price})`));
        console.log('------------------------');

    } catch (err) {
        console.error('Verification failed:', err.message);
    }
}
verify();
