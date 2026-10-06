// ============================================
// CONFIGURACIÓN DE CONEXIÓN A MySQL
// ============================================
// Este archivo centraliza la conexión a la base de datos
// para que todos los endpoints puedan reutilizarla.
//mysql -u root -p
//-- Reemplaza "jdc" por tus iniciales reales
// CREATE DATABASE erp_contable_jdc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
// USE erp_contable_jdc;
// CREATE USER 'erp_user'@'localhost' IDENTIFIED BY 'erp2026';
// GRANT ALL PRIVILEGES ON erp_contable_jdc.* TO 'erp_user'@'localhost';
// FLUSH PRIVILEGES;
// EXIT;

// Importamos el paquete mysql2 (ya instalado con npm install mysql2)
const mysql = require('mysql2');

// Creamos un "pool" de conexiones.
// Un pool mantiene varias conexiones abiertas y las reutiliza,
// lo cual es más eficiente que abrir y cerrar una conexión en cada petición.
const pool = mysql.createPool({
  host: 'localhost',           // Servidor donde está MySQL (local en este caso)
  user: 'erp_user',            // Usuario creado en el Paso 1.4 
  password: '',         // Contraseña del usuario erp2026
  database: 'erp_contable_jdc', // ⚠️ REEMPLAZA con el nombre de TU base de datos (erp_contable_[tus iniciales])
  waitForConnections: true,    // Si no hay conexiones libres, espera en cola
  connectionLimit: 10,         // Máximo de conexiones simultáneas
  queueLimit: 0                // Sin límite de peticiones en cola
});

// Exportamos el pool como "promesas" para poder usar async/await
// en los endpoints en lugar de callbacks.
module.exports = pool.promise();