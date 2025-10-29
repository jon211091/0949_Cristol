// SISTEMA DE FILTROS AVANZADOS

var filtrosActivos = {
    manzanas: {},
    escuelas: {}
};

function inicializarFiltrosAvanzados() {
    crearPanelFiltros();
}

function crearPanelFiltros() {
    var panelLateral = document.querySelector('.panel-lateral');
    
    var filtrosHTML = `
        <div class="grupo-control">
            <label>🎯 Filtros Avanzados</label>
            
            <!-- Filtros para Manzanas -->
            <div class="card mb-2">
                <div class="card-header p-2" onclick="toggleFiltro('manzanas')">
                    <strong>🏘️ Manzanas</strong>
                    <span class="float-end">▼</span>
                </div>
                <div class="card-body p-2" id="filtros-manzanas">
                    <div class="mb-2">
                        <label class="small">Nivel Socioeconómico:</label>
                        <select class="form-select form-select-sm" id="filtro-nse" onchange="aplicarFiltroNSE()">
                            <option value="">Todos los NSE</option>
                            ${Object.keys(CONFIG_MAPA.coloresNSE).map(nse => 
                                `<option value="${nse}">${nse}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="mb-2">
                        <label class="small">Población mínima:</label>
                        <input type="number" class="form-control form-control-sm" id="filtro-poblacion-min" 
                               placeholder="Ej: 100" onchange="aplicarFiltroPoblacion()">
                    </div>
                    
                    <div class="mb-2">
                        <label class="small">Rango de edades:</label>
                        <select class="form-select form-select-sm" id="filtro-rango-edad" onchange="aplicarFiltroEdades()">
                            <option value="">Todos los rangos</option>
                            <option value="P_3A5">3-5 años</option>
                            <option value="P_6A11">6-11 años</option>
                            <option value="P_12A14">12-14 años</option>
                            <option value="P_15A17">15-17 años</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Filtros para Escuelas -->
            <div class="card mb-2">
                <div class="card-header p-2" onclick="toggleFiltro('escuelas')">
                    <strong>🏫 Escuelas</strong>
                    <span class="float-end">▼</span>
                </div>
                <div class="card-body p-2" id="filtros-escuelas">
                    <div class="mb-2">
                        <label class="small">Nivel Educativo:</label>
                        <select class="form-select form-select-sm" id="filtro-nivel-educativo" onchange="aplicarFiltroNivelEducativo()">
                            <option value="">Todos los niveles</option>
                            ${Object.keys(CONFIG_MAPA.coloresEducacion).map(nivel => 
                                `<option value="${nivel}">${nivel}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="mb-2">
                        <label class="small">Alumnos mínimos:</label>
                        <input type="number" class="form-control form-control-sm" id="filtro-alumnos-min" 
                               placeholder="Ej: 100" onchange="aplicarFiltroAlumnos()">
                    </div>
                </div>
            </div>
            
            <!-- Controles de filtros -->
            <div class="d-grid gap-1">
                <button class="btn btn-sm btn-success" onclick="aplicarTodosLosFiltros()">
                    ✅ Aplicar Filtros
                </button>
                <button class="btn btn-sm btn-secondary" onclick="limpiarFiltros()">
                    🗑️ Limpiar Filtros
                </button>
                <button class="btn btn-sm btn-info" onclick="guardarFiltros()">
                    💾 Guardar Filtros
                </button>
            </div>
            
            <!-- Contador de resultados -->
            <div id="contador-filtros" class="mt-2 p-2 bg-light rounded small" style="display: none;">
                <strong>Resultados filtrados:</strong>
                <div id="contador-manzanas">Manzanas: 0</div>
                <div id="contador-escuelas">Escuelas: 0</div>
            </div>
        </div>
    `;
    
    // Insertar después del buscador
    var buscador = panelLateral.querySelector('.grupo-control');
    buscador.insertAdjacentHTML('afterend', filtrosHTML);
}

function toggleFiltro(tipo) {
    var elemento = document.getElementById(`filtros-${tipo}`);
    if (elemento.style.display === 'none') {
        elemento.style.display = 'block';
    } else {
        elemento.style.display = 'none';
    }
}

function aplicarFiltroNSE() {
    var nseSeleccionado = document.getElementById('filtro-nse').value;
    filtrosActivos.manzanas.nse = nseSeleccionado;
    aplicarFiltrosManzanas();
}

function aplicarFiltroPoblacion() {
    var poblacionMin = parseInt(document.getElementById('filtro-poblacion-min').value) || 0;
    filtrosActivos.manzanas.poblacionMinima = poblacionMin;
    aplicarFiltrosManzanas();
}

function aplicarFiltroNivelEducativo() {
    var nivelSeleccionado = document.getElementById('filtro-nivel-educativo').value;
    filtrosActivos.escuelas.nivel = nivelSeleccionado;
    aplicarFiltrosEscuelas();
}

function aplicarFiltroAlumnos() {
    var alumnosMin = parseInt(document.getElementById('filtro-alumnos-min').value) || 0;
    filtrosActivos.escuelas.alumnosMinimos = alumnosMin;
    aplicarFiltrosEscuelas();
}

function aplicarTodosLosFiltros() {
    aplicarFiltrosManzanas();
    aplicarFiltrosEscuelas();
    actualizarContadorFiltros();
}

function aplicarFiltrosManzanas() {
    if (!capas.manzanas) return;
    
    var contador = 0;
    
    capas.manzanas.eachLayer(function(layer) {
        var propiedades = layer.feature.properties;
        var cumpleFiltros = true;
        
        // Filtro por NSE
        if (filtrosActivos.manzanas.nse && propiedades.NSE !== filtrosActivos.manzanas.nse) {
            cumpleFiltros = false;
        }
        
        // Filtro por población mínima
        if (filtrosActivos.manzanas.poblacionMinima) {
            var poblacion = parseInt(propiedades.POBTOT) || 0;
            if (poblacion < filtrosActivos.manzanas.poblacionMinima) {
                cumpleFiltros = false;
            }
        }
        
        // Aplicar estilo según filtros
        if (cumpleFiltros) {
            layer.setStyle({ fillOpacity: 0.7 });
            contador++;
        } else {
            layer.setStyle({ fillOpacity: 0.2 });
        }
    });
    
    filtrosActivos.manzanas.contador = contador;
}

function aplicarFiltrosEscuelas() {
    if (!capas.escuelas) return;
    
    var contador = 0;
    
    capas.escuelas.eachLayer(function(layer) {
        var propiedades = layer.feature.properties;
        var cumpleFiltros = true;
        
        // Filtro por nivel educativo
        if (filtrosActivos.escuelas.nivel && propiedades.NIV_EDUC !== filtrosActivos.escuelas.nivel) {
            cumpleFiltros = false;
        }
        
        // Filtro por alumnos mínimos
        if (filtrosActivos.escuelas.alumnosMinimos) {
            var alumnos = parseInt(propiedades.ALUM_TOT) || 0;
            if (alumnos < filtrosActivos.escuelas.alumnosMinimos) {
                cumpleFiltros = false;
            }
        }
        
        // Aplicar estilo según filtros
        if (cumpleFiltros) {
            layer.setStyle({ fillOpacity: 0.8 });
            contador++;
        } else {
            layer.setStyle({ fillOpacity: 0.2 });
        }
    });
    
    filtrosActivos.escuelas.contador = contador;
}

function actualizarContadorFiltros() {
    var contadorElement = document.getElementById('contador-filtros');
    var contadorManzanas = document.getElementById('contador-manzanas');
    var contadorEscuelas = document.getElementById('contador-escuelas');
    
    if (filtrosActivos.manzanas.contador !== undefined || filtrosActivos.escuelas.contador !== undefined) {
        contadorElement.style.display = 'block';
        contadorManzanas.textContent = `Manzanas: ${filtrosActivos.manzanas.contador || 0}`;
        contadorEscuelas.textContent = `Escuelas: ${filtrosActivos.escuelas.contador || 0}`;
    }
}

function limpiarFiltros() {
    // Limpiar controles
    document.getElementById('filtro-nse').value = '';
    document.getElementById('filtro-poblacion-min').value = '';
    document.getElementById('filtro-nivel-educativo').value = '';
    document.getElementById('filtro-alumnos-min').value = '';
    
    // Limpiar filtros activos
    filtrosActivos = { manzanas: {}, escuelas: {} };
    
    // Restaurar estilos
    if (capas.manzanas) {
        capas.manzanas.eachLayer(function(layer) {
            layer.setStyle({ fillOpacity: 0.7 });
        });
    }
    
    if (capas.escuelas) {
        capas.escuelas.eachLayer(function(layer) {
            layer.setStyle({ fillOpacity: 0.8 });
        });
    }
    
    // Ocultar contador
    document.getElementById('contador-filtros').style.display = 'none';
    
    actualizarEstado('✅ Filtros limpiados');
}

function guardarFiltros() {
    var configFiltros = {
        filtros: filtrosActivos,
        fecha: new Date().toISOString(),
        area: obtenerAreaEstudio()
    };
    
    var contenido = JSON.stringify(configFiltros, null, 2);
    descargarArchivo(contenido, 'configuracion_filtros.json', 'application/json');
    actualizarEstado('✅ Configuración de filtros guardada');
}