// SISTEMA COMPLETO DE EXPORTACIÓN DE DATOS

function exportarDatos() {
    actualizarEstado('💾 Preparando exportación de datos...');
    
    // Crear menú de exportación
    var contenidoPopup = `
        <div style="min-width: 300px; text-align: center;">
            <h6>💾 Exportar Datos</h6>
            <div class="d-grid gap-2">
                <button class="btn btn-sm btn-success" onclick="exportarDatosCSV()">
                    📄 Exportar a CSV
                </button>
                <button class="btn btn-sm btn-warning" onclick="exportarDatosExcel()">
                    📊 Exportar a Excel
                </button>
                <button class="btn btn-sm btn-info" onclick="exportarReportePDF()">
                    📑 Generar Reporte PDF
                </button>
                <button class="btn btn-sm btn-secondary" onclick="exportarConfiguracion()">
                    ⚙️ Exportar Configuración
                </button>
            </div>
            <div class="mt-3">
                <small class="text-muted">Se exportarán los datos visibles en el mapa actual</small>
            </div>
        </div>
    `;
    
    L.popup()
        .setLatLng(mapa.getCenter())
        .setContent(contenidoPopup)
        .openOn(mapa);
}

function exportarDatosCSV() {
    actualizarEstado('📄 Generando archivo CSV...');
    
    var datosCompletos = recopilarDatosParaExportacion();
    var csvContent = convertirDatosACSV(datosCompletos);
    
    descargarArchivo(csvContent, 'datos_sociodemograficos.csv', 'text/csv');
    actualizarEstado('✅ CSV exportado correctamente');
}

function exportarDatosExcel() {
    actualizarEstado('📊 Generando archivo Excel...');
    
    var datosCompletos = recopilarDatosParaExportacion();
    
    // Crear libro de Excel
    var workbook = XLSX.utils.book_new();
    
    // Añadir hojas para cada tipo de datos
    if (datosCompletos.manzanas.length > 0) {
        var worksheetManzanas = XLSX.utils.json_to_sheet(datosCompletos.manzanas);
        XLSX.utils.book_append_sheet(workbook, worksheetManzanas, "Manzanas");
    }
    
    if (datosCompletos.escuelas.length > 0) {
        var worksheetEscuelas = XLSX.utils.json_to_sheet(datosCompletos.escuelas);
        XLSX.utils.book_append_sheet(workbook, worksheetEscuelas, "Escuelas");
    }
    
    if (datosCompletos.estadisticas) {
        var worksheetStats = XLSX.utils.json_to_sheet([datosCompletos.estadisticas]);
        XLSX.utils.book_append_sheet(workbook, worksheetStats, "Estadísticas");
    }
    
    // Generar y descargar
    XLSX.writeFile(workbook, 'estudio_sociodemografico.xlsx');
    actualizarEstado('✅ Excel exportado correctamente');
}

function recopilarDatosParaExportacion() {
    var datos = {
        manzanas: [],
        escuelas: [],
        estadisticas: {},
        metadata: {
            fechaExportacion: new Date().toISOString(),
            totalManzanas: 0,
            totalEscuelas: 0,
            areaEstudio: obtenerAreaEstudio()
        }
    };
    
    // Recopilar datos de manzanas visibles
    if (capas.manzanas && CONFIG_MAPA.capas.manzanas.visible) {
        capas.manzanas.eachLayer(function(layer) {
            var feature = layer.feature;
            if (feature && feature.properties) {
                datos.manzanas.push({
                    ...feature.properties,
                    latitud: feature.geometry.coordinates[0][0][1],
                    longitud: feature.geometry.coordinates[0][0][0]
                });
            }
        });
    }
    
    // Recopilar datos de escuelas visibles
    if (capas.escuelas && CONFIG_MAPA.capas.escuelas.visible) {
        capas.escuelas.eachLayer(function(layer) {
            var feature = layer.feature;
            if (feature && feature.properties) {
                datos.escuelas.push({
                    ...feature.properties,
                    latitud: feature.geometry.coordinates[1],
                    longitud: feature.geometry.coordinates[0]
                });
            }
        });
    }
    
    // Estadísticas resumidas
    datos.estadisticas = {
        totalManzanas: datos.manzanas.length,
        totalEscuelas: datos.escuelas.length,
        poblacionTotal: datos.manzanas.reduce((sum, m) => sum + (parseInt(m.POBTOT) || 0), 0),
        alumnosTotales: datos.escuelas.reduce((sum, e) => sum + (parseInt(e.ALUM_TOT) || 0), 0)
    };
    
    datos.metadata.totalManzanas = datos.manzanas.length;
    datos.metadata.totalEscuelas = datos.escuelas.length;
    
    return datos;
}

function convertirDatosACSV(datos) {
    var csvContent = "DATOS SOCIODEMOGRÁFICOS - EXPORTACIÓN\n\n";
    
    // Metadatos
    csvContent += "METADATOS\n";
    csvContent += `Fecha de exportación,${datos.metadata.fechaExportacion}\n`;
    csvContent += `Total de manzanas,${datos.metadata.totalManzanas}\n`;
    csvContent += `Total de escuelas,${datos.metadata.totalEscuelas}\n`;
    csvContent += `Área de estudio,${datos.metadata.areaEstudio}\n\n`;
    
    // Datos de manzanas
    if (datos.manzanas.length > 0) {
        csvContent += "MANZANAS - DATOS SOCIODEMOGRÁFICOS\n";
        var headersManzanas = Object.keys(datos.manzanas[0]).join(',');
        csvContent += headersManzanas + '\n';
        
        datos.manzanas.forEach(function(manzana) {
            var fila = Object.values(manzana).map(val => 
                typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',');
            csvContent += fila + '\n';
        });
        csvContent += '\n';
    }
    
    // Datos de escuelas
    if (datos.escuelas.length > 0) {
        csvContent += "ESCUELAS - DATOS EDUCATIVOS\n";
        var headersEscuelas = Object.keys(datos.escuelas[0]).join(',');
        csvContent += headersEscuelas + '\n';
        
        datos.escuelas.forEach(function(escuela) {
            var fila = Object.values(escuela).map(val => 
                typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',');
            csvContent += fila + '\n';
        });
    }
    
    return csvContent;
}

function descargarArchivo(contenido, nombre, tipo) {
    var blob = new Blob([contenido], { type: tipo });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function obtenerAreaEstudio() {
    var bounds = mapa.getBounds();
    if (bounds) {
        var centro = bounds.getCenter();
        return `Centro: ${centro.lat.toFixed(4)}, ${centro.lng.toFixed(4)} | Zoom: ${mapa.getZoom()}`;
    }
    return 'Área completa';
}

function exportarReportePDF() {
    actualizarEstado('📑 Generando reporte PDF...');
    
    // Usar html2pdf.js para generar PDF
    var element = document.querySelector('.contenedor-principal');
    
    html2pdf().from(element).set({
        margin: 10,
        filename: 'reporte_sociodemografico.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).save().then(() => {
        actualizarEstado('✅ PDF generado correctamente');
    });
}

function exportarConfiguracion() {
    var configExport = {
        configuracion: CONFIG_MAPA,
        estadisticas: estadisticas,
        fechaExportacion: new Date().toISOString(),
        version: '1.0'
    };
    
    var contenido = JSON.stringify(configExport, null, 2);
    descargarArchivo(contenido, 'configuracion_mapa.json', 'application/json');
    actualizarEstado('✅ Configuración exportada');
}