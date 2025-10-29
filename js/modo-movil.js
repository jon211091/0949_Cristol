// OPTIMIZACIÓN AVANZADA PARA DISPOSITIVOS MÓVILES
console.log('📱 Inicializando modo móvil optimizado...');

var panelMovilAbierto = false;

function inicializarModoMovil() {
    if (esDispositivoMovil()) {
        optimizarParaAppsNativas();
        configurarEventosTouch();
        ajustarVisualizacionMovil();
    }
}

function esDispositivoMovil() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

function optimizarParaAppsNativas() {
    console.log('📱 Optimizando para app nativa...');
    
    // Prevenir zoom con doble tap
    document.addEventListener('dblclick', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // Prevenir zoom con gestos
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('gestureend', function(e) {
        e.preventDefault();
    });
    
    // Optimizar panel lateral para móviles
    var panelLateral = document.querySelector('.panel-lateral');
    if (panelLateral) {
        panelLateral.style.width = '85%';
        panelLateral.style.maxWidth = '400px';
        panelLateral.style.height = '70%';
        panelLateral.style.top = '0';
        panelLateral.style.left = '0';
        panelLateral.style.transform = 'translateX(-100%)';
        panelLateral.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        panelLateral.style.zIndex = '1000';
        panelLateral.style.position = 'fixed';
        panelLateral.style.overflowY = 'auto';
        panelLateral.style.webkitOverflowScrolling = 'touch'; // Scroll suave iOS
    }
    
    // Crear botón flotante móvil
    crearBotonFlotanteMovil();
    
    // Ajustar controles del mapa
    ajustarControlesMapaMovil();
    
    // Optimizar rendimiento táctil
    optimizarRendimientoTouch();
}

function crearBotonFlotanteMovil() {
    // Remover botón existente si hay
    var botonExistente = document.querySelector('.boton-flotante-movil');
    if (botonExistente) {
        botonExistente.remove();
    }
    
    var botonFlotante = document.createElement('div');
    botonFlotante.className = 'boton-flotante-movil';
    botonFlotante.innerHTML = '📊';
    botonFlotante.setAttribute('style', `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        z-index: 1001;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        cursor: pointer;
        border: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
    `);
    
    botonFlotante.addEventListener('click', alternarPanelMovil);
    botonFlotante.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.style.transform = 'scale(0.95)';
    });
    
    botonFlotante.addEventListener('touchend', function(e) {
        e.preventDefault();
        this.style.transform = 'scale(1)';
        alternarPanelMovil();
    });
    
    document.querySelector('.area-mapa').appendChild(botonFlotante);
}

function alternarPanelMovil() {
    var panel = document.querySelector('.panel-lateral');
    var boton = document.querySelector('.boton-flotante-movil');
    
    if (!panelMovilAbierto) {
        // Abrir panel
        panel.style.transform = 'translateX(0)';
        boton.innerHTML = '✕';
        boton.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        panelMovilAbierto = true;
        
        // Ocultar leyenda al abrir panel
        var leyenda = document.getElementById('leyenda-flotante');
        if (leyenda) {
            leyenda.style.opacity = '0.3';
        }
    } else {
        // Cerrar panel
        panel.style.transform = 'translateX(-100%)';
        boton.innerHTML = '📊';
        boton.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
        panelMovilAbierto = false;
        
        // Mostrar leyenda al cerrar panel
        var leyenda = document.getElementById('leyenda-flotante');
        if (leyenda) {
            leyenda.style.opacity = '1';
        }
    }
}

function ajustarControlesMapaMovil() {
    // Mover zoom a esquina inferior izquierda
    if (mapa.zoomControl) {
        mapa.zoomControl.setPosition('bottomleft');
    }
    
    // Añadir control de geolocalización
    var controlGeolocation = L.control({ position: 'bottomright' });
    
    controlGeolocation.onAdd = function(mapa) {
        var div = L.DomUtil.create('div', 'geolocation-control-movil');
        div.innerHTML = `
            <button style="
                background: linear-gradient(135deg, #2ecc71, #27ae60);
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                font-size: 20px;
                color: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            ">📍</button>
        `;
        
        div.addEventListener('click', obtenerUbicacionUsuario);
        div.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(0.95)';
        });
        
        div.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(1)';
            obtenerUbicacionUsuario();
        });
        
        return div;
    };
    
    controlGeolocation.addTo(mapa);
}

function configurarEventosTouch() {
    // Swipe para abrir/cerrar panel
    var startX = 0;
    var startY = 0;
    
    document.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!startX || !startY) return;
        
        var diffX = e.touches[0].clientX - startX;
        var diffY = e.touches[0].clientY - startY;
        
        // Solo considerar swipe horizontal
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0 && !panelMovilAbierto && startX < 50) {
                // Swipe derecha desde borde izquierdo - abrir panel
                alternarPanelMovil();
            } else if (diffX < 0 && panelMovilAbierto) {
                // Swipe izquierda - cerrar panel
                alternarPanelMovil();
            }
            startX = null;
            startY = null;
        }
    });
    
    // Cerrar panel al tocar fuera
    document.addEventListener('touchstart', function(e) {
        if (panelMovilAbierto) {
            var panel = document.querySelector('.panel-lateral');
            var boton = document.querySelector('.boton-flotante-movil');
            
            if (!panel.contains(e.target) && !boton.contains(e.target)) {
                alternarPanelMovil();
            }
        }
    });
}

function optimizarRendimientoTouch() {
    // Mejorar rendimiento de mapas en móviles
    mapa.touchZoom.enable();
    mapa.dragging.enable();
    
    // Optimizar para pantallas táctiles
    var container = mapa.getContainer();
    container.style.webkitTapHighlightColor = 'transparent';
    container.style.touchAction = 'pan-x pan-y';
    
    // Prevenir acciones por defecto en elementos interactivos
    var elementosInteractivos = document.querySelectorAll('button, .btn-herramienta, .item-capa');
    elementosInteractivos.forEach(function(elemento) {
        elemento.style.webkitTapHighlightColor = 'transparent';
        elemento.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        });
    });
}

function obtenerUbicacionUsuario() {
    if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización');
        return;
    }
    
    actualizarEstado('📍 Buscando tu ubicación...');
    
    var options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
    };
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            var latlng = [position.coords.latitude, position.coords.longitude];
            
            // Mover mapa a la ubicación
            mapa.setView(latlng, 16);
            
            // Añadir marcador
            var marker = L.marker(latlng, {
                icon: L.divIcon({
                    className: 'mi-ubicacion-marker',
                    html: '📍',
                    iconSize: [30, 30],
                    iconAnchor: [15, 30]
                })
            }).addTo(mapa);
            
            marker.bindPopup(`
                <div style="text-align: center; min-width: 200px;">
                    <h6>📍 Tu Ubicación Actual</h6>
                    <p>Precisión: ${position.coords.accuracy.toFixed(0)}m</p>
                    <button class="btn btn-sm btn-primary" onclick="analizarUbicacion(${position.coords.latitude}, ${position.coords.longitude})">
                        📊 Analizar esta zona
                    </button>
                    <button class="btn btn-sm btn-secondary mt-1" onclick="mapa.removeLayer(this.parentElement._popup._source)">
                        ❌ Eliminar
                    </button>
                </div>
            `).openPopup();
            
            actualizarEstado('✅ Ubicación encontrada');
            
            // Auto-cerrar después de 5 segundos en móviles
            setTimeout(() => {
                marker.closePopup();
            }, 5000);
        },
        function(error) {
            var mensaje = 'Error obteniendo ubicación: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensaje += 'Permiso denegado por el usuario';
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensaje += 'Ubicación no disponible';
                    break;
                case error.TIMEOUT:
                    mensaje += 'Tiempo de espera agotado';
                    break;
                default:
                    mensaje += 'Error desconocido';
            }
            
            actualizarEstado('❌ ' + mensaje);
            alert(mensaje);
        },
        options
    );
}

function ajustarVisualizacionMovil() {
    // Ajustar leyenda para móviles
    var leyenda = document.getElementById('leyenda-flotante');
    if (leyenda) {
        leyenda.style.bottom = '80px';
        leyenda.style.right = '10px';
        leyenda.style.maxWidth = '200px';
        leyenda.style.fontSize = '12px';
        leyenda.style.maxHeight = '50vh';
    }
    
    // Optimizar gráficas para móviles
    var graficas = document.querySelectorAll('.canvas-grafica');
    graficas.forEach(function(canvas) {
        canvas.style.height = '180px !important';
    });
}

// Inicialización automática
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(inicializarModoMovil, 1000);
    });
} else {
    setTimeout(inicializarModoMovil, 1000);
}