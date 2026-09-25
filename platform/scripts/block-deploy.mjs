const action = process.argv[2] === '--dev' ? 'local preview' : 'deployment';
console.error(`Cloudflare ${action} is blocked: the legacy lumiq-cam Worker and its staging Hyperdrive/R2 resources were deleted. Do not recreate that Worker or reattach lumiq.cam. Use npm run dev for isolated local work. The closed test uses its separate ignored config; production remains locked until every launch gate and owner approval is complete.`);
process.exitCode=1;
