// MAPA SOCIODEMOGRÁFICO - COMPLETO CON CARGA PROGRESIVA
console.log('🗺️ Iniciando mapa sociodemográfico...');

// Variables globales
var mapa;
var capas = {};
var estadisticas = {};
var totalPuntos = 0;
var puntosCargados = 0;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado');
    actualizarEstado('🔄 Inicializando mapa...');
    inicializarMapa();
});

function actualizarEstado(mensaje) {
    var elemento = document.getElementById('estado-panel');
    if (elemento) {
        elemento.innerHTML = mensaje;
    }
    console.log('📢 ' + mensaje);
}

function actualizarProgresoGeneral() {
    var porcentaje = totalPuntos > 0 ? Math.round((puntosCargados / totalPuntos) * 100) : 0;
    actualizarEstado(`🔄 Cargando datos: ${puntosCargados.toLocaleString()}/${totalPuntos.toLocaleString()} (${porcentaje}%)`);
}

function inicializarMapa() {
    try {
        mapa = L.map('mapa').setView(CONFIG_MAPA.mapa.centro, CONFIG_MAPA.mapa.zoomInicial);
        
        // Capa base
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            minZoom: CONFIG_MAPA.mapa.minZoom,
            maxZoom: CONFIG_MAPA.mapa.maxZoom
        }).addTo(mapa);
        
        console.log('✅ Mapa base inicializado');
        actualizarEstado('✅ Mapa listo - Cargando capas...');
        
        // Calcular total de puntos primero
        calcularTotalPuntos();
        
    } catch (error) {
        console.error('❌ Error inicializando mapa:', error);
        actualizarEstado('❌ Error al cargar el mapa: ' + error.message);
    }
}

function calcularTotalPuntos() {
    totalPuntos = 0;
    puntosCargados = 0;
    
    // Contar puntos en cada capa (estimación)
    Object.values(CONFIG_MAPA.capas).forEach(config => {
        if (config.visible) {
            // Estimación basada en el tipo de capa
            if (config.tipo === 'poligono') {
                totalPuntos += 5000; // Menos puntos para polígonos
            } else {
                totalPuntos += 1000; // Menos puntos para otras capas
            }
        }
    });
    
    console.log(`📊 Total estimado de puntos: ${totalPuntos}`);
    cargarCapasEnOrden();
}

function cargarCapasEnOrden() {
    const ordenCapas = ['isocronas', 'manzanas', 'escuelas', 'sitio'];
    let capasCargadas = 0;
    
    ordenCapas.forEach((id, index) => {
        setTimeout(() => {
            actualizarEstado(`🔄 Cargando ${CONFIG_MAPA.capas[id].nombre}...`);
            cargarCapa(id, CONFIG_MAPA.capas[id])
                .then(() => {
                    capasCargadas++;
                    actualizarEstado(`✅ ${CONFIG_MAPA.capas[id].nombre} cargada (${capasCargadas}/${ordenCapas.length})`);
                    
                    if (capasCargadas === ordenCapas.length) {
                        finalizarCarga();
                    }
                })
                .catch(error => {
                    console.error(`❌ Error cargando capa ${id}:`, error);
                    capasCargadas++;
                    actualizarEstado(`⚠️ Error en ${CONFIG_MAPA.capas[id].nombre}, continuando...`);
                    
                    if (capasCargadas === ordenCapas.length) {
                        finalizarCarga();
                    }
                });
        }, index * 1000); // Espaciar la carga de capas
    });
}

function cargarCapa(id, config) {
    return new Promise((resolve, reject) => {
        if (!config.visible) {
            console.log(`⏭️ Saltando capa ${id} (no visible)`);
            resolve();
            return;
        }
        
        console.log(`📥 Cargando capa: ${config.nombre}`);
        
        fetch(config.archivo)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error HTTP ${response.status} - ${config.archivo}`);
                }
                return response.json();
            })
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
                        
                        // Actualizar progreso
                        puntosCargados++;
                        if (puntosCargados % 500 === 0) {
                            actualizarProgresoGeneral();
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
                
                capa.addTo(mapa);
                capas[id] = capa;
                
                resolve();
            })
            .catch(error => {
                console.error(`❌ Error cargando ${config.nombre}:`, error);
                reject(error);
            });
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
        color: 'transparent',
        weight: 0,
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
        if (props[columna] !== undefined && props[columna] !== null && props[columna] !== '') {
            var valor = parseInt(props[columna]) || 0;
            tablaDatos += `
                <tr>
                    <td>${nombre}:</td>
                    <td>${valor.toLocaleString()}</td>
                </tr>
            `;
        }
    });
    
    // Añadir información básica
    var infoBasica = '';
    if (props.MANZANA) infoBasica += `<tr><td>Manzana:</td><td>${props.MANZANA}</td></tr>`;
    if (props.AGEB) infoBasica += `<tr><td>AGEB:</td><td>${props.AGEB}</td></tr>`;
    if (props.NSE) infoBasica += `<tr><td>NSE:</td><td>${props.NSE}</td></tr>`;
    
    return `
        <div class="popup-contenido">
            <h6 style="color: ${color}; margin-bottom: 10px; border-bottom: 2px solid ${color}; padding-bottom: 5px;">
                🏘️ Manzana - ${nse}
            </h6>
            <table class="popup-tabla">
                ${infoBasica}
                ${tablaDatos}
            </table>
        </div>
    `;
}

function crearPopupEscuela(props) {
    var nivel = props[CONFIG_MAPA.capas.escuelas.columnaNivel] || 'No especificado';
    var color = CONFIG_MAPA.coloresEducacion[nivel] || '#95a5a6';
    var alumnos = parseInt(props[CONFIG_MAPA.capas.escuelas.columnaAlumnos]) || 0;
    var nombreEscuela = props[CONFIG_MAPA.capas.escuelas.columnaNombre] || 'Escuela';
    
    var tablaDatos = '';
    for (var prop in props) {
        if (props[prop] !== null && props[prop] !== '' && prop !== 'geometry') {
            var valor = props[prop];
            // Formatear números
            if (!isNaN(valor) && valor !== '' && !isNaN(parseFloat(valor))) {
                valor = parseInt(valor).toLocaleString();
            }
            tablaDatos += `
                <tr>
                    <td>${prop}:</td>
                    <td>${valor}</td>
                </tr>
            `;
        }
    }
    
    return `
        <div class="popup-contenido">
            <h6 style="color: ${color}; margin-bottom: 10px; border-bottom: 2px solid ${color}; padding-bottom: 5px;">
                🏫 ${nombreEscuela} - ${nivel}
            </h6>
            <p><strong>Total de alumnos:</strong> ${alumnos.toLocaleString()}</p>
            <table class="popup-tabla">
                ${tablaDatos}
            </table>
        </div>
    `;
}

function crearPopupSitio(props) {
    var tablaDatos = '';
    for (var prop in props) {
        if (props[prop] !== null && props[prop] !== '' && prop !== 'geometry') {
            tablaDatos += `
                <tr>
                    <td>${prop}:</td>
                    <td>${props[prop]}</td>
                </tr>
            `;
        }
    }
    
    return `
        <div class="popup-contenido">
            <h6 style="color: #e74c3c; text-align: center; margin-bottom: 10px;">
                📍 SITIO DE ANÁLISIS
            </h6>
            <table class="popup-tabla">
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
        if (props[prop] !== null && props[prop] !== '' && prop !== 'geometry') {
            tablaDatos += `
                <tr>
                    <td>${prop}:</td>
                    <td>${props[prop]}</td>
                </tr>
            `;
        }
    }
    
    return `
        <div class="popup-contenido">
            <h6 style="color: ${color}; margin-bottom: 10px;">
                ⏱️ Isócrona - ${iso}
            </h6>
            <table class="popup-tabla">
                ${tablaDatos}
            </table>
        </div>
    `;
}

function crearPopupGenerico(props) {
    var tablaDatos = '';
    for (var prop in props) {
        if (props[prop] !== null && props[prop] !== '' && prop !== 'geometry') {
            tablaDatos += `
                <tr>
                    <td>${prop}:</td>
                    <td>${props[prop]}</td>
                </tr>
            `;
        }
    }
    
    return `
        <div class="popup-contenido">
            <h6 style="margin-bottom: 10px;">📋 Información</h6>
            <table class="popup-tabla">
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

function finalizarCarga() {
    console.log('🎉 ¡Todas las capas cargadas!');
    actualizarEstado('✅ Mapa completamente cargado');
    
    // Ocultar el panel de estado después de 3 segundos
    setTimeout(() => {
        var estadoPanel = document.getElementById('estado-panel');
        if (estadoPanel) {
            estadoPanel.style.display = 'none';
        }
    }, 3000);
    
    // Actualizar interfaz
    actualizarListaCapas();
    actualizarLeyenda();

    // Inicializar gráficas SI existen los elementos
    setTimeout(() => {
        if (window.crearGraficas && document.getElementById('grafica-educacion')) {
            crearGraficas();
        }
        
        // Inicializar funcionalidades móviles
        if (window.inicializarModoMovil) {
            inicializarModoMovil();
        }
    }, 1000);
    
    // Ajustar vista del mapa
    ajustarVistaMapa();
}

function actualizarListaCapas() {
    var lista = document.getElementById('lista-capas');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    Object.entries(CONFIG_MAPA.capas).forEach(([id, config]) => {
        var item = document.createElement('div');
        item.className = 'item-capa capa-cargada';
        item.innerHTML = `
            <input type="checkbox" id="capa-${id}" ${config.visible ? 'checked' : ''} 
                   onchange="alternarCapa('${id}')">
            <div class="color-muestra" style="background: ${obtenerColorMuestra(id)}"></div>
            <label for="capa-${id}" style="cursor: pointer; margin: 0; font-size: 14px;">${config.nombre}</label>
        `;
        lista.appendChild(item);
    });
}

function obtenerColorMuestra(id) {
    switch(id) {
        case 'manzanas': return '#e74c3c';
        case 'escuelas': return '#3498db';
        case 'sitio': return '#e74c3c';
        case 'isocronas': return '#9b59b6';
        default: return '#95a5a6';
    }
}

function actualizarLeyenda() {
    var leyenda = document.getElementById('leyenda-contenido');
    if (!leyenda) return;
    
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
    contenido += '<div class="mb-3"><strong>Niveles Educativos</strong>';
    Object.entries(CONFIG_MAPA.coloresEducacion).forEach(([nivel, color]) => {
        contenido += `
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 12px; height: 12px; background: ${color}; margin-right: 8px; border: 1px solid #ddd; border-radius: 50%;"></div>
                <span style="font-size: 11px;">${nivel}</span>
            </div>
        `;
    });
    contenido += '</div>';
    
    // Leyenda Isócronas
    contenido += '<div><strong>Isócronas</strong>';
    Object.entries(CONFIG_MAPA.coloresIsocronas).forEach(([tiempo, color]) => {
        contenido += `
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 12px; height: 3px; background: ${color}; margin-right: 8px; border: 1px solid ${color};"></div>
                <span style="font-size: 11px;">${tiempo}</span>
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
        var bounds = grupo.getBounds();
        if (bounds.isValid()) {
            mapa.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
        }
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
    var query = document.getElementById('buscar-escuelas').value.toLowerCase().trim();
    if (!query) {
        alert('Por favor, ingresa un nombre de escuela para buscar');
        return;
    }
    
    var encontrada = false;
    
    if (capas.escuelas) {
        capas.escuelas.eachLayer(function(layer) {
            if (encontrada) return; // Detener después de encontrar la primera
            
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
                actualizarEstado(`✅ Escuela encontrada: ${nombre}`);
            }
        });
    }
    
    if (!encontrada) {
        alert('No se encontraron escuelas con: "' + query + '"');
    }
}

function alternarPanel() {
    var panel = document.querySelector('.panel-lateral');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

function exportarDatos() {
    actualizarEstado('💾 Preparando exportación de datos...');
    setTimeout(() => {
        alert('La función de exportación estará disponible en la próxima versión');
        actualizarEstado('✅ Mapa listo');
    }, 1000);
}

function mostrarResumen() {
    var totalManzanas = estadisticas.manzanas ? Object.values(estadisticas.manzanas).reduce((sum, item) => sum + item.cantidad, 0) : 0;
    var totalEscuelas = estadisticas.escuelas ? Object.values(estadisticas.escuelas).reduce((sum, item) => sum + item.cantidad, 0) : 0;
    
    var contenido = `
        <div style="text-align: center; min-width: 300px;">
            <h6>📊 Resumen del Estudio</h6>
            <p><strong>Manzanas analizadas:</strong> ${totalManzanas.toLocaleString()}</p>
            <p><strong>Escuelas registradas:</strong> ${totalEscuelas.toLocaleString()}</p>
            <p><strong>Puntos cargados:</strong> ${puntosCargados.toLocaleString()}</p>
            <hr>
            <small>Estudio Sociodemográfico - INEGI 2020</small>
        </div>
    `;
    
    L.popup()
        .setLatLng(mapa.getCenter())
        .setContent(contenido)
        .openOn(mapa);
}

// INICIALIZAR TODAS LAS FUNCIONALIDADES AVANZADAS
function inicializarFuncionalidadesAvanzadas() {
    // Cargar librerías adicionales
    cargarLibreriasAvanzadas();
    
    // Inicializar módulos
    setTimeout(() => {
        if (window.inicializarGeocodificacion) inicializarGeocodificacion();
        if (window.inicializarFiltrosAvanzados) inicializarFiltrosAvanzados();
        if (window.inicializarModoMovil) inicializarModoMovil();
        if (window.crearGraficasAvanzadas) crearGraficasAvanzadas();
        
        console.log('🚀 Todas las funcionalidades avanzadas inicializadas');
    }, 2000);
}

function cargarLibreriasAvanzadas() {
    // SheetJS para Excel
    var scriptXLSX = document.createElement('script');
    scriptXLSX.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    document.head.appendChild(scriptXLSX);
    
    // html2pdf para PDF
    var scriptPDF = document.createElement('script');
    scriptPDF.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(scriptPDF);
    
    // Cargar módulos avanzados
    cargarScript('js/geocodificacion.js');
    cargarScript('js/filtros-avanzados.js');
    cargarScript('js/modo-movil.js');
    cargarScript('js/graficas-mejoradas.js');
    cargarScript('js/exportacion.js');
}

function cargarScript(src) {
    var script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
}