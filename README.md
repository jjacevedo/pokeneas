# pokeneas

Pokedex de Pokeneas, los pokemones nacidos en Antioquia. Taller 02 de Arquitectura de Software (EAFIT), en parejas.

Integrantes: Juan José Acevedo Otálvaro y Juan Esteban Peña Rojas.

## Rutas

| Ruta | Respuesta |
|---|---|
| `GET /` | Portada con enlaces a las dos rutas |
| `GET /api/pokenea` | JSON con `id`, `nombre`, `altura`, `habilidad` de un Pokenea al azar y `contenedor` (hostname del contenedor) |
| `GET /pokenea` | Vista con la imagen y la frase filosófica de un Pokenea al azar y el id del contenedor |

## Estructura

```text
src/
  server.js                         arranca el servidor
  app.js                            configura Express y registra las rutas
  config/index.js                   puerto y URL base de las imágenes
  routes/pokeneas.routes.js         define las rutas
  controllers/pokeneas.controller.js arma cada respuesta
  services/pokeneas.service.js      elige un Pokenea al azar y obtiene el id del contenedor
  data/pokeneas.js                  los 8 Pokeneas
  views/                            plantillas EJS
public/css/styles.css               estilos
assets/pokeneas/                    imágenes originales que se suben a S3
```

## Ejecutar localmente

```bash
npm install
npm start
```

La app escucha en el puerto `80` (configurable con `PORT`). Sin más configuración las imágenes se sirven desde `assets/pokeneas`.

## Imágenes en S3

En el despliegue las imágenes salen de un bucket de S3. La app arma la URL de cada imagen con la variable `IMAGES_BASE_URL`:

```bash
IMAGES_BASE_URL=https://<bucket>.s3.amazonaws.com/pokeneas npm start
```

Así el mismo código sirve en local y en la nube sin cambiar los datos.
