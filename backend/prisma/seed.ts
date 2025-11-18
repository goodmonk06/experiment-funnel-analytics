import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean up existing data (in development only)
  await prisma.userExperimentAssignment.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.funnelDefinition.deleteMany({});
  await prisma.experimentDefinition.deleteMany({});
  await prisma.project.deleteMany({});

  console.log('✅ Cleaned existing data\n');

  // Create demo project
  const demoProject = await prisma.project.create({
    data: {
      name: 'Demo SaaS App',
    },
  });

  console.log(`📁 Created project: ${demoProject.name}`);
  console.log(`   API Key: ${demoProject.apiKey}\n`);

  // Create funnel definition
  const signupFunnel = await prisma.funnelDefinition.create({
    data: {
      projectId: demoProject.id,
      name: 'Signup to Subscription Flow',
      stepsJson: JSON.stringify(['page_view', 'signup', 'subscribe']),
    },
  });

  console.log(`🔀 Created funnel: ${signupFunnel.name}\n`);

  // Create experiment definition
  const buttonExperiment = await prisma.experimentDefinition.create({
    data: {
      projectId: demoProject.id,
      key: 'cta_button_test',
      variantsJson: JSON.stringify(['control', 'green', 'blue']),
      status: 'active',
    },
  });

  console.log(`🧪 Created experiment: ${buttonExperiment.key}\n`);

  // Generate realistic user journey data
  console.log('👥 Generating user journey data...\n');

  const users = [
    // Users who complete full funnel (50 users, 33% conversion from view to subscribe)
    ...Array.from({ length: 50 }, (_, i) => `user_complete_${i}`),
    // Users who signup but don't subscribe (75 users)
    ...Array.from({ length: 75 }, (_, i) => `user_signup_${i}`),
    // Users who only view landing page (125 users)
    ...Array.from({ length: 125 }, (_, i) => `user_view_${i}`),
  ];

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const events: any[] = [];
  const assignments: any[] = [];

  for (const userId of users) {
    const isComplete = userId.startsWith('user_complete_');
    const hasSignup = isComplete || userId.startsWith('user_signup_');

    // Assign to experiment variant
    const variants = ['control', 'green', 'blue'];
    const variant = variants[Math.floor(Math.random() * variants.length)];

    assignments.push({
      projectId: demoProject.id,
      experimentKey: buttonExperiment.key,
      userIdOrAnonId: userId,
      variant,
      assignedAt: threeDaysAgo,
    });

    // Page view event (all users)
    events.push({
      projectId: demoProject.id,
      userIdOrAnonId: userId,
      name: 'page_view',
      propertiesJson: JSON.stringify({
        page: 'landing',
        referrer: 'google',
        variant,
      }),
      timestamp: threeDaysAgo,
    });

    // Signup event
    if (hasSignup) {
      events.push({
        projectId: demoProject.id,
        userIdOrAnonId: userId,
        name: 'signup',
        propertiesJson: JSON.stringify({
          email: `${userId}@example.com`,
          variant,
        }),
        timestamp: twoDaysAgo,
      });
    }

    // Subscribe event
    if (isComplete) {
      events.push({
        projectId: demoProject.id,
        userIdOrAnonId: userId,
        name: 'subscribe',
        propertiesJson: JSON.stringify({
          plan: 'premium',
          amount: 29.99,
          variant,
        }),
        timestamp: oneDayAgo,
      });
    }
  }

  // Insert events in batches
  const batchSize = 100;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    await prisma.event.createMany({
      data: batch,
    });
  }

  // Insert experiment assignments
  await prisma.userExperimentAssignment.createMany({
    data: assignments,
  });

  console.log(`✅ Created ${events.length} events`);
  console.log(`✅ Created ${assignments.length} experiment assignments\n`);

  // Summary
  const stats = {
    totalUsers: users.length,
    pageViews: users.length,
    signups: users.filter(u => u.startsWith('user_complete_') || u.startsWith('user_signup_')).length,
    subscriptions: users.filter(u => u.startsWith('user_complete_')).length,
  };

  console.log('📊 Data Summary:');
  console.log(`   Total Users: ${stats.totalUsers}`);
  console.log(`   Page Views: ${stats.pageViews} (100%)`);
  console.log(`   Signups: ${stats.signups} (${((stats.signups / stats.totalUsers) * 100).toFixed(1)}%)`);
  console.log(`   Subscriptions: ${stats.subscriptions} (${((stats.subscriptions / stats.totalUsers) * 100).toFixed(1)}%)`);
  console.log(`\n   Overall Conversion Rate: ${((stats.subscriptions / stats.totalUsers) * 100).toFixed(1)}%\n`);

  console.log('🎉 Seed completed successfully!\n');
  console.log('📝 Demo credentials:');
  console.log(`   API Key: ${demoProject.apiKey}`);
  console.log(`   Project ID: ${demoProject.id}`);
  console.log(`\n🔗 Next steps:`);
  console.log(`   1. Start the backend: npm run dev`);
  console.log(`   2. Open dashboard: http://localhost:3000`);
  console.log(`   3. View the "Demo SaaS App" project`);
  console.log(`   4. Explore funnels and experiments\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
