// GESTIÓN DE GRÁFICAS SOCIODEMOGRÁFICAS

function crearGraficas() {
    crearGraficaNSE();
    crearGraficaEducacion();
}

function crearGraficaNSE() {
    var ctx = document.getElementById('grafica-nse').getContext('2d');
    
    if (!estadisticas.nse) return;
    
    var labels = Object.keys(estadisticas.nse);
    var datos = labels.map(nse => estadisticas.nse[nse].poblacion);
    var colores = labels.map(nse => estadisticas.nse[nse].color);
    
    graficaNSE = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: datos,
                backgroundColor: colores,
                borderColor: '#fff',
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
                            var label = context.label || '';
                            var value = context.raw || 0;
                            var total = context.dataset.data.reduce((a, b) => a + b, 0);
                            var percentage = Math.round((value / total) * 100);
                            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function crearGraficaEducacion() {
    var ctx = document.getElementById('grafica-educacion').getContext('2d');
    
    if (!estadisticas.educacion) return;
    
    var labels = Object.keys(estadisticas.educacion);
    var datos = labels.map(nivel => estadisticas.educacion[nivel].cantidad);
    var colores = labels.map(nivel => estadisticas.educacion[nivel].color);
    
    graficaEducacion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad de Escuelas',
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
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Actualizar gráficas cuando cambie la vista del mapa
function actualizarGraficas() {
    if (graficaNSE) graficaNSE.destroy();
    if (graficaEducacion) graficaEducacion.destroy();
    
    // Recalcular estadísticas basadas en la vista actual
    recalcularEstadisticasVista();
    crearGraficas();
}

function recalcularEstadisticasVista() {
    // Reiniciar estadísticas
    estadisticas = { nse: {}, educacion: {} };
    
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