/**
 * The cursor is the only part of the listing contract the client carries back
 * unchanged, so what has to hold is the round trip and the refusal — a cursor
 * this code did not issue must not silently become "first page".
 */

import { describe, expect, test } from 'bun:test'

import { decodeProjectCursor, encodeProjectCursor } from './projects-persistence'

const createdAt = new Date('2026-09-14T10:00:00.000Z')

describe('project cursor', () => {
  test('survives the round trip with both halves of the ordering', () => {
    const cursor = encodeProjectCursor({ createdAt, id: 'project-1' })

    expect(decodeProjectCursor(cursor)).toEqual({
      createdAt: '2026-09-14T10:00:00.000Z',
      id: 'project-1',
    })
  })

  test('is opaque: it does not read as the values it carries', () => {
    const cursor = encodeProjectCursor({ createdAt, id: 'project-1' })

    expect(cursor).not.toContain('project-1')
    expect(cursor).not.toContain('2026')
  })

  test('keeps an id that contains the separator', () => {
    // The decoder splits on the FIRST separator, so everything after it is the
    // id. Ids are opaque strings (Decision 014) and nothing forbids this one.
    const cursor = encodeProjectCursor({ createdAt, id: 'a|b' })

    expect(decodeProjectCursor(cursor)?.id).toBe('a|b')
  })

  test.each([
    ['not base64 at all', 'não-é-um-cursor'],
    ['empty', ''],
    ['no separator', Buffer.from('2026-09-14T10:00:00.000Z', 'utf8').toString('base64url')],
    ['no id', Buffer.from('2026-09-14T10:00:00.000Z|', 'utf8').toString('base64url')],
    ['no timestamp', Buffer.from('|project-1', 'utf8').toString('base64url')],
    ['timestamp is not a date', Buffer.from('ontem|project-1', 'utf8').toString('base64url')],
  ])('refuses a cursor it did not issue: %s', (_name, cursor) => {
    expect(decodeProjectCursor(cursor)).toBeNull()
  })
})
