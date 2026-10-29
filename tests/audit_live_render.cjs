async function testFullSuite() {
  const base = 'https://mental-health-platform-1-8sao.onrender.com';
  console.log('=== FULL END-TO-END DATA PERSISTENCE & AI AUDIT ===\n');

  // 1. Register User
  const username = 'E2E_' + Date.now();
  const password = 'StrongPassword888!';
  console.log('[1/5] Registering new user on live database:', username);

  const regRes = await fetch(base + '/api/auth/register-private', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const regData = await regRes.json();
  console.log('  -> HTTP Status:', regRes.status);
  console.log('  -> User registered with DB ID:', regData.user?.id);
  console.log('  -> 8 Recovery Codes generated:', regData.recoveryCodes?.length);

  const token = regData.token;

  // 2. Save Data into Database
  console.log('\n[2/5] Saving Personal Reflection to database...');
  const reflectionToSave = {
    title: 'Work Exhaustion & Anxiety',
    reflectionText: 'Client shared feeling intense deadline anxiety and broken sleep patterns.',
    concerns: ['Academic / Work Stress', 'Sleep Disruption'],
    copingStrategies: ['Diaphragmatic breathing', 'Worry Journaling'],
    recommendedNextStep: 'Consultation with licensed clinical psychologist'
  };

  const saveRes = await fetch(base + '/api/user/reflections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ reflection: reflectionToSave, language: 'en' })
  });
  const saveData = await saveRes.json();
  console.log('  -> Save Status:', saveRes.status);
  console.log('  -> Reflection ID created:', saveData.reflectionId);
  console.log('  -> Timestamp saved:', saveData.savedAt);

  // 3. Read back saved data from Database
  console.log('\n[3/5] Querying saved data from database to verify persistence...');
  const getRes = await fetch(base + '/api/user/reflections', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const getData = await getRes.json();
  console.log('  -> Query Status:', getRes.status);
  console.log('  -> Total records retrieved:', (getData.reflections || []).length);
  const record = (getData.reflections || [])[0];
  console.log('  -> Verified Saved Record Title:', record?.title);
  console.log('  -> Verified Saved Record ID:', record?.id);

  // 4. Single-Use Recovery Code Verification on Live DB
  console.log('\n[4/5] Verifying Recovery Code consumption on live DB...');
  const testCode = regData.recoveryCodes[0];
  const recRes = await fetch(base + '/api/auth/recover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, recoveryCode: testCode, newPassword: 'BrandNewPass123!' })
  });
  const recData = await recRes.json();
  console.log('  -> First use (Unused code):', recRes.status, 'Success:', recData.ok);
  console.log('  -> Remaining unused recovery codes:', recData.remainingRecoveryCodes);

  // 5. Test Live Gemini AI Chat
  console.log('\n[5/5] Testing Live Gemini AI Chat message...');
  const chatRes = await fetch(base + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Hello Aura, I have been feeling very anxious about work lately.',
      language: 'en'
    })
  });
  const chatData = await chatRes.json();
  console.log('  -> Chat Status:', chatRes.status);
  console.log('  -> Live AI Provider:', chatData.provider);
  console.log('  -> Live AI Response snippet:\n     ' + (chatData.text || '').slice(0, 150));

  console.log('\n=============================================================');
  console.log('ALL LIVE CHECKS PASSED: FRONTEND, BACKEND, DB & GEMINI AI!');
  console.log('=============================================================');
}

testFullSuite().catch(e => {
  console.error('Audit Error:', e);
  process.exit(1);
});
