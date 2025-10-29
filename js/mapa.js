// MAPA SOCIODEMOGRÁFICO - IMPLEMENTACIÓN COMPLETA

// Variables globales
var mapa;
var capas = {};
var graficaNSE, graficaEducacion;
var estadisticas = {};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏘️ Iniciando mapa sociodemográfico...');
    
    inicializarMapa();
    cargarTodasLasCapas();
    configurarInterfaz();
});

function inicializarMapa() {
    mapa = L.map('mapa').setView(CONFIG_MAPA.mapa.centro, CONFIG_MAPA.mapa.zoomInicial);
    
    // Capa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapa);
}

function cargarTodasLasCapas() {
    Object.entries(CONFIG_MAPA.capas).forEach(([id, config]) => {
        cargarCapa(id, config);
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
            return estiloIsocronas();
        default:
            return { color: '#3388ff', fillOpacity: 0.5 };
    }
}

function estiloManzanas(feature) {
    var nse = feature.properties[CONFIG_MAPA.capas.manzanas.columnaNSE];
    var color = CONFIG_MAPA.coloresNSE[nse] || CONFIG_MAPA.coloresNSE['SIN CLASIFICACION'];
    
    return {
        fillColor: color,
        color: '#2c3e50',
        weight: 1,
        opacity: 0.8,
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

function estiloIsocronas() {
    return {
        fillColor: 'transparent',
        color: '#e91e63',
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
        case "Radios/Isócronas":
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
    
    return `
        <div style="min-width: 250px;">
            <h6 style="color: ${color}; margin-bottom: 10px;">🏘️ Manzana - ${nse}</h6>
            <table style="width: 100%; font-size: 12px;">
                <tr><td><strong>Manzana:</strong></td><td>${props.MANZANA || 'N/A'}</td></tr>
                <tr><td><strong>AGEB:</strong></td><td>${props.AGEB || 'N/A'}</td></tr>
                <tr><td><strong>Población:</strong></td><td>${props.POBLACION || 'N/A'}</td></tr>
                <tr><td><strong>Viviendas:</strong></td><td>${props.VIVIENDAS || 'N/A'}</td></tr>
            </table>
        </div>
    `;
}

function crearPopupEscuela(props) {
    var nivel = props[CONFIG_MAPA.capas.escuelas.columnaNivel] || 'No especificado';
    var color = CONFIG_MAPA.coloresEducacion[nivel] || '#95a5a6';
    
    return `
        <div style="min-width: 280px;">
            <h6 style="color: ${color}; margin-bottom: 10px;">🏫 ${props[CONFIG_MAPA.capas.escuelas.columnaNombre] || 'Escuela'}</h6>
            <table style="width: 100%; font-size: 12px;">
                <tr><td><strong>Nivel:</strong></td><td>${nivel}</td></tr>
                <tr><td><strong>Turno:</strong></td><td>${props.TURNO || 'N/A'}</td></tr>
                <tr><td><strong>Alumnos:</strong></td><td>${props.ALUMNOS || 'N/A'}</td></tr>
                <tr><td><strong>Dirección:</strong></td><td>${props.DIRECCION || 'N/A'}</td></tr>
            </table>
        </div>
    `;
}

function crearPopupSitio(props) {
    return `
        <div style="min-width: 200px; text-align: center;">
            <h6 style="color: #e74c3c;">📍 SITIO DE ANÁLISIS</h6>
            <p><strong>${props.NOMBRE || 'Sitio de Estudio'}</strong></p>
            <p style="font-size: 11px; color: #666;">${props.DESCRIPCION || 'Punto principal de análisis'}</p>
        </div>
    `;
}

function crearPopupIsocrona(props) {
    return `
        <div style="min-width: 200px;">
            <h6 style="color: #e91e63;">⏱️ ${props.TIEMPO || 'Radio'}</h6>
            <p><strong>Distancia:</strong> ${props.DISTANCIA || 'N/A'}</p>
            <p><strong>Tiempo:</strong> ${props.TIEMPO || 'N/A'} minutos</p>
        </div>
    `;
}

function analizarManzana(feature) {
    var nse = feature.properties[CONFIG_MAPA.capas.manzanas.columnaNSE] || 'SIN CLASIFICACION';
    var poblacion = parseInt(feature.properties.POBLACION) || 0;
    
    if (!estadisticas.nse) estadisticas.nse = {};
    if (!estadisticas.nse[nse]) {
        estadisticas.nse[nse] = { cantidad: 0, poblacion: 0, color: CONFIG_MAPA.coloresNSE[nse] };
    }
    
    estadisticas.nse[nse].cantidad++;
    estadisticas.nse[nse].poblacion += poblacion;
}

function analizarEscuela(feature) {
    var nivel = feature.properties[CONFIG_MAPA.capas.escuelas.columnaNivel] || 'NO ESPECIFICADO';
    var alumnos = parseInt(feature.properties.ALUMNOS) || 0;
    
    if (!estadisticas.educacion) estadisticas.educacion = {};
    if (!estadisticas.educacion[nivel]) {
        estadisticas.educacion[nivel] = { cantidad: 0, alumnos: 0, color: CONFIG_MAPA.coloresEducacion[nivel] };
    }
    
    estadisticas.educacion[nivel].cantidad++;
    estadisticas.educacion[nivel].alumnos += alumnos;
}

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

function actualizarListaCapas() {
    var lista = document.getElementById('lista-capas');
    lista.innerHTML = '';
    
    Object.entries(CONFIG_MAPA.capas).forEach(([id, config]) => {
        var item = document.createElement('div');
        item.className = 'item-capa';
        item.innerHTML = `
            <input type="checkbox" id="capa-${id}" ${config.visible ? 'checked' : ''} 
                   onchange="alternarCapa('${id}')">
            <div class="color-muestra" style="background: ${obtenerColorMuestra(id)}"></div>
            <label for="capa-${id}" style="cursor: pointer; margin: 0;">${config.nombre}</label>
        `;
        lista.appendChild(item);
    });
}

function obtenerColorMuestra(id) {
    switch(id) {
        case 'manzanas': return '#e74c3c';
        case 'escuelas': return '#3498db';
        case 'sitio': return '#e74c3c';
        case 'isocronas': return '#e91e63';
        default: return '#95a5a6';
    }
}

function actualizarLeyenda() {
    var leyenda = document.getElementById('leyenda-contenido');
    var contenido = '';
    
    // Leyenda NSE
    contenido += '<div class="mb-3"><strong>Niveles Socioeconómicos</strong>';
    Object.entries(CONFIG_MAPA.coloresNSE).forEach(([nse, color]) => {
        contenido += `
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 12px; height: 12px; background: ${color}; margin-right: 8px; border: 1px solid #ddd;"></div>
                <span style="font-size: 11px;">${nse}</span>
            </div>
        `;
    });
    contenido += '</div>';
    
    // Leyenda Educación
    contenido += '<div><strong>Niveles Educativos</strong>';
    Object.entries(CONFIG_MAPA.coloresEducacion).forEach(([nivel, color]) => {
        contenido += `
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 12px; height: 12px; background: ${color}; margin-right: 8px; border: 1px solid #ddd; border-radius: 50%;"></div>
                <span style="font-size: 11px;">${nivel}</span>
            </div>
        `;
    });
    contenido += '</div>';
    
    leyenda.innerHTML = contenido;
}

function ajustarVistaMapa() {
    var capasVisibles = Object.values(capas).filter((capa, index) => {
        return CONFIG_MAPA.capas[Object.keys(capas)[index]].visible;
    });
    
    if (capasVisibles.length > 0) {
        var grupo = L.featureGroup(capasVisibles);
        mapa.fitBounds(grupo.getBounds(), { padding: [20, 20], maxZoom: 15 });
    }
}

// Funciones de control
function alternarCapa(id) {
    var checkbox = document.getElementById(`capa-${id}`);
    if (checkbox.checked) {
        mapa.addLayer(capas[id]);
        CONFIG_MAPA.capas[id].visible = true;
    } else {
        mapa.removeLayer(capas[id]);
        CONFIG_MAPA.capas[id].visible = false;
    }
}

function buscarEscuelas() {
    var query = document.getElementById('buscar-escuelas').value.toLowerCase();
    if (!query) return;
    
    var encontrada = false;
    
    if (capas.escuelas) {
        capas.escuelas.eachLayer(function(layer) {
            var nombre = layer.feature.properties[CONFIG_MAPA.capas.escuelas.columnaNombre];
            if (nombre && nombre.toLowerCase().includes(query)) {
                mapa.setView(layer.getLatLng(), 16);
                layer.openPopup();
                
                // Resaltar escuela encontrada
                layer.setStyle({
                    radius: 10,
                    weight: 3,
                    color: '#e74c3c',
                    fillColor: '#e74c3c'
                });
                
                setTimeout(() => {
                    var nivel = layer.feature.properties[CONFIG_MAPA.capas.escuelas.columnaNivel];
                    layer.setStyle({
                        radius: 6,
                        weight: 2,
                        color: '#2c3e50',
                        fillColor: CONFIG_MAPA.coloresEducacion[nivel] || '#95a5a6'
                    });
                }, 3000);
                
                encontrada = true;
                return;
            }
        });
    }
    
    if (!encontrada) {
        alert('No se encontraron escuelas con: "' + query + '"');
    }
}

function alternarPanel() {
    var panel = document.querySelector('.panel-lateral');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function exportarDatos() {
    // Implementar exportación de datos
    console.log('Exportando datos sociodemográficos...');
    alert('Función de exportación en desarrollo');
}

function mostrarResumen() {
    var contenido = `
        <div style="text-align: center; min-width: 300px;">
            <h6>📊 Resumen Estadístico</h6>
            <p><strong>Manzanas analizadas:</strong> ${estadisticas.nse ? Object.values(estadisticas.nse).reduce((sum, item) => sum + item.cantidad, 0) : 0}</p>
            <p><strong>Escuelas registradas:</strong> ${estadisticas.educacion ? Object.values(estadisticas.educacion).reduce((sum, item) => sum + item.cantidad, 0) : 0}</p>
        </div>
    `;
    
    L.popup()
        .setLatLng(mapa.getCenter())
        .setContent(contenido)
        .openOn(mapa);
}

function configurarInterfaz() {
    // Configuración adicional de la interfaz
    console.log('✅ Interfaz configurada');
}