import { eq, inArray } from 'drizzle-orm';
import { db } from './client.js';
import { permissions, roles, rolePermissions } from './schema/index.js';
import { PERMISSIONS, ROLES } from '../modules/identity/rbac.js';
// Additive-only sync: inserts any permission/role/role-permission-mapping
// defined in rbac.ts that isn't already in the database. Never removes or
// modifies an existing row, so it's always safe to re-run after editing
// rbac.ts — it only ever catches the DB up to what the source of truth says.
async function sync() {
    const existingPerms = await db.select().from(permissions);
    const existingPermCodes = new Set(existingPerms.map((p) => p.code));
    const newPerms = PERMISSIONS.filter((p) => !existingPermCodes.has(p.code));
    if (newPerms.length > 0) {
        await db.insert(permissions).values(newPerms);
        console.log(`Inserted ${newPerms.length} new permission(s): ${newPerms.map((p) => p.code).join(', ')}`);
    }
    else {
        console.log('No new permissions to insert.');
    }
    const allPerms = await db.select().from(permissions);
    const permIdByCode = new Map(allPerms.map((p) => [p.code, p.id]));
    const existingRoles = await db.select().from(roles);
    const existingRoleCodes = new Set(existingRoles.map((r) => r.code));
    const newRoles = ROLES.filter((r) => !existingRoleCodes.has(r.code));
    for (const role of newRoles) {
        await db.insert(roles).values({ code: role.code, name: role.name, description: role.description });
        console.log(`Inserted new role: ${role.code}`);
    }
    const allRoles = await db.select().from(roles);
    const roleIdByCode = new Map(allRoles.map((r) => [r.code, r.id]));
    const existingMappings = await db.select().from(rolePermissions);
    const existingMappingKeys = new Set(existingMappings.map((m) => `${m.roleId}:${m.permissionId}`));
    let addedMappings = 0;
    for (const role of ROLES) {
        const roleId = roleIdByCode.get(role.code);
        if (!roleId)
            continue;
        const wantedPermIds = [...new Set(role.permissions)]
            .map((code) => permIdByCode.get(code))
            .filter((id) => id !== undefined);
        const toInsert = wantedPermIds
            .filter((permissionId) => !existingMappingKeys.has(`${roleId}:${permissionId}`))
            .map((permissionId) => ({ roleId, permissionId }));
        if (toInsert.length > 0) {
            await db.insert(rolePermissions).values(toInsert);
            addedMappings += toInsert.length;
            console.log(`  ${role.code}: +${toInsert.length} permission mapping(s)`);
        }
    }
    console.log(`\nDone. ${newPerms.length} new permissions, ${newRoles.length} new roles, ${addedMappings} new role-permission mappings.`);
    process.exit(0);
}
sync().catch((err) => {
    console.error(err);
    process.exit(1);
});
