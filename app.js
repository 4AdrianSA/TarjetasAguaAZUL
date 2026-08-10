console.log('app.js cargo correctamente');
var editandoId = null;

var prefijos = ['sep','oct','nov','dic','ene','feb','mar','abr','may','jun','jul','ago'];
var canal = new BroadcastChannel('publicadores_sync');

function leerCheckboxes(name) {
    return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map(function(cb) { return cb.value; });
}

function calcularSumaHoras() {
    var inputsHoras = document.querySelectorAll('.input-horas');
    var sumaTotal = 0;
    inputsHoras.forEach(function(input) {
        sumaTotal += parseFloat(input.value) || 0;
    });
    var celdaTotal = document.getElementById('total-horas');
    if (celdaTotal) celdaTotal.textContent = sumaTotal;
}

document.querySelectorAll('.input-horas').forEach(function(casilla) {
    casilla.addEventListener('input', calcularSumaHoras);
});

function recolectarDatos() {
    var nombre = document.getElementById('input-nombre').value.trim();
    if (!nombre) {
        mostrarToast('Escribe el nombre del publicador', 'error');
        return null;
    }

    var horasNegativas = false;
    prefijos.forEach(function(p) {
        var h = parseFloat(document.getElementById(p + '-horas').value);
        if (!isNaN(h) && h < 0) horasNegativas = true;
    });
    if (horasNegativas) {
        mostrarToast('Las horas no pueden ser negativas', 'error');
        return null;
    }

    var meses = prefijos.map(function(p) {
        var fila = document.getElementById(p + '-participo');
        var nombreMes = fila ? fila.closest('tr').querySelector('td').textContent.trim() : p;
        return {
            nombre: nombreMes,
            participo: document.getElementById(p + '-participo').checked,
            cursos: parseInt(document.getElementById(p + '-cursos').value) || 0,
            auxiliar: document.getElementById(p + '-auxiliar').checked,
            horas: parseFloat(document.getElementById(p + '-horas').value) || 0,
            notas: document.getElementById(p + '-notas').value
        };
    });

    return {
        id: editandoId || Date.now(),
        nombre: nombre,
        fechaNacimiento: document.getElementById('input-fecha-nacimiento').value,
        fechaBautismo: document.getElementById('fecha-de-bautismo').value,
        anioServicio: document.getElementById('input-anio').value,
        cargo: leerCheckboxes('privilegio'),
        genero: document.querySelector('input[name="genero"]:checked')?.value || '',
        grupo: document.querySelector('input[name="grupo"]:checked')?.value || '',
        grupoNumero: document.getElementById('input-grupo-numero').value,
        rolGrupo: document.querySelector('input[name="rol-grupo"]:checked')?.value || '',
        estado: document.getElementById('input-estado').value || 'Activo',
        observaciones: document.getElementById('input-observaciones').value.trim(),
        meses: meses
    };
}

function limpiarFormulario() {
    document.getElementById('input-nombre').value = '';
    document.getElementById('input-fecha-nacimiento').value = '';
    document.getElementById('fecha-de-bautismo').value = '';
    document.getElementById('input-anio').value = '';
    document.getElementById('input-grupo-numero').value = '';
    document.querySelectorAll('input[name="privilegio"], input[name="genero"], input[name="grupo"], input[name="rol-grupo"]').forEach(function(cb) { cb.checked = false; });
    document.getElementById('input-estado').value = 'Activo';
    document.getElementById('input-observaciones').value = '';
    prefijos.forEach(function(p) {
        document.getElementById(p + '-participo').checked = false;
        document.getElementById(p + '-cursos').value = '';
        document.getElementById(p + '-auxiliar').checked = false;
        document.getElementById(p + '-horas').value = '';
        document.getElementById(p + '-notas').value = '';
    });
    editandoId = null;
    calcularSumaHoras();
}

function renderizarTablaMesesPDF(meses) {
    console.log('renderizarTablaMesesPDF - meses:', meses ? meses.length : 0, meses);
    if (!Array.isArray(meses) || meses.length === 0) return '';

    var mesMap = {};
    meses.forEach(function(m) { mesMap[m.nombre] = m; });

    var totalHoras = 0;
    nombresMeses.forEach(function(nombre) {
        var m = mesMap[nombre];
        if (m) totalHoras += m.horas || 0;
    });

    var html = '<table style="width:100%;table-layout:fixed;border-collapse:collapse;border:2px solid #000;font-size:12px;line-height:1.4;color:#000;">' +
        '<colgroup>' +
        '<col style="width:14%;">' +
        '<col style="width:6%;">' +
        '<col style="width:10%;">' +
        '<col style="width:6%;">' +
        '<col style="width:10%;">' +
        '<col>' +
        '</colgroup>' +
        '<thead><tr style="background:#ddd;">' +
        '<th style="border:2px solid #000;padding:4px 6px;text-align:left;font-weight:bold;color:#000;">Mes</th>' +
        '<th style="border:2px solid #000;padding:4px 6px;text-align:center;font-weight:bold;color:#000;">Part.</th>' +
        '<th style="border:2px solid #000;padding:4px 6px;text-align:center;font-weight:bold;color:#000;">Cursos</th>' +
        '<th style="border:2px solid #000;padding:4px 6px;text-align:center;font-weight:bold;color:#000;">Aux.</th>' +
        '<th style="border:2px solid #000;padding:4px 6px;text-align:center;font-weight:bold;color:#000;">Horas</th>' +
        '<th style="border:2px solid #000;padding:4px 6px;text-align:left;font-weight:bold;color:#000;">Notas</th>' +
        '</tr></thead><tbody>';
    nombresMeses.forEach(function(nombre) {
        var m = mesMap[nombre] || { nombre: nombre, participo: false, cursos: 0, auxiliar: false, horas: 0, notas: '' };
        var nombreCorto = abbr[m.nombre] || m.nombre;
        html += '<tr>' +
            '<td style="border:1px solid #000;padding:4px 6px;color:#000;font-weight:bold;">' + nombreCorto + '</td>' +
            '<td style="border:1px solid #000;padding:4px 6px;text-align:center;color:#000;">' + (m.participo ? '\u2713' : '') + '</td>' +
            '<td style="border:1px solid #000;padding:4px 6px;text-align:center;color:#000;">' + (m.cursos || 0) + '</td>' +
            '<td style="border:1px solid #000;padding:4px 6px;text-align:center;color:#000;">' + (m.auxiliar ? '\u2713' : '') + '</td>' +
            '<td style="border:1px solid #000;padding:4px 6px;text-align:center;color:#000;">' + (m.horas || '') + '</td>' +
            '<td style="border:1px solid #000;padding:4px 6px;color:#000;">' + (m.notas || '') + '</td>' +
            '</tr>';
    });
    html += '<tr style="font-weight:bold;background:#e0e0e0;">' +
        '<td style="border:2px solid #000;padding:4px 6px;color:#000;font-weight:bold;" colspan="3">Total</td>' +
        '<td style="border:2px solid #000;background:#ddd;color:#000;"></td>' +
        '<td style="border:2px solid #000;padding:4px 6px;text-align:center;color:#000;font-weight:bold;">' + totalHoras + '</td>' +
        '<td style="border:2px solid #000;background:#ddd;color:#000;"></td>' +
        '</tr>';
    html += '</tbody></table>';
    return html;
}

function renderizarCheckS21(ficha) {
    var cargos = Array.isArray(ficha.cargo) ? ficha.cargo : (ficha.cargo ? [ficha.cargo] : []);
    var items = [];

    if (ficha.genero === 'Hombre') items.push('Hombre');
    if (ficha.genero === 'Mujer') items.push('Mujer');
    if (ficha.grupo !== 'Ungido') items.push('Otras ovejas');
    if (ficha.grupo === 'Ungido') items.push('Ungido');
    if (cargos.indexOf('Anciano') !== -1) items.push('Anciano');
    if (cargos.indexOf('Siervo ministerial') !== -1) items.push('Siervo ministerial');
    if (cargos.indexOf('Precursor Regular') !== -1) items.push('Prec. regular');
    if (cargos.indexOf('Precursor Especial') !== -1) items.push('Prec. especial');
    if (cargos.indexOf('Misionero que sirve en el campo') !== -1) items.push('Misionero');

    var badges = items.map(function(item) {
        return '<span style="display:inline;font-size:11px;color:#000;font-weight:bold;">\u25A0 ' + item + '</span>';
    }).join(' &nbsp;&nbsp; ');

    return badges;
}

function renderizarFichaPDF(ficha, opciones) {
    opciones = opciones || {};
    var esGrupo = opciones.grupo;
    var nombreGrupo = opciones.nombreGrupo || '';
    var cargo = Array.isArray(ficha.cargo) ? ficha.cargo.join(', ') : ficha.cargo;

    if (esGrupo) {
        var fs = '12px';
        var fsLabel = '11px';
        var pad = '5px 12px';
        var padCell = '4px 8px';

        var wrapStyle = 'border:2px solid #000;margin:0;padding:' + pad +
            ';font-family:Arial,sans-serif;color:#000;background:#fff;width:100%;box-sizing:border-box;' +
            'page-break-inside:avoid;break-inside:avoid;';

        var html = '<div style="' + wrapStyle + '">';

        html += '<div style="text-align:center;margin:0 0 4px 0;padding-bottom:4px;border-bottom:2px solid #000;">' +
            '<h2 style="margin:0;padding:0;font-size:14px;color:#000;font-weight:bold;text-transform:uppercase;letter-spacing:1px;line-height:1.3;">REGISTRO DE PUBLICADOR DE LA CONGREGACI\u00D3N</h2>' +
            (nombreGrupo ? '<p style="margin:2px 0 0 0;font-size:12px;color:#000;font-weight:bold;">' + nombreGrupo + '</p>' : '') +
            '</div>';

        html += '<table style="width:100%;border-collapse:collapse;font-size:' + fs + ';color:#000;font-weight:500;margin:0 0 3px 0;">' +
            '<tr><td style="padding:' + padCell + ';width:55%;"><strong>Nombre:</strong> ' + escapeHtml(ficha.nombre) + '</td>' +
            '<td style="padding:' + padCell + ';width:45%;" rowspan="3">' + renderizarCheckS21(ficha) + '</td></tr>' +
            '<tr><td style="padding:' + padCell + ';"><strong>Fecha de nacimiento:</strong> ' + (ficha.fechaNacimiento || '') + '</td></tr>' +
            '<tr><td style="padding:' + padCell + ';"><strong>Fecha de bautismo:</strong> ' + (ficha.fechaBautismo || '') + '</td></tr>' +
            '<tr><td style="padding:' + padCell + ';"><strong>Grupo N. \u00B0:</strong> ' + (ficha.grupoNumero || '') +
            (ficha.rolGrupo ? ' <strong>Rol:</strong> ' + ficha.rolGrupo : '') + '</td></tr>' +
            (ficha.observaciones ? '<tr><td style="padding:' + padCell + ';font-style:italic;"><strong>Observaciones:</strong> ' + escapeHtml(ficha.observaciones) + '</td></tr>' : '') +
            '</table>';

        html += '<div style="font-size:' + fsLabel + ';color:#000;margin:0 0 3px 0;font-weight:bold;">A\u00F1o de servicio ' + (ficha.anioServicio || new Date().getFullYear()) + '</div>';

        html += renderizarTablaMesesPDF(ficha.meses);

        html += '</div>';
        return html;
    }

    var wrapStyle = 'border:2px solid #000;margin:3px 0;padding:6px 8px;font-family:Arial,sans-serif;color:#000;background:#fff;page-break-inside:avoid;break-inside:avoid;';

    return '<div style="' + wrapStyle + '">' +
        '<div style="border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:4px;">' +
            '<h3 style="margin:0;font-size:13px;color:#000;">' + escapeHtml(ficha.nombre) + '</h3>' +
            '<p style="margin:1px 0 0 0;font-size:10px;color:#333;">' +
                (ficha.grupo ? 'Grupo ' + ficha.grupoNumero : '') +
                (ficha.rolGrupo ? ' - ' + ficha.rolGrupo : '') +
            '</p>' +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:4px;">' +
            '<tr>' +
                '<td style="padding:1px 4px;width:50%;"><strong>Nac:</strong> ' + (ficha.fechaNacimiento || '-') + '</td>' +
                '<td style="padding:1px 4px;width:50%;"><strong>Baut:</strong> ' + (ficha.fechaBautismo || '-') + '</td>' +
            '</tr>' +
            '<tr>' +
                '<td style="padding:1px 4px;"><strong>Serv:</strong> ' + (ficha.anioServicio || '-') + '</td>' +
                '<td style="padding:1px 4px;">' + (cargo || '-') + '</td>' +
            '</tr>' +
            '<tr>' +
                '<td style="padding:1px 4px;"><strong>Genero:</strong> ' + (ficha.genero || '-') + '</td>' +
            '</tr>' +
            (ficha.observaciones ? '<tr><td colspan="2" style="padding:1px 4px;font-style:italic;"><strong>Obs:</strong> ' + escapeHtml(ficha.observaciones) + '</td></tr>' : '') +
        '</table>' +
        (ficha.meses ? renderizarTablaMesesPDF(ficha.meses) : '') +
    '</div>';
}

function pesoFicha(f) {
    var rol = (f.rolGrupo || '').toLowerCase();
    if (rol === 'superintendente de grupo' || rol === 'superintendente') return 0;
    if (rol === 'auxiliar de grupo' || rol === 'auxiliar') return 1;
    var cargos = Array.isArray(f.cargo) ? f.cargo : (f.cargo ? [f.cargo] : []);
    var cargosLower = cargos.map(function(c) { return c.toLowerCase(); });
    if (cargosLower.indexOf('anciano') !== -1) return 2;
    if (cargosLower.indexOf('precursor regular') !== -1) return 3;
    if (cargosLower.indexOf('precursor especial') !== -1) return 4;
    return 5;
}

function ordenarFichas(fichas) {
    return fichas.slice().sort(function(a, b) { return pesoFicha(a) - pesoFicha(b); });
}

function calcularResumenGrupo(datos) {
    var resumen = {
        totalPublicadores: datos.length,
        ancianos: 0,
        siervos: 0,
        precRegTotal: 0,
        precRegHoras: 0,
        precRegCursos: 0,
        precAuxTotal: 0,
        precAuxHoras: 0,
        precAuxCursos: 0,
        precAuxiliar: 0,
        precAuxiliarHoras: 0,
        precAuxiliarCursos: 0,
        pubCursos: 0,
        totalHoras: 0,
        totalCursos: 0,
        porMes: []
    };

    for (var i = 0; i < 12; i++) {
        resumen.porMes.push({
            nombre: nombresMeses[i],
            precRegHoras: 0,
            precRegCursos: 0,
            precRegParticipo: 0,
            precAuxHoras: 0,
            precAuxCursos: 0,
            precAuxParticipo: 0,
            precAuxiliar: 0,
            precAuxiliarHoras: 0,
            precAuxiliarCursos: 0,
            pubCursos: 0,
            pubParticipo: 0,
            totalHoras: 0,
            totalCursos: 0,
            noParticipo: []
        });
    }

    var mesIndexMap = {};
    nombresMeses.forEach(function(n, i) { mesIndexMap[n] = i; });

    datos.forEach(function(f) {
        var estado = f.estado || 'Activo';
        if (estado === 'Inactivo' || estado === 'Baja') return;

        var cargos = Array.isArray(f.cargo) ? f.cargo : (f.cargo ? [f.cargo] : []);
        var esPrecReg = cargos.indexOf('Precursor Regular') !== -1;
        var esPrecAux = cargos.indexOf('Precursor Especial') !== -1;

        if (cargos.indexOf('Anciano') !== -1) resumen.ancianos++;
        if (cargos.indexOf('Siervo ministerial') !== -1) resumen.siervos++;
        if (esPrecReg) resumen.precRegTotal++;
        if (esPrecAux) resumen.precAuxTotal++;

        if (f.meses && Array.isArray(f.meses)) {
            f.meses.forEach(function(m) {
                var idx = mesIndexMap[m.nombre];
                if (idx === undefined) return;
                resumen.totalHoras += m.horas || 0;
                resumen.totalCursos += m.cursos || 0;
                resumen.porMes[idx].totalHoras += m.horas || 0;
                resumen.porMes[idx].totalCursos += m.cursos || 0;

                if (m.participo) {
                    if (esPrecReg) {
                        resumen.precRegHoras += m.horas || 0;
                        resumen.precRegCursos += m.cursos || 0;
                        resumen.porMes[idx].precRegHoras += m.horas || 0;
                        resumen.porMes[idx].precRegCursos += m.cursos || 0;
                        resumen.porMes[idx].precRegParticipo++;
                    }
                    if (esPrecAux) {
                        resumen.precAuxHoras += m.horas || 0;
                        resumen.precAuxCursos += m.cursos || 0;
                        resumen.porMes[idx].precAuxHoras += m.horas || 0;
                        resumen.porMes[idx].precAuxCursos += m.cursos || 0;
                        resumen.porMes[idx].precAuxParticipo++;
                    }
                    if (!esPrecReg && !esPrecAux) {
                        resumen.pubCursos += m.cursos || 0;
                        resumen.porMes[idx].pubParticipo++;
                    }
                    if (m.auxiliar) {
                        resumen.precAuxiliar++;
                        resumen.precAuxiliarHoras += m.horas || 0;
                        resumen.precAuxiliarCursos += m.cursos || 0;
                        resumen.porMes[idx].precAuxiliar++;
                        resumen.porMes[idx].precAuxiliarHoras += m.horas || 0;
                        resumen.porMes[idx].precAuxiliarCursos += m.cursos || 0;
                    }
                } else {
                    resumen.porMes[idx].noParticipo.push({nombre: f.nombre, anioServicio: f.anioServicio || '-'});
                }
            });
        }
    });

    return resumen;
}

function renderizarResumen(resumen, titulo, anioServicio) {
    var mesesCompletos = ['Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'];
    var mesNumMap = {'Septiembre':8,'Octubre':9,'Noviembre':10,'Diciembre':11,'Enero':0,'Febrero':1,'Marzo':2,'Abril':3,'Mayo':4,'Junio':5,'Julio':6,'Agosto':7};
    var mesMap = {};
    if (resumen.porMes) {
        resumen.porMes.forEach(function(m) { mesMap[m.nombre] = m; });
    }

    var anio = parseInt(anioServicio) || new Date().getFullYear();
    var hoy = new Date();
    var fechaMeses = {};
    mesesCompletos.forEach(function(n) {
        var mesCal = mesNumMap[n];
        var anioCal = mesCal >= 8 ? anio - 1 : anio;
        fechaMeses[n] = new Date(anioCal, mesCal + 1, 0);
    });

    var sTh = 'border:2px solid #000;padding:4px 6px;text-align:center;font-weight:bold;color:#000;';
    var sTd = 'border:1px solid #000;padding:4px 6px;text-align:center;color:#000;';
    var sTdL = 'border:1px solid #000;padding:4px 6px;color:#000;font-weight:bold;';
    var sTotal = 'border:2px solid #000;padding:4px 6px;text-align:center;color:#000;font-weight:bold;background:#e0e0e0;';

    var totPR = { cantidad: 0, horas: 0, cursos: 0 };
    var totPA = { cantidad: 0, horas: 0, cursos: 0 };
    var totPaux = { cantidad: 0, horas: 0, cursos: 0 };
    var totPub = { cantidad: 0, cursos: 0 };
    var totInac = { cantidad: 0 };

    mesesCompletos.forEach(function(n) {
        var m = mesMap[n] || { precRegParticipo: 0, precRegHoras: 0, precRegCursos: 0, precAuxParticipo: 0, precAuxHoras: 0, precAuxCursos: 0, precAuxiliar: 0, precAuxiliarHoras: 0, precAuxiliarCursos: 0, pubParticipo: 0, pubCursos: 0, noParticipo: [] };
        totPR.cantidad += m.precRegParticipo;
        totPR.horas += m.precRegHoras || 0;
        totPR.cursos += m.precRegCursos || 0;
        totPA.cantidad += m.precAuxParticipo;
        totPA.horas += m.precAuxHoras || 0;
        totPA.cursos += m.precAuxCursos || 0;
        totPaux.cantidad += m.precAuxiliar;
        totPaux.horas += m.precAuxiliarHoras || 0;
        totPaux.cursos += m.precAuxiliarCursos || 0;
        totPub.cantidad += m.pubParticipo;
        totPub.cursos += m.pubCursos || 0;
        totInac.cantidad += m.noParticipo.length;
    });

    var html = '<div style="clear:both;margin:10px 0;padding:12px;border:2px solid #000;background:#fff;color:#000;">' +
        '<h3 style="margin:0 0 8px 0;border-bottom:1px solid #000;padding-bottom:4px;color:#000;font-size:13px;">Resumen - ' + titulo + '</h3>' +
        '<p style="margin:3px 0;color:#000;font-size:11px;"><strong>Total publicadores:</strong> ' + resumen.totalPublicadores + ' | <strong>Ancianos:</strong> ' + resumen.ancianos + ' | <strong>Siervos ministeriales:</strong> ' + resumen.siervos + '</p>';

    html += '<div style="margin-top:10px;page-break-before:always;page-break-inside:avoid;">' +
        '<h3 style="margin:0 0 6px 0;border-bottom:1px solid #000;padding-bottom:4px;color:#000;font-size:12px;">Precursores Regulares</h3>' +
        '<table style="width:100%;border-collapse:collapse;border:2px solid #000;font-size:12px;line-height:1.4;color:#000;">' +
        '<colgroup><col style="width:20%;"><col style="width:26%;"><col style="width:27%;"><col style="width:27%;"></colgroup>' +
        '<thead><tr style="background:#ddd;">' +
        '<th style="' + sTh + 'text-align:left;">Mes</th>' +
        '<th style="' + sTh + '">Cantidad PR</th>' +
        '<th style="' + sTh + '">Horas PR</th>' +
        '<th style="' + sTh + '">Cursos Bíblicos PR</th>' +
        '</tr></thead><tbody>';
    mesesCompletos.forEach(function(n) {
        var m = mesMap[n] || { precRegParticipo: 0, precRegHoras: 0, precRegCursos: 0 };
        html += '<tr><td style="' + sTdL + '">' + abbr[n] + '</td><td style="' + sTd + '">' + m.precRegParticipo + '</td><td style="' + sTd + '">' + (m.precRegHoras || 0) + '</td><td style="' + sTd + '">' + (m.precRegCursos || 0) + '</td></tr>';
    });
    html += '<tr><td style="' + sTotal + 'text-align:left;">Total</td><td style="' + sTotal + '">' + totPR.cantidad + '</td><td style="' + sTotal + '">' + totPR.horas + '</td><td style="' + sTotal + '">' + totPR.cursos + '</td></tr>';
    html += '</tbody></table></div>';

    html += '<div style="margin-top:10px;page-break-before:always;page-break-inside:avoid;">' +
        '<h3 style="margin:0 0 6px 0;border-bottom:1px solid #000;padding-bottom:4px;color:#000;font-size:12px;">Precursores Especiales</h3>' +
        '<table style="width:100%;border-collapse:collapse;border:2px solid #000;font-size:12px;line-height:1.4;color:#000;">' +
        '<colgroup><col style="width:20%;"><col style="width:26%;"><col style="width:27%;"><col style="width:27%;"></colgroup>' +
        '<thead><tr style="background:#ddd;">' +
        '<th style="' + sTh + 'text-align:left;">Mes</th>' +
        '<th style="' + sTh + '">Cantidad PE</th>' +
        '<th style="' + sTh + '">Horas PE</th>' +
        '<th style="' + sTh + '">Cursos Bíblicos PE</th>' +
        '</tr></thead><tbody>';
    mesesCompletos.forEach(function(n) {
        var m = mesMap[n] || { precAuxParticipo: 0, precAuxHoras: 0, precAuxCursos: 0 };
        html += '<tr><td style="' + sTdL + '">' + abbr[n] + '</td><td style="' + sTd + '">' + m.precAuxParticipo + '</td><td style="' + sTd + '">' + (m.precAuxHoras || 0) + '</td><td style="' + sTd + '">' + (m.precAuxCursos || 0) + '</td></tr>';
    });
    html += '<tr><td style="' + sTotal + 'text-align:left;">Total</td><td style="' + sTotal + '">' + totPA.cantidad + '</td><td style="' + sTotal + '">' + totPA.horas + '</td><td style="' + sTotal + '">' + totPA.cursos + '</td></tr>';
    html += '</tbody></table></div>';

    html += '<div style="margin-top:10px;page-break-before:always;page-break-inside:avoid;">' +
        '<h3 style="margin:0 0 6px 0;border-bottom:1px solid #000;padding-bottom:4px;color:#000;font-size:12px;">Precursor Auxiliar</h3>' +
        '<table style="width:100%;border-collapse:collapse;border:2px solid #000;font-size:12px;line-height:1.4;color:#000;">' +
        '<colgroup><col style="width:20%;"><col style="width:26%;"><col style="width:27%;"><col style="width:27%;"></colgroup>' +
        '<thead><tr style="background:#ddd;">' +
        '<th style="' + sTh + 'text-align:left;">Mes</th>' +
        '<th style="' + sTh + '">Cantidad PA</th>' +
        '<th style="' + sTh + '">Horas PA</th>' +
        '<th style="' + sTh + '">Cursos Bíblicos PA</th>' +
        '</tr></thead><tbody>';
    mesesCompletos.forEach(function(n) {
        var m = mesMap[n] || { precAuxiliar: 0, precAuxiliarHoras: 0, precAuxiliarCursos: 0 };
        html += '<tr><td style="' + sTdL + '">' + abbr[n] + '</td><td style="' + sTd + '">' + m.precAuxiliar + '</td><td style="' + sTd + '">' + (m.precAuxiliarHoras || 0) + '</td><td style="' + sTd + '">' + (m.precAuxiliarCursos || 0) + '</td></tr>';
    });
    html += '<tr><td style="' + sTotal + 'text-align:left;">Total</td><td style="' + sTotal + '">' + totPaux.cantidad + '</td><td style="' + sTotal + '">' + totPaux.horas + '</td><td style="' + sTotal + '">' + totPaux.cursos + '</td></tr>';
    html += '</tbody></table></div>';

    html += '<div style="margin-top:10px;page-break-before:always;page-break-inside:avoid;">' +
        '<h3 style="margin:0 0 6px 0;border-bottom:1px solid #000;padding-bottom:4px;color:#000;font-size:12px;">Publicadores</h3>' +
        '<table style="width:100%;border-collapse:collapse;border:2px solid #000;font-size:12px;line-height:1.4;color:#000;">' +
        '<colgroup><col style="width:20%;"><col style="width:40%;"><col style="width:40%;"></colgroup>' +
        '<thead><tr style="background:#ddd;">' +
        '<th style="' + sTh + 'text-align:left;">Mes</th>' +
        '<th style="' + sTh + '">Publicadores que informaron</th>' +
        '<th style="' + sTh + '">Cursos Bíblicos</th>' +
        '</tr></thead><tbody>';
    mesesCompletos.forEach(function(n) {
        var m = mesMap[n] || { pubParticipo: 0, pubCursos: 0 };
        html += '<tr><td style="' + sTdL + '">' + abbr[n] + '</td><td style="' + sTd + '">' + m.pubParticipo + '</td><td style="' + sTd + '">' + (m.pubCursos || 0) + '</td></tr>';
    });
    html += '<tr><td style="' + sTotal + 'text-align:left;">Total</td><td style="' + sTotal + '">' + totPub.cantidad + '</td><td style="' + sTotal + '">' + totPub.cursos + '</td></tr>';
    html += '</tbody></table></div>';

    html += '<div style="margin-top:10px;page-break-before:always;page-break-inside:avoid;">' +
        '<h3 style="margin:0 0 6px 0;border-bottom:1px solid #000;padding-bottom:4px;color:#000;font-size:12px;">Registro de Publicadores que NO Informaron</h3>' +
        '<p style="margin:2px 0 6px 0;color:#666;font-size:10px;">Meses futuros se muestran como "-". A\u00F1o de servicio: ' + anio + ' (' + anio + '-' + (anio + 1) + ')</p>' +
        '<table style="width:100%;border-collapse:collapse;border:2px solid #000;font-size:12px;line-height:1.4;color:#000;">' +
        '<colgroup><col style="width:14%;"><col style="width:10%;"><col style="width:76%;"></colgroup>' +
        '<thead><tr style="background:#ddd;">' +
        '<th style="' + sTh + 'text-align:left;">Mes</th>' +
        '<th style="' + sTh + '">Cantidad</th>' +
        '<th style="' + sTh + 'text-align:left;">Nombres</th>' +
        '</tr></thead><tbody>';
    mesesCompletos.forEach(function(n) {
        var m = mesMap[n] || { noParticipo: [] };
        var esFuturo = fechaMeses[n] > hoy;
        var nombres = esFuturo ? '-' : (m.noParticipo.map(function(p) { return p.nombre; }).join(', ') || '-');
        var cantidad = esFuturo ? '-' : m.noParticipo.length;
        var estiloFila = esFuturo ? 'color:#999;' : '';
        html += '<tr style="' + estiloFila + '"><td style="' + sTdL + '">' + abbr[n] + '</td><td style="' + sTd + '">' + cantidad + '</td><td style="border:1px solid #000;padding:4px 6px;color:' + (esFuturo ? '#999' : '#000') + ';">' + nombres + '</td></tr>';
    });
    html += '</tbody></table></div>';

    html += '<div style="margin-top:10px;page-break-before:always;page-break-inside:avoid;">' +
        '<h3 style="margin:0 0 6px 0;border-bottom:1px solid #000;padding-bottom:4px;color:#000;font-size:12px;">Gran Total del Año de Servicio</h3>' +
        '<table style="width:100%;border-collapse:collapse;border:2px solid #000;font-size:12px;line-height:1.4;color:#000;">' +
        '<colgroup><col style="width:30%;"><col style="width:35%;"><col style="width:35%;"></colgroup>' +
        '<thead><tr style="background:#ddd;">' +
        '<th style="' + sTh + 'text-align:left;">Concepto</th>' +
        '<th style="' + sTh + '">Horas</th>' +
        '<th style="' + sTh + '">Cursos Bíblicos</th>' +
        '</tr></thead><tbody>' +
        '<tr><td style="' + sTdL + '">Precursores Regulares</td><td style="' + sTd + '">' + totPR.horas + '</td><td style="' + sTd + '">' + totPR.cursos + '</td></tr>' +
        '<tr><td style="' + sTdL + '">Precursores Especiales</td><td style="' + sTd + '">' + totPA.horas + '</td><td style="' + sTd + '">' + totPA.cursos + '</td></tr>' +
        '<tr><td style="' + sTdL + '">Precursor Auxiliar</td><td style="' + sTd + '">' + totPaux.horas + '</td><td style="' + sTd + '">' + totPaux.cursos + '</td></tr>' +
        '<tr><td style="' + sTdL + '">Publicadores</td><td style="' + sTd + '">-</td><td style="' + sTd + '">' + totPub.cursos + '</td></tr>' +
        '<tr><td style="' + sTotal + 'text-align:left;">TOTAL GENERAL</td><td style="' + sTotal + '">' + resumen.totalHoras + '</td><td style="' + sTotal + '">' + resumen.totalCursos + '</td></tr>' +
        '</tbody></table></div>';

    html += '</div>';
    return html;
}


function generarPDFFicha(ficha, opciones) {
    opciones = opciones || {};
    var tempDiv = document.createElement('div');
    tempDiv.style.color = '#000000';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.padding = '15px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.width = '680px';
    tempDiv.style.filter = 'grayscale(1)';
    tempDiv.style.webkitFilter = 'grayscale(1)';

    var titulo = opciones.titulo || 'Ficha de Registro';
    tempDiv.innerHTML = '<h1 style="text-align:center;color:#000;margin-bottom:5px;">' + titulo + '</h1>' +
        renderizarFichaPDF(ficha);

    if (opciones.resumen) {
        tempDiv.innerHTML += renderizarResumen(opciones.resumen, opciones.resumenTitulo || 'Resumen', opciones.anioServicio);
    }

    document.body.appendChild(tempDiv);

    setTimeout(function() {
        html2pdf().set({
            margin: 10,
            filename: opciones.filename || ('Ficha_' + (ficha.nombre || 'Publicador') + '.pdf'),
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['css'] }
        }).from(tempDiv).save().then(function() {
            if (tempDiv.parentNode) document.body.removeChild(tempDiv);
        }).catch(function(err) {
            console.error('Error generando PDF:', err);
            alert('Error al generar PDF: ' + err.message);
            if (tempDiv.parentNode) document.body.removeChild(tempDiv);
        });
    }, 100);
}

function renderizarFicha(ficha) {
    var cargo = Array.isArray(ficha.cargo) ? ficha.cargo.join(', ') : ficha.cargo;
    var estado = ficha.estado || 'Activo';
    var estadoBadge = '';
    var fichaClassExtra = '';
    if (estado === 'Inactivo') {
        estadoBadge = ' <span class="badge-estado badge-estado-inactivo">INACTIVO</span>';
        fichaClassExtra = ' estado-inactivo';
    } else if (estado === 'Baja') {
        estadoBadge = ' <span class="badge-estado badge-estado-baja">BAJA</span>';
        fichaClassExtra = ' estado-baja';
    }

    var rowClass = '';
    if (estado === 'Inactivo') rowClass = ' fila-inactivo';
    if (estado === 'Baja') rowClass = ' fila-baja';

    var html = '<div class="ficha' + fichaClassExtra + '" data-id="' + ficha.id + '">' +
        '<div class="ficha-header">' +
            '<h3>' + escapeHtml(ficha.nombre) + estadoBadge + '</h3>' +
            '<div class="ficha-botones">' +
                '<button class="btn-pdf-ficha" data-id="' + ficha.id + '">📄 PDF</button>' +
                '<button class="btn-editar">✏️ Editar</button>' +
                '<button class="btn-cambiar-grupo" style="background-color:#7dcfff;color:#1a1b26;">🔄 Cambiar Grupo</button>' +
                '<button class="btn-eliminar">🗑️ Eliminar</button>' +
            '</div>' +
        '</div>' +
        '<div class="ficha-datos">' +
            '<p><strong>Grupo:</strong> ' + (ficha.grupoNumero || '-') + '</p>' +
            '<p><strong>Rol:</strong> ' + (ficha.rolGrupo || '-') + '</p>' +
            '<p><strong>Nacimiento:</strong> ' + (ficha.fechaNacimiento || '-') + '</p>' +
            '<p><strong>Bautismo:</strong> ' + (ficha.fechaBautismo || '-') + '</p>' +
            '<p><strong>Servicio:</strong> ' + (ficha.anioServicio || '-') + '</p>' +
            '<p><strong>Cargo:</strong> ' + (cargo || '-') + '</p>' +
            '<p><strong>Genero:</strong> ' + (ficha.genero || '-') + '</p>' +
            '<p><strong>Estado:</strong> ' + estado + '</p>' +
            (ficha.observaciones ? '<p style="grid-column:1/-1;"><strong>Observaciones:</strong> <em>' + escapeHtml(ficha.observaciones) + '</em></p>' : '') +
        '</div>';

    if (ficha.meses && Array.isArray(ficha.meses)) {
        var mesMapAll = {};
        ficha.meses.forEach(function(m) { mesMapAll[m.nombre] = m; });
        html += '<div class="table-responsive"><table class="ficha-tabla"><thead><tr>' +
            '<th>Mes</th><th>Part.</th><th>Cursos</th><th>Aux.</th><th>Horas</th><th>Notas</th>' +
            '</tr></thead><tbody>';
        nombresMeses.forEach(function(nombre) {
            var m = mesMapAll[nombre] || { nombre: nombre, participo: false, cursos: 0, auxiliar: false, horas: 0, notas: '' };
            html += '<tr class="' + rowClass + '">' +
                '<td>' + m.nombre + '</td>' +
                '<td>' + (m.participo ? '\u2713' : '') + '</td>' +
                '<td>' + (m.cursos || 0) + '</td>' +
                '<td>' + (m.auxiliar ? '\u2713' : '') + '</td>' +
                '<td>' + (m.horas || '') + '</td>' +
                '<td>' + (m.notas || '') + '</td>' +
                '</tr>';
        });
        html += '</tbody></table></div>';
    }

    html += '</div>';
    return html;
}

function mostrarFichas(lista) {
    var contenedor = document.getElementById('fichas-guardadas');
    if (!lista || lista.length === 0) {
        contenedor.innerHTML = '<p>No hay fichas guardadas aun.</p>';
        return;
    }

    var grupos = {};
    lista.forEach(function(f) {
        var num = f.grupoNumero || 'Sin grupo';
        if (!grupos[num]) grupos[num] = [];
        grupos[num].push(f);
    });

    var ordenGrupos = Object.keys(grupos).sort(function(a, b) {
        if (a === 'Sin grupo') return 1;
        if (b === 'Sin grupo') return -1;
        return parseInt(a) - parseInt(b);
    });

    var html = '';
    ordenGrupos.forEach(function(num) {
        html += '<div class="grupo-seccion">';
        html += '<div class="grupo-header">Grupo ' + num + ' (' + grupos[num].length + ' miembros)</div>';
        grupos[num].forEach(function(f) {
            html += renderizarFicha(f);
        });
        html += '</div>';
    });
    contenedor.innerHTML = html;

    contenedor.querySelectorAll('.btn-pdf-ficha').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var fichaId = parseInt(btn.dataset.id);
            var listaAll = cargarLista();
            var fichaEncontrada = null;
            for (var i = 0; i < listaAll.length; i++) {
                if (listaAll[i].id === fichaId) { fichaEncontrada = listaAll[i]; break; }
            }
            if (!fichaEncontrada) { alert('No se encontro la ficha.'); return; }
            generarPDFFicha(fichaEncontrada);
        });
    });

    actualizarSelectorGrupos(ordenGrupos);
    actualizarContadorFaltantes();
}

function actualizarSelectorGrupos(ordenGrupos) {
    var select = document.getElementById('select-grupo-pdf');
    var valorActual = select.value;
    select.innerHTML = '<option value="todos">Todos</option>';
    if (ordenGrupos) {
        ordenGrupos.forEach(function(num) {
            var opt = document.createElement('option');
            opt.value = num;
            opt.textContent = 'Grupo ' + num;
            select.appendChild(opt);
        });
    }
    if (valorActual) select.value = valorActual;
}

function contarFaltantes(lista) {
    return lista.filter(function(f) {
        if ((f.estado || 'Activo') === 'Baja') return false;
        if (f.faltanFechasNoAplica) return false;
        return !f.fechaNacimiento || !f.fechaBautismo;
    }).length;
}

function actualizarContadorFaltantes() {
    var btn = document.getElementById('btn-faltantes');
    if (!btn) return;
    btn.textContent = '📋 Fechas Faltantes (' + contarFaltantes(cargarLista()) + ')';
}

function renderizarFaltantes() {
    var panel = document.getElementById('faltantes-panel');
    var lista = cargarLista();

    var faltantes = lista.filter(function(f) {
        if ((f.estado || 'Activo') === 'Baja') return false;
        if (f.faltanFechasNoAplica) return false;
        return !f.fechaNacimiento || !f.fechaBautismo;
    });
    var marcados = lista.filter(function(f) { return f.faltanFechasNoAplica; });

    var btn = document.getElementById('btn-faltantes');
    if (btn) btn.textContent = '📋 Fechas Faltantes (' + faltantes.length + ')';
    if (!panel) return;

    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
        '<h3 style="margin:0;color:#7aa2f7;font-size:16px;">Fechas faltantes (' + faltantes.length + ')</h3>' +
        '<button id="btn-cerrar-faltantes" style="background:#f7768e;color:#1a1b26;border:none;border-radius:4px;padding:5px 12px;cursor:pointer;font-weight:bold;">Cerrar</button>' +
        '</div>';

    if (faltantes.length === 0) {
        html += '<p style="margin:8px 0;color:#c0caf5;">No hay fechas faltantes. 🎉</p>';
    } else {
        faltantes.forEach(function(f) {
            var faltas = [];
            if (!f.fechaNacimiento) faltas.push('Nacimiento');
            if (!f.fechaBautismo) faltas.push('Bautismo');
            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid #292e42;flex-wrap:wrap;">' +
                '<div style="color:#c0caf5;"><strong>' + escapeHtml(f.nombre) + '</strong> <span style="color:#565f89;font-size:12px;">(Grupo ' + (f.grupoNumero || 'Sin grupo') + ')</span><br>' +
                '<span style="font-size:12px;color:#ff9e64;">Falta: ' + faltas.join(' y ') + '</span></div>' +
                '<button class="btn-falta-noaplica" data-id="' + f.id + '" style="background:#e0af68;color:#1a1b26;border:none;border-radius:4px;padding:6px 14px;cursor:pointer;font-weight:bold;">No aplica</button>' +
                '</div>';
        });
    }

    if (marcados.length > 0) {
        html += '<h4 style="margin:15px 0 5px 0;color:#7aa2f7;font-size:13px;">Marcados como "No aplica" (' + marcados.length + ')</h4>';
        marcados.forEach(function(f) {
            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-bottom:1px solid #292e42;flex-wrap:wrap;">' +
                '<div style="color:#565f89;font-size:13px;"><strong>' + escapeHtml(f.nombre) + '</strong> <span style="font-size:11px;">(Grupo ' + (f.grupoNumero || 'Sin grupo') + ')</span></div>' +
                '<button class="btn-falta-restaurar" data-id="' + f.id + '" style="background:#7dcfff;color:#1a1b26;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;font-weight:bold;">Restaurar</button>' +
                '</div>';
        });
    }

    panel.innerHTML = html;
}

document.getElementById('btn-faltantes').addEventListener('click', function() {
    var panel = document.getElementById('faltantes-panel');
    if (panel.style.display === 'none' || panel.style.display === '') {
        renderizarFaltantes();
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
});

document.getElementById('faltantes-panel').addEventListener('click', function(e) {
    if (e.target.id === 'btn-cerrar-faltantes') {
        document.getElementById('faltantes-panel').style.display = 'none';
        return;
    }
    var noaplica = e.target.closest('.btn-falta-noaplica');
    if (noaplica) {
        var lista = cargarLista();
        var idN = parseInt(noaplica.dataset.id);
        var fichaN = null;
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].id === idN) { fichaN = lista[i]; break; }
        }
        if (fichaN) {
            fichaN.faltanFechasNoAplica = true;
            guardarLista(lista);
            renderizarFaltantes();
        }
        return;
    }
    var restaurar = e.target.closest('.btn-falta-restaurar');
    if (restaurar) {
        var lista2 = cargarLista();
        var idR = parseInt(restaurar.dataset.id);
        var fichaR = null;
        for (var j = 0; j < lista2.length; j++) {
            if (lista2[j].id === idR) { fichaR = lista2[j]; break; }
        }
        if (fichaR) {
            delete fichaR.faltanFechasNoAplica;
            guardarLista(lista2);
            renderizarFaltantes();
        }
        return;
    }
});

cargarDatosIniciales(function() {

document.getElementById('btn-guardar').addEventListener('click', function() {
    var ficha = recolectarDatos();
    if (!ficha) return;

    var lista = cargarLista();

    if (editandoId !== null) {
        var idx = -1;
        for (var i = 0; i < lista.length; i++) {
            if (Number(lista[i].id) === Number(editandoId)) { idx = i; break; }
        }
        if (idx !== -1) lista[idx] = ficha;
        editandoId = null;
    } else {
        lista.push(ficha);
    }

    guardarLista(lista);
    mostrarToast('Guardado: ' + ficha.nombre, 'ok');
    mostrarFichas(lista);
    limpiarFormulario();
});

document.getElementById('btn-ver').addEventListener('click', function() {
    mostrarFichas(cargarLista());
});

document.getElementById('input-buscar').addEventListener('input', function() {
    var texto = this.value.toLowerCase().trim();
    var lista = cargarLista();
    var filtrada = filtrarPorGrupoYEstado(lista);
    if (!texto) {
        mostrarFichas(filtrada);
        return;
    }
    filtrada = filtrada.filter(function(f) {
        return f.nombre.toLowerCase().indexOf(texto) !== -1;
    });
    mostrarFichas(filtrada);
});

function filtrarPorGrupoYEstado(lista) {
    var grupo = document.getElementById('select-grupo-pdf').value;
    var estado = document.getElementById('select-estado').value;
    var filtrada = lista;
    if (grupo !== 'todos') {
        filtrada = filtrada.filter(function(f) { return String(f.grupoNumero) === String(grupo); });
    }
    if (estado !== 'todos') {
        filtrada = filtrada.filter(function(f) { return (f.estado || 'Activo') === estado; });
    }
    return filtrada;
}

document.getElementById('select-grupo-pdf').addEventListener('change', function() {
    var lista = cargarLista();
    mostrarFichas(filtrarPorGrupoYEstado(lista));
});

document.getElementById('select-estado').addEventListener('change', function() {
    var lista = cargarLista();
    mostrarFichas(filtrarPorGrupoYEstado(lista));
});

document.getElementById('fichas-guardadas').addEventListener('click', function(e) {
    var fichaEl = e.target.closest('.ficha');
    if (!fichaEl) return;
    var id = parseInt(fichaEl.dataset.id);

    if (e.target.classList.contains('btn-pdf-ficha')) {
        e.stopPropagation();
        return;
    }

    if (e.target.classList.contains('btn-editar')) {
        e.stopPropagation();
        var lista2 = cargarLista();
        var ficha2 = null;
        for (var j = 0; j < lista2.length; j++) {
            if (lista2[j].id === id) { ficha2 = lista2[j]; break; }
        }
        if (!ficha2) return;

        var cargoArr = Array.isArray(ficha2.cargo) ? ficha2.cargo : (ficha2.cargo ? [ficha2.cargo] : []);

        document.getElementById('input-nombre').value = ficha2.nombre || '';
        document.getElementById('input-fecha-nacimiento').value = ficha2.fechaNacimiento || '';
        document.getElementById('fecha-de-bautismo').value = ficha2.fechaBautismo || '';
        document.getElementById('input-anio').value = ficha2.anioServicio || '';
        document.getElementById('input-grupo-numero').value = ficha2.grupoNumero || '';

        document.querySelectorAll('input[name="privilegio"]').forEach(function(cb) {
            cb.checked = cargoArr.indexOf(cb.value) !== -1;
        });
        if (ficha2.genero) {
            var genRadio = document.querySelector('input[name="genero"][value="' + ficha2.genero + '"]');
            if (genRadio) genRadio.checked = true;
        }
        if (ficha2.grupo) {
            var grupRadio = document.querySelector('input[name="grupo"][value="' + ficha2.grupo + '"]');
            if (grupRadio) grupRadio.checked = true;
        }
        if (ficha2.rolGrupo) {
            var rolRadio = document.querySelector('input[name="rol-grupo"][value="' + ficha2.rolGrupo + '"]');
            if (rolRadio) rolRadio.checked = true;
        }

        document.getElementById('input-estado').value = ficha2.estado || 'Activo';
        document.getElementById('input-observaciones').value = ficha2.observaciones || '';

        if (ficha2.meses && Array.isArray(ficha2.meses)) {
            ficha2.meses.forEach(function(m, i) {
                if (i < prefijos.length) {
                    document.getElementById(prefijos[i] + '-participo').checked = m.participo || false;
                    document.getElementById(prefijos[i] + '-cursos').value = m.cursos || '';
                    document.getElementById(prefijos[i] + '-auxiliar').checked = m.auxiliar || false;
                    document.getElementById(prefijos[i] + '-horas').value = m.horas || '';
                    document.getElementById(prefijos[i] + '-notas').value = m.notas || '';
                }
            });
        }

        editandoId = id;
        fichaEl.style.opacity = '0.5';
        fichaEl.style.border = '2px solid #e0af68';
        document.querySelectorAll('.ficha').forEach(function(el) {
            if (el !== fichaEl) el.style.opacity = '1';
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        mostrarToast('Editando: ' + ficha2.nombre, 'ok');
        return;
    }

    if (e.target.classList.contains('btn-eliminar')) {
        e.stopPropagation();
        if (!confirm('Eliminar a ' + (fichaEl.querySelector('h3')?.textContent || 'este publicador') + '?')) return;
        var lista3 = cargarLista();
        var nueva = [];
        for (var k = 0; k < lista3.length; k++) {
            if (lista3[k].id !== id) nueva.push(lista3[k]);
        }
        guardarLista(nueva);
        mostrarFichas(nueva);
        return;
    }

    if (e.target.classList.contains('btn-cambiar-grupo')) {
        e.stopPropagation();
        var lista4 = cargarLista();
        var ficha4 = null;
        for (var m = 0; m < lista4.length; m++) {
            if (Number(lista4[m].id) === id) { ficha4 = lista4[m]; break; }
        }
        if (!ficha4) return;

        window._fichaCambioGrupo = ficha4;
        document.getElementById('nombre-cambio-grupo').textContent = ficha4.nombre;
        document.getElementById('grupo-actual-cambio').textContent = ficha4.grupoNumero || 'Sin grupo';
        var sel = document.getElementById('select-nuevo-grupo');
        sel.value = ficha4.grupoNumero || '';
        document.getElementById('grupo-nuevo-label').textContent = sel.options[sel.selectedIndex].text;
        document.getElementById('modal-cambiar-grupo').style.display = 'flex';
        return;
    }
});

document.getElementById('select-nuevo-grupo').addEventListener('change', function() {
    var label = this.options[this.selectedIndex].text;
    document.getElementById('grupo-nuevo-label').textContent = label;
});

document.getElementById('btn-confirmar-cambio-grupo').addEventListener('click', function() {
    var ficha = window._fichaCambioGrupo;
    if (!ficha) return;

    var nuevoGrupo = document.getElementById('select-nuevo-grupo').value;
    var lista = cargarLista();
    for (var i = 0; i < lista.length; i++) {
        if (Number(lista[i].id) === Number(ficha.id)) {
            lista[i].grupoNumero = nuevoGrupo;
            break;
        }
    }
    guardarLista(lista);
    mostrarFichas(lista);
    document.getElementById('modal-cambiar-grupo').style.display = 'none';
    mostrarToast('Grupo de ' + ficha.nombre + ' cambiado a ' + (nuevoGrupo || 'Sin grupo'), 'ok');
    window._fichaCambioGrupo = null;
});

document.getElementById('btn-cancelar-cambio-grupo').addEventListener('click', function() {
    document.getElementById('modal-cambiar-grupo').style.display = 'none';
    window._fichaCambioGrupo = null;
});

document.getElementById('btn-generar-pdf').addEventListener('click', function() {
    var nombre = document.getElementById('input-nombre').value || 'Publicador';
    var fechaNac = document.getElementById('input-fecha-nacimiento').value || '';
    var fechaBau = document.getElementById('fecha-de-bautismo').value || '';
    var anio = document.getElementById('input-anio').value || '';
    var cargo = leerCheckboxes('privilegio');
    var genero = document.querySelector('input[name="genero"]:checked')?.value || '';
    var grupo = document.querySelector('input[name="grupo"]:checked')?.value || '';
    var grupoNum = document.getElementById('input-grupo-numero').value || '';
    var rol = document.querySelector('input[name="rol-grupo"]:checked')?.value || '';

    var meses = prefijos.map(function(p) {
        return {
            nombre: document.getElementById(p + '-participo').closest('tr').querySelector('td').textContent.trim(),
            participo: document.getElementById(p + '-participo').checked,
            cursos: parseInt(document.getElementById(p + '-cursos').value) || 0,
            auxiliar: document.getElementById(p + '-auxiliar').checked,
            horas: parseFloat(document.getElementById(p + '-horas').value) || 0,
            notas: document.getElementById(p + '-notas').value
        };
    });

    var ficha = {
        nombre: nombre,
        fechaNacimiento: fechaNac,
        fechaBautismo: fechaBau,
        anioServicio: anio,
        cargo: cargo,
        genero: genero,
        grupo: grupo,
        grupoNumero: grupoNum,
        rolGrupo: rol,
        meses: meses
    };

    generarPDFFicha(ficha);
});

document.getElementById('btn-pdf-grupo').addEventListener('click', function() {
    var lista = cargarLista();
    var valor = document.getElementById('select-grupo-pdf').value;
    var estadoFiltro = document.getElementById('select-estado').value;
    var grupoNombre = valor === 'todos' ? 'Todos los grupos' : 'Grupo ' + valor;

    var listaFiltrada = lista.filter(function(f) {
        var estado = f.estado || 'Activo';
        if (estadoFiltro !== 'todos' && estado !== estadoFiltro) return false;
        return true;
    });

    var datos;
    if (valor === 'todos') {
        var gruposMap = {};
        var gruposOrden = [];
        for (var g = 0; g < listaFiltrada.length; g++) {
            var num = listaFiltrada[g].grupoNumero || 'Sin grupo';
            if (!gruposMap[num]) { gruposMap[num] = []; gruposOrden.push(num); }
            gruposMap[num].push(listaFiltrada[g]);
        }
        gruposOrden.sort(function(a, b) { return parseInt(a) - parseInt(b); });
        datos = [];
        for (var gi = 0; gi < gruposOrden.length; gi++) {
            datos.push({ subtitulo: 'Grupo ' + gruposOrden[gi], fichas: gruposMap[gruposOrden[gi]] });
        }
    } else {
        datos = [{ subtitulo: null, fichas: listaFiltrada.filter(function(f) { return String(f.grupoNumero) === String(valor); }) }];
    }

    var totalPub = 0;
    datos.forEach(function(d) { totalPub += d.fichas.length; });
    if (totalPub === 0) {
        alert('No hay publicadores activos en este grupo.');
        return;
    }

    var paginas = [];
    paginas.push('<div style="margin:0;padding:5px 15px 0 15px;">' +
        '<h1 style="text-align:center;color:#000;margin:0;padding:0;font-size:16px;line-height:1.3;">' + grupoNombre + '</h1>' +
        '<p style="text-align:center;color:#333;margin:0;padding:0 0 2px 0;font-size:11px;line-height:1.3;">Total: ' + totalPub + ' publicadores</p>' +
        '</div>');

    for (var d = 0; d < datos.length; d++) {
        var bloque = datos[d];
        var nombreBloque = bloque.subtitulo || grupoNombre;
        var fichasOrdenadas = ordenarFichas(bloque.fichas);
        for (var f = 0; f < fichasOrdenadas.length; f++) {
            paginas.push('<div style="margin:0;padding:0 15px;">' + renderizarFichaPDF(fichasOrdenadas[f], { grupo: true, nombreGrupo: nombreBloque }) + '</div>');
        }
    }

    var allFichas = [];
    datos.forEach(function(dd) { allFichas = allFichas.concat(ordenarFichas(dd.fichas)); });
    var resumen = calcularResumenGrupo(allFichas);

    var aniosCount = {};
    allFichas.forEach(function(ff) {
        var a = ff.anioServicio || String(new Date().getFullYear());
        aniosCount[a] = (aniosCount[a] || 0) + 1;
    });
    var anioMasComun = Object.keys(aniosCount).sort(function(a, b) { return aniosCount[b] - aniosCount[a]; })[0] || String(new Date().getFullYear());

    paginas.push('<div style="padding:15px;">' + renderizarResumen(resumen, grupoNombre, anioMasComun) + '</div>');

    var btnGrupo = document.getElementById('btn-pdf-grupo');
    btnGrupo.disabled = true;
    btnGrupo.style.opacity = '0.6';
    renderizarPaginasAPDF(paginas, 'Grupo_' + valor + '.pdf', function() {
        btnGrupo.disabled = false;
        btnGrupo.style.opacity = '1';
    }, allFichas.length);
});

canal.onmessage = function(e) {
    if (e.data === 'actualizar') {
        var local = JSON.parse(localStorage.getItem('publicadores')) || [];
        cacheLista = local.filter(function(f) { return f && f.nombre; });
        mostrarFichas(cargarLista());
    }
};

window.addEventListener('storage', function(e) {
    if (e.key === 'publicadores') {
        var local = JSON.parse(localStorage.getItem('publicadores')) || [];
        cacheLista = local.filter(function(f) { return f && f.nombre; });
        mostrarFichas(cargarLista());
    }
});

document.getElementById('btn-nuevo-anio').addEventListener('click', function() {
    var lista = cargarLista();
    var aniosExistentes = {};
    lista.forEach(function(f) {
        if (f.anioServicio) aniosExistentes[f.anioServicio] = true;
    });

    var ultimoAnio = 0;
    lista.forEach(function(f) {
        var a = parseInt(f.anioServicio);
        if (a && a > ultimoAnio) ultimoAnio = a;
    });
    var anioSugerido;
    if (ultimoAnio) {
        anioSugerido = ultimoAnio + 1;
    } else {
        var ahora = new Date();
        var mesActual = ahora.getMonth();
        anioSugerido = mesActual >= 8 ? ahora.getFullYear() : ahora.getFullYear() - 1;
    }

    var nuevoAnio = prompt('Ano de servicio nuevo (Septiembre a Agosto):', anioSugerido);
    if (!nuevoAnio) return;
    nuevoAnio = parseInt(nuevoAnio);
    if (isNaN(nuevoAnio) || nuevoAnio < 2000 || nuevoAnio > 2099) {
        alert('Ano invalido.');
        return;
    }

    var yaExiste = lista.some(function(f) { return f.anioServicio == nuevoAnio; });
    if (yaExiste) {
        if (!confirm('Ya existen publicadores con ano ' + nuevoAnio + '. ¿Deseas agregar duplicados?')) return;
    }

    var activos = lista.filter(function(f) {
        return (f.estado || 'Activo') !== 'Baja';
    });

    if (activos.length === 0) {
        alert('No hay publicadores activos para clonar.');
        return;
    }

    if (!confirm('Se crearan ' + activos.length + ' fichas nuevas para el ano ' + nuevoAnio + ' con datos personales intactos y registros mensuales vacios. Los datos del ano anterior se conservan.\n\n¿Continuar?')) return;

    var mesesVacios = ['Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'].map(function(nombre) {
        return { nombre: nombre, participo: false, cursos: 0, auxiliar: false, horas: 0, notas: '' };
    });

    var nuevasFichas = activos.map(function(f) {
        return {
            id: Date.now() + Math.floor(Math.random() * 10000),
            nombre: f.nombre,
            fechaNacimiento: f.fechaNacimiento,
            fechaBautismo: f.fechaBautismo,
            anioServicio: String(nuevoAnio),
            cargo: Array.isArray(f.cargo) ? f.cargo.slice() : f.cargo,
            genero: f.genero,
            grupo: f.grupo,
            grupoNumero: f.grupoNumero,
            rolGrupo: f.rolGrupo,
            estado: f.estado || 'Activo',
            observaciones: '',
            meses: mesesVacios
        };
    });

    var listaCompleta = lista.concat(nuevasFichas);
    guardarLista(listaCompleta);
    alert('Listo! Se crearon ' + nuevasFichas.length + ' fichas para el ano ' + nuevoAnio + '.');
    mostrarFichas(listaCompleta);
});

document.getElementById('btn-exportar').addEventListener('click', function() {
    var lista = cargarLista();
    if (lista.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }
    var datos = {
        fecha: new Date().toISOString(),
        congregacion: 'Congregacion Agua Azul',
        publicadores: lista
    };
    var blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var hoy = new Date();
    var fechaStr = hoy.getFullYear() + '-' + String(hoy.getMonth()+1).padStart(2,'0') + '-' + String(hoy.getDate()).padStart(2,'0');
    a.download = 'Backup_Publicadores_' + fechaStr + '.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('Backup exportado: ' + a.download);
});

document.getElementById('btn-importar').addEventListener('click', function() {
    document.getElementById('input-importar').click();
});

document.getElementById('input-importar').addEventListener('change', function(e) {
    var archivo = e.target.files[0];
    if (!archivo) return;
    var lector = new FileReader();
    lector.onload = function(ev) {
        try {
            var datos = JSON.parse(ev.target.result);
            if (!datos.publicadores || !Array.isArray(datos.publicadores)) {
                alert('Archivo de backup invalido.');
                return;
            }
            var total = datos.publicadores.length;
            if (!confirm('Se importaran ' + total + ' publicadores.\nEsto REEMPLAZARA todos los datos actuales.\n\nFecha del backup: ' + (datos.fecha || 'desconocida') + '\n\n¿Continuar?')) return;
            guardarLista(datos.publicadores);
            mostrarFichas(datos.publicadores);
            alert('Backup importado correctamente: ' + total + ' publicadores.');
        } catch(err) {
            alert('Error al leer el archivo: ' + err.message);
        }
    };
    lector.readAsText(archivo);
    e.target.value = '';
});

document.getElementById('btn-resumen-sucursal').addEventListener('click', function() {
    var mesIdx = prompt('Numero del mes (0=Sept, 1=Oct, ... 11=Ago):', '0');
    if (mesIdx === null) return;
    mesIdx = parseInt(mesIdx);
    if (isNaN(mesIdx) || mesIdx < 0 || mesIdx > 11) { alert('Mes invalido.'); return; }

    var anioPrompt = prompt('Año de servicio (ej: 2025, 2026):', '2025');
    if (anioPrompt === null) return;
    var anioServicio = anioPrompt.trim();
    if (!anioServicio) { alert('Año invalido.'); return; }

    var lista = cargarLista();
    var activos = lista.filter(function(f) {
        return (f.estado || 'Activo') === 'Activo' && String(f.anioServicio || '') === anioServicio;
    });

    var totalPub = 0;
    var totalCursos = 0;
    var totalHoras = 0;
    var precRegPub = 0;
    var precRegHoras = 0;
    var precRegCursos = 0;
    var precAuxPub = 0;
    var precAuxHoras = 0;
    var precAuxCursos = 0;
    var precEspecialPub = 0;
    var precEspecialHoras = 0;
    var precEspecialCursos = 0;
    var pubOrdinarios = 0;
    var pubOrdHoras = 0;
    var pubOrdCursos = 0;
    var varones = 0;
    var mujeres = 0;
    var noInformaron = [];

    activos.forEach(function(f) {
        var mes = (f.meses && Array.isArray(f.meses)) ? f.meses[mesIdx] : null;
        var cargos = Array.isArray(f.cargo) ? f.cargo : (f.cargo ? [f.cargo] : []);
        var participo = mes ? mes.participo : false;
        var horas = mes ? (mes.horas || 0) : 0;
        var cursos = mes ? (mes.cursos || 0) : 0;
        var esPrecAux = mes ? mes.auxiliar : false;
        var esPrecReg = cargos.indexOf('Precursor Regular') !== -1;
        var esPrecEsp = cargos.indexOf('Precursor Especial') !== -1;

        if (participo) totalPub++;
        totalHoras += horas;
        totalCursos += cursos;

        if (f.genero === 'Hombre') varones++;
        else mujeres++;

        if (!participo) {
            noInformaron.push(f.nombre || 'Sin nombre');
        }

        if (esPrecReg) {
            precRegPub++;
            precRegHoras += horas;
            precRegCursos += cursos;
        } else if (esPrecEsp) {
            precEspecialPub++;
            precEspecialHoras += horas;
            precEspecialCursos += cursos;
        } else if (esPrecAux) {
            precAuxPub++;
            precAuxHoras += horas;
            precAuxCursos += cursos;
        } else if (participo) {
            pubOrdinarios++;
            pubOrdHoras += horas;
            pubOrdCursos += cursos;
        }
    });

    var html = '<p style="margin:5px 0;font-size:14px;"><strong>Mes:</strong> ' + nombresMeses[mesIdx] + '</p>';
    html += '<p style="margin:5px 0;font-size:14px;"><strong>Año de servicio:</strong> ' + anioServicio + '</p>';
    html += '<p style="margin:5px 0;font-size:14px;"><strong>Total publicadores activos:</strong> ' + activos.length + '</p>';
    html += '<p style="margin:5px 0;font-size:14px;"><strong>Varones:</strong> ' + varones + ' | <strong>Mujeres:</strong> ' + mujeres + '</p>';
    html += '<hr style="border-color:#414868;">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
    html += '<tr style="border-bottom:1px solid #414868;"><td style="padding:6px;"><strong>Publicadores que informaron</strong></td><td style="padding:6px;text-align:right;"><strong>' + totalPub + '</strong></td></tr>';
    html += '<tr style="border-bottom:1px solid #414868;"><td style="padding:6px;"><strong>Cursos biblicos totales</strong></td><td style="padding:6px;text-align:right;"><strong>' + totalCursos + '</strong></td></tr>';
    html += '<tr style="border-bottom:1px solid #414868;"><td style="padding:6px;"><strong>Horas totales</strong></td><td style="padding:6px;text-align:right;"><strong>' + totalHoras + '</strong></td></tr>';
    html += '<tr style="border-bottom:1px solid #414868;"><td style="padding:6px;">Prec. Regulares (pub/horas/cursos)</td><td style="padding:6px;text-align:right;">' + precRegPub + ' / ' + precRegHoras + ' / ' + precRegCursos + '</td></tr>';
    html += '<tr style="border-bottom:1px solid #414868;"><td style="padding:6px;">Prec. Especiales (pub/horas/cursos)</td><td style="padding:6px;text-align:right;">' + precEspecialPub + ' / ' + precEspecialHoras + ' / ' + precEspecialCursos + '</td></tr>';
    html += '<tr style="border-bottom:1px solid #414868;"><td style="padding:6px;">Prec. Auxiliares (pub/horas/cursos)</td><td style="padding:6px;text-align:right;">' + precAuxPub + ' / ' + precAuxHoras + ' / ' + precAuxCursos + '</td></tr>';
    html += '<tr><td style="padding:6px;"><strong>Pub. Ordinarios (pub/horas/cursos)</strong></td><td style="padding:6px;text-align:right;"><strong>' + pubOrdinarios + ' / ' + pubOrdHoras + ' / ' + pubOrdCursos + '</strong></td></tr>';
    html += '</table>';

    if (noInformaron.length > 0) {
        html += '<hr style="border-color:#414868;margin-top:12px;">';
        html += '<p style="margin:5px 0;font-size:14px;"><strong>No informaron (' + noInformaron.length + '):</strong></p>';
        html += '<p style="margin:3px 0;font-size:13px;">' + noInformaron.join(', ') + '</p>';
    }

    document.getElementById('contenido-resumen').innerHTML = html;
    document.getElementById('modal-resumen').style.display = 'flex';
});

document.getElementById('btn-pdf-resumen').addEventListener('click', function() {
    var contenido = document.getElementById('contenido-resumen');
    if (!contenido || !contenido.innerHTML.trim()) { alert('Primero genera el resumen.'); return; }

    var tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'background:#fff;color:#000;padding:20px;font-family:Arial,sans-serif;font-size:13px;filter:grayscale(1);-webkit-filter:grayscale(1);';
    tempDiv.innerHTML = contenido.innerHTML
        .replace(/border-color:#414868/g, 'border-color:#cccccc')
        .replace(/style="padding:6px;"/g, 'style="padding:6px;color:#000;"')
        .replace(/style="padding:6px;text-align:right;"/g, 'style="padding:6px;text-align:right;color:#000;"');
    document.body.appendChild(tempDiv);

    var opt = {
        margin: 0.5,
        filename: 'Resumen_Sucursal.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(tempDiv).save().then(function() {
        document.body.removeChild(tempDiv);
    });
});

function medirBloque(html) {
    var d = document.createElement('div');
    d.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden;width:680px;font-family:Arial,sans-serif;background:#fff;color:#000;';
    d.innerHTML = html;
    document.body.appendChild(d);
    var h = d.offsetHeight;
    document.body.removeChild(d);
    return h;
}

function empaquetarPaginas(bloques) {
    var maxCss = 889;
    var paginas = [];
    var actual = '';
    var actualH = 0;
    for (var i = 0; i < bloques.length; i++) {
        var h = medirBloque(bloques[i]);
        if (actual && actualH + h > maxCss) {
            paginas.push(actual);
            actual = '';
            actualH = 0;
        }
        if (actual) actual += '<div style="margin-top:8px;">' + bloques[i] + '</div>';
        else actual = bloques[i];
        actualH += h;
    }
    if (actual) paginas.push(actual);
    return paginas;
}

function mostrarOverlayPDF(visible) {
    var overlay = document.getElementById('overlay-pdf');
    if (!overlay) return;
    if (visible) {
        overlay.style.display = 'flex';
        document.getElementById('overlay-pdf-barra').style.width = '0%';
    } else {
        overlay.style.display = 'none';
    }
}

function actualizarOverlayPDF(hechas, total, msTranscurrido, tInicio) {
    var texto = document.getElementById('overlay-pdf-texto');
    var detalle = document.getElementById('overlay-pdf-detalle');
    var barra = document.getElementById('overlay-pdf-barra');
    if (!texto || !detalle || !barra) return;

    var pct = Math.min(100, Math.round(hechas / total * 100));
    barra.style.width = pct + '%';

    var seg = Math.round(msTranscurrido / 1000);
    var restante = '';
    if (hechas >= 3) {
        var promedio = msTranscurrido / hechas;
        var msRestante = promedio * (total - hechas);
        var segRest = Math.round(msRestante / 1000);
        restante = ' · Restante aprox: ' + (segRest >= 60 ? Math.floor(segRest / 60) + ' min ' + (segRest % 60) + ' s' : segRest + ' s');
    }
    var segTexto = (seg >= 60 ? Math.floor(seg / 60) + ' min ' + (seg % 60) + ' s' : seg + ' s');
    texto.textContent = 'Página ' + hechas + ' de ' + total + ' (' + pct + '%)';
    detalle.textContent = 'Transcurrido: ' + segTexto + restante;
    if (tInicio && hechas < 3 && total > 0) {
        var estInicial = Math.ceil(total * 1000 / 1000);
        detalle.textContent = 'Transcurrido: ' + segTexto + ' · Estimado total aprox: ' + estInicial + ' s (calculando…)';
    }
}

function renderizarPaginasAPDF(paginas, nombreArchivo, alTerminar, numFichas) {
    var CtorPDF = (typeof window.jsPDF === 'function') ? window.jsPDF :
                  (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : null;
    if (!CtorPDF) { alert('Error: librería jsPDF no cargada. Recarga la página.'); return; }
    if (typeof window.html2canvas !== 'function') { alert('Error: librería html2canvas no cargada. Recarga la página.'); return; }

    var pdf = new CtorPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
    var ANCHO_PAG = pdf.internal.pageSize.getWidth();
    var ALTO_PAG = pdf.internal.pageSize.getHeight();
    var MARGEN = 5;
    var anchoUtil = ANCHO_PAG - MARGEN * 2;
    var indice = 0;
    var tInicio = Date.now();

    mostrarOverlayPDF(true);
    var txtTexto = document.getElementById('overlay-pdf-texto');
    if (txtTexto && numFichas) {
        txtTexto.textContent = 'Generando PDF de ' + numFichas + ' fichas (≈' + paginas.length + ' páginas)…';
    }
    actualizarOverlayPDF(0, paginas.length, 0, tInicio);

    function terminar() {
        mostrarOverlayPDF(false);
        if (alTerminar) alTerminar();
    }

    function procesarPagina() {
        if (indice >= paginas.length) {
            var total = pdf.internal.getNumberOfPages();
            for (var p = 1; p <= total; p++) {
                pdf.setPage(p);
                pdf.setFontSize(8);
                pdf.setTextColor(160, 160, 160);
                pdf.text('Pag. ' + p + ' de ' + total, ANCHO_PAG / 2, ALTO_PAG - 4, { align: 'center' });
            }
            pdf.save(nombreArchivo);
            terminar();
            return;
        }
        var cont = document.createElement('div');
        cont.style.cssText = 'background:#ffffff;color:#000;font-family:Arial,sans-serif;width:680px;box-sizing:border-box;';
        cont.innerHTML = paginas[indice];
        document.body.appendChild(cont);
        window.html2canvas(cont, { scale: 2, backgroundColor: '#ffffff' }).then(function(canvas) {
            try {
                var img = canvas.toDataURL('image/jpeg', 0.98);
                var altoMM = anchoUtil * canvas.height / canvas.width;
                if (indice > 0) pdf.addPage('letter', 'portrait');
                pdf.addImage(img, 'JPEG', MARGEN, MARGEN, anchoUtil, altoMM);
                document.body.removeChild(cont);
                indice++;
                actualizarOverlayPDF(indice, paginas.length, Date.now() - tInicio, tInicio);
                procesarPagina();
            } catch (err) {
                document.body.removeChild(cont);
                console.error('Error generando PDF:', err);
                alert('Error al generar PDF: ' + err.message);
                terminar();
            }
        }).catch(function(err) {
            document.body.removeChild(cont);
            console.error('Error generando PDF:', err);
            alert('Error al generar PDF: ' + err.message);
            terminar();
        });
    }
    procesarPagina();
}

document.getElementById('btn-pdf-masivo').addEventListener('click', function() {
    var lista = cargarLista();
    var valor = document.getElementById('select-grupo-pdf').value;
    var estadoFiltro = document.getElementById('select-estado').value;

    var todos = lista.filter(function(f) {
        var estado = f.estado || 'Activo';
        if (estadoFiltro !== 'todos' && estado !== estadoFiltro) return false;
        return true;
    });

    if (valor !== 'todos') {
        todos = todos.filter(function(f) { return String(f.grupoNumero) === String(valor); });
    }

    if (todos.length === 0) {
        alert('No hay publicadores activos para generar PDF.');
        return;
    }

    var grupoNombre = valor === 'todos' ? 'Todos los grupos' : 'Grupo ' + valor;

    var bloques = [];
    bloques.push('<div style="margin:0;padding:10px 15px;text-align:center;">' +
        '<h1 style="margin:0;font-size:16px;color:#000;">' + (valor === 'todos' ? 'Toda la Congregacion - Fichas S-21' : grupoNombre + ' - Fichas S-21') + '</h1>' +
        '<p style="margin:2px 0 0 0;font-size:11px;color:#333;">Total: ' + todos.length + ' publicadores</p></div>');

    if (valor === 'todos') {
        var gruposMap = {};
        var gruposOrden = [];
        todos.forEach(function(f) {
            var num = f.grupoNumero || 'Sin grupo';
            if (!gruposMap[num]) { gruposMap[num] = []; gruposOrden.push(num); }
            gruposMap[num].push(f);
        });
        gruposOrden.sort(function(a, b) {
            if (a === 'Sin grupo') return 1;
            if (b === 'Sin grupo') return -1;
            return parseInt(a) - parseInt(b);
        });

        for (var gi = 0; gi < gruposOrden.length; gi++) {
            var grupo = gruposOrden[gi];
            var fichasGrupo = gruposMap[grupo].slice().sort(function(a, b) { return pesoFicha(a) - pesoFicha(b); });
            var nombreGrupo = 'Grupo ' + grupo;

            bloques.push('<div style="padding:5px 15px 0 15px;">' +
                '<h2 style="margin:0 0 5px 0;font-size:14px;color:#000;">' + nombreGrupo + ' (' + fichasGrupo.length + ')</h2></div>');

            fichasGrupo.forEach(function(f) {
                bloques.push('<div style="padding:0 15px;">' + renderizarFichaPDF(f, { grupo: true, nombreGrupo: nombreGrupo }) + '</div>');
            });
        }
    } else {
        var ordenados = todos.slice().sort(function(a, b) {
            var ga = parseInt(a.grupoNumero) || 9999;
            var gb = parseInt(b.grupoNumero) || 9999;
            if (ga !== gb) return ga - gb;
            return pesoFicha(a) - pesoFicha(b);
        });

        ordenados.forEach(function(f) {
            bloques.push('<div style="padding:0 15px;">' + renderizarFichaPDF(f, { grupo: true, nombreGrupo: grupoNombre }) + '</div>');
        });
    }

    var paginas = empaquetarPaginas(bloques);
    var btnMasivo = document.getElementById('btn-pdf-masivo');
    btnMasivo.disabled = true;
    btnMasivo.style.opacity = '0.6';
    renderizarPaginasAPDF(paginas, 'Fichas_S21_' + grupoNombre.replace(/\s+/g, '_') + '.pdf', function() {
        btnMasivo.disabled = false;
        btnMasivo.style.opacity = '1';
    }, todos.length);
});

function generarPDFPorCargo(nombreCargo, tituloPDF) {
    var lista = cargarLista();
    var estadoFiltro = document.getElementById('select-estado').value;

    var filtrados = lista.filter(function(f) {
        var estado = f.estado || 'Activo';
        if (estadoFiltro !== 'todos' && estado !== estadoFiltro) return false;
        var cargos = Array.isArray(f.cargo) ? f.cargo : (f.cargo ? [f.cargo] : []);
        return cargos.indexOf(nombreCargo) !== -1;
    });

    if (filtrados.length === 0) {
        mostrarToast('No hay publicadores con cargo: ' + nombreCargo, 'error');
        return;
    }

    var ordenados = ordenarFichas(filtrados);

    var tempDiv = document.createElement('div');
    tempDiv.style.color = '#000';
    tempDiv.style.backgroundColor = '#fff';
    tempDiv.style.padding = '0';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.width = '680px';
    tempDiv.style.filter = 'grayscale(1)';
    tempDiv.style.webkitFilter = 'grayscale(1)';

    var html = '<style>@page{size:letter portrait;margin:5mm 8mm 5mm 8mm !important;}</style>';
    html += '<div style="margin:0;padding:10px 15px;text-align:center;">' +
        '<h1 style="margin:0;font-size:16px;color:#000;">' + tituloPDF + ' - Fichas S-21</h1>' +
        '<p style="margin:2px 0 0 0;font-size:11px;color:#333;">Total: ' + ordenados.length + ' publicadores</p></div>';

    for (var i = 0; i < ordenados.length; i += 2) {
        html += '<div style="page-break-before:' + (i > 0 ? 'always' : 'auto') + ';padding:5px 15px 0 15px;">';
        html += renderizarFichaPDF(ordenados[i], {grupo: true, nombreGrupo: tituloPDF});
        if (i + 1 < ordenados.length) {
            html += '<div style="margin-top:8px;">' + renderizarFichaPDF(ordenados[i + 1], {grupo: true, nombreGrupo: tituloPDF}) + '</div>';
        }
        html += '</div>';
    }

    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    setTimeout(function() {
        html2pdf().set({
            margin: [5, 8, 5, 8],
            filename: tituloPDF.replace(/\s+/g, '_') + '_Fichas_S21.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['css'] }
        }).from(tempDiv).toPdf().get('pdf').then(function(pdf) {
            var totalPaginas = pdf.internal.getNumberOfPages();
            for (var p = 1; p <= totalPaginas; p++) {
                pdf.setPage(p);
                var texto = 'Pag. ' + p + ' de ' + totalPaginas;
                pdf.setFontSize(8);
                pdf.setTextColor(160, 160, 160);
                pdf.text(texto, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 4, { align: 'center' });
            }
        }).save().then(function() {
            if (tempDiv.parentNode) document.body.removeChild(tempDiv);
        }).catch(function(err) {
            console.error('Error PDF por cargo:', err);
            if (tempDiv.parentNode) document.body.removeChild(tempDiv);
        });
    }, 100);
}

document.getElementById('btn-pdf-prec-reg').addEventListener('click', function() {
    generarPDFPorCargo('Precursor Regular', 'Precursors Regulares');
});

document.getElementById('btn-pdf-ancianos').addEventListener('click', function() {
    generarPDFPorCargo('Anciano', 'Ancianos');
});

document.getElementById('btn-pdf-siervos').addEventListener('click', function() {
    generarPDFPorCargo('Siervo ministerial', 'Siervos Ministeriales');
});

}); // fin cargarDatosIniciales

document.getElementById('btn-cerrar-sesion').addEventListener('click', function() {
    sessionStorage.removeItem('acceso');
    window.location.href = 'login.html';
});

document.getElementById('btn-duplicados').addEventListener('click', function() {
    var lista = cargarLista();
    var grupos = {};
    lista.forEach(function(f) {
        var clave = (f.nombre || '').toLowerCase().trim() + '|' + (f.anioServicio || '');
        if (!grupos[clave]) grupos[clave] = [];
        grupos[clave].push(f);
    });

    var duplicados = [];
    Object.keys(grupos).forEach(function(clave) {
        if (grupos[clave].length > 1) duplicados.push(grupos[clave]);
    });

    if (duplicados.length === 0) {
        alert('No se encontraron fichas duplicadas.');
        return;
    }

    var totalDups = 0;
    duplicados.forEach(function(g) { totalDups += g.length - 1; });

    var html = '<p style="margin:0 0 10px 0;color:#e0af68;font-size:14px;">Se encontraron <strong>' + totalDups + '</strong> ficha(s) duplicada(s) en <strong>' + duplicados.length + '</strong> grupo(s):</p>';

    duplicados.forEach(function(grupo, gi) {
        html += '<div style="border:1px solid #414868;border-radius:6px;padding:10px;margin-bottom:10px;">';
        html += '<p style="margin:0 0 6px 0;font-weight:bold;color:#7aa2f7;font-size:13px;">' + grupo[0].nombre + ' (Año: ' + (grupo[0].anioServicio || '-') + ')</p>';
        grupo.forEach(function(f, fi) {
            var fecha = f.fechaNacimiento || '-';
            var baut = f.fechaBautismo || '-';
            var cargo = Array.isArray(f.cargo) ? f.cargo.join(', ') : (f.cargo || '-');
            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #33374a;">';
            html += '<span style="font-size:12px;">Nac: ' + fecha + ' | Baut: ' + baut + ' | Cargo: ' + cargo + '</span>';
            if (fi > 0) {
                html += '<button onclick="eliminarDuplicado(' + f.id + ')" style="background:#f7768e;color:#1a1b26;border:none;padding:3px 8px;border-radius:3px;cursor:pointer;font-size:11px;font-weight:bold;margin-left:8px;">Eliminar</button>';
            } else {
                html += '<span style="color:#9ece6a;font-size:11px;font-weight:bold;margin-left:8px;">Mantener</span>';
            }
            html += '</div>';
        });
        html += '</div>';
    });

    html += '<p style="margin:10px 0 0 0;color:#565f89;font-size:11px;">"Mantener" = primera ficha (no se elimina). Puedes eliminar las demás.</p>';

    document.getElementById('contenido-duplicados').innerHTML = html;
    document.getElementById('modal-duplicados').style.display = 'flex';
});

function eliminarDuplicado(id) {
    if (!confirm('Eliminar esta ficha duplicada?')) return;
    var lista = cargarLista();
    var nueva = lista.filter(function(f) { return f.id !== id; });
    guardarLista(nueva);
    mostrarFichas(nueva);
    document.getElementById('btn-duplicados').click();
}

// ============ IMPORTADOR DE HOJAS ESCANEADAS (OCR) ============

var escaneosPendientes = [];
var workerOCR = null;
var workerOCRCreando = false;

function anioServicioActual() {
    var hoy = new Date();
    return hoy.getMonth() >= 8 ? hoy.getFullYear() + 1 : hoy.getFullYear();
}

function normalizarNombre(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function leerArchivoComoDataURL(file) {
    return new Promise(function(resolve, reject) {
        var fr = new FileReader();
        fr.onload = function() { resolve(fr.result); };
        fr.onerror = reject;
        fr.readAsDataURL(file);
    });
}

function reducirImagenParaOCR(dataUrl, maxDim) {
    return new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
            var escala = Math.min(1, maxDim / Math.max(img.width, img.height));
            var w = Math.round(img.width * escala);
            var h = Math.round(img.height * escala);
            if (w >= img.width && h >= img.height) { resolve(dataUrl); return; }
            var c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(c.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = function() { resolve(dataUrl); };
        img.src = dataUrl;
    });
}

async function pdfAImagenes(file) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error('La librería de PDF no se cargó. Revisa tu conexión.');
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var buffer = await file.arrayBuffer();
    var pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
    var imgs = [];
    for (var p = 1; p <= pdfDoc.numPages; p++) {
        var page = await pdfDoc.getPage(p);
        var viewport = page.getViewport({ scale: 2 });
        var canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        var ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        imgs.push({ src: canvas.toDataURL('image/jpeg', 0.9), nombre: file.name + ' (página ' + p + ')' });
        canvas.width = 0; canvas.height = 0;
    }
    return imgs;
}

async function prepararWorkerOCR() {
    if (workerOCR) return workerOCR;
    if (workerOCRCreando) {
        while (!workerOCR) await new Promise(function(r) { setTimeout(r, 150); });
        return workerOCR;
    }
    if (typeof Tesseract === 'undefined') {
        throw new Error('La librería de OCR no se cargó. Revisa tu conexión.');
    }
    workerOCRCreando = true;
    var div = document.getElementById('progreso-escaneos');
    if (div) div.textContent = 'Descargando idioma español (solo la primera vez)…';
    workerOCR = await Tesseract.createWorker({
        logger: function(m) {
            if (!div) return;
            if (m.status === 'recognizing text') {
                div.textContent = 'Reconociendo… ' + Math.round((m.progress || 0) * 100) + '%';
            } else if (m.status === 'loading tesseract core' || m.status === 'initializing api' || m.status === 'loading language traineddata') {
                div.textContent = 'Preparando OCR…';
            }
        }
    });
    await workerOCR.loadLanguage('spa');
    await workerOCR.initialize('spa');
    workerOCRCreando = false;
    return workerOCR;
}

async function reconocerImagen(dataUrl) {
    var reducida = await reducirImagenParaOCR(dataUrl, 2200);
    var worker = await prepararWorkerOCR();
    var ret = await worker.recognize(reducida, {}, { blocks: true, text: true, hocr: false, tsv: false });
    return {
        text: (ret.data && ret.data.text) || '',
        dataUrl: reducida,
        palabras: obtenerPalabrasOCR(ret.data || {})
    };
}

function obtenerPalabrasOCR(data) {
    var out = [];
    (data.blocks || []).forEach(function(b) {
        (b.paragraphs || []).forEach(function(p) {
            (p.lines || []).forEach(function(l) {
                (l.words || []).forEach(function(w) {
                    if (w && w.text && w.bbox) {
                        out.push({ t: w.text, x0: w.bbox.x0, x1: w.bbox.x1, y0: w.bbox.y0, y1: w.bbox.y1 });
                    }
                });
            });
        });
    });
    return out;
}

function ignoradasNombre() {
    return /\b(congregacion|informe|formulario|s-?21|publicador|precursor|anciano|siervo|minist|sucursal|direccion|telefono|nombre|grupo|horas|cursos|participo|auxiliar|notas|total|firma|membrete)\b/i;
}

function candidatosNombres(texto) {
    var lineas = texto.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
    var ignoradas = ignoradasNombre();
    var res = [];
    for (var i = 0; i < lineas.length; i++) {
        var l = lineas[i];
        if (l.length > 80 || l.length < 6) continue;
        if (/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/.test(l)) continue;
        if ((l.match(/\b\d+([.,]\d+)?\b/g) || []).length > 3) continue;
        var n = normalizarNombre(l);
        if (!n) continue;
        if (ignoradas.test(l)) continue;
        var palabras = n.split(' ');
        if (palabras.length < 2 || palabras.length > 6) continue;
        if (!/\b[A-ZÁÉÍÓÚÑ]/.test(l)) continue;
        if (res.indexOf(l) === -1) res.push(l);
    }
    return res;
}

function parsearNombreOCR(texto) {
    var nombres = candidatosNombres(texto);
    var mejor = null;
    var mejorPuntos = -1;
    for (var i = 0; i < nombres.length; i++) {
        var l = nombres[i];
        var mayus = (l.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}\b/g) || []).length;
        var palabras = l.split(/\s+/).length;
        var puntos = mayus * 2 + (palabras >= 2 && palabras <= 4 ? 2 : 0);
        if (puntos > mejorPuntos) { mejorPuntos = puntos; mejor = l; }
    }
    return mejor || '';
}

function extraerFechasOCR(texto) {
    var fechas = { nacimiento: '', bautismo: '' };
    var mesesTexto = { enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6, julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12 };
    var lineas = texto.split('\n');
    for (var i = 0; i < lineas.length; i++) {
        var l = lineas[i].trim();
        var low = l.toLowerCase();
        var iso = '';

        var mNum;
        var reNum = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g;
        while ((mNum = reNum.exec(l)) !== null) {
            var dd = parseInt(mNum[1], 10), mm = parseInt(mNum[2], 10), yyyy = parseInt(mNum[3], 10);
            if (mm > 12) { var t = dd; dd = mm; mm = t; }
            if (mm < 1 || mm > 12 || yyyy < 1920 || yyyy > 2030) continue;
            iso = yyyy + '-' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd;
            break;
        }

        if (!iso) {
            var mTex = l.match(/\b(\d{1,2})\s*de\s*([a-záéíóúñ]+)\s*(?:de\s*)?(\d{4})\b/i);
            if (mTex) {
                var mesInt = mesesTexto[mTex[2].toLowerCase()];
                if (mesInt) {
                    var dd2 = parseInt(mTex[1], 10), yyyy2 = parseInt(mTex[3], 10);
                    if (yyyy2 >= 1920 && yyyy2 <= 2030) {
                        iso = yyyy2 + '-' + (mesInt < 10 ? '0' : '') + mesInt + '-' + (dd2 < 10 ? '0' : '') + dd2;
                    }
                }
            }
        }

        if (!iso) continue;
        if (/nac/i.test(low)) fechas.nacimiento = iso;
        else if (/baut/i.test(low)) fechas.bautismo = iso;
        else { if (!fechas.nacimiento) fechas.nacimiento = iso; else if (!fechas.bautismo) fechas.bautismo = iso; }
    }
    return fechas;
}

function mesesVacios() {
    return nombresMeses.map(function(nm) {
        return { nombre: nm, participo: false, cursos: 0, auxiliar: false, horas: 0, notas: '', detectado: false };
    });
}

function parsearMesesOCR(texto) {
    var resultado = mesesVacios();
    var lineas = texto.split('\n');
    for (var i = 0; i < lineas.length; i++) {
        var l = lineas[i].trim();
        var low = l.toLowerCase();
        for (var idx = 0; idx < 12; idx++) {
            var ab = abbr[nombresMeses[idx]].toLowerCase();
            if (low.indexOf(ab) === -1 && low.indexOf(nombresMeses[idx].toLowerCase()) === -1) continue;
            var r = resultado[idx];
            var numeros = l.match(/\d+([.,]\d+)?\b/g) || [];
            numeros.forEach(function(tok) {
                var val = parseFloat(tok.replace(',', '.'));
                if (val % 1 !== 0) { r.horas = val; r.detectado = true; }
                else if (val >= 0 && val <= 3 && r.cursos === 0) { r.cursos = val; r.detectado = true; }
                else if (val >= 4) { r.horas = val; r.detectado = true; }
            });
            if (low.indexOf('aux') !== -1) { r.auxiliar = true; r.detectado = true; }
        }
    }
    resultado.forEach(function(r) { if (r.horas > 0) r.participo = true; });
    return resultado;
}

function parsearTextoOCR(texto) {
    var nombre = parsearNombreOCR(texto);
    var fechas = extraerFechasOCR(texto);
    return {
        nombre: nombre,
        nombreNorm: normalizarNombre(nombre),
        fechaNacimiento: fechas.nacimiento,
        fechaBautismo: fechas.bautismo,
        meses: parsearMesesOCR(texto),
        textoCrudo: texto
    };
}

document.getElementById('btn-escaneos').addEventListener('click', function() {
    escaneosPendientes = [];
    document.getElementById('contenido-escaneos').innerHTML = '';
    document.getElementById('progreso-escaneos').textContent = '';
    document.getElementById('modal-escaneos').style.display = 'flex';
});

document.getElementById('btn-cerrar-escaneos').addEventListener('click', function() {
    document.getElementById('modal-escaneos').style.display = 'none';
});

function seleccionarArchivosDeCarpeta(files) {
    var porGrupo = {};
    var lista = [];
    files.forEach(function(f) {
        var rel = f.webkitRelativePath || f.name;
        var segs = rel.split('/');
        if (segs.length >= 2) {
            var g = segs[1];
            if (!porGrupo[g]) porGrupo[g] = { files: [], numero: '' };
            porGrupo[g].files.push(f);
            var m = g.match(/(\d+)/);
            if (m && !porGrupo[g].numero) porGrupo[g].numero = m[1];
        } else {
            lista.push({ file: f, grupo: '' });
        }
    });
    Object.keys(porGrupo).forEach(function(g) {
        var grupo = porGrupo[g];
        var imgs = grupo.files.filter(function(f) { return /\.(jpe?g|png|webp)$/i.test(f.name); });
        if (imgs.length > 0) {
            imgs.sort(function(a, b) {
                var na = parseInt((a.name.match(/(\d+)/) || [])[1]) || 0;
                var nb = parseInt((b.name.match(/(\d+)/) || [])[1]) || 0;
                return na - nb;
            });
            imgs.forEach(function(f) { lista.push({ file: f, grupo: grupo.numero }); });
        } else {
            grupo.files.filter(function(f) { return /\.pdf$/i.test(f.name); }).forEach(function(f) {
                lista.push({ file: f, grupo: grupo.numero });
            });
        }
    });
    return lista;
}

async function procesarArchivosEscaneos(seleccion) {
    var divProgreso = document.getElementById('progreso-escaneos');
    escaneosPendientes = [];
    try {
        var imagenes = [];
        for (var i = 0; i < seleccion.length; i++) {
            var file = seleccion[i].file;
            divProgreso.textContent = 'Leyendo archivo ' + (i + 1) + '/' + seleccion.length + ': ' + file.name + '…';
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                var imgsPdf = await pdfAImagenes(file);
                imgsPdf.forEach(function(im) { im.grupo = seleccion[i].grupo; });
                imagenes = imagenes.concat(imgsPdf);
            } else {
                var dataUrl = await leerArchivoComoDataURL(file);
                imagenes.push({ src: dataUrl, nombre: file.name, grupo: seleccion[i].grupo });
            }
        }

        await prepararWorkerOCR();

        var ids = 0;
        for (var j = 0; j < imagenes.length; j++) {
            divProgreso.textContent = 'Reconociendo hoja ' + (j + 1) + '/' + imagenes.length + ' (' + imagenes[j].nombre + ')…';
            var resultado = await reconocerImagen(imagenes[j].src);
            var texto = resultado.text || '';
            var nombres = candidatosNombres(texto);
            if (nombres.length >= 3) {
                nombres.forEach(function(nm) {
                    escaneosPendientes.push({
                        id: 'esc_' + Date.now() + '_' + (ids++),
                        nombre: nm,
                        nombreNorm: normalizarNombre(nm),
                        fechaNacimiento: '',
                        fechaBautismo: '',
                        meses: mesesVacios(),
                        textoCrudo: texto,
                        nombreArchivo: imagenes[j].nombre,
                        grupoSugerido: imagenes[j].grupo || '',
                        esLista: true
                    });
                });
            } else {
                var parsed = parsearTextoOCR(texto);
                parsed.id = 'esc_' + Date.now() + '_' + (ids++);
                parsed.nombreArchivo = imagenes[j].nombre;
                parsed.grupoSugerido = imagenes[j].grupo || '';
                divProgreso.textContent = 'Detectando participó y horas en ' + imagenes[j].nombre + '…';
                await aplicarDeteccionCeldas(parsed, resultado.dataUrl, resultado.palabras);
                escaneosPendientes.push(parsed);
            }
        }

        divProgreso.textContent = '';
        if (escaneosPendientes.length === 0) {
            divProgreso.textContent = 'No se pudo reconocer ningún nombre. Prueba con una foto más clara.';
        } else {
            renderizarRevisionEscaneos();
        }
    } catch (err) {
        console.error(err);
        divProgreso.textContent = 'Error: ' + err.message;
    }
}

document.getElementById('input-escaneos').addEventListener('change', function(e) {
    var files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = '';
    procesarArchivosEscaneos(files.map(function(f) { return { file: f, grupo: '' }; }));
});

document.getElementById('btn-carpeta-escaneos').addEventListener('click', function() {
    document.getElementById('input-carpeta-escaneos').click();
});

document.getElementById('input-carpeta-escaneos').addEventListener('change', function(e) {
    var files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = '';
    var seleccion = seleccionarArchivosDeCarpeta(files);
    procesarArchivosEscaneos(seleccion);
});

function cargarImagenCanvas(dataUrl) {
    return new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
            var c = document.createElement('canvas');
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            c.getContext('2d').drawImage(img, 0, 0);
            resolve(c);
        };
        img.onerror = function() { resolve(null); };
        img.src = dataUrl;
    });
}

function detectarFilasConPalabras(palabras, W, H) {
    if (!palabras || !palabras.length) return null;
    var minH = H * 0.01, tol = H * 0.0064, xLim = W * 0.212, y0Min = H * 0.164, y1Max = H * 0.457;
    var mw = palabras.filter(function(w) {
        return w.x0 < xLim && w.y0 > y0Min && w.y1 < y1Max && (w.y1 - w.y0) >= minH;
    });
    if (mw.length < 8) return null;
    mw.sort(function(a, b) { return (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2; });
    var clusters = [];
    for (var i = 0; i < mw.length; i++) {
        var c = (mw[i].y0 + mw[i].y1) / 2;
        var placed = false;
        for (var k = 0; k < clusters.length; k++) {
            if (Math.abs(clusters[k].center - c) <= tol) {
                clusters[k].ws.push(mw[i]);
                var sum = 0;
                for (var q = 0; q < clusters[k].ws.length; q++) sum += (clusters[k].ws[q].y0 + clusters[k].ws[q].y1) / 2;
                clusters[k].center = sum / clusters[k].ws.length;
                placed = true;
                break;
            }
        }
        if (!placed) clusters.push({ center: c, ws: [mw[i]] });
    }
    clusters.sort(function(a, b) { return a.center - b.center; });
    if (clusters.length < 12) return null;
    var centers = clusters.slice(0, 12).map(function(cl) { return cl.center; });
    var gaps = [];
    for (var j = 1; j < centers.length; j++) gaps.push(centers[j] - centers[j - 1]);
    gaps.sort(function(a, b) { return a - b; });
    var pitch = gaps[Math.floor(gaps.length / 2)];
    if (pitch < H * 0.016 || pitch > H * 0.0215) return null;
    return { centers: centers, pitch: pitch };
}

function grayscaleCanvas(canvas) {
    var W = canvas.width, H = canvas.height;
    var imgData = canvas.getContext('2d').getImageData(0, 0, W, H).data;
    var g = new Uint8Array(W * H);
    for (var i = 0; i < W * H; i++) {
        var o = i * 4;
        g[i] = Math.round(0.299 * imgData[o] + 0.587 * imgData[o + 1] + 0.114 * imgData[o + 2]);
    }
    return g;
}

function detectarFilasConProyeccion(canvas, g, W, H) {
    var hproj = new Float32Array(H);
    for (var y = 0; y < H; y++) {
        var c = 0, row = y * W;
        for (var x = 0; x < W; x++) if (g[row + x] < 128) c++;
        hproj[y] = c;
    }
    var hLines = [], s = 0, thr = W * 0.10;
    for (var yy = 0; yy < H; yy++) {
        if (hproj[yy] > thr) s++;
        else if (s >= 2) { hLines.push(yy - s + Math.floor(s / 2)); s = 0; } else s = 0;
    }
    if (s >= 2) hLines.push(H - s + Math.floor(s / 2));
    var best = null;
    for (var i = 0; i < hLines.length; i++) for (var j = i + 1; j < hLines.length; j++) {
        var t = hLines[i], b = hLines[j], rh = (b - t) / 12;
        if (rh < H * 0.0107 || rh > H * 0.0321) continue;
        var m = 0;
        for (var k = 0; k <= 12; k++) {
            var yk = t + k * rh;
            for (var q = i; q <= j; q++) {
                if (Math.abs(hLines[q] - yk) <= rh * 0.12) { m++; break; }
            }
        }
        if (m >= 10 && (!best || m > best.m)) best = { t: t, b: b, rh: rh, m: m };
    }
    if (!best) return null;
    var c0 = best.t + best.rh / 2;
    if (c0 < H * 0.16 || c0 > H * 0.232) return null;
    var centers = [];
    for (var z = 0; z < 12; z++) centers.push(best.t + z * best.rh + best.rh / 2);
    return { centers: centers, pitch: best.rh };
}

function detectarFilasConColumna(canvas, g, W, H) {
    var x0m = Math.round(W * 0.0588), x1m = Math.round(W * 0.2059);
    var hproj = new Float32Array(H);
    for (var y = 0; y < H; y++) {
        var c = 0;
        for (var x = x0m; x <= x1m; x++) if (g[y * W + x] < 128) c++;
        hproj[y] = c;
    }
    var bands = [], inB = false, st = 0, thrB = 6;
    for (var y2 = Math.round(H * 0.157); y2 < H; y2++) {
        if (hproj[y2] > thrB) { if (!inB) { inB = true; st = y2; } }
        else { if (inB) { bands.push((st + y2 - 1) / 2); inB = false; } }
    }
    if (inB) bands.push((st + H - 1) / 2);
    if (bands.length < 6) return null;
    var best = null;
    for (var S = Math.round(H * 0.164); S <= Math.round(H * 0.229); S += 2) {
        for (var P = H * 0.0179; P <= H * 0.0207; P += 0.0002) {
            var m = 0;
            for (var i = 0; i < 12; i++) {
                var e = S + i * P;
                for (var q = 0; q < bands.length; q++) {
                    if (Math.abs(bands[q] - e) <= P * 0.22) { m++; break; }
                }
            }
            if (m >= 10 && (!best || m > best.m)) best = { m: m, S: S, P: P };
        }
    }
    if (!best) return null;
    var centers = [];
    for (var z = 0; z < 12; z++) centers.push(best.S + z * best.P);
    return { centers: centers, pitch: best.P };
}

function detectarFilas(canvas, palabras) {
    var W = canvas.width, H = canvas.height;
    var g = grayscaleCanvas(canvas);
    return detectarFilasConPalabras(palabras, W, H) ||
           detectarFilasConProyeccion(canvas, g, W, H) ||
           detectarFilasConColumna(canvas, g, W, H);
}

function corregirAlineacion(filas, palabras, W, H) {
    if (!filas || !palabras) return filas;
    var cab = palabras.filter(function(w) {
        return /^20\d\d/.test(w.t) && w.y1 < H * 0.2 && w.x0 < W * 0.35;
    });
    if (cab.length === 0) return filas;
    var cCab = (cab[0].y0 + cab[0].y1) / 2;
    if (Math.abs(cCab - filas.centers[0]) <= filas.pitch * 0.6) {
        var centers = filas.centers.slice(1);
        while (centers.length < 12) centers.push(centers[centers.length - 1] + filas.pitch);
        return { centers: centers, pitch: filas.pitch, corregida: true };
    }
    return filas;
}

function densidadTinta(ctx, x, y, w, h) {
    if (w < 4 || h < 4 || x < 0 || y < 0) return 0;
    var d = ctx.getImageData(x, y, w, h).data;
    var dark = 0, tot = 0;
    for (var i = 0; i < d.length; i += 16) {
        var v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (v < 130) dark++;
        tot++;
    }
    return tot ? dark / tot : 0;
}

function parsearHorasDesdeTexto(t) {
    var nums = (t.match(/\d+([.,]\d+)?/g) || []).map(function(s) { return parseFloat(s.replace(',', '.')); });
    var plausibles = nums.filter(function(v) { return v >= 0.5 && v <= 120; });
    if (plausibles.length === 0) return 0;
    return Math.max.apply(null, plausibles);
}

async function ocrCeldaDigitos(canvas, x, y, w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(20, Math.round(w * 2.5));
    c.height = Math.max(20, Math.round(h * 2.5));
    var ctx2 = c.getContext('2d');
    ctx2.drawImage(canvas, x, y, w, h, 0, 0, c.width, c.height);
    var worker = await prepararWorkerOCR();
    await worker.setParameters({ tessedit_char_whitelist: '0123456789.,' });
    try {
        var ret = await worker.recognize(c.toDataURL('image/jpeg', 0.9), {}, { blocks: false, text: true, hocr: false, tsv: false });
        return (ret.data && ret.data.text) || '';
    } finally {
        await worker.setParameters({ tessedit_char_whitelist: '' });
    }
}

async function aplicarDeteccionCeldas(esc, dataUrl, palabras) {
    if (!esc || esc.esLista || !dataUrl) return;
    try {
        var canvas = await cargarImagenCanvas(dataUrl);
        if (!canvas) return;
        var filas = detectarFilas(canvas, palabras);
        if (!filas) { esc.filasDetectadas = false; return; }
        esc.filasDetectadas = true;
        filas = corregirAlineacion(filas, palabras, canvas.width, canvas.height) || filas;
        var ctx = canvas.getContext('2d');
        var W = canvas.width, H = canvas.height;
        var p0 = Math.round(W * 0.2094), p1 = Math.round(W * 0.3176);
        var h0 = Math.round(W * 0.4294), h1 = Math.round(W * 0.6471);
        for (var i = 0; i < 12; i++) {
            var y0 = Math.round(filas.centers[i] - filas.pitch / 2) + 2;
            var y1 = Math.round(filas.centers[i] + filas.pitch / 2) - 2;
            if (y1 - y0 < 10) continue;

            if (p1 - p0 >= 8) {
                var dens = densidadTinta(ctx, p0, y0, p1 - p0, y1 - y0);
                if (dens > 0.045) {
                    esc.meses[i].participo = true;
                    esc.meses[i].detectado = true;
                }
            }

            if (h1 - h0 >= 25) {
                var texto = await ocrCeldaDigitos(canvas, h0, y0, h1 - h0, y1 - y0);
                var horas = parsearHorasDesdeTexto(texto);
                if (horas > 0) {
                    esc.meses[i].horas = horas;
                    esc.meses[i].participo = true;
                    esc.meses[i].detectado = true;
                }
            }
        }
    } catch (e) {
        console.error('Detección de celdas falló:', e);
    }
}

function similitudNombres(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    var ta = a.split(' ');
    var tb = b.split(' ');
    var comunes = 0;
    for (var i = 0; i < ta.length; i++) {
        if (tb.indexOf(ta[i]) !== -1) comunes++;
    }
    return (2 * comunes) / (ta.length + tb.length);
}

function buscarCoincidencia(nombreNorm, lista) {
    if (!nombreNorm) return null;
    var mejor = null;
    var mejorScore = 0.6;
    for (var i = 0; i < lista.length; i++) {
        var score = similitudNombres(nombreNorm, normalizarNombre(lista[i].nombre));
        if (score > mejorScore) { mejorScore = score; mejor = i; }
    }
    return mejor;
}

function renderizarRevisionEscaneos() {
    var cont = document.getElementById('contenido-escaneos');
    var lista = cargarLista();
    var indices = lista.map(function(f, i) { return i; }).sort(function(a, b) {
        return normalizarNombre(lista[a].nombre).localeCompare(normalizarNombre(lista[b].nombre));
    });

    var html = '<p style="margin:0 0 12px 0;color:#565f89;font-size:13px;">Se reconocieron <strong style="color:#7aa2f7;">' + escaneosPendientes.length + '</strong> hoja(s). Revisa cada tarjeta, corrige si hace falta y elige la ficha destino. Solo se rellenan las celdas vacías. Guarda al final.</p>';

    escaneosPendientes.forEach(function(esc, k) {
        var coincidencia = buscarCoincidencia(esc.nombreNorm, lista);
        var estadoBadge = coincidencia !== null
            ? '<span style="background:rgba(115,218,202,0.12);color:#73daca;border:1px solid #73daca;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:bold;">✓ Coincide con: ' + escapeHtml(lista[coincidencia].nombre) + '</span>'
            : '<span style="background:rgba(247,118,142,0.12);color:#f7768e;border:1px solid #f7768e;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:bold;">Sin coincidencia — se creará una ficha nueva</span>';

        var opciones = '<option value="nueva">➕ Crear ficha nueva</option>';
        indices.forEach(function(i) {
            opciones += '<option value="' + i + '">' + escapeHtml(lista[i].nombre) + (lista[i].anioServicio ? ' (' + lista[i].anioServicio + ')' : '') + '</option>';
        });

        html += '<div style="border:1px solid #414868;border-radius:8px;padding:14px;margin-bottom:14px;background:#1a1b26;">';

        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px;">';
        html += '<div style="flex:1;min-width:220px;">';
        html += '<label style="font-size:12px;color:#565f89;">' + (esc.esLista ? 'Nombre (de la lista de asistentes):' : 'Nombre reconocido (editable):') + '</label><br>';
        html += '<input type="text" id="nom-' + esc.id + '" value="' + escapeHtml(esc.nombre) + '" style="width:100%;max-width:340px;padding:7px 10px;border-radius:4px;border:1px solid #414868;background:#24283b;color:#c0caf5;font-size:14px;margin-top:4px;">';
        html += '</div>';
        html += '<div style="text-align:right;">' + estadoBadge + '<div style="color:#565f89;font-size:11px;margin-top:4px;">' + escapeHtml(esc.nombreArchivo || '') + '</div></div>';
        html += '</div>';

        html += '<div style="margin-bottom:10px;">';
        html += '<label style="font-size:12px;color:#565f89;">Aplicar a la ficha:</label><br>';
        html += '<select id="dest-' + esc.id + '" style="width:100%;max-width:420px;padding:7px 10px;border-radius:4px;border:1px solid #414868;background:#24283b;color:#c0caf5;font-size:13px;margin-top:4px;">' + opciones + '</select>';
        html += '</div>';

        html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px;">';
        html += '<label style="font-size:12px;color:#565f89;">Fecha nacimiento: <input type="date" id="fnac-' + esc.id + '" value="' + (esc.fechaNacimiento || '') + '" style="padding:5px 8px;border-radius:4px;border:1px solid #414868;background:#24283b;color:#c0caf5;margin-left:4px;"></label>';
        html += '<label style="font-size:12px;color:#565f89;">Fecha bautismo: <input type="date" id="fbaut-' + esc.id + '" value="' + (esc.fechaBautismo || '') + '" style="padding:5px 8px;border-radius:4px;border:1px solid #414868;background:#24283b;color:#c0caf5;margin-left:4px;"></label>';
        html += '<label style="font-size:12px;color:#565f89;">Grupo (solo si es nueva): <input type="number" id="grupo-' + esc.id + '" min="1" placeholder="Ej: 2" value="' + (esc.grupoSugerido || '') + '" style="width:70px;padding:5px 8px;border-radius:4px;border:1px solid #414868;background:#24283b;color:#c0caf5;margin-left:4px;"></label>';
        html += '</div>';

        html += '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
        html += '<thead><tr style="color:#565f89;text-align:left;">';
        html += '<th style="padding:4px;border-bottom:1px solid #414868;">Mes</th>';
        html += '<th style="padding:4px;border-bottom:1px solid #414868;text-align:center;">Participó</th>';
        html += '<th style="padding:4px;border-bottom:1px solid #414868;text-align:center;">Cursos</th>';
        html += '<th style="padding:4px;border-bottom:1px solid #414868;text-align:center;">Aux.</th>';
        html += '<th style="padding:4px;border-bottom:1px solid #414868;text-align:center;">Horas</th>';
        html += '<th style="padding:4px;border-bottom:1px solid #414868;">Notas</th>';
        html += '</tr></thead><tbody>';

        esc.meses.forEach(function(m, i) {
            var fondo = m.detectado ? 'background:rgba(115,218,202,0.08);' : '';
            html += '<tr style="' + fondo + '">';
            html += '<td style="padding:3px 4px;border-bottom:1px solid #292e42;color:#c0caf5;white-space:nowrap;">' + m.nombre + (m.detectado ? ' <span title="Datos detectados por OCR" style="color:#73daca;">●</span>' : '') + '</td>';
            html += '<td style="padding:3px 4px;border-bottom:1px solid #292e42;text-align:center;"><input type="checkbox" id="mes-' + esc.id + '-' + i + '-participo"' + (m.participo ? ' checked' : '') + '></td>';
            html += '<td style="padding:3px 4px;border-bottom:1px solid #292e42;text-align:center;"><input type="number" min="0" value="' + (m.cursos || '') + '" id="mes-' + esc.id + '-' + i + '-cursos" style="width:55px;padding:3px 5px;border-radius:3px;border:1px solid #414868;background:#24283b;color:#c0caf5;"></td>';
            html += '<td style="padding:3px 4px;border-bottom:1px solid #292e42;text-align:center;"><input type="checkbox" id="mes-' + esc.id + '-' + i + '-auxiliar"' + (m.auxiliar ? ' checked' : '') + '></td>';
            html += '<td style="padding:3px 4px;border-bottom:1px solid #292e42;text-align:center;"><input type="number" min="0" step="0.5" value="' + (m.horas || '') + '" id="mes-' + esc.id + '-' + i + '-horas" style="width:70px;padding:3px 5px;border-radius:3px;border:1px solid #414868;background:#24283b;color:#c0caf5;"></td>';
            html += '<td style="padding:3px 4px;border-bottom:1px solid #292e42;"><input type="text" value="' + escapeHtml(m.notas || '') + '" id="mes-' + esc.id + '-' + i + '-notas" style="width:100%;padding:3px 5px;border-radius:3px;border:1px solid #414868;background:#24283b;color:#c0caf5;"></td>';
            html += '</tr>';
        });

        html += '</tbody></table>';

        html += '<details style="margin-top:10px;"><summary style="cursor:pointer;color:#565f89;font-size:12px;">Ver texto reconocido (OCR)</summary>';
        html += '<pre style="white-space:pre-wrap;background:#16161e;border:1px solid #292e42;border-radius:4px;padding:10px;font-size:11px;color:#a9b1d6;max-height:180px;overflow:auto;margin:8px 0 0 0;">' + escapeHtml(esc.textoCrudo) + '</pre></details>';

        html += '</div>';
    });

    html += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px;">';
    html += '<button onclick="document.getElementById(\'modal-escaneos\').style.display=\'none\'" style="background:#f7768e;color:#1a1b26;border:none;padding:9px 18px;border-radius:4px;font-weight:bold;cursor:pointer;">Cancelar</button>';
    html += '<button id="btn-confirmar-escaneos" onclick="aplicarEscaneos()" style="background:#9ece6a;color:#1a1b26;border:none;padding:9px 18px;border-radius:4px;font-weight:bold;cursor:pointer;">💾 Guardar cambios</button>';
    html += '</div>';

    cont.innerHTML = html;

    escaneosPendientes.forEach(function(esc) {
        var sel = document.getElementById('dest-' + esc.id);
        if (!sel) return;
        var coincidencia = buscarCoincidencia(esc.nombreNorm, lista);
        sel.value = coincidencia !== null ? String(coincidencia) : 'nueva';
        var grupoInput = document.getElementById('grupo-' + esc.id);
        if (grupoInput && !grupoInput.value) grupoInput.value = esc.grupoSugerido || '';
    });
}

function leerMesesEscaneoUI(id) {
    var resultado = [];
    for (var i = 0; i < 12; i++) {
        var p = document.getElementById('mes-' + id + '-' + i + '-participo').checked;
        var c = parseInt(document.getElementById('mes-' + id + '-' + i + '-cursos').value) || 0;
        var a = document.getElementById('mes-' + id + '-' + i + '-auxiliar').checked;
        var h = parseFloat(document.getElementById('mes-' + id + '-' + i + '-horas').value) || 0;
        var n = document.getElementById('mes-' + id + '-' + i + '-notas').value.trim();
        resultado.push({
            nombre: nombresMeses[i],
            participo: p,
            cursos: c,
            auxiliar: a,
            horas: h,
            notas: n,
            detectado: p || c > 0 || a || h > 0 || n.length > 0
        });
    }
    return resultado;
}

function aplicarEscaneos() {
    var lista = cargarLista();
    var creados = 0;
    var actualizados = 0;
    var omitidos = 0;
    var resumenHtml = '';

    escaneosPendientes.forEach(function(esc) {
        var nombre = document.getElementById('nom-' + esc.id).value.trim();
        if (!nombre) { omitidos++; return; }

        var fechaNac = document.getElementById('fnac-' + esc.id).value;
        var fechaBaut = document.getElementById('fbaut-' + esc.id).value;
        var grupoNum = document.getElementById('grupo-' + esc.id).value;
        var dest = document.getElementById('dest-' + esc.id).value;
        var mesesEsc = leerMesesEscaneoUI(esc.id);

        if (String(dest) === 'nueva') {
            lista.push({
                id: Date.now() + Math.floor(Math.random() * 10000),
                nombre: nombre,
                fechaNacimiento: fechaNac,
                fechaBautismo: fechaBaut,
                anioServicio: String(anioServicioActual()),
                cargo: [],
                genero: '',
                grupo: '',
                grupoNumero: grupoNum,
                rolGrupo: '',
                estado: 'Activo',
                meses: mesesEsc.filter(function(m) { return m.detectado; }).map(function(m) {
                    return { nombre: m.nombre, participo: m.participo, cursos: m.cursos, auxiliar: m.auxiliar, horas: m.horas, notas: m.notas };
                })
            });
            creados++;
            resumenHtml += '<div style="color:#73daca;font-size:13px;padding:4px 0;">➕ <strong>' + escapeHtml(nombre) + '</strong> — ficha creada</div>';
            return;
        }

        var f = lista[parseInt(dest, 10)];
        if (!f) { omitidos++; return; }

        var huboCambio = false;
        if (!f.fechaNacimiento && fechaNac) { f.fechaNacimiento = fechaNac; huboCambio = true; }
        if (!f.fechaBautismo && fechaBaut) { f.fechaBautismo = fechaBaut; huboCambio = true; }
        if (!f.grupoNumero && esc.grupoSugerido) { f.grupoNumero = esc.grupoSugerido; huboCambio = true; }

        if (!Array.isArray(f.meses)) f.meses = [];
        var map = {};
        f.meses.forEach(function(m) { if (m && m.nombre) map[m.nombre] = m; });

        mesesEsc.forEach(function(mE) {
            if (!mE.detectado) return;
            var m = map[mE.nombre];
            if (!m) {
                map[mE.nombre] = { nombre: mE.nombre, participo: mE.participo, cursos: mE.cursos, auxiliar: mE.auxiliar, horas: mE.horas, notas: mE.notas };
                f.meses.push(map[mE.nombre]);
                huboCambio = true;
                return;
            }
            if (mE.horas > 0 && !m.horas) { m.horas = mE.horas; huboCambio = true; }
            if (mE.participo && !m.participo) { m.participo = true; huboCambio = true; }
            if (mE.auxiliar && !m.auxiliar) { m.auxiliar = true; huboCambio = true; }
            if (mE.cursos > 0 && !m.cursos) { m.cursos = mE.cursos; huboCambio = true; }
        });

        var orden = {};
        nombresMeses.forEach(function(nm, i) { orden[nm] = i; });
        f.meses.sort(function(a, b) { return (orden[a.nombre] !== undefined ? orden[a.nombre] : 99) - (orden[b.nombre] !== undefined ? orden[b.nombre] : 99); });

        if (huboCambio) {
            actualizados++;
            resumenHtml += '<div style="color:#7aa2f7;font-size:13px;padding:4px 0;">✓ <strong>' + escapeHtml(f.nombre) + '</strong> — actualizado (solo celdas vacías)</div>';
        }
    });

    guardarLista(lista);
    mostrarFichas(cargarLista());
    escaneosPendientes = [];

    var cont = document.getElementById('contenido-escaneos');
    cont.innerHTML = '<p style="color:#9ece6a;font-size:14px;font-weight:bold;margin:0 0 10px 0;">✅ Guardado</p>' +
        (creados > 0 ? '<div style="color:#73daca;font-size:13px;margin-bottom:6px;">Fichas creadas: <strong>' + creados + '</strong></div>' : '') +
        (actualizados > 0 ? '<div style="color:#7aa2f7;font-size:13px;margin-bottom:6px;">Fichas actualizadas: <strong>' + actualizados + '</strong></div>' : '') +
        (omitidos > 0 ? '<div style="color:#e0af68;font-size:13px;margin-bottom:6px;">Omitidos (sin nombre): <strong>' + omitidos + '</strong></div>' : '') +
        resumenHtml +
        '<p style="margin:10px 0 0 0;color:#565f89;font-size:12px;">Puedes cerrar esta ventana.</p>';
}
