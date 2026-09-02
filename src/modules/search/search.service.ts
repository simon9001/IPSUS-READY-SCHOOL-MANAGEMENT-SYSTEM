import { ilike, or, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  journalEntries,
  students,
  admissions,
  feeInvoices,
  feePayments,
  budgets,
  purchaseRequisitions,
  purchaseOrders,
  suppliers,
  teachers,
  subjects,
  assets,
  inventoryItems,
} from '../../db/schema/index.js'

export interface SearchResultItem {
  id: string | number
  category: 'journal' | 'fees' | 'budgets' | 'procurement' | 'students' | 'admissions' | 'academic' | 'assets' | 'inventory'
  title: string
  subtitle: string
  path: string
  status?: string
}

export const searchService = {
  async search(query: string, user: { id: number; permissions: string[] }): Promise<SearchResultItem[]> {
    const q = query.trim()
    if (!q || q.length < 2) return []

    const pattern = `%${q}%`
    const permissions = user.permissions ?? []
    const results: SearchResultItem[] = []

    // 1. Journal Entries (if ledger.journal.view)
    if (permissions.includes('ledger.journal.view')) {
      const jeRows = await db
        .select({
          id: journalEntries.id,
          entryNo: journalEntries.entryNo,
          description: journalEntries.description,
          status: journalEntries.status,
          sourceModule: journalEntries.sourceModule,
        })
        .from(journalEntries)
        .where(
          or(
            ilike(journalEntries.entryNo, pattern),
            ilike(journalEntries.description, pattern),
            ilike(journalEntries.sourceReference, pattern),
          ),
        )
        .limit(5)

      for (const r of jeRows) {
        results.push({
          id: `je-${r.id}`,
          category: 'journal',
          title: r.entryNo,
          subtitle: `${r.description} • ${r.sourceModule}`,
          path: `/dashboard/finance/journal`,
          status: r.status,
        })
      }
    }

    // 2. Fees & Invoices (if fees.view)
    if (permissions.includes('fees.view')) {
      const invRows = await db
        .select({
          id: feeInvoices.id,
          invoiceNo: feeInvoices.invoiceNo,
          totalAmount: feeInvoices.totalAmount,
          status: feeInvoices.status,
        })
        .from(feeInvoices)
        .where(ilike(feeInvoices.invoiceNo, pattern))
        .limit(4)

      for (const r of invRows) {
        results.push({
          id: `inv-${r.id}`,
          category: 'fees',
          title: r.invoiceNo,
          subtitle: `Amount: KES ${Number(r.totalAmount).toLocaleString()} • ${r.status}`,
          path: `/dashboard/finance/fees`,
          status: r.status,
        })
      }

      const payRows = await db
        .select({
          id: feePayments.id,
          receiptNo: feePayments.receiptNo,
          amount: feePayments.amount,
          paymentMethod: feePayments.paymentMethod,
        })
        .from(feePayments)
        .where(or(ilike(feePayments.receiptNo, pattern), ilike(feePayments.referenceNo, pattern)))
        .limit(4)

      for (const r of payRows) {
        results.push({
          id: `rct-${r.id}`,
          category: 'fees',
          title: r.receiptNo,
          subtitle: `Receipt: KES ${Number(r.amount).toLocaleString()} via ${r.paymentMethod}`,
          path: `/dashboard/finance/fees`,
        })
      }
    }

    // 3. Budgets (if budget.view)
    if (permissions.includes('budget.view')) {
      const budgetRows = await db
        .select({
          id: budgets.id,
          fiscalYear: budgets.fiscalYear,
          name: budgets.name,
          status: budgets.status,
        })
        .from(budgets)
        .where(
          or(
            ilike(budgets.name, pattern),
            ilike(sql`CAST(${budgets.fiscalYear} AS TEXT)`, pattern),
          ),
        )
        .limit(4)

      for (const r of budgetRows) {
        results.push({
          id: `budget-${r.id}`,
          category: 'budgets',
          title: `Budget: ${r.name}`,
          subtitle: `FY ${r.fiscalYear} • ${r.status}`,
          path: `/dashboard/finance/budgets`,
          status: r.status,
        })
      }
    }

    // 4. Procurement (if procurement.view)
    if (permissions.includes('procurement.view')) {
      const reqRows = await db
        .select({
          id: purchaseRequisitions.id,
          requisitionNo: purchaseRequisitions.requisitionNo,
          department: purchaseRequisitions.department,
          status: purchaseRequisitions.status,
        })
        .from(purchaseRequisitions)
        .where(
          or(
            ilike(purchaseRequisitions.requisitionNo, pattern),
            ilike(purchaseRequisitions.department, pattern),
          ),
        )
        .limit(4)

      for (const r of reqRows) {
        results.push({
          id: `req-${r.id}`,
          category: 'procurement',
          title: r.requisitionNo,
          subtitle: `${r.department || 'General'} Requisition • ${r.status}`,
          path: `/dashboard/finance/procurement`,
          status: r.status,
        })
      }

      const poRows = await db
        .select({
          id: purchaseOrders.id,
          lpoNo: purchaseOrders.lpoNo,
          totalAmount: purchaseOrders.totalAmount,
          status: purchaseOrders.status,
        })
        .from(purchaseOrders)
        .where(ilike(purchaseOrders.lpoNo, pattern))
        .limit(4)

      for (const r of poRows) {
        results.push({
          id: `po-${r.id}`,
          category: 'procurement',
          title: r.lpoNo,
          subtitle: `LPO Amount: KES ${Number(r.totalAmount).toLocaleString()} • ${r.status}`,
          path: `/dashboard/finance/procurement`,
          status: r.status,
        })
      }

      const suppRows = await db
        .select({
          id: suppliers.id,
          name: suppliers.name,
          kraPin: suppliers.kraPin,
          contactPerson: suppliers.contactPerson,
        })
        .from(suppliers)
        .where(
          or(
            ilike(suppliers.name, pattern),
            ilike(suppliers.kraPin, pattern),
            ilike(suppliers.contactPerson, pattern),
          ),
        )
        .limit(4)

      for (const r of suppRows) {
        results.push({
          id: `supp-${r.id}`,
          category: 'procurement',
          title: r.name,
          subtitle: `Supplier • PIN: ${r.kraPin || 'N/A'} • Contact: ${r.contactPerson || 'N/A'}`,
          path: `/dashboard/finance/procurement`,
        })
      }
    }

    // 5. Students (if students.view)
    if (permissions.includes('students.view')) {
      const studentRows = await db
        .select({
          id: students.id,
          admissionNo: students.admissionNo,
          firstName: students.firstName,
          lastName: students.lastName,
          nemisUpi: students.nemisUpi,
          boardingStatus: students.boardingStatus,
        })
        .from(students)
        .where(
          or(
            ilike(students.firstName, pattern),
            ilike(students.lastName, pattern),
            ilike(students.admissionNo, pattern),
            ilike(students.nemisUpi, pattern),
          ),
        )
        .limit(5)

      for (const r of studentRows) {
        results.push({
          id: `student-${r.id}`,
          category: 'students',
          title: `${r.firstName} ${r.lastName} (${r.admissionNo})`,
          subtitle: `NEMIS: ${r.nemisUpi || 'N/A'} • ${r.boardingStatus}`,
          path: `/dashboard/students`,
        })
      }
    }

    // 6. Admissions (if admissions.view)
    if (permissions.includes('admissions.view')) {
      const admRows = await db
        .select({
          id: admissions.id,
          applicationNo: admissions.applicationNo,
          firstName: admissions.firstName,
          lastName: admissions.lastName,
          admissionType: admissions.admissionType,
          status: admissions.status,
        })
        .from(admissions)
        .where(
          or(
            ilike(admissions.applicationNo, pattern),
            ilike(admissions.firstName, pattern),
            ilike(admissions.lastName, pattern),
            ilike(admissions.nemisUpi, pattern),
          ),
        )
        .limit(4)

      for (const r of admRows) {
        results.push({
          id: `adm-${r.id}`,
          category: 'admissions',
          title: `${r.firstName} ${r.lastName} (${r.applicationNo})`,
          subtitle: `Admission: ${r.admissionType} • ${r.status}`,
          path: `/dashboard/admissions`,
          status: r.status,
        })
      }
    }

    // 7. Academic: Teachers & Subjects
    if (permissions.includes('teachers.view')) {
      const teacherRows = await db
        .select({
          id: teachers.id,
          fullName: teachers.fullName,
          staffNo: teachers.staffNo,
          tscNumber: teachers.tscNumber,
          email: teachers.email,
        })
        .from(teachers)
        .where(
          or(
            ilike(teachers.fullName, pattern),
            ilike(teachers.staffNo, pattern),
            ilike(teachers.tscNumber, pattern),
            ilike(teachers.email, pattern),
          ),
        )
        .limit(4)

      for (const r of teacherRows) {
        results.push({
          id: `teacher-${r.id}`,
          category: 'academic',
          title: r.fullName,
          subtitle: `Teacher • Staff No: ${r.staffNo} • TSC: ${r.tscNumber || 'BOM'}`,
          path: `/dashboard/academic/teachers`,
        })
      }
    }

    if (permissions.includes('subjects.view')) {
      const subjRows = await db
        .select({
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        })
        .from(subjects)
        .where(
          or(
            ilike(subjects.name, pattern),
            ilike(subjects.code, pattern),
          ),
        )
        .limit(4)

      for (const r of subjRows) {
        results.push({
          id: `subj-${r.id}`,
          category: 'academic',
          title: `${r.name} (${r.code})`,
          subtitle: `Subject`,
          path: `/dashboard/academic/subjects`,
        })
      }
    }

    // 8. Fixed Assets & Inventory
    if (permissions.includes('assets.view')) {
      const assetRows = await db
        .select({
          id: assets.id,
          name: assets.name,
          assetTag: assets.assetTag,
          location: assets.location,
          description: assets.description,
        })
        .from(assets)
        .where(
          or(
            ilike(assets.name, pattern),
            ilike(assets.assetTag, pattern),
            ilike(assets.description, pattern),
          ),
        )
        .limit(4)

      for (const r of assetRows) {
        results.push({
          id: `asset-${r.id}`,
          category: 'assets',
          title: `${r.name} (${r.assetTag})`,
          subtitle: `Asset • Location: ${r.location || 'Main Campus'}`,
          path: `/dashboard/finance/assets`,
        })
      }
    }

    if (permissions.includes('inventory.view')) {
      const invItemRows = await db
        .select({
          id: inventoryItems.id,
          name: inventoryItems.name,
          itemCode: inventoryItems.itemCode,
          category: inventoryItems.category,
        })
        .from(inventoryItems)
        .where(
          or(
            ilike(inventoryItems.name, pattern),
            ilike(inventoryItems.itemCode, pattern),
            ilike(inventoryItems.category, pattern),
          ),
        )
        .limit(4)

      for (const r of invItemRows) {
        results.push({
          id: `inv-item-${r.id}`,
          category: 'inventory',
          title: `${r.name} (${r.itemCode})`,
          subtitle: `Stock Item • ${r.category || 'General'}`,
          path: `/dashboard/finance/inventory`,
        })
      }
    }

    return results
  },
}
