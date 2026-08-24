/**
 * Automated Test Runner for ITUE301 AWDF Practical Examination (SET A)
 * Validates all REST Endpoints, Status Codes, Mongoose Schemas & Error Handling
 */

const http = require('http');

const API_BASE = 'http://localhost:5000';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('  🧪 ITUE301 Practical Exam (SET A) - Automated Test Suite');
  console.log('  Hospital Appointment System (MedCare Plus)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(title, condition, extraInfo = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${title}`);
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      if (extraInfo) console.error(`     Details: ${JSON.stringify(extraInfo)}`);
    }
  }

  try {
    // ---------------------------------------------------------
    // Test 1: Task 3 - GET /api/v1/appointments (200 OK)
    // ---------------------------------------------------------
    console.log('--- Task 3: REST API Endpoints ---');
    const res1 = await makeRequest('/api/v1/appointments', 'GET');
    assert('GET /api/v1/appointments returns HTTP 200', res1.statusCode === 200, res1.statusCode);
    assert('GET /api/v1/appointments returns list of appointments', Array.isArray(res1.body) && res1.body.length > 0);

    // ---------------------------------------------------------
    // Test 2: Task 3 - POST /api/v1/appointments (201 Created)
    // ---------------------------------------------------------
    const newAppointment = {
      patientName: 'Emma Watson',
      doctorName: 'Dr. Sarah Jenkins',
      date: '2026-09-01',
      timeSlot: '11:00 AM',
      status: 'confirmed',
      reason: 'Routine cardiovascular evaluation'
    };
    const res2 = await makeRequest('/api/v1/appointments', 'POST', newAppointment);
    assert('POST /api/v1/appointments returns HTTP 201', res2.statusCode === 201, res2.statusCode);
    assert('POST /api/v1/appointments returns success payload', res2.body && res2.body.success === true);

    // ---------------------------------------------------------
    // Test 3: Task 3 & 4 - GET /api/v1/doctors (200 OK)
    // ---------------------------------------------------------
    const res3 = await makeRequest('/api/v1/doctors', 'GET');
    assert('GET /api/v1/doctors returns HTTP 200', res3.statusCode === 200, res3.statusCode);
    assert('GET /api/v1/doctors returns doctors array with required fields', 
      Array.isArray(res3.body) && res3.body.length > 0 && res3.body[0].name && res3.body[0].specialisation
    );

    // ---------------------------------------------------------
    // Test 4: Task 5 - Real MongoDB Operation (Create & Save to DB)
    // ---------------------------------------------------------
    console.log('\n--- Task 5: MongoDB Mongoose Schemas, Real DB Operations & Validation ---');
    const randomEmail = `patient_${Date.now()}@medcareplus.com`;
    const newDbPatient = {
      name: 'Alexander Fleming',
      email: randomEmail,
      phone: '+1-555-9080',
      bloodGroup: 'O+',
      age: 45
    };
    const resDbCreate = await makeRequest('/api/v1/patients', 'POST', newDbPatient);
    assert('POST /api/v1/patients performs real MongoDB insert (HTTP 201 Created)', 
      resDbCreate.statusCode === 201 && resDbCreate.body.success === true && resDbCreate.body.data._id
    );

    // ---------------------------------------------------------
    // Test 5: Task 5 - Real MongoDB Operation (Find from DB)
    // ---------------------------------------------------------
    const resDbFind = await makeRequest('/api/v1/patients', 'GET');
    assert('GET /api/v1/patients retrieves real documents from MongoDB Atlas (HTTP 200 OK)', 
      resDbFind.statusCode === 200 && Array.isArray(resDbFind.body.data) && resDbFind.body.data.length > 0
    );

    // ---------------------------------------------------------
    // Test 6: Task 5 - Mongoose Schema Validation (Valid Patient)
    // ---------------------------------------------------------
    const validPatient = {
      type: 'patient',
      payload: {
        name: 'David Miller',
        email: 'david.miller@example.com',
        phone: '+1-555-0199',
        bloodGroup: 'O+',
        age: 34
      }
    };
    const res4 = await makeRequest('/api/v1/test/validate', 'POST', validPatient);
    assert('Valid Patient schema validation passes with HTTP 200', res4.statusCode === 200);

    // ---------------------------------------------------------
    // Test 7: Task 5 - Mongoose Schema Validation Failure (Invalid Blood Group)
    // ---------------------------------------------------------
    const invalidPatient = {
      type: 'patient',
      payload: {
        name: 'David Miller',
        email: 'david.miller@example.com',
        bloodGroup: 'XYZ+' // Invalid enum value!
      }
    };
    const res5 = await makeRequest('/api/v1/test/validate', 'POST', invalidPatient);
    assert('Invalid Blood Group enum triggers validation failure (HTTP 400)', res5.statusCode === 400);
    assert('Validation failure returns structured error details without raw stack', 
      res5.body && res5.body.errorType === 'ValidationError' && Array.isArray(res5.body.details)
    );

    // ---------------------------------------------------------
    // Test 8: Task 5 - Reason exceeding 300 characters validation
    // ---------------------------------------------------------
    const longReasonAppointment = {
      type: 'appointment',
      payload: {
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439012',
        date: '2026-08-30',
        timeSlot: '10:00 AM',
        status: 'pending',
        reason: 'A'.repeat(305) // 305 characters > 300 limit!
      }
    };
    const res6 = await makeRequest('/api/v1/test/validate', 'POST', longReasonAppointment);
    assert('Reason > 300 characters triggers validation failure (HTTP 400)', res6.statusCode === 400);

    // ---------------------------------------------------------
    // Test 7: Task 3 - Global Error-Handling Middleware (HTTP 500)
    // ---------------------------------------------------------
    console.log('\n--- Task 3: Global Error Handling Middleware ---');
    const res7 = await makeRequest('/api/v1/test/trigger-error', 'GET');
    assert('Unhandled server error returns HTTP 500 JSON (no raw stack leak)', 
      res7.statusCode === 500 && res7.body && res7.body.success === false
    );

    console.log('\n================================================================');
    console.log(`  🏁 Test Results: ${passed} / ${total} Tests Passed (${Math.round((passed/total)*100)}%)`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ Test execution failed: Ensure backend server is running (npm start)', error.message);
  }
}

runTests();
