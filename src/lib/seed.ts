/**
 * Database seeding script
 * Populates the database with initial data from config.json
 *
 * IMPORTANT: config.json is used ONLY for initial database seeding.
 * After running `npm run db:seed`, all data lives in the database.
 * config.json should NOT be committed to git (it's in .gitignore).
 * Use config.example.json as a template to create your local config.json.
 *
 * Environment variables are loaded via dotenv-cli in the npm script
 */

import { db } from './db';
import { systemStatus, issues, maintenance, announcements, config } from './schema';
import * as fs from 'fs';
import * as path from 'path';

async function seed() {
  console.log('🌱 Seeding database...');

  // Load config.json
  const configPath = path.join(process.cwd(), 'config.json');

  if (!fs.existsSync(configPath)) {
    console.error('❌ config.json not found. Please create it from config.example.json');
    process.exit(1);
  }

  const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  try {
    // 1. Seed system status
    console.log('  📊 Seeding system status...');

    const systems = configData.systems || [
      { id: 'heat', name: 'Heat', icon: '🔥', label: 'Heat' },
      { id: 'water', name: 'Water', icon: '💧', label: 'Water' },
      { id: 'laundry', name: 'Laundry', icon: '🧺', label: 'Laundry' },
    ];

    for (const system of systems) {
      const statusData = configData.status?.systemStatus?.[system.id] || {
        status: 'ok',
        count: '3/3',
      };

      await db.insert(systemStatus).values({
        systemId: system.id,
        status: statusData.status,
        count: statusData.count,
        note: statusData.note || null,
        updatedAt: new Date(),
      }).onConflictDoNothing();
    }

    // 2. Seed current issues
    console.log('  🔧 Seeding current issues...');

    const currentIssues = configData.status?.currentIssues || [];
    for (const issue of currentIssues) {
      await db.insert(issues).values({
        category: issue.category,
        location: issue.location,
        icon: issue.icon || null,
        status: issue.status,
        detail: issue.detail,
        reportedAt: new Date(),
      });
    }

    // 3. Seed scheduled maintenance
    console.log('  🛠️  Seeding scheduled maintenance...');

    const maintenanceItems = configData.status?.scheduledMaintenance || [];
    for (const item of maintenanceItems) {
      await db.insert(maintenance).values({
        date: item.date,
        description: item.description,
        createdAt: new Date(),
      });
    }

    // 4. Seed announcements
    console.log('  📢 Seeding announcements...');

    const pinnedNotifications = configData.status?.pinnedNotifications || [];
    for (const notification of pinnedNotifications) {
      await db.insert(announcements).values({
        type: notification.type,
        message: notification.message,
        expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : null,
        createdAt: new Date(),
      });
    }

    // 5. Seed static configuration
    console.log('  ⚙️  Seeding static configuration...');

    // Add IDs to contacts if they don't have them
    const contacts = (configData.contacts || []).map((contact: any, index: number) => ({
      id: contact.id || `contact-${index + 1}`,
      ...contact,
    }));

    // Add IDs to helpful links if they don't have them
    const helpfulLinks = (configData.helpfulLinks || []).map((link: any, index: number) => ({
      id: link.id || `link-${index + 1}`,
      ...link,
    }));

    const configEntries = [
      { key: 'contacts', value: contacts },
      { key: 'helpfulLinks', value: helpfulLinks },
      { key: 'garbageSchedule', value: configData.garbageSchedule || {} },
      { key: 'buildings', value: configData.buildings || {} },
      { key: 'systems', value: systems },
      { key: 'reportEmail', value: configData.reportEmail || 'building-status@example.com' },
    ];

    for (const entry of configEntries) {
      await db.insert(config).values({
        key: entry.key,
        value: entry.value,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: config.key,
        set: { value: entry.value, updatedAt: new Date() },
      });
    }

    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`  - ${systems.length} system status entries`);
    console.log(`  - ${currentIssues.length} current issues`);
    console.log(`  - ${maintenanceItems.length} scheduled maintenance items`);
    console.log(`  - ${pinnedNotifications.length} announcements`);
    console.log(`  - ${configEntries.length} configuration entries`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seed };
