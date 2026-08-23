import { eq } from 'drizzle-orm';
import { db } from './client.js';
import { accounts, funds, fiscalPeriods, permissions, roles, rolePermissions, users, userRoles } from './schema/index.js';
import { PERMISSIONS, ROLES } from '../modules/identity/rbac.js';
import { hashPassword } from '../modules/identity/password.js';
async function seed() {
    console.log('Seeding chart of accounts...');
    await db.insert(accounts).values([
        // Assets
        { code: '1000', name: 'Cash and Bank', type: 'asset', normalBalance: 'debit' },
        { code: '1010', name: 'Cash at Bank - Main Account', type: 'asset', normalBalance: 'debit' },
        { code: '1020', name: 'Cash at Bank - Capitation Account', type: 'asset', normalBalance: 'debit' },
        { code: '1030', name: 'Petty Cash / Imprest', type: 'asset', normalBalance: 'debit' },
        { code: '1100', name: 'Fee Debtors (Students)', type: 'asset', normalBalance: 'debit' },
        { code: '1200', name: 'Inventory - Stores', type: 'asset', normalBalance: 'debit' },
        { code: '1500', name: 'Property, Plant and Equipment', type: 'asset', normalBalance: 'debit' },
        { code: '1510', name: 'Accumulated Depreciation - PPE', type: 'asset', normalBalance: 'credit' },
        // Liabilities
        { code: '2000', name: 'Creditors / Payables', type: 'liability', normalBalance: 'credit' },
        { code: '2100', name: 'PAYE Payable', type: 'liability', normalBalance: 'credit' },
        { code: '2110', name: 'NSSF Payable', type: 'liability', normalBalance: 'credit' },
        { code: '2120', name: 'SHIF Payable', type: 'liability', normalBalance: 'credit' },
        { code: '2200', name: 'Fees Received in Advance', type: 'liability', normalBalance: 'credit' },
        { code: '2300', name: 'Deferred Capitation / Grant Income', type: 'liability', normalBalance: 'credit' },
        // Net Assets / Equity
        { code: '3000', name: 'Accumulated Fund / Net Assets', type: 'net_assets', normalBalance: 'credit' },
        // Revenue
        { code: '4000', name: 'Tuition Fee Income', type: 'revenue', normalBalance: 'credit' },
        { code: '4010', name: 'Boarding Fee Income', type: 'revenue', normalBalance: 'credit' },
        { code: '4020', name: 'Activity Fee Income', type: 'revenue', normalBalance: 'credit' },
        { code: '4100', name: 'Government Capitation Income (FDSE)', type: 'revenue', normalBalance: 'credit' },
        { code: '4200', name: 'Donations and Grants Income', type: 'revenue', normalBalance: 'credit' },
        { code: '4300', name: 'Trading Income (Farm/Shop)', type: 'revenue', normalBalance: 'credit' },
        { code: '4400', name: 'Interest Income', type: 'revenue', normalBalance: 'credit' },
        // Expenses
        { code: '5000', name: 'Staff Salaries and Wages', type: 'expense', normalBalance: 'debit' },
        { code: '5100', name: 'Teaching and Learning Materials', type: 'expense', normalBalance: 'debit' },
        { code: '5200', name: 'Food and Boarding Expenses', type: 'expense', normalBalance: 'debit' },
        { code: '5300', name: 'Utilities (Electricity, Water)', type: 'expense', normalBalance: 'debit' },
        { code: '5400', name: 'Repairs and Maintenance', type: 'expense', normalBalance: 'debit' },
        { code: '5500', name: 'Transport Expenses', type: 'expense', normalBalance: 'debit' },
        { code: '5600', name: 'Medical Expenses', type: 'expense', normalBalance: 'debit' },
        { code: '5700', name: 'Depreciation Expense', type: 'expense', normalBalance: 'debit' },
        { code: '5900', name: 'Administrative Expenses', type: 'expense', normalBalance: 'debit' },
    ]);
    console.log('Seeding funds / voteheads...');
    await db.insert(funds).values([
        { code: 'FUND-CAP', name: 'Government Capitation (FDSE)', restrictionType: 'restricted', restrictionNotes: 'Restricted to tuition and approved operational voteheads per MoE capitation guidelines.' },
        { code: 'FUND-TUI', name: 'Tuition Fund', restrictionType: 'unrestricted' },
        { code: 'FUND-BRD', name: 'Boarding Fund', restrictionType: 'unrestricted' },
        { code: 'FUND-DEV', name: 'Development Fund', restrictionType: 'restricted', restrictionNotes: 'Restricted to capital projects as approved by BOM/parents.' },
        { code: 'FUND-PTA', name: 'PTA Fund', restrictionType: 'unrestricted' },
        { code: 'FUND-BUR', name: 'Bursary / CDF Fund', restrictionType: 'restricted', restrictionNotes: 'Restricted to designated beneficiary students.' },
        { code: 'FUND-TRD', name: 'Trading Activities (Farm/Shop)', restrictionType: 'unrestricted' },
    ]);
    console.log('Seeding fiscal periods for 2026...');
    await db.insert(fiscalPeriods).values([
        { name: '2026 Term 1', fiscalYear: 2026, term: 1, startDate: '2026-01-06', endDate: '2026-04-03' },
        { name: '2026 Term 2', fiscalYear: 2026, term: 2, startDate: '2026-04-27', endDate: '2026-08-07' },
        { name: '2026 Term 3', fiscalYear: 2026, term: 3, startDate: '2026-08-31', endDate: '2026-11-13' },
    ]);
    console.log('Seeding permissions...');
    const insertedPermissions = await db.insert(permissions).values(PERMISSIONS).returning();
    const permissionIdByCode = new Map(insertedPermissions.map((p) => [p.code, p.id]));
    console.log('Seeding roles and role-permission mappings...');
    for (const role of ROLES) {
        const [insertedRole] = await db
            .insert(roles)
            .values({ code: role.code, name: role.name, description: role.description })
            .returning();
        const mappings = [...new Set(role.permissions)]
            .map((code) => permissionIdByCode.get(code))
            .filter((id) => id !== undefined)
            .map((permissionId) => ({ roleId: insertedRole.id, permissionId }));
        if (mappings.length > 0) {
            await db.insert(rolePermissions).values(mappings);
        }
    }
    console.log('Seeding initial system administrator account...');
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
    const [adminUser] = await db
        .insert(users)
        .values({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@school.local',
        passwordHash: await hashPassword(adminPassword),
        fullName: 'System Administrator',
        mustChangePassword: true,
    })
        .returning();
    const [adminRole] = await db.select().from(roles).where(eq(roles.code, 'system_admin'));
    if (adminRole) {
        await db.insert(userRoles).values({ userId: adminUser.id, roleId: adminRole.id });
    }
    console.log(`Seed complete. Admin login: ${adminUser.email} / (password from SEED_ADMIN_PASSWORD or default — change on first login)`);
    process.exit(0);
}
seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
