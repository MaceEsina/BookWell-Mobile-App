import { Env } from '@/bindings'
import { nanoid } from 'nanoid'

export interface IMarketplace {
  id: string
  userId: string
  dateCreated: string
  title: string
  dateStart?: string
  dateEnd?: string
  isHidden: number
  audiences: string
  adImage?: string
  commerceUrl?: string
}

// D1 doc: https://developers.cloudflare.com/d1/client-api
export const getById = async (env: Env, id: string, fields?: string)
  : Promise<IMarketplace | undefined> => {
  if (id == null) throw new Error('Missing parameter: id')

  const stmt = env.DB.prepare('SELECT * FROM Marketplaces WHERE id=?').bind(id)
  const record: any = await stmt.first()
  // let user: User
  if (record) {
    if (record.userId) delete record.userId
    if (fields == null) return record;
    const aryReqFields = fields.split(',')
    const props = Object.getOwnPropertyNames(record)
    let newRst: any = {}
    for (let i = 0; i < props.length; ++i) {
      let prop = props[i]
      if (aryReqFields.includes(prop)) {
        newRst[prop] = record[prop]
      }
    }
    return newRst as IMarketplace
  }
}

export const getAll = async (env: Env, userId: string, crit?: string, fields?: string, sort?: string, pageNo?: string, pageSize?: string)
  : Promise<IMarketplace[] | undefined> => {
  if (userId == null) throw new Error('Missing parameter: userId')

  let sql = `SELECT * FROM Marketplaces WHERE userId='${userId}'`
  if (crit != null) sql += ` AND ${crit}`
  if (sort != null) sql += ` ORDER BY ${sort}`
  if (pageNo != null && pageSize != null) sql += ` LIMIT ${parseInt(pageNo) * parseInt(pageSize)},${pageSize}`
  const resp = await env.DB.prepare(sql).all()
  if (resp.error != null) throw new Error(resp.error)
  if (resp.results == null || resp.results.length === 0) return []
  resp.results.forEach((e: any) => delete e.userId)
  if (fields == null) return resp.results as IMarketplace[]
  let results: any = []
  for (let i = 0; i < resp.results.length; ++i) {
    let record: any = resp.results[i]
    const aryReqFields = fields.split(',')
    const props = Object.getOwnPropertyNames(record)
    let newRst: any = {}
    for (let i = 0; i < props.length; ++i) {
      let prop = props[i]
      if (aryReqFields.includes(prop)) {
        newRst[prop] = record[prop];
      }
    }
    results.push(newRst)
  }
  return results
}

export const create = async (env: Env, userId: string, param: any)
  : Promise<IMarketplace | undefined> => {
  if (param == null) throw new Error('Missing parameters')
  if (userId == null) throw new Error('Missing parameter: userId')
  if (param.title == null) throw new Error('Missing parameter: title')
  if (param.isHidden == null) throw new Error('Missing parameter: isHidden')
  if (param.audiences == null) throw new Error('Missing parameter: audiences')
  if (param.adImage == null) throw new Error('Missing parameter: adImage')

  const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM Users WHERE id=?').bind(param.userId).first()
  if (count == 0) throw new Error('UserId not found')

  const id: string = nanoid()
  const newRec: IMarketplace = {
    id: id,
    userId: userId,
    dateCreated: new Date().toISOString(),
    title: param.title,
    dateStart: param.dateStart,
    dateEnd: param.dateEnd,
    isHidden: param.isHidden,
    audiences: param.audiences,
    adImage: param.adImage,
    commerceUrl: param.commerceUrl,
  }

  const result: any = await env.DB.prepare('INSERT INTO Marketplaces(id,userId,dateCreated,title,dateStart,dateEnd,isHidden,audiences,adImage,commerceUrl) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(
    newRec.id,
    newRec.userId,
    newRec.dateCreated,
    newRec.title,
    newRec.dateStart,
    newRec.dateEnd,
    newRec.isHidden,
    newRec.audiences,
    newRec.adImage,
    newRec.commerceUrl,
  ).run()
  if (!result.success) throw new Error(result)

  return newRec;
}

export const updateById = async (env: Env, id: string, param: any)
  : Promise<boolean> => {
  if (id == null) throw new Error('Missing id')
  if (param == null) throw new Error('Missing parameters')

  const stmt = env.DB.prepare('SELECT * FROM Marketplaces WHERE id=?').bind(id)
  const record: any = await stmt.first()
  if (record == null) throw new Error('Record not found')
  if (record.userId) delete record.userId

  let updValues: string[] = []
  const props = Object.getOwnPropertyNames(record)
  // let newRec: any = {}
  let values: any = []
  for (let i = 0; i < props.length; ++i) {
    let prop = props[i]
    if (param[prop] != undefined) {
      updValues.push(`${prop}=?`)
      values.push(param[prop])
    }
  }
  let sql = `UPDATE Marketplaces SET ${updValues.join(',')} WHERE id=?`
  values.push(id)
  const result: any = await env.DB.prepare(sql).bind(...values).run()
  // console.log(result)
  if (!result.success) throw new Error(result)

  return true
}

export const deleteById = async (env: Env, id: string)
  : Promise<boolean> => {
  if (id == null) throw new Error('Missing id')

  const result: any = await env.DB.prepare('DELETE FROM Marketplaces WHERE id=?').bind(id).run()
  if (!result.success) throw new Error(result)

  return true
}
