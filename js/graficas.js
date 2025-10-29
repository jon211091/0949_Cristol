// GESTIÓN COMPLETA DE GRÁFICAS SOCIODEMOGRÁFICAS

console.log('📊 Cargando módulo de gráficas...');

var graficas = {};

function crearGraficas() {
    console.log('📈 Inicializando gráficas...');
    
    try {
        crearGraficasEducacion();
        crearGraficasSociodemograficas();
        console.log('✅ Todas las gráficas creadas correctamente');
    } catch (error) {
        console.error('❌ Error creando gráficas:', error);
    }
}

function crearGraficasEducacion() {
    var ctx = document.getElementById('grafica-educacion');
    if (!ctx) {
        console.error('❌ No se encuentra el canvas para gráfica de educación');
        return;
    }
    
    ctx = ctx.getContext('2d');
    
    if (!estadisticas.escuelas || Object.keys(estadisticas.escuelas).length === 0) {
        console.log('⚠️ No hay datos de escuelas para la gráfica');
        document.getElementById('grafica-educacion').style.display = 'none';
        return;
    }
    
    var labels = Object.keys(estadisticas.escuelas);
    var datosAlumnos = labels.map(nivel => estadisticas.escuelas[nivel].alumnos);
    var datosEscuelas = labels.map(nivel => estadisticas.escuelas[nivel].cantidad);
    var colores = labels.map(nivel => estadisticas.escuelas[nivel].color);
    
    // Destruir gráfica anterior si existe
    if (graficas.educacion) {
        graficas.educacion.destroy();
    }
    
    graficas.educacion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total de Alumnos',
                    data: datosAlumnos,
                    backgroundColor: colores,
                    borderColor: colores.map(color => color),
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Número de Escuelas',
                    data: datosEscuelas,
                    type: 'line',
                    borderColor: '#2c3e50',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y1',
                    pointBackgroundColor: '#2c3e50',
                    pointBorderColor: '#2c3e50',
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            var label = context.dataset.label || '';
                            var value = context.raw || 0;
                            if (context.dataset.label === 'Total de Alumnos') {
                                return `${label}: ${value.toLocaleString()} alumnos`;
                            } else {
                                return `${label}: ${value} escuelas`;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Total de Alumnos'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Número de Escuelas'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function crearGraficasSociodemograficas() {
    var container = document.getElementById('grafica-nse');
    if (!container) {
        console.error('❌ No se encuentra el contenedor para gráficas sociodemográficas');
        return;
    }
    
    if (!estadisticas.manzanas || Object.keys(estadisticas.manzanas).length === 0) {
        console.log('⚠️ No hay datos de manzanas para las gráficas sociodemográficas');
        container.innerHTML = '<div class="estado-carga">No hay datos sociodemográficos disponibles</div>';
        return;
    }
    
    var labels = Object.keys(estadisticas.manzanas);
    var colores = labels.map(nse => estadisticas.manzanas[nse].color);
    
    // Crear contenedor para múltiples gráficas
    container.innerHTML = `
        <div class="selector-grafica">
            <select id="selector-columna" class="form-select form-select-sm" onchange="actualizarGraficaSociodemografica()">
                ${Object.entries(CONFIG_MAPA.columnasAnalisis).map(([key, value]) => 
                    `<option value="${key}">${value}</option>`
                ).join('')}
            </select>
        </div>
        <canvas id="grafica-sociodemografica" class="canvas-grafica"></canvas>
    `;
    
    // Crear primera gráfica
    actualizarGraficaSociodemografica();
}

function actualizarGraficaSociodemografica() {
    var ctx = document.getElementById('grafica-sociodemografica');
    if (!ctx) return;
    
    ctx = ctx.getContext('2d');
    
    var selector = document.getElementById('selector-columna');
    var columnaSeleccionada = selector ? selector.value : 'POBTOT';
    
    // Destruir gráfica anterior si existe
    if (graficas.sociodemografica) {
        graficas.sociodemografica.destroy();
    }
    
    if (!estadisticas.manzanas) return;
    
    var labels = Object.keys(estadisticas.manzanas);
    var datos = labels.map(nse => estadisticas.manzanas[nse].datos[columnaSeleccionada] || 0);
    var colores = labels.map(nse => estadisticas.manzanas[nse].color);
    var titulo = CONFIG_MAPA.columnasAnalisis[columnaSeleccionada] || columnaSeleccionada;
    
    // Calcular total para porcentajes
    var total = datos.reduce((sum, value) => sum + value, 0);
    
    graficas.sociodemografica = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: titulo,
                data: datos,
                backgroundColor: colores,
                borderColor: colores.map(color => color),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            var value = context.raw || 0;
                            var percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Actualizar gráficas cuando cambie la vista del mapa
function actualizarGraficas() {
    console.log('🔄 Actualizando gráficas por cambio de vista...');
    
    if (graficas.educacion) graficas.educacion.destroy();
    if (graficas.sociodemografica) graficas.sociodemografica.destroy();
    
    // Recalcular estadísticas basadas en la vista actual
    recalcularEstadisticasVista();
    crearGraficas();
}

function recalcularEstadisticasVista() {
    console.log('📊 Recalculando estadísticas para la vista actual...');
    
    // Reiniciar estadísticas
    estadisticas = { manzanas: {}, escuelas: {} };
    
    var bounds = mapa.getBounds();
    if (!bounds) return;
    
    // Re-analizar manzanas visibles
    if (capas.manzanas) {
        capas.manzanas.eachLayer(function(layer) {
            if (bounds.contains(layer.getBounds().getCenter())) {
                analizarManzana(layer.feature);
            }
        });
    }
    
    // Re-analizar escuelas visibles
    if (capas.escuelas) {
        capas.escuelas.eachLayer(function(layer) {
            if (bounds.contains(layer.getLatLng())) {
                analizarEscuela(layer.feature);
            }
        });
    }
}

// Actualizar gráficas cuando se mueve el mapa
if (mapa) {
    mapa.on('moveend', function() {
        setTimeout(actualizarGraficas, 500);
    });
}

console.log('✅ Módulo de gráficas cargado correctamente');