# Casa Club Alebrijes Teotihuacán · Registro QR del Comedor

App web para registrar las comidas de los jugadores de la casa club mediante QR.

- **Jugadores:** inician sesión y ven su credencial con QR digital, foto de perfil y tarjeta imprimible (PDF, centrada en la hoja). Pueden subir/cambiar su foto desde su perfil. **No escanean.**
- **Cocineras:** eligen la comida (Desayuno, Comida o Cena — el horario lo decide su celular) y escanean el QR con la cámara. Bloquea duplicados.
- **Administrador:** el panel muestra **solo quién no pasó al comedor** y a qué comida faltó, por día, con filtro de fechas; además crea usuarios.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | HTML + CSS + JS puro (sin build) |
| Hospedaje | GitHub Pages |
| Base de datos + Auth | Supabase (plan gratis) |

---

## 1. Requisitos

- Cuenta en [GitHub](https://github.com) (para publicar la app).
- Proyecto en [Supabase](https://supabase.com) (ya configurado con las tablas y permisos).

## 2. Subir la app a GitHub Pages

1. En GitHub, crea un repositorio nuevo (público o privado).
2. Sube a ese repositorio **todo el contenido de esta carpeta**: `index.html`, `css/`, `js/`, `assets/` (no hace falta instalar nada, la app no requiere build).
   - En la web de GitHub: *Add file → Upload files* y arrastra los archivos.
3. En el repositorio: **Settings → Pages** → en *Build and deployment* elige:
   - Source: **Deploy from a branch**
   - Branch: `main` · folder: `/ (root)`
   - Guardar con *Save*.
4. Espera 1–2 minutos y entra a la URL que aparece (formato `https://TUUSUARIO.github.io/NOMBRE-REPO/`).

> La app necesita HTTPS (GitHub Pages lo da) para que la cámara del celular funcione al escanear.

## 3. Accesos actuales

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `juan@alebrijes.club` | `alebrijes2026` |
| Administrador (respaldo) | `admin@alebrijes.club` | `Admin2026!` |
| Cocinera | `cocinera@alebrijes.club` | `alebrijes2026` |
| Jugador (prueba) | `jugador@alebrijes.club` | `Prueba123!` |
| Jugador | `haziel@alebrijes.club` | `haziel09` |

> Cambia las contraseñas apenas entres por primera vez. `Alebrijes2026!` quedó invalidada por la protección de contraseñas filtradas de Supabase.

## 4. Uso diario

1. **El administrador** entra, va a *Panel → Jugadores* y crea a cada jugador (nombre, folio de 4 dígitos, usuario y contraseña).
2. **El jugador** entra con su usuario, ve su credencial con QR y foto, pulsa *Subir foto de perfil* para agregarla y *Imprimir / Guardar PDF* para llevarla impresa (la foto aparece también en el PDF).
3. **La cocinera** (o el administrador) abre la app, pulsa *Escanear*, elige la comida que está sirviendo (Desayuno, Comida o Cena) y apunta la cámara al QR de cada jugador.
   - El QR del jugador se registra al momento; si ya estaba registrado en esa comida, avisa «ya registrado» y no duplica.
   - Las faltas son automáticas: el jugador que **no se registró** en una comida del día queda como falta en el panel.
4. **El administrador** ve en *Panel → Faltas* quién no pasó al comedor y a qué comida faltó, por día, con filtro de fechas (Desde/Hasta, por defecto hoy).

## 5. Folios

- Cada jugador tiene un folio único de **4 dígitos** (solo números, ej. `0012`). El QR de la credencial codifica ese folio y es lo que escanea la cocinera.

## Notas de seguridad

- La clave pública de Supabase está en `js/config.js`; es de solo lectura para datos privados (los permisos reales los impone la base de datos).
- El jugador solo ve su propio perfil; las cocineras solo registran; solo el admin administra usuarios.