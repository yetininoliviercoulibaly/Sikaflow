
import { MikroORM } from '@mikro-orm/core';
import config from '../mikro-orm.config';

async function initDb() {
  console.log('Initializing Database Schema...');
  try {
    const orm = await MikroORM.init(config);
    const generator = orm.getSchemaGenerator();
    
    await generator.updateSchema();
    console.log('Schema updated successfully.');
    
    await orm.close(true);
  } catch (error) {
    console.error('Error initializing DB:', error);
    process.exit(1);
  }
}

initDb();
