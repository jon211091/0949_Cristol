// CONFIGURACIÓN ESPECÍFICA PARA ESTUDIOS SOCIODEMOGRÁFICOS

const CONFIG_MAPA = {
    proyecto: {
        titulo: "Estudio Sociodemográfico",
        descripcion: "Análisis de niveles socioeconómicos e infraestructura educativa"
    },

    mapa: {
        centro: [19.4326, -99.1332], // CDMX
        zoomInicial: 12
    },

    // Colores para Niveles Socioeconómicos
    coloresNSE: {
        'A/B': '#e74c3c',        // Rojo
        'C+': '#e67e22',         // Naranja
        'C': '#f1c40f',          // Amarillo
        'C-': '#d35400',         // Café claro
        'D+': '#27ae60',         // Verde oscuro
        'D': '#9b59b6',          // Morado
        'E': '#8b4513',          // Café oscuro
        'SIN POBLACIÓN': '#95a5a6', // Gris
        'SIN CLASIFICACION': '#bdc3c7' // Gris claro
    },

    // Colores para Niveles Educativos
    coloresEducacion: {
        'PREESCOLAR': '#3498db',     // Azul
        'PRIMARIA': '#f39c12',       // Oro/Naranja
        'SECUNDARIA': '#2ecc71',     // Verde
        'BACHILLERATO': '#e91e63'    // Rosa
    },

    // Configuración de capas
    capas: {
        manzanas: {
            nombre: "Manzanas - Niveles Socioeconómicos",
            archivo: "datos/manzanas_nse.geojson",
            tipo: "poligono",
            visible: true,
            columnaNSE: "NSE"
        },

        escuelas: {
            nombre: "Escuelas Premium", 
            archivo: "datos/escuelas_premium.geojson",
            tipo: "punto",
            visible: true,
            columnaNivel: "NIV_EDUC",
            columnaNombre: "NOMBRE"
        },

        sitio: {
            nombre: "Sitio de Análisis",
            archivo: "datos/sitio_analisis.geojson", 
            tipo: "punto",
            visible: true
        },

        isocronas: {
            nombre: "Radios/Isócronas",
            archivo: "datos/isocronas.geojson",
            tipo: "poligono", 
            visible: true
        }
    }
};