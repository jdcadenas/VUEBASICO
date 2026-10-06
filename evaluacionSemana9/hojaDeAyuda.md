## 📖 HOJA DE AYUDA: CONCEPTOS BÁSICOS

Ten este documento a la mano mientras realizas los ejercicios.

### 1. ¿Por qué MySQL y no seguir en memoria RAM?

| Característica | Memoria RAM (Semana 7-8) | MySQL (Semana 9) |
|----------------|--------------------------|------------------|
| Persistencia | Se pierde al reiniciar | Permanece entre sesiones |
| Concurrencia | Solo un usuario | Múltiples usuarios simultáneos |
| Volumen | Limitada por memoria del servidor | Maneja millones de registros |
| Integridad | Sin validaciones de estructura | Restricciones (FK, UNIQUE, CHECK) |
| Consultas complejas | Arreglos en JavaScript | SQL con JOIN, GROUP BY, SUM |

### 2. Tipos de datos MySQL más usados en este proyecto

| Tipo | Uso | Ejemplo |
|------|-----|---------|
| `INT AUTO_INCREMENT` | Llaves primarias | `id` |
| `VARCHAR(n)` | Textos cortos | `nombre VARCHAR(100)` |
| `DECIMAL(10,2)` | Montos de dinero | `monto DECIMAL(10,2)` → 99999999.99 |
| `ENUM('A','B')` | Valores fijos | `tipo ENUM('Ingreso','Egreso')` |
| `DATE` | Solo fecha | `fecha DATE` → '2026-10-01' |
| `TIMESTAMP` | Fecha y hora automática | `fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP` |

### 3. Foreign Keys y cardinalidad

**Foreign Key (FK):** Campo que referencia la PK de otra tabla. Garantiza integridad referencial.

```sql
FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE SET NULL
```

- `contacto_id` en `movimientos` apunta a `id` en `contactos`
- `ON DELETE SET NULL`: si se elimina un contacto, sus movimientos no se borran, solo queda `contacto_id = NULL`

**Cardinalidad 1:N:** Un contacto puede tener **muchos** movimientos, pero un movimiento pertenece a **un solo** contacto.

### 4. Códigos de estado HTTP en este proyecto

| Código | Nombre | Cuándo usarlo en el ERP |
|--------|--------|-------------------------|
| **200** | OK | GET y PUT exitosos |
| **201** | Created | POST exitoso (recurso creado) |
| **400** | Bad Request | Validación fallida (campos vacíos, monto negativo, RFC duplicado) |
| **404** | Not Found | ID no existe en la BD |
| **500** | Server Error | Error de conexión a MySQL, bug en el código |

### 5. Diferencia entre `db.query()` con arreglos en memoria

**Antes (memoria RAM):**
```javascript
let contactos = [];
app.get('/api/contactos', (req, res) => {
  res.json(contactos); // Devuelve el arreglo en memoria
});
```

**Ahora (MySQL):**
```javascript
app.get('/api/contactos', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM contactos');
  res.json(rows); // Devuelve resultado de la consulta SQL
});
```

### 6. Errores comunes y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `ER_ACCESS_DENIED_ERROR` | Credenciales incorrectas en `db.js` | Verifica usuario, password y permisos |
| `ER_DUP_ENTRY` | RFC duplicado | Usa un RFC único o elimina el registro duplicado |
| `ECONNREFUSED` | MySQL no está corriendo | Inicia el servicio MySQL |
| Los datos no persisten | El servidor aún usa arreglos | Verifica que uses `db.query()` en todos los endpoints |
| `Cannot POST /api/...` | Falta `express.json()` | Agrega `app.use(express.json())` antes de las rutas |

### 7. Comandos MySQL útiles

```sql
SHOW DATABASES;                    -- Ver bases de datos
USE erp_contable_jdc;              -- Seleccionar BD (reemplaza con tu BD)
SHOW TABLES;                       -- Ver tablas
DESCRIBE contactos;                -- Ver estructura de tabla
SELECT * FROM contactos;           -- Ver todos los registros
ALTER TABLE contactos ADD telefono VARCHAR(20);  -- Agregar columna (Reto Prueba de Fuego #2)
DELETE FROM contactos WHERE id=1;  -- Eliminar registro específico
DROP DATABASE erp_contable_jdc;    -- ⚠️ Eliminar BD completa (cuidado)
```

### 8. Tips para la Prueba de Fuego

- **Respira:** 3 minutos es tiempo suficiente si sabes qué buscar.
- **Lee el error:** La consola de Node.js te dice exactamente en qué línea falló.
- **Usa internet:** Si olvidas la sintaxis de `ALTER TABLE`, búscala. Lo importante es saber *qué* buscar.
- **Prueba en Postman:** Después de cada modificación, verifica en Postman que el endpoint funcione.
- **No entres en pánico con el Reto 3:** Cambiar la contraseña en `db.js` es solo editar un string. No hay que reiniciar MySQL ni hacer nada complejo.

---