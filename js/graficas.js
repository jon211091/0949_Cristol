// GESTIÓN DE GRÁFICAS SOCIODEMOGRÁFICAS MEJORADAS

function crearGraficas() {
    crearGraficasEducacion();
    crearGraficasSociodemograficas();
}

function crearGraficasEducacion() {
    var ctx = document.getElementById('grafica-educacion').getContext('2d');
    
    if (!estadisticas.escuelas) return;
    
    var labels = Object.keys(estadisticas.escuelas);
    var datosAlumnos = labels.map(nivel => estadisticas.escuelas[nivel].alumnos);
    var datosEscuelas = labels.map(nivel => estadisticas.escuelas[nivel].cantidad);
    var colores = labels.map(nivel => estadisticas.escuelas[nivel].color);
    
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
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
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
                    }
                }
            }
        }
    });
}

function crearGraficasSociodemograficas() {
    var container = document.getElementById('grafica-nse');
    if (!container) return;
    
    if (!estadisticas.manzanas) return;
    
    var labels = Object.keys(estadisticas.manzanas);
    var colores = labels.map(nse => estadisticas.manzanas[nse].color);
    
    // Crear contenedor para múltiples gráficas
    container.innerHTML = `
        <div class="selectorgrafica mb-2">
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
    var selector = document.getElementById('selector-columna');
    var columnaSeleccionada = selector ? selector.value : 'POBTOT';
    
    var ctx = document.getElementById('grafica-sociodemografica').getContext('2d');
    
    if (graficas.sociodemografica) {
        graficas.sociodemografica.destroy();
    }
    
    if (!estadisticas.manzanas) return;
    
    var labels = Object.keys(estadisticas.manzanas);
    var datos = labels.map(nse => estadisticas.manzanas[nse].datos[columnaSeleccionada] || 0);
    var colores = labels.map(nse => estadisticas.manzanas[nse].color);
    var titulo = CONFIG_MAPA.columnasAnalisis[columnaSeleccionada] || columnaSeleccionada;
    
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
                            var total = context.dataset.data.reduce((a, b) => a + b, 0);
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
                }
            }
        }
    });
}

// Actualizar gráficas cuando cambie la vista del mapa
function actualizarGraficas() {
    if (graficas.educacion) graficas.educacion.destroy();
    if (graficas.sociodemografica) graficas.sociodemografica.destroy();
    
    // Recalcular estadísticas basadas en la vista actual
    recalcularEstadisticasVista();
    crearGraficas();
}

function recalcularEstadisticasVista() {
    // Reiniciar estadísticas
    estadisticas = { manzanas: {}, escuelas: {} };
    
    var bounds = mapa.getBounds();
    
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
mapa.on('moveend', function() {
    actualizarGraficas();
});