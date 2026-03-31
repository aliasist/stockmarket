interface D1ExecResult {
  results?: unknown[]
  success?: boolean
  meta?: {
    changes?: number
    last_row_id?: number
    duration?: number
    rows_read?: number
    rows_written?: number
  }
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<{ results?: T[] }>
  run(): Promise<D1ExecResult>
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch(statements: D1PreparedStatement[]): Promise<D1ExecResult[]>
  dump(): Promise<ArrayBuffer>
  exec(query: string): Promise<D1ExecResult>
}

interface ScheduledController {
  cron: string
  scheduledTime: number
}
