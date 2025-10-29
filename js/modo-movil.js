// OPTIMIZACIÓN PARA DISPOSITIVOS MÓVILES

function inicializarModoMovil() {
    detectarDispositivo();
    optimizarInterfazMovil();
    agregarGestosTouch();
}

function detectarDispositivo() {
    var esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (esMovil) {
        document.body.classList.add('modo-movil');
        console.log('📱 Modo móvil activado');
    }
}

function optimizarInterfazMovil() {
    // Rediseñar interfaz para móviles
    if (document.body.classList.contains('modo-movil')) {
        // Panel lateral colapsable
        var panelLateral = document.querySelector('.panel-lateral');
        panelLateral.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">🎯 Controles</h6>
                <button class="btn btn-sm btn-outline-secondary" onclick="alternarPanelMovil()">
                    📱
                </button>
            </div>
            <div id="contenido-panel-movil">
                ${panelLateral.innerHTML}
            </div>
        `;
        
        // Ocultar panel inicialmente en móviles
        panelLateral.style.width = '300px';
        panelLateral.style.transform = 'translateX(-100%)';
        panelLateral.style.transition = 'transform 0.3s ease';
        
        // Botón flotante para abrir panel
        var botonFlotante = document.createElement('div');
        botonFlotante.className = 'boton-flotante-movil';
        botonFlotante.innerHTML = '📊';
        botonFlotante.onclick = alternarPanelMovil;
        document.querySelector('.area-mapa').appendChild(botonFlotante);
        
        // Optimizar mapa para touch
        mapa.touchZoom.enable();
        mapa.dragging.enable();
        mapa.scrollWheelZoom.enable();
        
        // Ajustar controles para touch
        ajustarControlesTouch();
    }
}

function alternarPanelMovil() {
    var panel = document.querySelector('.panel-lateral');
    var boton = document.querySelector('.boton-flotante-movil');
    
    if (panel.style.transform === 'translateX(-100%)' || !panel.style.transform) {
        panel.style.transform = 'translateX(0)';
        boton.style.opacity = '0.5';
    } else {
        panel.style.transform = 'translateX(-100%)';
        boton.style.opacity = '1';
    }
}

function ajustarControlesTouch() {
    // Mover controles a posiciones más accesibles
    if (mapa.zoomControl) {
        mapa.zoomControl.setPosition('bottomright');
    }
    
    // Añadir control de geolocalización
    var controlGeolocation = L.control({
        position: 'bottomright'
    });
    
    controlGeolocation.onAdd = function(mapa) {
        var div = L.DomUtil.create('div', 'geolocation-control');
        div.innerHTML = `
            <button class="btn btn-sm btn-primary" onclick="obtenerUbicacionUsuario()" 
                    style="background: #3498db; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 18px;">
                📍
            </button>
        `;
        return div;
    };
    
    controlGeolocation.addTo(mapa);
}

function obtenerUbicacionUsuario() {
    if (!navigator.geolocation) {
        alert('La geolocalización no es soportada por este navegador');
        return;
    }
    
    actualizarEstado('📍 Obteniendo tu ubicación...');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            var latlng = [position.coords.latitude, position.coords.longitude];
            
            // Mover mapa a la ubicación
            mapa.setView(latlng, 16);
            
            // Añadir marcador
            L.marker(latlng)
                .addTo(mapa)
                .bindPopup(`
                    <div style="text-align: center;">
                        <h6>📍 Tu Ubicación</h6>
                        <p>Precisión: ${position.coords.accuracy.toFixed(0)}m</p>
                        <button class="btn btn-sm btn-primary" onclick="analizarUbicacion(${position.coords.latitude}, ${position.coords.longitude})">
                            📊 Analizar esta zona
                        </button>
                    </div>
                `)
                .openPopup();
            
            actualizarEstado('✅ Ubicación encontrada');
        },
        function(error) {
            console.error('Error obteniendo ubicación:', error);
            var mensaje = '';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensaje = 'Permiso de ubicación denegado';
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensaje = 'Información de ubicación no disponible';
                    break;
                case error.TIMEOUT:
                    mensaje = 'Tiempo de espera agotado';
                    break;
                default:
                    mensaje = 'Error desconocido';
            }
            
            actualizarEstado('❌ ' + mensaje);
            alert('Error: ' + mensaje);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

function agregarGestosTouch() {
    // Doble tap para zoom
    var ultimoTap = 0;
    
    mapa.on('click', function(e) {
        var ahora = new Date().getTime();
        var diferencia = ahora - ultimoTap;
        
        if (diferencia < 300) { // Doble tap en 300ms
            mapa.setView(e.latlng, mapa.getZoom() + 1);
        }
        
        ultimoTap = ahora;
    });
    
    // Swipe para mostrar/ocultar panel
    var inicioX = null;
    
    mapa.getContainer().addEventListener('touchstart', function(e) {
        inicioX = e.touches[0].clientX;
    });
    
    mapa.getContainer().addEventListener('touchmove', function(e) {
        if (!inicioX) return;
        
        var diferenciaX = e.touches[0].clientX - inicioX;
        
        // Swipe de izquierda a derecha para mostrar panel
        if (diferenciaX > 50) {
            document.querySelector('.panel-lateral').style.transform = 'translateX(0)';
            document.querySelector('.boton-flotante-movil').style.opacity = '0.5';
            inicioX = null;
        }
    });
}