// MAPA SOCIODEMOGRÁFICO - VERSIÓN MEJORADA

// Variables globales
var mapa;
var capas = {};
var graficas = {};
var estadisticas = {};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏘️ Iniciando mapa sociodemográfico mejorado...');
    
    inicializarMapa();
    // Cargar capas en orden inverso (la última será la de mayor z-index)
    cargarCapasEnOrden();
    configurarInterfaz();
});

function inicializarMapa() {
    mapa = L.map('mapa').setView(CONFIG_MAPA.mapa.centro, CONFIG_MAPA.mapa.zoomInicial);
    
    // Capa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapa);
}

function cargarCapasEnOrden() {
    // Orden de carga según z-index (de menor a mayor)
    const ordenCapas = ['isocronas', 'manzanas', 'escuelas', 'sitio'];
    
    ordenCapas.forEach(id => {
        cargarCapa(id, CONFIG_MAPA.capas[id]);
    });
}

function cargarCapa(id, config) {
    fetch(config.archivo)
        .then(response => response.json())
        .then(datos => {
            console.log(`✅ ${config.nombre} cargada:`, datos.features.length, 'elementos');
            
            var capa = L.geoJSON(datos, {
                style: function(feature) {
                    return obtenerEstilo(feature, id, config);
                },
                onEachFeature: function(feature, layer) {
                    configurarPopup(feature, layer, config);
                    
                    // Para análisis de estadísticas
                    if (id === 'manzanas') {
                        analizarManzana(feature);
                    } else if (id === 'escuelas') {
                        analizarEscuela(feature);
                    }
                },
                pointToLayer: function(feature, latlng) {
                    if (config.tipo === 'punto') {
                        return L.circleMarker(latlng, obtenerEstilo(feature, id, config));
                    }
                    return L.marker(latlng);
                }
            });
            
            // Aplicar z-index
            if (config.zIndex) {
                capa.setZIndex(config.zIndex);
            }
            
            if (config.visible) {
                capa.addTo(mapa);
            }
            
            capas[id] = capa;
            
            // Actualizar interfaz cuando todas las capas estén cargadas
            if (Object.keys(capas).length === Object.keys(CONFIG_MAPA.capas).length) {
                finalizarCarga();
            }
        })
        .catch(error => {
            console.error(`❌ Error cargando ${config.nombre}:`, error);
        });
}

function obtenerEstilo(feature, id, config) {
    switch(id) {
        case 'manzanas':
            return estiloManzanas(feature);
        case 'escuelas':
            return estiloEscuelas(feature);
        case 'sitio':
            return estiloSitio();
        case 'isocronas':
            return estiloIsocronas(feature);
        default:
            return { color: '#3388ff', fillOpacity: 0.5 };
    }
}

function estiloManzanas(feature) {
    var nse = feature.properties[CONFIG_MAPA.capas.manzanas.columnaNSE];
    var color = CONFIG_MAPA.coloresNSE[nse] || CONFIG_MAPA.coloresNSE['SIN CLASIFICACION'];
    
    return {
        fillColor: color,
        color: 'transparent', // LÍNEAS TRANSPARENTES
        weight: 0, // SIN BORDE
        opacity: 0,
        fillOpacity: 0.7
    };
}

function estiloEscuelas(feature) {
    var nivel = feature.properties[CONFIG_MAPA.capas.escuelas.columnaNivel];
    var color = CONFIG_MAPA.coloresEducacion[nivel] || '#95a5a6';
    
    return {
        fillColor: color,
        color: '#2c3e50',
        radius: 6,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.8
    };
}

function estiloSitio() {
    return {
        fillColor: '#e74c3c',
        color: '#c0392b',
        radius: 10,
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9
    };
}

function estiloIsocronas(feature) {
    var iso = feature.properties[CONFIG_MAPA.capas.isocronas.columnaISO];
    var color = CONFIG_MAPA.coloresIsocronas[iso] || '#95a5a6';
    
    return {
        fillColor: 'transparent',
        color: color,
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0,
        dashArray: '5, 5'
    };
}

function configurarPopup(feature, layer, config) {
    if (!feature.properties) return;
    
    var contenido = '';
    var props = feature.properties;
    
    switch(config.nombre) {
        case "Manzanas - Niveles Socioeconómicos":
            contenido = crearPopupManzana(props);
            break;
        case "Escuelas Premium":
            contenido = crearPopupEscuela(props);
            break;
        case "Sitio de Análisis":
            contenido = crearPopupSitio(props);
            break;
        case "Isócronas":
            contenido = crearPopupIsocrona(props);
            break;
        default:
            contenido = crearPopupGenerico(props);
    }
    
    layer.bindPopup(contenido);
}

function crearPopupManzana(props) {
    var nse = props[CONFIG_MAPA.capas.manzanas.columnaNSE] || 'No especificado';
    var color = CONFIG_MAPA.coloresNSE[nse] || '#95a5a6';
    
    var tablaDatos = '';
    Object.entries(CONFIG_MAPA.columnasAnalisis).forEach(([columna, nombre]) => {
        if (props[columna] !== undefined) {
            tablaDatos += `
                <tr>
                    <td><strong>${nombre}:</strong></td>
                    <td>${parseInt(props[columna]).toLocaleString()}</td>
                </tr>
            `;
        }
    });
    
    return `
        <div style="min-width: 280px; max-height: 400px; overflow-y: auto;">
            <h6 style="color: ${color}; margin-bottom: 10px; border-bottom: 2px solid ${color}; padding-bottom: 5px;">
                🏘️ Manzana - ${nse}
            </h6>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <tr><td colspan="2" style="padding: 5px 0; border-bottom: 1px solid #eee;"><strong>Identificadores</strong></td></tr>
                <tr><td><strong>Manzana:</strong></td><td>${props.MANZANA || 'N/A'}</td></tr>
                <tr><td><strong>AGEB:</strong></td><td>${props.AGEB || 'N/A'}</td></tr>
                <tr><td colspan="2" style="padding: 5px 0; border-bottom: 1px solid #eee;"><strong>Datos Sociodemográficos</strong></td></tr>
                ${tablaDatos}
            </table>
        </div>
    `;
}

function crearPopupEscuela(props) {
    var nivel = props[CONFIG_MAPA.capas.escuelas.columnaNivel] || 'No especificado';
    var color = CONFIG_MAPA.coloresEducacion[nivel] || '#95a5a6';
    var alumnos = parseInt(props[CONFIG_MAPA.capas.escuelas.columnaAlumnos]) || 0;
    
    var tablaDatos = '';
    for (var prop in props) {
        if (props[prop] !== null && props[prop] !== '') {
            var valor = props[prop];
            // Formatear números
            if (!isNaN(valor) && valor !== '') {
                valor = parseInt(valor).toLocaleString();
            }
            tablaDatos += `
                <tr>
                    <td style="padding: 3px 5px; border-bottom: 1px solid #f0f0f0;"><strong>${prop}:</strong></td>
                    <td style="padding: 3px 5px; border-bottom: 1px solid #f0f0f0;">${valor}</td>
                </tr>
            `;
        }
    }
    
    return `
        <div style="min-width: 300px; max-height: 400px; overflow-y: auto;">
            <h6 style="color: ${color}; margin-bottom: 10px; border-bottom: 2px solid ${color}; padding-bottom: 5px;">
                🏫 ${props[CONFIG_MAPA.capas.escuelas.columnaNombre] || 'Escuela'} - ${nivel}
            </h6>
            <p><strong>Alumnos:</strong> ${alumnos.toLocaleString()}</p>
            <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                ${tablaDatos}
            </table>
        </div>
    `;
}

function crearPopupSitio(props) {
    var tablaDatos = '';
    for (var prop in props) {
        if (props[prop] !== null && props[prop] !== '') {
            tablaDatos += `
                <tr>
                    <td><strong>${prop}:</strong></td>
                    <td>${props[prop]}</td>
                </tr>
            `;
        }
    }
    
    return `
        <div style="min-width: 250px;">
            <h6 style="color: #e74c3c; text-align: center; margin-bottom: 10px;">📍 SITIO DE ANÁLISIS</h6>
            <table style="width: 100%; font-size: 12px;">
                ${tablaDatos}
            </table>
        </div>
    `;
}

function crearPopupIsocrona(props) {
    var iso = props[CONFIG_MAPA.capas.isocronas.columnaISO] || 'No especificado';
    var color = CONFIG_MAPA.coloresIsocronas[iso] || '#95a5a6';
    
    var tablaDatos = '';
    for (var prop in props) {
        if (props[prop] !== null && props[prop] !== '') {
            tablaDatos += `
                <tr>
                    <td><strong>${prop}:</strong></td>
                    <td>${props[prop]}</td>
                </tr>
            `;
        }
    }
    
    return `
        <div style="min-width: 250px;">
            <h6 style="color: ${color}; margin-bottom: 10px;">⏱️ Isócrona - ${iso}</h6>
            <table style="width: 100%; font-size: 12px;">
                ${tablaDatos}
            </table>
        </div>
    `;
}

function analizarManzana(feature) {
    var nse = feature.properties[CONFIG_MAPA.capas.manzanas.columnaNSE] || 'SIN CLASIFICACION';
    
    if (!estadisticas.manzanas) estadisticas.manzanas = {};
    if (!estadisticas.manzanas[nse]) {
        estadisticas.manzanas[nse] = {
            cantidad: 0,
            color: CONFIG_MAPA.coloresNSE[nse],
            datos: {}
        };
        
        // Inicializar todas las columnas de análisis
        Object.keys(CONFIG_MAPA.columnasAnalisis).forEach(columna => {
            estadisticas.manzanas[nse].datos[columna] = 0;
        });
    }
    
    estadisticas.manzanas[nse].cantidad++;
    
    // Sumar todas las columnas de análisis
    Object.keys(CONFIG_MAPA.columnasAnalisis).forEach(columna => {
        var valor = parseInt(feature.properties[columna]) || 0;
        estadisticas.manzanas[nse].datos[columna] += valor;
    });
}

function analizarEscuela(feature) {
    var nivel = feature.properties[CONFIG_MAPA.capas.escuelas.columnaNivel] || 'NO ESPECIFICADO';
    var alumnos = parseInt(feature.properties[CONFIG_MAPA.capas.escuelas.columnaAlumnos]) || 0;
    
    if (!estadisticas.escuelas) estadisticas.escuelas = {};
    if (!estadisticas.escuelas[nivel]) {
        estadisticas.escuelas[nivel] = {
            cantidad: 0,
            alumnos: 0,
            color: CONFIG_MAPA.coloresEducacion[nivel]
        };
    }
    
    estadisticas.escuelas[nivel].cantidad++;
    estadisticas.escuelas[nivel].alumnos += alumnos;
}

// ... (el resto de las funciones se mantienen igual hasta finalizarCarga)

function finalizarCarga() {
    console.log('🎉 Todas las capas cargadas');
    
    // Actualizar interfaz
    actualizarListaCapas();
    actualizarLeyenda();
    
    // Crear gráficas
    crearGraficas();
    
    // Ajustar vista del mapa
    ajustarVistaMapa();
}

// ... (las funciones de control se mantienen igual)