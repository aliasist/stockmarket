interface D1ExecResult {
  results?: unknown[]
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<{ results?: T[] }>
  run(): Promise<D1ExecResult>
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
}

interface ScheduledController {
  cron: string
  scheduledTime: number
}
