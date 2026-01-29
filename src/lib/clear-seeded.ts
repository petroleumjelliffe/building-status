/**
 * Clear seeded content script
 * Removes all maintenance and issues from the database
 *
 * Run with: npm run db:clear-seeded
 */

import { db } from './db';
import { issues, maintenance } from './schema';

async function clearSeeded() {
  console.log('🧹 Clearing seeded content...');

  try {
    // Clear issues
    console.log('  🔧 Clearing issues...');
    const deletedIssues = await db.delete(issues).returning({ id: issues.id });

    // Clear maintenance
    console.log('  🛠️  Clearing maintenance...');
    const deletedMaintenance = await db.delete(maintenance).returning({ id: maintenance.id });

    console.log('✅ Seeded content cleared successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`  - ${deletedIssues.length} issues deleted`);
    console.log(`  - ${deletedMaintenance.length} maintenance items deleted`);

  } catch (error) {
    console.error('❌ Error clearing seeded content:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  clearSeeded()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { clearSeeded };
