/**
 * Pure permission arithmetic, deliberately free of database access so the
 * rules can be tested directly. The queries that feed these functions live in
 * auth.repository.ts and identity.repository.ts.
 */
/**
 * Effective permission codes: role grants, plus explicit grants, minus
 * explicit revokes. A revoke beats a role grant — an admin who explicitly
 * takes a permission away expects it gone whatever the user's roles say.
 */
export function mergePermissions(rolePermissions, overrides) {
    const effective = new Set(rolePermissions);
    for (const override of overrides) {
        if (override.granted)
            effective.add(override.code);
        else
            effective.delete(override.code);
    }
    return [...effective];
}
/** Active users who effectively hold the administrator permission. */
export function administratorIds(candidates) {
    return candidates
        .filter((c) => c.status === 'active')
        .filter((c) => (c.override === null ? c.hasViaRole : c.override))
        .map((c) => c.userId);
}
/**
 * True when taking the permission away from targetUserId would leave nobody
 * holding it — the lockout this guard exists to prevent.
 */
export function wouldRemoveLastAdministrator(holderIds, targetUserId) {
    return holderIds.filter((id) => id !== targetUserId).length === 0;
}
