-- =====================================================
-- Inicializacion de bases de datos para Innovatech Chile
-- Se ejecuta UNA SOLA VEZ al primer arranque del contenedor MySQL
-- (solo si /var/lib/mysql esta vacio).
-- =====================================================

-- ventas_db ya la crea MYSQL_DATABASE del compose; aqui creamos la segunda
CREATE DATABASE IF NOT EXISTS despachos_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Conceder permisos al usuario de la app sobre ambas BD
GRANT ALL PRIVILEGES ON ventas_db.*    TO 'innovatech'@'%';
GRANT ALL PRIVILEGES ON despachos_db.* TO 'innovatech'@'%';
FLUSH PRIVILEGES;
