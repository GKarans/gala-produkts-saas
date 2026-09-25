export const isReleaseApproved = (mode, approval) =>
  ['staging', 'production'].includes(mode) && approval === mode;
