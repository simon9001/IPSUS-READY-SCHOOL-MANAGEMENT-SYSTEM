import { eq } from 'drizzle-orm';
import { db } from './client.js';
import { roles, users, userRoles } from './schema/index.js';
import { hashPassword } from '../modules/identity/password.js';
// One demo login per non-admin role, so every permission tier in rbac.ts can
// actually be logged into and clicked through — not just read about.
const DEMO_USERS = [
    { email: 'principal@school.local', fullName: 'Dr. James Kariuki', roleCode: 'principal' },
    { email: 'dean@school.local', fullName: 'Margaret Wanjiku', roleCode: 'dean_of_studies' },
    { email: 'bursar@school.local', fullName: 'Mary Njoroge', roleCode: 'bursar' },
    { email: 'accounts.clerk@school.local', fullName: 'Peter Mwangi', roleCode: 'accounts_clerk' },
    { email: 'bom.treasurer@school.local', fullName: 'Samuel Otieno', roleCode: 'bom_treasurer' },
    { email: 'bom.member@school.local', fullName: 'Grace Achieng', roleCode: 'bom_member' },
    { email: 'procurement@school.local', fullName: 'David Kimani', roleCode: 'procurement_officer' },
    { email: 'storekeeper@school.local', fullName: 'Alice Wambui', roleCode: 'store_keeper' },
    { email: 'payroll@school.local', fullName: 'John Mutua', roleCode: 'payroll_officer' },
    { email: 'internal.auditor@school.local', fullName: 'Susan Chebet', roleCode: 'internal_auditor' },
    { email: 'external.auditor@school.local', fullName: 'OAG Representative', roleCode: 'external_auditor' },
    { email: 'parent@school.local', fullName: 'Parent Demo Account', roleCode: 'parent' },
    { email: 'hr@school.local', fullName: 'Lucy Wairimu', roleCode: 'hr_officer' },
    { email: 'registrar@school.local', fullName: 'Michael Odhiambo', roleCode: 'registrar' },
    { email: 'teacher@school.local', fullName: 'Faith Nyambura', roleCode: 'teacher' },
    { email: 'counselor@school.local', fullName: 'Ruth Wanjiku', roleCode: 'counselor' },
    { email: 'boarding@school.local', fullName: 'Joseph Kiprono', roleCode: 'boarding_officer' },
    { email: 'nurse@school.local', fullName: 'Esther Muthoni', roleCode: 'school_nurse' },
    { email: 'transport@school.local', fullName: 'Daniel Mwangi', roleCode: 'transport_officer' },
    { email: 'timetable@school.local', fullName: 'Nancy Achieng', roleCode: 'timetable_coordinator' },
    { email: 'librarian@school.local', fullName: 'Catherine Njeri', roleCode: 'librarian' },
];
async function seedDemoUsers() {
    const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
    const passwordHash = await hashPassword(password);
    for (const demo of DEMO_USERS) {
        const [existing] = await db.select().from(users).where(eq(users.email, demo.email));
        if (existing) {
            console.log(`Skip (already exists): ${demo.email}`);
            continue;
        }
        const [role] = await db.select().from(roles).where(eq(roles.code, demo.roleCode));
        if (!role) {
            console.warn(`No role found for code "${demo.roleCode}", skipping ${demo.email}`);
            continue;
        }
        const [user] = await db
            .insert(users)
            .values({ email: demo.email, passwordHash, fullName: demo.fullName, mustChangePassword: false })
            .returning();
        await db.insert(userRoles).values({ userId: user.id, roleId: role.id });
        console.log(`Created: ${demo.email} (${demo.fullName}) — ${role.name}`);
    }
    console.log(`\nAll demo accounts share the password: ${password}`);
    process.exit(0);
}
seedDemoUsers().catch((err) => {
    console.error(err);
    process.exit(1);
});
