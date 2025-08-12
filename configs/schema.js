
import { boolean, integer, json, pgTable, serial, varchar } from "drizzle-orm/pg-core";

// Use lowercase table name to avoid quoted identifiers and match Postgres default
export const CourseList=pgTable('courselist',{
    id:serial('id').primaryKey(),
    // Use lowercase DB column identifiers to match existing Postgres schema
    courseId:varchar('courseid').notNull(),
    name:varchar('name').notNull(),
    category:varchar('category').notNull(),
    level:varchar('level').notNull(),
    includeVideo:varchar('includevideo').notNull().default('Yes'),
    courseOutput:json('courseoutput').notNull(),
    createdBy:varchar('createdby').notNull(),
    userName:varchar('username'),
    userProfileImage:varchar('userprofileimage'),
    courseBanner:varchar('coursebanner').default('/placeholder.png'),
    publish:boolean('publish').default(false)
})


export const Chapters=pgTable('chapters',{
    id:serial('id').primaryKey(),
    courseId:varchar('courseid').notNull(),
    chapterId:integer('chapterid').notNull(),
    content:json('content').notNull(),
    videoId:varchar('videoid').notNull()
})