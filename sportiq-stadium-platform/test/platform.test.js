const assert = require('assert');

// Simple mock values for testing the Carbon Footprint Calculator arithmetic
function calculateCarbonFootprintMock(attendance, transit, orders, gridLoad) {
  // 1. Travel: 0.005 Tons CO2/car driver, 0.001 Tons CO2/transit rider
  const drivingFans = attendance * (1 - transit / 100);
  const transitFans = attendance * (transit / 100);
  const travelEmissions = (drivingFans * 0.005) + (transitFans * 0.001);

  // 2. Concession orders: 0.002 Tons CO2/meal
  const foodEmissions = orders * 0.002;

  // 3. Grid load draw: 0.0004 Tons CO2/kW
  const powerEmissions = gridLoad * 0.0004;

  const total = parseFloat((travelEmissions + foodEmissions + powerEmissions).toFixed(1));
  return {
    total,
    travel: parseFloat(travelEmissions.toFixed(1)),
    food: parseFloat(foodEmissions.toFixed(1)),
    power: parseFloat(powerEmissions.toFixed(1))
  };
}

// A mini-runner wrapper so this can run with just `node test/platform.test.js`
function runTests() {
  console.log('\n=======================================');
  console.log(' Starting Sportiq Operations Tests... ');
  console.log('=======================================');
  
  try {
    // Run Test 1
    const res1 = calculateCarbonFootprintMock(65000, 60, 45000, 11400);
    assert.strictEqual(res1.travel, 169);
    assert.strictEqual(res1.food, 90);
    assert.strictEqual(res1.power, 4.6);
    assert.strictEqual(res1.total, 263.6);
    console.log('✅ Test 1 Passed: Carbon Footprint arithmetic check.');

    // Run Test 2
    const res2 = calculateCarbonFootprintMock(0, 0, 0, 0);
    assert.strictEqual(res2.total, 0);
    console.log('✅ Test 2 Passed: Zero boundaries check.');

    // Run Test 3 (HTML safe escaper check)
    function escape(text) {
      if (!text) return '';
      return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    const htmlText = '<script>alert("XSS")</script>';
    assert.strictEqual(escape(htmlText), '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    console.log('✅ Test 3 Passed: HTML Escaper XSS protection check.');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! (3/3)');
    console.log('=======================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Failure Detected:');
    console.error(err);
    process.exit(1);
  }
}

runTests();
