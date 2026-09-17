/**
 * The organization policy is configuration, and configuration drifts in
 * silence: nothing fails when a flag flips, and the README keeps promising what
 * the code stopped doing.
 *
 * This asserts the promises `docs/engineering/security.md` and the production
 * checklist make, and nothing about behaviour — the hooks that enforce the
 * owner invariant need PostgreSQL and belong in an integration test.
 */

import { describe, expect, test } from 'bun:test'

import { organizationOptions } from './organization'

const FORTY_EIGHT_HOURS = 60 * 60 * 48

describe('organization policy', () => {
  test('the creator becomes owner, and deletion is disabled by default', () => {
    expect(organizationOptions.creatorRole).toBe('owner')
    expect(organizationOptions.disableOrganizationDeletion).toBe(true)
  })

  test('invitations require a verified email and expire', () => {
    expect(organizationOptions.requireEmailVerificationOnInvitation).toBe(true)
    expect(organizationOptions.invitationExpiresIn).toBe(FORTY_EIGHT_HOURS)
    expect(organizationOptions.cancelPendingInvitationsOnReInvite).toBe(true)
  })

  test('membership is bounded', () => {
    expect(organizationOptions.membershipLimit).toBe(25)
  })

  test('the features the starter does not ship stay off', () => {
    expect(organizationOptions.teams.enabled).toBe(false)
    expect(organizationOptions.dynamicAccessControl.enabled).toBe(false)
  })

  test('the hooks that keep at least one owner are registered', () => {
    const hooks = organizationOptions.organizationHooks

    // Removing or demoting the last owner leaves an organization nobody can
    // administer, and it is these two hooks that refuse it.
    expect(hooks.beforeRemoveMember).toBeFunction()
    expect(hooks.beforeUpdateMemberRole).toBeFunction()
  })

  test('membership changes are audited', () => {
    const hooks = organizationOptions.organizationHooks

    expect(hooks.afterAcceptInvitation).toBeFunction()
    expect(hooks.afterCreateInvitation).toBeFunction()
    expect(hooks.afterRemoveMember).toBeFunction()
    expect(hooks.afterUpdateMemberRole).toBeFunction()
  })
})
