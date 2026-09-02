import { systemRepository } from './system.repository.js';
import { PERMISSIONS, ROLES } from '../identity/rbac.js';
/**
 * Maker-checker pairs the RBAC design deliberately keeps apart: no single role
 * in rbac.ts holds both sides of any pair below. So a hit here always means a
 * *user* was granted two roles that together defeat the segregation of duties —
 * exactly what an auditor asks about, and something the role catalogue itself
 * cannot detect.
 */
const SEGREGATION_RULES = [
    { rule: 'Creates and approves journal entries', permissions: ['ledger.journal.create', 'ledger.journal.approve'] },
    { rule: 'Prepares and approves budgets', permissions: ['budget.manage', 'budget.approve'] },
    { rule: 'Raises and approves purchase requisitions', permissions: ['procurement.requisition.create', 'procurement.requisition.approve'] },
    { rule: 'Prepares and approves supplier payments', permissions: ['procurement.payment.create', 'procurement.payment.approve'] },
    { rule: 'Runs and approves payroll', permissions: ['payroll.process', 'payroll.approve'] },
];
async function rbacDrift() {
    const [dbPermissions, dbRoles, dbPairs] = await Promise.all([
        systemRepository.permissionCodes(),
        systemRepository.roleCodes(),
        systemRepository.rolePermissionPairs(),
    ]);
    const dbPermissionCodes = new Set(dbPermissions.map((p) => p.code));
    const dbRoleCodes = new Set(dbRoles.map((r) => r.code));
    const dbPairKeys = new Set(dbPairs.map((p) => `${p.roleCode}|${p.permissionCode}`));
    const sourcePermissionCodes = new Set(PERMISSIONS.map((p) => p.code));
    const sourceRoleCodes = new Set(ROLES.map((r) => r.code));
    const missingRolePermissions = [];
    const sourcePairKeys = new Set();
    for (const role of ROLES) {
        for (const permissionCode of new Set(role.permissions)) {
            sourcePairKeys.add(`${role.code}|${permissionCode}`);
            if (!dbPairKeys.has(`${role.code}|${permissionCode}`)) {
                missingRolePermissions.push({ roleCode: role.code, permissionCode });
            }
        }
    }
    // The direction that actually matters for security. db:sync-rbac only ever
    // inserts, so narrowing a role in rbac.ts leaves the database still granting
    // everything that was taken away — and users keep the access indefinitely.
    // Only check roles the source still defines; a role dropped from rbac.ts
    // entirely is already reported as an orphan role.
    const orphanRolePermissions = dbPairs
        .filter((p) => sourceRoleCodes.has(p.roleCode) && !sourcePairKeys.has(`${p.roleCode}|${p.permissionCode}`))
        .map((p) => ({ roleCode: p.roleCode, permissionCode: p.permissionCode }));
    const missingPermissions = [...sourcePermissionCodes].filter((c) => !dbPermissionCodes.has(c));
    const missingRoles = [...sourceRoleCodes].filter((c) => !dbRoleCodes.has(c));
    // db:sync-rbac is additive-only, so a code removed from rbac.ts stays behind
    // in the database — surfaced here rather than deleted automatically, since
    // dropping a permission row cascades to role_permissions.
    const orphanPermissions = [...dbPermissionCodes].filter((c) => !sourcePermissionCodes.has(c));
    const orphanRoles = [...dbRoleCodes].filter((c) => !sourceRoleCodes.has(c));
    return {
        missingPermissions,
        missingRoles,
        missingRolePermissions,
        orphanPermissions,
        orphanRoles,
        orphanRolePermissions,
        inSync: missingPermissions.length === 0 &&
            missingRoles.length === 0 &&
            missingRolePermissions.length === 0 &&
            orphanPermissions.length === 0 &&
            orphanRoles.length === 0 &&
            orphanRolePermissions.length === 0,
    };
}
async function segregationConflicts() {
    const pairs = await systemRepository.userPermissionPairs();
    const byUser = new Map();
    for (const pair of pairs) {
        const existing = byUser.get(pair.userId);
        if (existing)
            existing.codes.add(pair.code);
        else
            byUser.set(pair.userId, { email: pair.email, fullName: pair.fullName, codes: new Set([pair.code]) });
    }
    const conflicts = [];
    for (const [userId, user] of byUser) {
        for (const { rule, permissions } of SEGREGATION_RULES) {
            if (user.codes.has(permissions[0]) && user.codes.has(permissions[1])) {
                conflicts.push({ userId, email: user.email, fullName: user.fullName, rule, permissions });
            }
        }
    }
    return conflicts;
}
async function flaggedAccounts() {
    const [lockedOut, roleless, neverLoggedIn] = await Promise.all([
        systemRepository.lockedOutUsers(),
        systemRepository.usersWithoutRoles(),
        systemRepository.neverLoggedInUsers(),
    ]);
    const rolelessIds = new Set(roleless.map((u) => u.id));
    return [
        ...lockedOut.map((u) => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            reason: 'Locked out',
            detail: `${u.failedLoginAttempts} failed attempts — unlocks ${u.lockedUntil ? new Date(u.lockedUntil).toLocaleString() : 'shortly'}`,
        })),
        ...roleless.map((u) => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            reason: 'No role assigned',
            detail: 'Can log in but holds no permissions',
        })),
        // A roleless account has already been listed above, and it has never been
        // signed into precisely because there is nothing to sign in to — listing
        // it twice would report one broken account as two problems.
        ...neverLoggedIn
            .filter((u) => !rolelessIds.has(u.id))
            .map((u) => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            reason: 'Never signed in',
            detail: `Created ${new Date(u.createdAt).toLocaleDateString()}`,
        })),
    ];
}
async function runtime() {
    let databaseReachable = true;
    let databaseLatencyMs = null;
    try {
        databaseLatencyMs = await systemRepository.ping();
    }
    catch {
        databaseReachable = false;
    }
    return {
        databaseReachable,
        databaseLatencyMs,
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        heapUsedMb: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10,
        environment: process.env.NODE_ENV ?? 'development',
    };
}
export const systemService = {
    userStats: () => systemRepository.userStats(),
    roleUsage: () => systemRepository.roleUsage(),
    flaggedAccounts,
    rbacDrift,
    segregationConflicts,
    runtime,
    async health() {
        const [runtimeStatus, users, flagged] = await Promise.all([runtime(), systemRepository.userStats(), flaggedAccounts()]);
        return { runtime: runtimeStatus, users, flaggedAccounts: flagged };
    },
    async rbacStatus() {
        const [drift, conflicts, roleUsage] = await Promise.all([rbacDrift(), segregationConflicts(), systemRepository.roleUsage()]);
        return { drift, conflicts, roleUsage, catalogue: { permissions: PERMISSIONS.length, roles: ROLES.length } };
    },
};
