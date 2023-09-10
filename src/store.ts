type Db = import('mongodb').Db

export const add_sticker_tag = (db: Db) =>
    async (user_id: number, tag: string, sticker_id: string) => {
        const db_tags = db.collection('tags')
        const db_tagged_stickers = db.collection('tagged_stickers')

        const tag_n_user = { user_id, tag }
        const tag_res = await db_tags.updateOne(
            tag_n_user,
            { $set: tag_n_user },
            { upsert: true },
        )
        const tag_id = tag_res.upsertedId
        const tagged_sticker = { tag_id, sticker_id }
        await db_tagged_stickers.updateOne(
            tagged_sticker,
            { $set: tagged_sticker },
            { upsert: true },
        )
    }

export const get_stickers = (db: Db) =>
    async (user_id: number, query: string) => {
        // const col = db.collection('users')
        const db_tags = db.collection('tags')

        const stickers_cur = db_tags.aggregate([
            { $match: { user_id, tag: new RegExp(query) } },
            {
                $lookup: {
                    localField: '_id',
                    from: 'tagged_stickers',
                    foreignField: 'tag_id',
                    as: 'stickers',
                }
            },
        ])

        const stickers_res =
            (await stickers_cur.map((res_tag) => res_tag.stickers).toArray())
        const stickers = stickers_res.flat()

        // TODO fix: filter repeated stickers

        return stickers as {sticker_id: string}[]
    }

// == Postgres ==

import { Database } from './types.ts' // this is the Database interface we defined earlier
import { Pool } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'

const dialect = new PostgresDialect({
  pool: new Pool({
    database: 'test',
    host: 'localhost',
    user: 'admin',
    port: 5434,
    max: 10,
  })
})

// Database interface is passed to Kysely's constructor, and from now on, Kysely 
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how 
// to communicate with your database.
export const db = new Kysely<Database>({
  dialect,
})
