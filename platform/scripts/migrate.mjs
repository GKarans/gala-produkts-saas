import {openDatabase} from '../server/db.mjs';
if(process.env.PLATFORM_MODE!=='staging'||process.env.PLATFORM_MIGRATE!=='1'||!process.env.PLATFORM_DATABASE_URL)throw new Error('Explicit isolated staging migration configuration is required.');
const db=await openDatabase();await db.close();console.log('Isolated platform schema applied. No MVP migration was run.');
