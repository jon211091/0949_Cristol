// INICIALIZACIÓN OPTIMIZADA PARA APPS MÓVILES
console.log('📱 Iniciando app de mapas sociodemográficos...');

// Esperar a que todo esté cargado
window.addEventListener('load', function() {
    console.log('✅ Página completamente cargada');
    
    // Inicializar modo móvil primero
    setTimeout(function() {
        if (typeof inicializarModoMovil === 'function') {
            inicializarModoMovil();
        }
    }, 500);
    
    // Verificar errores continuamente
    window.addEventListener('error', function(e) {
        console.error('❌ Error capturado:', e.error);
    });
});