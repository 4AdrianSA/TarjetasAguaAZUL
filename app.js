console.log('app.js cargo correctamente');
var editandoId = null;

var prefijos = ['sep','oct','nov','dic','ene','feb','mar','abr','may','jun','jul','ago'];
var canal = new BroadcastChannel('publicadores_sync');

// Firebase / Firestore
var db = null;
var usaFirebase = false;
var cacheLista = [];

try {
    if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey !== 'TU_API_KEY_AQUI') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        usaFirebase = true;
        console.log('Firebase conectado');
    } else {
        console.log('Firebase no configurado, usando localStorage');
    }
} catch(e) {
    console.log('Firebase no disponible:', e);
}

function cargarLista() {
    return cacheLista.filter(function(f) { return f && f.nombre; });
}

function guardarLista(lista) {
    cacheLista = lista.filter(function(f) { return f && f.nombre; });
    localStorage.setItem('publicadores', JSON.stringify(cacheLista));

    if (usaFirebase && db) {
        db.collection('publicadores').doc('datos').set({
            lista: cacheLista,
            fechaGuardado: new Date().toISOString()
        }).then(function() {
            console.log('Guardado en Firestore');
        }).catch(function(err) {
            console.error('Error Firestore:', err);
        });
    }

    canal.postMessage('actualizar');
}

function cargarDatosIniciales(callback) {
    if (usaFirebase && db) {
        db.collection('publicadores').doc('datos').get().then(function(doc) {
            if (doc.exists && doc.data().lista) {
                cacheLista = doc.data().lista;
                console.log('Datos desde Firestore:', cacheLista.length);
            } else {
                var local = JSON.parse(localStorage.getItem('publicadores')) || [];
                cacheLista = local.filter(function(f) { return f && f.nombre; });
                if (cacheLista.length > 0) {
                    guardarLista(cacheLista);
                    console.log('Migrados a Firestore:', cacheLista.length);
                }
            }
            callback();
        }).catch(function(err) {
            console.error('Error Firestore:', err);
            var local = JSON.parse(localStorage.getItem('publicadores')) || [];
            cacheLista = local.filter(function(f) { return f && f.nombre; });
            callback();
        });
    } else {
        var local = JSON.parse(localStorage.getItem('publicadores')) || [];
        cacheLista = local.filter(function(f) { return f && f.nombre; });
        callback();
    }
}

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
        alert('Escribe el nombre del publicador');
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
}

function cargarLista() {
    var datos = JSON.parse(localStorage.getItem('publicadores')) || [];
    return datos.filter(function(f) { return f && f.nombre; });
}

function guardarLista(lista) {
    localStorage.setItem('publicadores', JSON.stringify(lista));
    canal.postMessage('actualizar');
}

function renderizarTablaMesesPDF(meses) {
    console.log('renderizarTablaMesesPDF - meses:', meses ? meses.length : 0, meses);
    if (!Array.isArray(meses) || meses.length === 0) return '';

    var nombresMeses = ['Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'];
    var abbr = {'Septiembre':'Sep','Octubre':'Oct','Noviembre':'Nov','Diciembre':'Dic','Enero':'Ene','Febrero':'Feb','Marzo':'Mar','Abril':'Abr','Mayo':'May','Junio':'Jun','Julio':'Jul','Agosto':'Ago'};
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
    if (ficha.grupo !== 'ungido') items.push('Otras ovejas');
    if (ficha.grupo === 'ungido') items.push('Ungido');
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
            '<tr><td style="padding:' + padCell + ';width:55%;"><strong>Nombre:</strong> ' + (ficha.nombre || '') + '</td>' +
            '<td style="padding:' + padCell + ';width:45%;" rowspan="3">' + renderizarCheckS21(ficha) + '</td></tr>' +
            '<tr><td style="padding:' + padCell + ';"><strong>Fecha de nacimiento:</strong> ' + (ficha.fechaNacimiento || '') + '</td></tr>' +
            '<tr><td style="padding:' + padCell + ';"><strong>Fecha de bautismo:</strong> ' + (ficha.fechaBautismo || '') + '</td></tr>' +
            '<tr><td style="padding:' + padCell + ';"><strong>Grupo N. \u00B0:</strong> ' + (ficha.grupoNumero || '') +
            (ficha.rolGrupo ? ' <strong>Rol:</strong> ' + ficha.rolGrupo : '') + '</td></tr>' +
            (ficha.observaciones ? '<tr><td style="padding:' + padCell + ';font-style:italic;"><strong>Observaciones:</strong> ' + ficha.observaciones + '</td></tr>' : '') +
            '</table>';

        html += '<div style="font-size:' + fsLabel + ';color:#000;margin:0 0 3px 0;font-weight:bold;">A\u00F1o de servicio ' + (ficha.anioServicio || new Date().getFullYear()) + '</div>';

        html += renderizarTablaMesesPDF(ficha.meses);

        html += '</div>';
        return html;
    }

    var wrapStyle = 'border:2px solid #000;margin:3px 0;padding:6px 8px;font-family:Arial,sans-serif;color:#000;background:#fff;page-break-inside:avoid;break-inside:avoid;';

    return '<div style="' + wrapStyle + '">' +
        '<div style="border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:4px;">' +
            '<h3 style="margin:0;font-size:13px;color:#000;">' + ficha.nombre + '</h3>' +
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
                '<td style="padding:1px 4px;"><strong>Cargo:</strong> ' + (cargo || '-') + '</td>' +
            '</tr>' +
            '<tr>' +
                '<td style="padding:1px 4px;"><strong>Genero:</strong> ' + (ficha.genero || '-') + '</td>' +
            '</tr>' +
            (ficha.observaciones ? '<tr><td colspan="2" style="padding:1px 4px;font-style:italic;"><strong>Obs:</strong> ' + ficha.observaciones + '</td></tr>' : '') +
        '</table>' +
        (ficha.meses ? renderizarTablaMesesPDF(ficha.meses) : '') +
    '</div>';
}

function ordenarFichas(fichas) {
    var prioridad = {
        'superintendente': 0,
        'auxiliar': 1,
        'anciano': 2,
        'precursor regular': 3,
        'precursor especial': 4,
        'publicador': 5
    };

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

    return fichas.slice().sort(function(a, b) { return pesoFicha(a) - pesoFicha(b); });
}

function calcularResumenGrupo(datos) {
    var nombresMeses = ['Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'];

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
    var abbr = {'Septiembre':'Sep','Octubre':'Oct','Noviembre':'Nov','Diciembre':'Dic','Enero':'Ene','Febrero':'Feb','Marzo':'Mar','Abril':'Abr','Mayo':'May','Junio':'Jun','Julio':'Jul','Agosto':'Ago'};
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
            '<h3>' + ficha.nombre + estadoBadge + '</h3>' +
            '<div class="ficha-botones">' +
                '<button class="btn-pdf-ficha" data-id="' + ficha.id + '">PDF</button>' +
                '<button class="btn-editar">Editar</button>' +
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
            (ficha.observaciones ? '<p style="grid-column:1/-1;"><strong>Observaciones:</strong> <em>' + ficha.observaciones + '</em></p>' : '') +
        '</div>';

    if (ficha.meses && Array.isArray(ficha.meses)) {
        var nombresMesesAll = ['Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'];
        var mesMapAll = {};
        ficha.meses.forEach(function(m) { mesMapAll[m.nombre] = m; });
        html += '<div class="table-responsive"><table class="ficha-tabla"><thead><tr>' +
            '<th>Mes</th><th>Part.</th><th>Cursos</th><th>Aux.</th><th>Horas</th><th>Notas</th>' +
            '</tr></thead><tbody>';
        nombresMesesAll.forEach(function(nombre) {
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

cargarDatosIniciales(function() {

document.getElementById('btn-guardar').addEventListener('click', function() {
    var ficha = recolectarDatos();
    if (!ficha) return;

    var lista = cargarLista();

    if (editandoId !== null) {
        var idx = -1;
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].id === editandoId) { idx = i; break; }
        }
        if (idx !== -1) lista[idx] = ficha;
        editandoId = null;
    } else {
        lista.push(ficha);
    }

    guardarLista(lista);
    alert('Guardado: ' + ficha.nombre);
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
        filtrada = filtrada.filter(function(f) { return f.grupoNumero === grupo; });
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    var resumen = calcularResumenGrupo([ficha]);
    generarPDFFicha(ficha, {
        resumen: resumen,
        resumenTitulo: 'Ficha Individual',
        anioServicio: anio
    });
});

document.getElementById('btn-pdf-grupo').addEventListener('click', function() {
    var lista = cargarLista();
    var valor = document.getElementById('select-grupo-pdf').value;
    var grupoNombre = valor === 'todos' ? 'Todos los grupos' : 'Grupo ' + valor;

    var listaFiltrada = lista.filter(function(f) {
        var estado = f.estado || 'Activo';
        return estado === 'Activo';
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
        datos = [{ subtitulo: null, fichas: listaFiltrada.filter(function(f) { return f.grupoNumero === valor; }) }];
    }

    var totalPub = 0;
    datos.forEach(function(d) { totalPub += d.fichas.length; });
    if (totalPub === 0) {
        alert('No hay publicadores activos en este grupo.');
        return;
    }

    var tempDiv = document.createElement('div');
    tempDiv.style.color = '#000000';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.margin = '0';
    tempDiv.style.padding = '0';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.width = '680px';
    tempDiv.style.boxSizing = 'border-box';

    var html = '<style>@page{size:letter portrait;margin-top:0mm !important;margin-bottom:5mm;margin-left:8mm;margin-right:8mm;}</style>' +
        '<div style="margin:0;padding:5px 15px 0 15px;">' +
        '<h1 style="text-align:center;color:#000;margin:0;padding:0;font-size:16px;line-height:1.3;">' + grupoNombre + '</h1>' +
        '<p style="text-align:center;color:#333;margin:0;padding:0 0 2px 0;font-size:11px;line-height:1.3;">Total: ' + totalPub + ' publicadores</p>' +
        '</div>';

    var fichaCount = 0;
    var paginasGrupos = [];
    paginasGrupos.push(grupoNombre);

    for (var d = 0; d < datos.length; d++) {
        var bloque = datos[d];
        var nombreBloque = bloque.subtitulo || grupoNombre;
        var fichasOrdenadas = ordenarFichas(bloque.fichas);
        for (var f = 0; f < fichasOrdenadas.length; f++) {
            fichaCount++;
            paginasGrupos.push(nombreBloque);
            var fichaStyle = fichaCount > 1
                ? 'margin:0;padding:0 15px;page-break-before:always;'
                : 'margin:0;padding:0 15px;';
            html += '<div style="' + fichaStyle + '">' + renderizarFichaPDF(fichasOrdenadas[f], {grupo: true, nombreGrupo: nombreBloque}) + '</div>';
        }
    }

    paginasGrupos.push('Resumen - ' + grupoNombre);

    var allFichas = [];
    datos.forEach(function(d) { allFichas = allFichas.concat(ordenarFichas(d.fichas)); });
    var resumen = calcularResumenGrupo(allFichas);

    var aniosCount = {};
    allFichas.forEach(function(f) {
        var a = f.anioServicio || String(new Date().getFullYear());
        aniosCount[a] = (aniosCount[a] || 0) + 1;
    });
    var anioMasComun = Object.keys(aniosCount).sort(function(a, b) { return aniosCount[b] - aniosCount[a]; })[0] || String(new Date().getFullYear());

    html += '<div style="page-break-before:always;clear:both;padding:15px;">' + renderizarResumen(resumen, grupoNombre, anioMasComun) + '</div>';

    tempDiv.innerHTML = html;

    document.body.appendChild(tempDiv);

    setTimeout(function() {
        html2pdf().set({
            margin: [0, 8, 10, 8],
            filename: 'Grupo_' + valor + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['css'] }
        }).from(tempDiv).toPdf().get('pdf').then(function(pdf) {
            var totalPaginas = pdf.internal.getNumberOfPages();
            for (var p = 1; p <= totalPaginas; p++) {
                pdf.setPage(p);
                var texto = 'Pág. ' + p + ' de ' + totalPaginas;
                pdf.setFontSize(8);
                pdf.setTextColor(160, 160, 160);
                pdf.text(texto, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 4, { align: 'center' });
            }
        }).save().then(function() {
            if (tempDiv.parentNode) document.body.removeChild(tempDiv);
        }).catch(function(err) {
            console.error('Error generando PDF:', err);
            alert('Error al generar PDF: ' + err.message);
            if (tempDiv.parentNode) document.body.removeChild(tempDiv);
        });
    }, 100);
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
    var anioSugerido = ultimoAnio ? ultimoAnio + 1 : new Date().getFullYear();

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
    var idxMes = parseInt(document.getElementById('select-estado').dataset.mesIdx) || 0;
    var nombresMeses = ['Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'];
    var mesIdx = prompt('Numero del mes (0=Sept, 1=Oct, ... 11=Ago):', '0');
    if (mesIdx === null) return;
    mesIdx = parseInt(mesIdx);
    if (isNaN(mesIdx) || mesIdx < 0 || mesIdx > 11) { alert('Mes invalido.'); return; }

    var lista = cargarLista();
    var activos = lista.filter(function(f) { return (f.estado || 'Activo') === 'Activo'; });

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
    var varones = 0;
    var mujeres = 0;

    activos.forEach(function(f) {
        var mes = (f.meses && Array.isArray(f.meses)) ? f.meses[mesIdx] : null;
        var cargos = Array.isArray(f.cargo) ? f.cargo : (f.cargo ? [f.cargo] : []);
        var participo = mes ? mes.participo : false;
        var horas = mes ? (mes.horas || 0) : 0;
        var cursos = mes ? (mes.cursos || 0) : 0;
        var esPrecAux = mes ? mes.auxiliar : false;

        if (participo) totalPub++;
        totalHoras += horas;
        totalCursos += cursos;

        if (f.genero === 'Hombre') varones++;
        else mujeres++;

        if (cargos.indexOf('Precursor Regular') !== -1) {
            precRegPub++;
            precRegHoras += horas;
            precRegCursos += cursos;
        }
        if (cargos.indexOf('Precursor Especial') !== -1) {
            precEspecialPub++;
            precEspecialHoras += horas;
            precEspecialCursos += cursos;
        }
        if (esPrecAux) {
            precAuxPub++;
            precAuxHoras += horas;
            precAuxCursos += cursos;
        }
    });

    var html = '<p style="margin:5px 0;font-size:14px;"><strong>Mes:</strong> ' + nombresMeses[mesIdx] + '</p>';
    html += '<p style="margin:5px 0;font-size:14px;"><strong>Total publicadores activos:</strong> ' + activos.length + '</p>';
    html += '<p style="margin:5px 0;font-size:14px;"><strong>Varones:</strong> ' + varones + ' | <strong>Mujeres:</strong> ' + mujeres + '</p>';
    html += '<hr style="border-color:#414868;">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
    html += '<tr style="border-bottom:1px solid #414868;"><td style="padding:6px;"><strong>Publicadores que informaron</strong></td><td style="padding:6px;text-align:right;"><strong>' + totalPub + '</strong></td></tr>';
    html += '<tr style="border-bottom:1px solid #414868;"><td style="padding:6px;"><strong>Cursos biblicos totales</strong></td><td style="padding:6px;text-align:right;"><strong>' + totalCursos + '</strong></td></tr>';
    html += '<tr style="border-bottom:1px solid #414868;"><td style="padding:6px;"><strong>Horas totales</strong></td><td style="padding:6px;text-align:right;"><strong>' + totalHoras + '</strong></td></tr>';
    html += '<tr style="border-bottom:1px solid #414868;"><td style="padding:6px;">Prec. Regulares (pub/horas/cursos)</td><td style="padding:6px;text-align:right;">' + precRegPub + ' / ' + precRegHoras + ' / ' + precRegCursos + '</td></tr>';
    html += '<tr style="border-bottom:1px solid #414868;"><td style="padding:6px;">Prec. Especiales (pub/horas/cursos)</td><td style="padding:6px;text-align:right;">' + precEspecialPub + ' / ' + precEspecialHoras + ' / ' + precEspecialCursos + '</td></tr>';
    html += '<tr><td style="padding:6px;">Prec. Auxiliares (pub/horas/cursos)</td><td style="padding:6px;text-align:right;">' + precAuxPub + ' / ' + precAuxHoras + ' / ' + precAuxCursos + '</td></tr>';
    html += '</table>';

    document.getElementById('contenido-resumen').innerHTML = html;
    document.getElementById('modal-resumen').style.display = 'flex';
});

document.getElementById('btn-pdf-masivo').addEventListener('click', function() {
    var lista = cargarLista();
    var valor = document.getElementById('select-grupo-pdf').value;

    var activos = lista.filter(function(f) {
        return (f.estado || 'Activo') === 'Activo';
    });

    if (valor !== 'todos') {
        activos = activos.filter(function(f) { return f.grupoNumero === valor; });
    }

    if (activos.length === 0) {
        alert('No hay publicadores activos para generar PDF.');
        return;
    }

    var ordenados = ordenarFichas(activos);
    var grupoNombre = valor === 'todos' ? 'Toda la Congregacion' : 'Grupo ' + valor;

    var tempDiv = document.createElement('div');
    tempDiv.style.color = '#000';
    tempDiv.style.backgroundColor = '#fff';
    tempDiv.style.padding = '0';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.width = '680px';

    var html = '<style>@page{size:letter portrait;margin:5mm 8mm 5mm 8mm !important;}</style>';
    html += '<div style="margin:0;padding:10px 15px;text-align:center;">' +
        '<h1 style="margin:0;font-size:16px;color:#000;">' + grupoNombre + ' - Fichas S-21</h1>' +
        '<p style="margin:2px 0 0 0;font-size:11px;color:#333;">Total: ' + ordenados.length + ' publicadores</p></div>';

    for (var i = 0; i < ordenados.length; i += 2) {
        html += '<div style="page-break-before:' + (i > 0 ? 'always' : 'auto') + ';padding:5px 15px 0 15px;">';
        html += renderizarFichaPDF(ordenados[i], {grupo: true, nombreGrupo: grupoNombre});
        if (i + 1 < ordenados.length) {
            html += '<div style="margin-top:8px;">' + renderizarFichaPDF(ordenados[i + 1], {grupo: true, nombreGrupo: grupoNombre}) + '</div>';
        }
        html += '</div>';
    }

    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    setTimeout(function() {
        html2pdf().set({
            margin: [5, 8, 5, 8],
            filename: 'Fichas_S21_' + grupoNombre.replace(/\s+/g, '_') + '.pdf',
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
            console.error('Error PDF masivo:', err);
            alert('Error al generar PDF: ' + err.message);
            if (tempDiv.parentNode) document.body.removeChild(tempDiv);
        });
    }, 100);
});

}); // fin cargarDatosIniciales
