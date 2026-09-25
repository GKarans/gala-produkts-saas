import {PLANS} from '../shared/plans.js';
import {estimateCosts} from '../shared/cost-model.js';

const [, , subscribersArg, utilizationArg, averagePairArg, viewsArg, emailArg] = process.argv;
const result = estimateCosts({
  plans: PLANS,
  subscribers: Number(subscribersArg || 100),
  eventUtilization: Number(utilizationArg || 0.55),
  averagePhotoPairMiB: Number(averagePairArg || 1.08),
  fullSizeViewsPerPhoto: Number(viewsArg || 100),
  emailUsd: Number(emailArg || 0),
});

console.log(JSON.stringify(result, null, 2));
