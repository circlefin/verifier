/**
 * Copyright 2024 Circle Internet Group, Inc.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const { Client } = require("pg")

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.MIGRATE_DB_USER,
  password: process.env.MIGRATE_DB_PASSWORD
}

const verifierDB = process.env.DB_DATABASE
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASSWORD
const dbSchema = process.env.DB_SCHEMA

setupVerifierDatabase(dbConfig, verifierDB, dbUser, dbPassword, dbSchema).catch(
  (err) => {
    console.log(err)
    process.exit(1)
  }
)

/***
 * Creates verifier database, schema, and user
 *
 * @param config The database connection info
 * @param database Name of database to create
 * @param user The verifier user
 * @param password The password for the verifier user
 * @param schema The schema for the verifier database
 */
async function setupVerifierDatabase(config, database, user, password, schema) {
  if (!database || !user || !password || !schema) {
    console.log("Database, username, password, and schema are required!")
    process.exit(1)
  }

  const createConfig = Object.assign({ database: "postgres" }, config)
  const createClient = new Client(createConfig)
  await createClient.connect()

  let result = await createClient.query(
    `SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower($1);`,
    [database]
  )

  if (result?.rowCount !== 0) {
    console.log(`Database already exists. Database=${database}`)
  } else {
    try {
      await createClient.query(`CREATE DATABASE ${database}`)
      console.log(`Database created successfully. Database=${database}`)
    } catch (err) {
      console.log("Failed to create database!")
      throw err
    }
  }
  createClient.end()

  // Now create the schema and roles.
  const rolesDbConfig = Object.assign({ database: database }, config)
  const rolesClient = new Client(rolesDbConfig)
  await rolesClient.connect()

  // Create verifier user
  await createUser(rolesClient, user, password)

  // Create PI RO user
  const piRoUser = "pi_ro_dbuser"
  await createUser(rolesClient, piRoUser, process.env.PI_RO_PASSWORD)

  const protractorUser = "protractor_dbuser"
  await createUser(rolesClient, protractorUser, process.env.PI_RO_PASSWORD)

  try {
    await rolesClient.query(`CREATE SCHEMA IF NOT EXISTS ${schema};`)
    console.log(`Schema created successfully. Schema=${schema}`)
  } catch (err) {
    console.log(`Failed to create schema. Schema=${schema}`)
    throw err
  }

  // Permission for verifier user
  await rolesClient.query(`GRANT CONNECT ON DATABASE ${database} TO ${user};`)
  await rolesClient.query(`GRANT USAGE ON SCHEMA ${schema} TO ${user};`)
  await rolesClient.query(`ALTER USER ${user} SET search_path TO '${schema}';`)

  // Permission for pi RO user
  await rolesClient.query(`GRANT USAGE ON SCHEMA ${schema} TO ${piRoUser};`)

  rolesClient.end()
}

async function createUser(rolesClient, user, password, opt = {}) {
  const result = await rolesClient.query(
    "SELECT * FROM pg_catalog.pg_user WHERE usename = $1;",
    [user]
  )
  if (result?.rowCount !== 0) {
    console.log(`User already exists. User=${user}`)
  } else {
    try {
      await rolesClient.query(
        `CREATE ROLE ${user} LOGIN PASSWORD '${password}';`
      )
      console.log(`Role created successfully. Role=${user}`)
    } catch (err) {
      console.log(`Failed to create role. Role=${user}`)
      throw err
    }
  }
}
