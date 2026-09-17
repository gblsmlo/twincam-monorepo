/**
 * The facts about a project's fields that more than one layer has to agree on:
 * the column that stores the value and the contract that publishes it.
 *
 * Plain constants, no Zod, so `packages/infra/database` can read them without
 * importing a schema library to declare a column (Decision 020). The rule that
 * lives here is the one a disagreement would make wrong — a length the contract
 * refuses and the column accepts is a row the database will hold and no client
 * can produce.
 */
export const projectNameRule = {
  max: 80,
  min: 3,
} as const

export const projectDescriptionRule = {
  max: 280,
} as const

export const projectStatuses = ['active', 'archived'] as const
