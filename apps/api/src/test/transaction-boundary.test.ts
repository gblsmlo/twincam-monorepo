/**
 * The executable half of Decision 019. The decision documents a probe; a probe
 * that only exists in a document is the convention it exists to replace
 * (`MONO-11`), so it runs here.
 *
 * Only the negative rule is a test: no operation opens a unit of work. The
 * other half of the probe — every file that opens one is a composition root —
 * needs judgment about what a composition root is in each slice, and belongs
 * in a review.
 */

import { describe, expect, test } from 'bun:test'

const OPENS_A_TRANSACTION = /withWorkspaceTransaction|\.transaction\(/

describe('transaction boundary', () => {
  test('no persistence operation opens its own transaction', async () => {
    const glob = new Bun.Glob('features/**/*-persistence.ts')
    const offenders: string[] = []

    for await (const relativePath of glob.scan({ cwd: `${import.meta.dir}/..` })) {
      const source = await Bun.file(`${import.meta.dir}/../${relativePath}`).text()

      if (OPENS_A_TRANSACTION.test(source)) {
        offenders.push(relativePath)
      }
    }

    // An operation that opens a transaction has already committed when the
    // caller's next write fails, and no composition above it can be atomic.
    expect(offenders).toEqual([])
  })
})
