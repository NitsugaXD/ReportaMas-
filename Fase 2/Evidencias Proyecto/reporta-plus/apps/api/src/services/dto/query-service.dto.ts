export class QueryServiceDto {
  q?: string
  from?: string
  to?: string
  tech?: string
  client?: string
  status?: 'DRAFT' | 'SIGNED' | 'SENT' | 'DONE'
  page?: string
  pageSize?: string
}
