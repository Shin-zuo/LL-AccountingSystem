import fetch from 'node-fetch';

async function testAuth() {
  try {
    console.log("Testing authentication...");

    // Test login with admin@example.com
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      }),
      credentials: 'include'
    });

    const result = await response.json();
    console.log("Login response:", response.status, result);

    if (response.ok) {
      // Test /api/me endpoint
      const meResponse = await fetch('http://localhost:5000/api/me', {
        credentials: 'include'
      });
      const meResult = await meResponse.json();
      console.log("/api/me response:", meResponse.status, meResult);
    }

  } catch (error) {
    console.error("Error testing auth:", error);
  }
}

testAuth();
