const action = process.argv[2] === '--dev' ? 'local preview' : 'deployment';
console.error(`Cloudflare ${action} via the base config is blocked: it targets the existing lumiq.cam staging Worker and its data. Use npm run dev for isolated local work. The closed test uses its separate ignored config; production remains locked until every launch gate and owner approval is complete.`);
process.exitCode=1;
