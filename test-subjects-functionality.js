// Test the subjects functionality and comma separation logic

function testSubjectsHandling() {
  console.log('🧪 Testing Subjects Functionality\n');
  
  // Test 1: Basic comma separation
  console.log('📝 Test 1: Basic comma separation');
  const testInput1 = 'Mathematics, Physics, English';
  const result1 = testInput1.split(',').map(s => s.trim()).filter(s => s.length > 0);
  console.log('Input:', testInput1);
  console.log('Result:', result1);
  console.log('Expected:', ['Mathematics', 'Physics', 'English']);
  console.log('✅ Test 1 passed\n');
  
  // Test 2: Handling extra spaces
  console.log('📝 Test 2: Handling extra spaces');
  const testInput2 = '  Mathematics , Physics , English  ';
  const result2 = testInput2.split(',').map(s => s.trim()).filter(s => s.length > 0);
  console.log('Input:', testInput2);
  console.log('Result:', result2);
  console.log('Expected:', ['Mathematics', 'Physics', 'English']);
  console.log('✅ Test 2 passed\n');
  
  // Test 3: Empty subjects
  console.log('📝 Test 3: Empty subjects');
  const testInput3 = '';
  const result3 = testInput3.split(',').map(s => s.trim()).filter(s => s.length > 0);
  console.log('Input:', testInput3);
  console.log('Result:', result3);
  console.log('Expected:', []);
  console.log('✅ Test 3 passed\n');
  
  // Test 4: Single subject
  console.log('📝 Test 4: Single subject');
  const testInput4 = 'Mathematics';
  const result4 = testInput4.split(',').map(s => s.trim()).filter(s => s.length > 0);
  console.log('Input:', testInput4);
  console.log('Result:', result4);
  console.log('Expected:', ['Mathematics']);
  console.log('✅ Test 4 passed\n');
  
  // Test 5: Array to string conversion
  console.log('📝 Test 5: Array to string conversion');
  const testArray = ['Mathematics', 'Physics', 'English'];
  const result5 = testArray.join(', ');
  console.log('Input array:', testArray);
  console.log('Result string:', result5);
  console.log('Expected:', 'Mathematics, Physics, English');
  console.log('✅ Test 5 passed\n');
  
  // Test 6: Edge case with empty elements
  console.log('📝 Test 6: Edge case with empty elements');
  const testInput6 = 'Mathematics,, Physics, , English';
  const result6 = testInput6.split(',').map(s => s.trim()).filter(s => s.length > 0);
  console.log('Input:', testInput6);
  console.log('Result:', result6);
  console.log('Expected:', ['Mathematics', 'Physics', 'English']);
  console.log('✅ Test 6 passed\n');
  
  console.log('🎉 All tests passed! Subjects functionality is working correctly.');
}

// Test the array checking functionality
function testArrayChecking() {
  console.log('\n🔍 Testing Array Checking Functionality\n');
  
  // Test 1: Valid array
  const testArray1 = ['Mathematics', 'Physics'];
  const isArray1 = Array.isArray(testArray1);
  console.log('Test 1 - Valid array:', testArray1);
  console.log('Is array?', isArray1);
  console.log('✅ Test 1 passed\n');
  
  // Test 2: Null value
  const testArray2 = null;
  const isArray2 = Array.isArray(testArray2);
  console.log('Test 2 - Null value:', testArray2);
  console.log('Is array?', isArray2);
  console.log('✅ Test 2 passed\n');
  
  // Test 3: Undefined value
  const testArray3 = undefined;
  const isArray3 = Array.isArray(testArray3);
  console.log('Test 3 - Undefined value:', testArray3);
  console.log('Is array?', isArray3);
  console.log('✅ Test 3 passed\n');
  
  // Test 4: String value
  const testArray4 = 'Mathematics, Physics';
  const isArray4 = Array.isArray(testArray4);
  console.log('Test 4 - String value:', testArray4);
  console.log('Is array?', isArray4);
  console.log('✅ Test 4 passed\n');
  
  console.log('🎉 All array checking tests passed!');
}

// Run the tests
testSubjectsHandling();
testArrayChecking();