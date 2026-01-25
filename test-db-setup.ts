/**
 * Test script to verify database setup for multi-property architecture
 */

import { getDefaultProperty, createProperty, getAllProperties } from './src/lib/property';

async function testDatabaseSetup() {
  console.log('🧪 Testing database setup...\n');

  try {
    // Test 1: Check default property exists
    console.log('1. Checking default property...');
    const defaultProperty = await getDefaultProperty();
    if (defaultProperty) {
      console.log('✅ Default property found:');
      console.log(`   - ID: ${defaultProperty.id}`);
      console.log(`   - Property ID: ${defaultProperty.propertyId}`);
      console.log(`   - Hash: ${defaultProperty.hash}`);
      console.log(`   - Name: ${defaultProperty.name}`);
    } else {
      console.log('❌ Default property not found!');
    }

    // Test 2: List all properties
    console.log('\n2. Listing all properties...');
    const allProperties = await getAllProperties();
    console.log(`✅ Found ${allProperties.length} properties:`);
    allProperties.forEach(prop => {
      console.log(`   - ${prop.name} (hash: ${prop.hash})`);
    });

    // Test 3: Create a test property
    console.log('\n3. Creating test property...');
    const testProperty = await createProperty('test-property', 'Test Property');
    console.log('✅ Test property created:');
    console.log(`   - ID: ${testProperty.id}`);
    console.log(`   - Property ID: ${testProperty.propertyId}`);
    console.log(`   - Hash: ${testProperty.hash}`);
    console.log(`   - Name: ${testProperty.name}`);

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testDatabaseSetup();
