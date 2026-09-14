// Types shared by the database-free messaging units. Nothing here imports the
// database, so every unit that uses them can be tested in isolation.

export type Channel = 'sms' | 'email' | 'both'
export type DeliveryChannel = 'sms' | 'email'
export type StaffCategory = 'teaching' | 'non_teaching'
export type RecipientKind = 'parent' | 'teacher' | 'staff'

/** A hand-picked person. A family is identified by any one of its children's student ids. */
export interface PickedPerson {
  kind: 'family' | 'teacher' | 'staff'
  id: number
}

export type Audience =
  | { type: 'all_parents' }
  | { type: 'class_parents'; classId: number; streamId?: number }
  | { type: 'fee_balance_parents'; minimumBalance?: number }
  | { type: 'all_teachers' }
  | { type: 'all_staff'; category?: StaffCategory }
  | { type: 'individuals'; people: PickedPerson[] }

export interface ComposeInput {
  channel: Channel
  audiences: Audience[]
  subject?: string
  body: string
}

/** One active student with their guardian fields and, if linked, their parent account. */
export interface StudentContactRow {
  studentId: number
  firstName: string
  lastName: string
  classId: number
  className: string
  streamId: number | null
  guardianName: string | null
  guardianPhone: string | null
  guardianEmail: string | null
  parentUserId: number | null
  parentName: string | null
  parentPhone: string | null
  parentEmail: string | null
}

/** One fee invoice item with the total allocated against it. Numerics arrive as strings. */
export interface InvoiceItemLine {
  studentId: number
  invoiceStatus: string
  amount: string | number
  allocated: string | number
}

export interface FamilyChild {
  studentId: number
  firstName: string
  classId: number
  className: string
  streamId: number | null
}

export interface Family {
  key: string
  name: string
  /** Normalised phone, or null when there is no usable phone. */
  phone: string | null
  /** The phone as stored, kept so a skipped row can say "Invalid" rather than "No". */
  rawPhone: string | null
  /** Lower-cased email, or null. */
  email: string | null
  children: FamilyChild[]
  balance: number
}

export interface PersonRow {
  id: number
  fullName: string
  phone: string | null
  email: string | null
}

export interface StaffRow extends PersonRow {
  category: StaffCategory
  teacherId: number | null
}

export interface Directory {
  families: Family[]
  teachers: PersonRow[]
  staff: StaffRow[]
}

export interface Recipient {
  kind: RecipientKind
  name: string
  phone: string | null
  rawPhone: string | null
  email: string | null
  /** For parents: the children in scope for this message. Empty for teachers and staff. */
  children: FamilyChild[]
  /** For parents: the whole family's balance. 0 for teachers and staff. */
  balance: number
}

/** A notifications row as built for a batch, before the batch id is known. */
export interface MessageRow {
  channel: DeliveryChannel
  recipientName: string
  recipientPhone: string | null
  recipientEmail: string | null
  subject: string | null
  body: string
  status: 'pending' | 'skipped'
  failureReason: string | null
}

export interface PreviewSummary {
  recipients: number
  channels: Array<{ channel: DeliveryChannel; queued: number; skipped: number }>
  skipped: number
  samples: Array<{ name: string; subject: string | null; body: string }>
}

export interface PersonHit {
  kind: PickedPerson['kind']
  id: number
  label: string
  detail: string
}
