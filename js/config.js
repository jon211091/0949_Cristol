// CONFIGURACIÓN COMPLETA PARA ESTUDIOS SOCIODEMOGRÁFICOS

const CONFIG_MAPA = {
    proyecto: {
        titulo: "Estudio Sociodemográfico",
        descripcion: "Análisis de niveles socioeconómicos e infraestructura educativa"
    },

    mapa: {
        centro: [19.4326, -99.1332], // CDMX
        zoomInicial: 12,
        minZoom: 3,
        maxZoom: 18
    },

    // Colores para Niveles Socioeconómicos (con bordes transparentes)
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

    // Colores para Isócronas
    coloresIsocronas: {
        '5 min': '#27ae60',      // Verde
        '10 min': '#f1c40f',     // Amarillo
        '15 min': '#e67e22',     // Naranja
        '20 min': '#9b59b6'      // Morado
    },

    // Configuración de capas (ORDEN Z-INDEX)
    capas: {
        isocronas: {
            nombre: "Isócronas",
            archivo: "datos/isocronas.geojson",
            tipo: "poligono",
            visible: true,
            columnaISO: "ISO",
            zIndex: 100
        },

        manzanas: {
            nombre: "Manzanas - Niveles Socioeconómicos",
            archivo: "datos/manzanas_nse.geojson",
            tipo: "poligono",
            visible: true,
            columnaNSE: "NSE",
            zIndex: 200
        },

        escuelas: {
            nombre: "Escuelas Premium", 
            archivo: "datos/escuelas_premium.geojson",
            tipo: "punto",
            visible: true,
            columnaNivel: "NIV_EDUC",
            columnaAlumnos: "ALUM_TOT",
            columnaNombre: "NOMBRE",
            zIndex: 300
        },

        sitio: {
            nombre: "Sitio de Análisis",
            archivo: "datos/sitio_analisis.geojson", 
            tipo: "punto",
            visible: true,
            zIndex: 400
        }
    },

    // Columnas para análisis sociodemográfico
    columnasAnalisis: {
        'POBTOT': 'Población Total',
        'P_3A5': 'Población 3-5 años',
        'P_6A11': 'Población 6-11 años', 
        'P_12A14': 'Población 12-14 años',
        'P_15A17': 'Población 15-17 años',
        'TOTHOG': 'Total de Hogares',
        'VIVTOT': 'Viviendas Totales'
    }
};

console.log('✅ CONFIG_MAPA cargado correctamente');