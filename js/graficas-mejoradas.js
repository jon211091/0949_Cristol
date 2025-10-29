// GRÁFICAS AVANZADAS - MÚLTIPLES TIPOS Y ANÁLISIS

var graficasAvanzadas = {};

function crearGraficasAvanzadas() {
    console.log('📈 Inicializando gráficas avanzadas...');
    
    crearSelectorTipoGrafica();
    crearGraficasEducacionAvanzadas();
    crearGraficasSociodemograficasAvanzadas();
    crearGraficaComparativa();
}

function crearSelectorTipoGrafica() {
    var container = document.getElementById('grafica-nse');
    if (!container) return;
    
    // Añadir selector de tipo de gráfica
    var selectorHTML = `
        <div class="row mb-3">
            <div class="col-6">
                <select id="selector-tipo-grafica" class="form-select form-select-sm" onchange="cambiarTipoGrafica()">
                    <option value="bar">📊 Barras</option>
                    <option value="doughnut">🍩 Dona</option>
                    <option value="pie">🥧 Pastel</option>
                    <option value="line">📈 Líneas</option>
                    <option value="radar">🎯 Radar</option>
                </select>
            </div>
            <div class="col-6">
                <select id="selector-columna" class="form-select form-select-sm" onchange="actualizarGraficaSociodemograficaAvanzada()">
                    ${Object.entries(CONFIG_MAPA.columnasAnalisis).map(([key, value]) => 
                        `<option value="${key}">${value}</option>`
                    ).join('')}
                </select>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <canvas id="grafica-sociodemografica-avanzada" class="canvas-grafica"></canvas>
            </div>
        </div>
    `;
    
    container.innerHTML = selectorHTML;
}

function cambiarTipoGrafica() {
    actualizarGraficaSociodemograficaAvanzada();
}

function crearGraficasEducacionAvanzadas() {
    var ctx = document.getElementById('grafica-educacion');
    if (!ctx) return;
    
    ctx = ctx.getContext('2d');
    
    if (!estadisticas.escuelas) return;
    
    var labels = Object.keys(estadisticas.escuelas);
    var datosAlumnos = labels.map(nivel => estadisticas.escuelas[nivel].alumnos);
    var datosEscuelas = labels.map(nivel => estadisticas.escuelas[nivel].cantidad);
    var colores = labels.map(nivel => estadisticas.escuelas[nivel].color);
    
    // Gráfica combinada: barras + línea
    graficasAvanzadas.educacion = new Chart(ctx, {
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
                    borderWidth: 3,
                    fill: false,
                    yAxisID: 'y1',
                    pointBackgroundColor: '#2c3e50',
                    pointBorderColor: '#ffffff',
                    pointRadius: 6,
                    pointHoverRadius: 8
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
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
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
                        text: 'Total de Alumnos',
                        font: { weight: 'bold' }
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
                        text: 'Número de Escuelas',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        precision: 0
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function crearGraficasSociodemograficasAvanzadas() {
    actualizarGraficaSociodemograficaAvanzada();
}

function actualizarGraficaSociodemograficaAvanzada() {
    var ctx = document.getElementById('grafica-sociodemografica-avanzada');
    if (!ctx) return;
    
    ctx = ctx.getContext('2d');
    
    var selectorTipo = document.getElementById('selector-tipo-grafica');
    var selectorColumna = document.getElementById('selector-columna');
    var tipoGrafica = selectorTipo ? selectorTipo.value : 'bar';
    var columnaSeleccionada = selectorColumna ? selectorColumna.value : 'POBTOT';
    
    // Destruir gráfica anterior si existe
    if (graficasAvanzadas.sociodemografica) {
        graficasAvanzadas.sociodemografica.destroy();
    }
    
    if (!estadisticas.manzanas) return;
    
    var labels = Object.keys(estadisticas.manzanas);
    var datos = labels.map(nse => estadisticas.manzanas[nse].datos[columnaSeleccionada] || 0);
    var colores = labels.map(nse => estadisticas.manzanas[nse].color);
    var titulo = CONFIG_MAPA.columnasAnalisis[columnaSeleccionada] || columnaSeleccionada;
    
    // Configuración específica por tipo de gráfica
    var configGrafica = obtenerConfiguracionGrafica(tipoGrafica, labels, datos, colores, titulo);
    
    graficasAvanzadas.sociodemografica = new Chart(ctx, configGrafica);
}

function obtenerConfiguracionGrafica(tipo, labels, datos, colores, titulo) {
    var configBase = {
        type: tipo,
        data: {
            labels: labels,
            datasets: [{
                label: titulo,
                data: datos,
                backgroundColor: colores,
                borderColor: tipo === 'line' || tipo === 'radar' ? colores : colores.map(color => color),
                borderWidth: tipo === 'line' ? 3 : 1,
                fill: tipo === 'radar'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: tipo !== 'bar',
                    position: 'top'
                },
                title: {
                    display: true,
                    text: titulo,
                    font: { size: 14, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            var value = context.raw || 0;
                            var total = context.dataset.data.reduce((a, b) => a + b, 0);
                            var percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            
                            if (tipo === 'pie' || tipo === 'doughnut') {
                                return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
                            }
                            return `${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };
    
    // Personalizaciones por tipo
    switch(tipo) {
        case 'bar':
            configBase.options.scales = {
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
            };
            break;
            
        case 'line':
            configBase.data.datasets[0].tension = 0.4;
            configBase.data.datasets[0].pointBackgroundColor = colores;
            configBase.data.datasets[0].pointBorderColor = '#ffffff';
            configBase.data.datasets[0].pointRadius = 5;
            configBase.data.datasets[0].pointHoverRadius = 7;
            configBase.options.scales = {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            };
            break;
            
        case 'radar':
            configBase.options.scales = {
                r: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            };
            break;
    }
    
    return configBase;
}

function crearGraficaComparativa() {
    // Crear contenedor para gráfica comparativa
    var container = document.querySelector('.graficas-container');
    if (!container) return;
    
    var comparativaHTML = `
        <div class="mt-4">
            <p class="small fw-bold">📊 Comparativa de Variables Sociodemográficas</p>
            <div class="row mb-2">
                <div class="col-6">
                    <select id="selector-comparativa-1" class="form-select form-select-sm">
                        ${Object.entries(CONFIG_MAPA.columnasAnalisis).map(([key, value]) => 
                            `<option value="${key}">${value}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="col-6">
                    <select id="selector-comparativa-2" class="form-select form-select-sm">
                        ${Object.entries(CONFIG_MAPA.columnasAnalisis).map(([key, value]) => 
                            `<option value="${key}" ${key === 'P_6A11' ? 'selected' : ''}>${value}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <canvas id="grafica-comparativa" class="canvas-grafica"></canvas>
            <button class="btn btn-sm btn-outline-primary w-100 mt-2" onclick="actualizarGraficaComparativa()">
                🔄 Actualizar Comparativa
            </button>
        </div>
    `;
    
    // Insertar después de las gráficas existentes
    var graficasExistente = container.querySelector('#grafica-nse').parentNode;
    graficasExistente.insertAdjacentHTML('afterend', comparativaHTML);
    
    // Crear gráfica comparativa inicial
    setTimeout(actualizarGraficaComparativa, 1000);
}

function actualizarGraficaComparativa() {
    var ctx = document.getElementById('grafica-comparativa');
    if (!ctx) return;
    
    ctx = ctx.getContext('2d');
    
    var selector1 = document.getElementById('selector-comparativa-1');
    var selector2 = document.getElementById('selector-comparativa-2');
    var columna1 = selector1 ? selector1.value : 'POBTOT';
    var columna2 = selector2 ? selector2.value : 'P_6A11';
    
    if (!estadisticas.manzanas) return;
    
    var labels = Object.keys(estadisticas.manzanas);
    var datos1 = labels.map(nse => estadisticas.manzanas[nse].datos[columna1] || 0);
    var datos2 = labels.map(nse => estadisticas.manzanas[nse].datos[columna2] || 0);
    var colores = ['#3498db', '#e74c3c'];
    
    // Destruir gráfica anterior si existe
    if (graficasAvanzadas.comparativa) {
        graficasAvanzadas.comparativa.destroy();
    }
    
    graficasAvanzadas.comparativa = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: CONFIG_MAPA.columnasAnalisis[columna1],
                    data: datos1,
                    backgroundColor: colores[0],
                    borderColor: colores[0],
                    borderWidth: 1
                },
                {
                    label: CONFIG_MAPA.columnasAnalisis[columna2],
                    data: datos2,
                    backgroundColor: colores[1],
                    borderColor: colores[1],
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString()}`;
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