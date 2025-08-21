# Discourse Moodle Users Plugin

Plugin para Discourse que permite importar y visualizar usuarios de Moodle, agrupándolos por país con funcionalidades de filtrado y búsqueda.

## 🚀 Características

- **Importación automática** de usuarios desde Moodle via Web Service
- **Agrupación por país** con contadores en tiempo real
- **Filtros avanzados** por país y búsqueda de texto
- **Interfaz responsive** similar al diseño de Discourse
- **API REST** para integración con otros sistemas
- **Configuración desde admin** sin modificar código

## 📋 Requisitos

- Discourse 3.0+
- Moodle con Web Service habilitado
- Token de autenticación para la API de Moodle

## ⚙️ Instalación

### 1. Clonar el plugin

```bash
cd /var/discourse/containers/app/plugins
git clone https://github.com/hectorsanchez/discourse-moodle-users.git
```

### 2. Rebuild de la aplicación

```bash
cd /var/discourse
sudo ./launcher rebuild app
```

### 3. Configurar desde el admin

1. Ir a **Admin → Plugins → discourse-moodle-users**
2. Configurar:
   - **dmu_enabled**: `true` (habilitar plugin)
   - **dmu_moodle_api_url**: URL del Web Service de Moodle
   - **dmu_moodle_api_token**: Token de autenticación

### 4. Agregar enlace al sidebar (opcional)

1. Ir a **Admin → Customize → Navigation Menu**
2. Agregar nuevo enlace:
   - **Name**: `Moodle Users`
   - **URL**: `/moodle/users`
   - **Icon**: `👥`
   - **Position**: Después de "Categories"

## 🔧 Configuración de Moodle

### Habilitar Web Service

1. En Moodle: **Administración del sitio → Plugins → Servicios web**
2. Habilitar **Servicios web**
3. Crear un **token** para el usuario administrador

### Configurar función

La función `core_user_get_users` debe estar habilitada en el servicio web.

## 📱 Uso

### Acceso directo
- **URL**: `https://tu-foro.com/moodle/users`
- **Enlace en header**: Botón azul "👥 Usuarios Moodle" (si está habilitado)

### Funcionalidades
- **Filtro por país**: Dropdown con todos los países disponibles
- **Búsqueda**: Campo de texto para buscar por nombre, apellido o email
- **Actualización**: Botón para refrescar datos desde Moodle
- **Estadísticas**: Contadores en tiempo real de usuarios y países

## 🎨 Personalización

### Colores y estilos
Los estilos están incluidos en el template y se pueden modificar editando el archivo:
```
assets/javascripts/discourse/templates/moodle-users-page.hbs
```

### Posición del enlace
El enlace en el header se puede personalizar modificando:
```
assets/javascripts/discourse/connectors/header-before/moodle-users-header-link.js
```

## 🔍 API Endpoints

### GET /moodle/users
Obtiene todos los usuarios de Moodle agrupados por país.

**Respuesta:**
```json
{
  "success": true,
  "users_by_country": {
    "FR": [
      {
        "firstname": "Francois",
        "lastname": "Soulard",
        "email": "francois@rio20.net"
      }
    ]
  },
  "total_users": 26,
  "timestamp": "2025-08-21T19:44:03Z"
}
```

### POST /moodle/save_settings
Guarda la configuración del plugin (solo administradores).

## 🐛 Solución de problemas

### Error "invalid percent escape"
- ✅ **Solucionado**: El plugin ahora usa `URI.encode_www_form` para construir URLs seguras

### Error "That page doesn't exist or is private"
- ✅ **Solucionado**: El controlador ahora permite acceso público sin autenticación

### No aparecen usuarios
1. Verificar que el plugin esté habilitado (`dmu_enabled = true`)
2. Verificar URL y token de Moodle
3. Revisar logs del servidor para errores de API

## 📝 Changelog

### v0.1.0
- ✅ Plugin básico funcionando
- ✅ API endpoint `/moodle/users`
- ✅ Interfaz web con filtros
- ✅ Agrupación por país
- ✅ Búsqueda de usuarios
- ✅ Diseño responsive

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

GPL v3 - Ver archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Héctor Sanchez** - [GitHub](https://github.com/hectorsanchez)

---

## 💡 Consejos de uso

- **Actualización automática**: Los datos se cargan al acceder a la página
- **Filtros combinados**: Puedes usar país + búsqueda simultáneamente
- **Responsive**: La interfaz se adapta a móviles y tablets
- **Sin cache**: Los datos siempre están actualizados desde Moodle
