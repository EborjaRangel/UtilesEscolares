import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

await client.query(`
  UPDATE paquetes SET precio = CASE grado
    WHEN 'Preescolar' THEN 5.00
    WHEN '1° - 3° Primaria' THEN 6.00
    WHEN '4° - 6° Primaria' THEN 7.00
    WHEN 'Secundaria' THEN 8.00
    ELSE precio
  END
`);

const result = await client.query(
  'SELECT id, nombre, grado, precio FROM paquetes ORDER BY precio'
);
console.table(result.rows);
await client.end();
