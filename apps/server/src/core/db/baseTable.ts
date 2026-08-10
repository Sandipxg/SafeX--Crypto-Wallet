import { createBaseTable } from 'orchid-orm'

export const BaseTable = createBaseTable({
  columnTypes: (t) => ({
    ...t
  })
})
