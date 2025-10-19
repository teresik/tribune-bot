const { fmtLocal, fmtUTC } = require('../utils/dates');
function logNextRun(job) {
    const next = job?.nextInvocation?.();
    if (!next) return console.log('🗓 [AUTO] Следующая перезапись: не запланирована');
    console.log(`🗓 [AUTO] Следующая перезапись: ${fmtLocal(next.toDate())}  (${fmtUTC(next.toDate())})`);
}
module.exports = { logNextRun };
