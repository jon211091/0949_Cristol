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

// ... (mantén todo el código intermedio igual hasta finalizarCarga)

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

// ... (mantén el resto de funciones igual)