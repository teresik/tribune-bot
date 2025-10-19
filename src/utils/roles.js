const { ROLES } = require('../constants');

function hasBroadcasterPerm(member) {
    if (!member) return false;
    if (ROLES.BROADCASTER_ROLE_ID) return member.roles.cache.has(ROLES.BROADCASTER_ROLE_ID);
    return member.roles.cache.some(r => r.name.toLowerCase().includes('broadcaster'));
}
function hasGenderRole(member, gender) {
    if (!member?.roles?.cache) return false;
    return member.roles.cache.some(r => r.name && r.name.toLowerCase().includes(gender.toLowerCase()));
}
module.exports = { hasBroadcasterPerm, hasGenderRole };
