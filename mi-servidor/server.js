// ============================================
// SERVIDOR EXPRESS CON MySQL - ERP CONTABLE
// ============================================
// Este archivo define todos los endpoints (rutas) de la API REST
// y los conecta a la base de datos MySQL en lugar de usar arreglos en memoria.

// Importamos las dependencias necesarias
const express = require('express');    // Framework web para Node.js
const cors = require('cors');          // Middleware para permitir peticiones desde otros orígenes (Vue en puerto 5173)
const db = require('./config/db');     // Importamos el pool de conexiones a MySQL que configuramos en db.js

const app = express();    // Creamos la aplicación Express
const PORT = 3000;        // Puerto en el que escuchará el servidor

// ============================================
// MIDDLEWARES
// ============================================
// Los middlewares son funciones que se ejecutan ANTES de llegar a las rutas.
// Se ejecutan en el orden en que se declaran.

app.use(cors());           // Permite que Vue (puerto 5173) haga peticiones a este servidor (puerto 3000)
app.use(express.json());   // Permite que el servidor entienda cuerpos de peticiones en formato JSON

// ============================================
// ENDPOINTS PARA CONTACTOS
// ============================================

// 1. Obtener todos los contactos (GET)
// Ruta: http://localhost:3000/api/contactos
app.get('/api/contactos', async (req, res) => {
  try {
    // db.query() ejecuta una consulta SQL y devuelve una promesa.
    // "rows" contiene el arreglo de resultados.
    const [rows] = await db.query('SELECT * FROM contactos ORDER BY id');
    
    // Respondemos con status 200 (OK) y el arreglo de contactos en formato JSON
    res.status(200).json({ exito: true, datos: rows });
  } catch (error) {
    // Si algo falla (ej: MySQL caído), capturamos el error y respondemos 500
    console.error('Error al obtener contactos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// 2. Obtener un contacto por ID (GET)
// Ruta: http://localhost:3000/api/contactos/1
app.get('/api/contactos/:id', async (req, res) => {
  try {
    // req.params.id contiene el ID que viene en la URL.
    // Usamos "?" como placeholder para evitar Inyección SQL.
    const [rows] = await db.query('SELECT * FROM contactos WHERE id = ?', [req.params.id]);
    
    // Si no se encontró ningún registro, devolvemos 404 (Not Found)
    if (rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Contacto no encontrado' });
    }
    
    // Si existe, devolvemos el primer (y único) resultado
    res.status(200).json({ exito: true, datos: rows[0] });
  } catch (error) {
    console.error('Error al obtener contacto:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// 3. Crear un nuevo contacto (POST)
// Ruta: http://localhost:3000/api/contactos
app.post('/api/contactos', async (req, res) => {
  try {
    // Extraemos los campos del cuerpo JSON de la petición
    const { nombre, rfc, tipo, email, telefono } = req.body;
    
    // Validación de campos obligatorios (regla de negocio)
    if (!nombre || !rfc || !tipo) {
      return res.status(400).json({ exito: false, mensaje: 'Campos obligatorios: nombre, rfc, tipo' });
    }
    
    // INSERT: agregamos un nuevo registro a la tabla contactos.
    // Los "?" se reemplazan en orden con los valores del array.
    const [result] = await db.query(
      'INSERT INTO contactos (nombre, rfc, tipo, email, telefono) VALUES (?, ?, ?, ?, ?)',
      [nombre, rfc, tipo, email || null, telefono || null]
    );
    
    // result.insertId contiene el ID auto-generado del nuevo registro
    res.status(201).json({
      exito: true,
      mensaje: 'Contacto creado exitosamente',
      datos: { id: result.insertId, nombre, rfc, tipo }
    });
  } catch (error) {
    console.error('Error al crear contacto:', error);
    
    // Si el RFC ya existe, MySQL lanza el error 'ER_DUP_ENTRY'
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ exito: false, mensaje: 'El RFC ya está registrado' });
    }
    
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// 4. Actualizar un contacto (PUT)
// Ruta: http://localhost:3000/api/contactos/1
app.put('/api/contactos/:id', async (req, res) => {
  try {
    const { nombre, rfc, tipo, email, telefono } = req.body;
    
    // UPDATE: modificamos el registro cuyo id coincide con req.params.id
    const [result] = await db.query(
      'UPDATE contactos SET nombre=?, rfc=?, tipo=?, email=?, telefono=? WHERE id=?',
      [nombre, rfc, tipo, email, telefono, req.params.id]
    );
    
    // affectedRows indica cuántos registros fueron modificados.
    // Si es 0, significa que el ID no existía.
    if (result.affectedRows === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Contacto no encontrado' });
    }
    
    res.status(200).json({ exito: true, mensaje: 'Contacto actualizado', datos: { id: parseInt(req.params.id), nombre, rfc, tipo } });
  } catch (error) {
    console.error('Error al actualizar contacto:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// 5. Eliminar un contacto (DELETE)
// Ruta: http://localhost:3000/api/contactos/1
app.delete('/api/contactos/:id', async (req, res) => {
  try {
    // DELETE: borra el registro con el ID especificado
    const [result] = await db.query('DELETE FROM contactos WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Contacto no encontrado' });
    }
    
    res.status(200).json({ exito: true, mensaje: 'Contacto eliminado' });
  } catch (error) {
    console.error('Error al eliminar contacto:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS PARA MOVIMIENTOS (CAJA/BANCO)
// ============================================

// 1. Obtener todos los movimientos (GET)
// Ruta: http://localhost:3000/api/movimientos
app.get('/api/movimientos', async (req, res) => {
  try {
    // JOIN: combinamos movimientos con contactos para mostrar el nombre del contacto
    // LEFT JOIN: incluye movimientos aunque no tengan contacto asociado (contacto_id = NULL)
    const [rows] = await db.query(`
      SELECT m.*, c.nombre AS contacto_nombre 
      FROM movimientos m 
      LEFT JOIN contactos c ON m.contacto_id = c.id
      ORDER BY m.fecha DESC
    `);
    res.status(200).json({ exito: true, datos: rows });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// 2. Crear un nuevo movimiento (POST)
// Ruta: http://localhost:3000/api/movimientos
app.post('/api/movimientos', async (req, res) => {
  try {
    const { concepto, tipo, monto, fecha, contacto_id } = req.body;
    
    // Validaciones de negocio (reglas contables básicas)
    if (!concepto || !tipo || !monto || !fecha) {
      return res.status(400).json({ exito: false, mensaje: 'Campos obligatorios: concepto, tipo, monto, fecha' });
    }
    
    // El tipo solo puede ser 'Ingreso' o 'Egreso'
    if (!['Ingreso', 'Egreso'].includes(tipo)) {
      return res.status(400).json({ exito: false, mensaje: 'El tipo debe ser "Ingreso" o "Egreso"' });
    }
    
    // Convertimos el monto a número y verificamos que sea positivo
    const montoNumerico = parseFloat(monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({ exito: false, mensaje: 'El monto debe ser un número positivo' });
    }
    
    // INSERT del movimiento en la base de datos
    const [result] = await db.query(
      'INSERT INTO movimientos (concepto, tipo, monto, fecha, contacto_id) VALUES (?, ?, ?, ?, ?)',
      [concepto, tipo, montoNumerico, fecha, contacto_id || null]
    );
    
    res.status(201).json({
      exito: true,
      mensaje: 'Movimiento registrado',
      datos: { id: result.insertId, concepto, tipo, monto: montoNumerico, fecha }
    });
  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// 3. Generar reporte (resumen contable de tesorería) (GET)
// Ruta: http://localhost:3000/api/resumen
// Este endpoint calcula totales directamente en SQL usando SUM y CASE
app.get('/api/resumen', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE 0 END) AS totalIngresos,
        SUM(CASE WHEN tipo = 'Egreso' THEN monto ELSE 0 END) AS totalEgresos,
        COUNT(*) AS totalMovimientos
      FROM movimientos
    `);
    
    const resumen = rows[0];
    
    // Calculamos el saldo restando egresos de ingresos
    // Usamos "|| 0" para manejar el caso de que no haya movimientos (NULL)
    const saldo = (parseFloat(resumen.totalIngresos) || 0) - (parseFloat(resumen.totalEgresos) || 0);
    
    res.status(200).json({
      exito: true,
      datos: {
        totalIngresos: parseFloat(resumen.totalIngresos) || 0,
        totalEgresos: parseFloat(resumen.totalEgresos) || 0,
        saldo: saldo,
        totalMovimientos: parseInt(resumen.totalMovimientos)
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
// app.listen() pone al servidor a escuchar peticiones en el puerto especificado.
// El callback se ejecuta una vez que el servidor está listo.
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  SERVIDOR ERP CON MySQL ACTIVO        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(` Puerto: http://localhost:${PORT}`);
  console.log(` Base de datos: erp_contable_jdc`);  // ⚠️ REEMPLAZA con tu BD
});