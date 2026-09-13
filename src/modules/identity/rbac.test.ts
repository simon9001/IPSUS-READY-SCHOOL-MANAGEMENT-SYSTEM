import { describe, it, expect } from 'vitest'
import { PERMISSIONS, ROLES } from './rbac.js'

const permsOf = (name: string) => {
  const role = ROLES.find((r) => r.name === name)
  if (!role) throw new Error(`role ${name} not found`)
  return role.permissions
}
const holdersOf = (code: string) => ROLES.filter((r) => r.permissions.includes(code)).map((r) => r.name)

describe('student and teacher edit/delete permissions', () => {
  it('defines students.edit, students.delete and teachers.delete in the catalogue', () => {
    const codes = PERMISSIONS.map((p) => p.code)
    expect(codes).toContain('students.edit')
    expect(codes).toContain('students.delete')
    expect(codes).toContain('teachers.delete')
  })

  it('lets the Dean of Studies edit and delete students and delete teachers', () => {
    expect(permsOf('Dean of Studies')).toEqual(expect.arrayContaining(['students.edit', 'students.delete', 'teachers.delete']))
  })

  it('lets the Registrar keep adding and editing students', () => {
    expect(permsOf('Registrar / Admissions Officer')).toEqual(expect.arrayContaining(['students.manage', 'students.edit']))
  })

  it('gives the destructive permissions to the Dean alone', () => {
    expect(holdersOf('students.delete')).toEqual(['Dean of Studies'])
    expect(holdersOf('teachers.delete')).toEqual(['Dean of Studies'])
  })

  it('keeps the catalogue free of duplicate codes', () => {
    const codes = PERMISSIONS.map((p) => p.code)
    expect(codes).toHaveLength(new Set(codes).size)
  })

  it('never gives a role a permission the catalogue does not define', () => {
    const codes = new Set(PERMISSIONS.map((p) => p.code))
    const unknown = ROLES.flatMap((r) => r.permissions.filter((p) => !codes.has(p)).map((p) => `${r.name} → ${p}`))
    expect(unknown).toEqual([])
  })
})
