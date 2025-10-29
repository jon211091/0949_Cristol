// SISTEMA DE GEOCODIFICACIÓN Y BÚSQUEDA AVANZADA

var controlGeocodificador;

function inicializarGeocodificacion() {
    // Añadir control de búsqueda por dirección
    controlGeocodificador = L.control({
        position: 'topleft'
    });
    
    controlGeocodificador.onAdd = function(mapa) {
        var div = L.DomUtil.create('div', 'geocoder-control');
        div.innerHTML = `
            <div class="input-group input-group-sm">
                <input type="text" id="geocoder-input" class="form-control" 
                       placeholder="Buscar dirección...">
                <button class="btn btn-outline-secondary" type="button" onclick="buscarDireccion()">
                    🔍
                </button>
            </div>
            <div id="geocoder-results" class="mt-2" style="display: none;"></div>
        `;
        return div;
    };
    
    controlGeocodificador.addTo(mapa);
    
    // Enter para buscar
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && document.activeElement.id === 'geocoder-input') {
            buscarDireccion();
        }
    });
}

function buscarDireccion() {
    var query = document.getElementById('geocoder-input').value.trim();
    if (!query) return;
    
    actualizarEstado(`🔍 Buscando: "${query}"`);
    
    // Usar Nominatim (OpenStreetMap) para geocodificación
    var url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&viewbox=-99.4,19.1,-98.9,19.6&bounded=1`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            mostrarResultadosGeocodificacion(data, query);
        })
        .catch(error => {
            console.error('Error en geocodificación:', error);
            actualizarEstado('❌ Error en la búsqueda');
        });
}

function mostrarResultadosGeocodificacion(resultados, query) {
    var container = document.getElementById('geocoder-results');
    
    if (resultados.length === 0) {
        container.innerHTML = '<div class="alert alert-warning p-2">No se encontraron resultados</div>';
        container.style.display = 'block';
        return;
    }
    
    var html = '<div class="list-group">';
    
    resultados.forEach((resultado, index) => {
        html += `
            <a href="#" class="list-group-item list-group-item-action p-2" 
               onclick="seleccionarResultadoGeocodificacion(${index})">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${resultado.display_name.split(',')[0]}</h6>
                    <small>${resultado.type}</small>
                </div>
                <p class="mb-1 small">${resultado.display_name}</p>
            </a>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    container.style.display = 'block';
}

function seleccionarResultadoGeocodificacion(index) {
    var input = document.getElementById('geocoder-input');
    var query = input.value;
    var url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data[index]) {
                var resultado = data[index];
                var latlng = [parseFloat(resultado.lat), parseFloat(resultado.lon)];
                
                // Mover mapa a la ubicación
                mapa.setView(latlng, 16);
                
                // Añadir marcador
                var marker = L.marker(latlng)
                    .addTo(mapa)
                    .bindPopup(`
                        <div style="text-align: center;">
                            <h6>📍 ${resultado.display_name.split(',')[0]}</h6>
                            <p class="small">${resultado.display_name}</p>
                            <button class="btn btn-sm btn-primary" onclick="analizarUbicacion(${resultado.lat}, ${resultado.lon})">
                                📊 Analizar esta zona
                            </button>
                        </div>
                    `)
                    .openPopup();
                
                // Ocultar resultados
                document.getElementById('geocoder-results').style.display = 'none';
                actualizarEstado(`✅ Ubicación encontrada: ${resultado.display_name.split(',')[0]}`);
            }
        });
}

function analizarUbicacion(lat, lng) {
    var punto = L.latLng(lat, lng);
    
    // Encontrar manzanas dentro de un radio
    var manzanasCercanas = [];
    var escuelasCercanas = [];
    
    if (capas.manzanas) {
        capas.manzanas.eachLayer(function(layer) {
            var centro = layer.getBounds().getCenter();
            var distancia = punto.distanceTo(centro);
            
            if (distancia < 1000) { // 1km radio
                manzanasCercanas.push({
                    layer: layer,
                    distancia: distancia,
                    propiedades: layer.feature.properties
                });
            }
        });
    }
    
    if (capas.escuelas) {
        capas.escuelas.eachLayer(function(layer) {
            var distancia = punto.distanceTo(layer.getLatLng());
            
            if (distancia < 1000) { // 1km radio
                escuelasCercanas.push({
                    layer: layer,
                    distancia: distancia,
                    propiedades: layer.feature.properties
                });
            }
        });
    }
    
    // Mostrar análisis
    mostrarAnalisisUbicacion(manzanasCercanas, escuelasCercanas, punto);
}

function mostrarAnalisisUbicacion(manzanas, escuelas, punto) {
    var poblacionTotal = manzanas.reduce((sum, m) => sum + (parseInt(m.propiedades.POBTOT) || 0), 0);
    var alumnosTotales = escuelas.reduce((sum, e) => sum + (parseInt(e.propiedades.ALUM_TOT) || 0), 0);
    
    var contenido = `
        <div style="min-width: 400px; max-height: 500px; overflow-y: auto;">
            <h6>📊 Análisis de la Zona</h6>
            <div class="row text-center mb-3">
                <div class="col-6">
                    <div class="card">
                        <div class="card-body p-2">
                            <h5>${manzanas.length}</h5>
                            <small>Manzanas</small>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card">
                        <div class="card-body p-2">
                            <h5>${escuelas.length}</h5>
                            <small>Escuelas</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <h7>🏘️ Población en 1km radio:</h7>
            <p><strong>${poblacionTotal.toLocaleString()} habitantes</strong></p>
            
            <h7>🏫 Escuelas cercanas:</h7>
            <div style="max-height: 200px; overflow-y: auto;">
    `;
    
    escuelas.forEach(escuela => {
        contenido += `
            <div class="border-bottom py-1">
                <strong>${escuela.propiedades.NOMBRE}</strong><br>
                <small>${escuela.propiedades.NIV_EDUC} | ${escuela.distancia.toFixed(0)}m</small>
            </div>
        `;
    });
    
    contenido += `
            </div>
            <button class="btn btn-sm btn-success w-100 mt-2" onclick="crearRadioAnalisis(${punto.lat}, ${punto.lng})">
                🎯 Crear radio de análisis
            </button>
        </div>
    `;
    
    L.popup()
        .setLatLng(punto)
        .setContent(contenido)
        .openOn(mapa);
}

function crearRadioAnalisis(lat, lng) {
    // Crear círculo de análisis
    var radio = L.circle([lat, lng], {
        color: '#e74c3c',
        fillColor: '#e74c3c',
        fillOpacity: 0.1,
        radius: 1000 // 1km
    }).addTo(mapa);
    
    radio.bindPopup(`
        <div style="text-align: center;">
            <h6>🎯 Radio de Análisis</h6>
            <p>Radio: 1km</p>
            <button class="btn btn-sm btn-danger" onclick="mapa.removeLayer(this._sourceTarget)">
                ❌ Eliminar radio
            </button>
        </div>
    `).openPopup();
}