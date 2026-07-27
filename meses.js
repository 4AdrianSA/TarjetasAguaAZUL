var modoEdicionMasiva = false;
var editandoFilaId = null;

function volverAlRegistro() {
    var _k2 = ['P','a','n','d','a','2','0','0','4','2'];
    var clave = prompt('Contraseña del Secretario:');
    if (clave === _k2.join('')) {
        sessionStorage.setItem('acceso', 'secretario');
        window.location.href = 'index.html';
    } else if (clave !== null) {
        alert('Contraseña incorrecta.');
    }
}

function actualizarSelectorGrupos() {
    var lista = cargarLista();
    var grupos = {};
    lista.forEach(function(f) {
        var num = f.grupoNumero || 'Sin grupo';
        grupos[num] = true;
    });
    var select = document.getElementById('select-grupo-mes');
    select.innerHTML = '<option value="todos">Todos</option>';
    Object.keys(grupos).sort(function(a, b) {
        if (a === 'Sin grupo') return 1;
        if (b === 'Sin grupo') return -1;
        return parseInt(a) - parseInt(b);
    }).forEach(function(num) {
        var opt = document.createElement('option');
        opt.value = num;
        opt.textContent = 'Grupo ' + num;
        select.appendChild(opt);
    });
}

function pesoCargo(cargos, rolGrupo) {
    if (rolGrupo === 'Superintendente de grupo') return 0;
    if (rolGrupo === 'Auxiliar de grupo') return 1;
    if (cargos.indexOf('Anciano') !== -1) return 2;
    if (cargos.indexOf('Precursor Regular') !== -1) return 3;
    if (cargos.indexOf('Precursor Especial') !== -1) return 4;
    if (cargos.indexOf('Siervo ministerial') !== -1) return 5;
    return 6;
}

function toggleEdicionMasiva() {
    modoEdicionMasiva = !modoEdicionMasiva;
    editandoFilaId = null;
    var btn = document.getElementById('btn-editar-masivo');
    btn.textContent = modoEdicionMasiva ? 'Guardar Todos' : 'Editar Todos';
    btn.style.backgroundColor = modoEdicionMasiva ? '#9ece6a' : '#7aa2f7';
    mostrarMes();
}

function editarFila(id) {
    editandoFilaId = parseInt(id);
    mostrarMes();
}

function guardarFila(id) {
    id = parseInt(id);
    var idxMes = parseInt(document.getElementById('select-mes').value);
    var lista = cargarLista();
    var f = null;
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].id === id) { f = lista[i]; break; }
    }
    if (!f) return;

    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    var participoCb = tr.querySelector('.edit-participo');
    var cursosIn = tr.querySelector('.edit-cursos');
    var horasIn = tr.querySelector('.edit-horas');
    var notasIn = tr.querySelector('.edit-notas');

    if (!f.meses || !Array.isArray(f.meses)) {
        f.meses = [];
        for (var j = 0; j < 12; j++) f.meses.push({ participo: false, cursos: 0, horas: 0, auxiliar: false, notas: '' });
    }
    if (!f.meses[idxMes]) {
        f.meses[idxMes] = { participo: false, cursos: 0, horas: 0, auxiliar: false, notas: '' };
    }

    if (participoCb) f.meses[idxMes].participo = participoCb.checked;
    if (cursosIn) f.meses[idxMes].cursos = parseInt(cursosIn.value) || 0;
    if (horasIn) f.meses[idxMes].horas = parseFloat(horasIn.value) || 0;
    if (notasIn) f.meses[idxMes].notas = notasIn.value;

    guardarLista(lista);
    editandoFilaId = null;
    mostrarMes();
}

function guardarEdicionMasiva() {
    var idxMes = parseInt(document.getElementById('select-mes').value);
    var lista = cargarLista();

    lista.forEach(function(f) {
        var tr = document.querySelector('tr[data-id="' + f.id + '"]');
        if (!tr) return;

        var participoCb = tr.querySelector('.edit-participo');
        var cursosIn = tr.querySelector('.edit-cursos');
        var horasIn = tr.querySelector('.edit-horas');
        var notasIn = tr.querySelector('.edit-notas');

        if (!f.meses || !Array.isArray(f.meses)) {
            f.meses = [];
            for (var i = 0; i < 12; i++) f.meses.push({ participo: false, cursos: 0, horas: 0, auxiliar: false, notas: '' });
        }
        if (!f.meses[idxMes]) {
            f.meses[idxMes] = { participo: false, cursos: 0, horas: 0, auxiliar: false, notas: '' };
        }

        if (participoCb) f.meses[idxMes].participo = participoCb.checked;
        if (cursosIn) f.meses[idxMes].cursos = parseInt(cursosIn.value) || 0;
    if (horasIn) f.meses[idxMes].horas = parseFloat(horasIn.value) || 0;
        if (notasIn) f.meses[idxMes].notas = notasIn.value;
    });

    guardarLista(lista);
    modoEdicionMasiva = false;
    document.getElementById('btn-editar-masivo').textContent = 'Editar Todos';
    document.getElementById('btn-editar-masivo').style.backgroundColor = '#7aa2f7';
    mostrarMes();
}

function mostrarMes() {
    var idxMes = parseInt(document.getElementById('select-mes').value);
    var valorGrupo = document.getElementById('select-grupo-mes').value;
    var valorAnio = document.getElementById('select-anio-servicio').value;
    var lista = cargarLista();

    if (valorGrupo !== 'todos') {
        lista = lista.filter(function(f) { return String(f.grupoNumero) === String(valorGrupo); });
    }
    if (valorAnio !== 'todos') {
        lista = lista.filter(function(f) { return String(f.anioServicio) === String(valorAnio); });
    }

    var nombreMes = nombresMeses[idxMes];
    var totalParticipo = 0;
    var totalCursos = 0;
    var totalHoras = 0;
    var totalNoParticipo = 0;
    var precRegHoras = 0;
    var precRegCursos = 0;
    var precAuxHoras = 0;
    var precAuxCursos = 0;
    var precRegParticipo = 0;
    var precAuxParticipo = 0;

    var filas = lista.map(function(f) {
        var mes = (f.meses && Array.isArray(f.meses)) ? f.meses[idxMes] : null;
        var cargos = Array.isArray(f.cargo) ? f.cargo : (f.cargo ? [f.cargo] : []);

        var participo = mes ? mes.participo : false;
        var cursos = mes ? (mes.cursos || 0) : 0;
        var horas = mes ? (mes.horas || 0) : 0;
        var notas = mes ? (mes.notas || '') : '';
        var cargoPrincipal = cargos[0] || '';

        if (participo) totalParticipo++;
        if (!participo) totalNoParticipo++;
        totalCursos += cursos;
        totalHoras += horas;

        if (cargos.indexOf('Precursor Regular') !== -1) {
            precRegHoras += horas;
            precRegCursos += cursos;
            if (participo) precRegParticipo++;
        }
        if (cargos.indexOf('Precursor Especial') !== -1) {
            precAuxHoras += horas;
            precAuxCursos += cursos;
            if (participo) precAuxParticipo++;
        }

        return {
            id: f.id,
            nombre: f.nombre,
            servicio: cargoPrincipal || 'Publicador',
            estado: f.estado || 'Activo',
            observaciones: f.observaciones || '',
            participo: participo,
            cursos: cursos,
            horas: horas,
            notas: notas,
            peso: pesoCargo(cargos, f.rolGrupo),
            esPrecReg: cargos.indexOf('Precursor Regular') !== -1
        };
    });

    filas.sort(function(a, b) {
        if (a.peso !== b.peso) return a.peso - b.peso;
        return a.nombre.localeCompare(b.nombre);
    });

    var porcentaje = filas.length > 0 ? Math.round((totalParticipo / filas.length) * 100) : 0;

    var statsHtml = '<div class="estadisticas">' +
        '<div class="stat-card verde"><div class="numero">' + totalParticipo + '/' + filas.length + '</div><div class="label">Informes Recibidos (' + porcentaje + '%)</div></div>' +
        '<div class="stat-card rojo"><div class="numero">' + totalNoParticipo + '</div><div class="label">No Participaron</div></div>' +
        '<div class="stat-card"><div class="numero">' + totalCursos + '</div><div class="label">Cursos Totales</div></div>' +
        '<div class="stat-card naranja"><div class="numero">' + totalHoras + '</div><div class="label">Horas Totales</div></div>' +
        '</div>';

    statsHtml += '<div class="estadisticas">' +
        '<div class="stat-card"><div class="numero">' + precRegHoras + '</div><div class="label">Prec. Reg. Horas</div></div>' +
        '<div class="stat-card"><div class="numero">' + precRegCursos + '</div><div class="label">Prec. Reg. Cursos</div></div>' +
        '<div class="stat-card"><div class="numero">' + precRegParticipo + '</div><div class="label">Prec. Reg. Participaron</div></div>' +
        '<div class="stat-card"><div class="numero">' + precAuxHoras + '</div><div class="label">Prec. Aux. Horas</div></div>' +
        '<div class="stat-card"><div class="numero">' + precAuxCursos + '</div><div class="label">Prec. Aux. Cursos</div></div>' +
        '<div class="stat-card"><div class="numero">' + precAuxParticipo + '</div><div class="label">Prec. Aux. Participaron</div></div>' +
        '</div>';

    document.getElementById('estadisticas-container').innerHTML = statsHtml;

    var accionHtml = '';
    if (modoEdicionMasiva) {
        accionHtml = '<button class="btn-guardar-fila" onclick="guardarEdicionMasiva()" style="padding:8px 18px;font-size:14px;">Guardar Todos</button> ' +
            '<button class="btn-guardar-fila" style="background-color:#f7768e;color:#1a1b26;padding:8px 18px;font-size:14px;" onclick="toggleEdicionMasiva()">Cancelar</button>';
    }

    var anioTexto = (valorAnio && valorAnio !== 'todos') ? ' - Año: ' + valorAnio : '';
    var tablaHtml = '<div class="resumen-header">' +
        '<h2>' + nombreMes + ' - ' + filas.length + ' publicadores' + anioTexto + '</h2>' +
        accionHtml +
        '</div>' +
        '<table class="tabla-mes">' +
        '<thead><tr>' +
            '<th style="text-align:left;">Nombre</th>' +
            '<th>Servicio</th>' +
            '<th>Participo</th>' +
            '<th>Cursos</th>' +
            '<th>Horas</th>' +
            '<th style="text-align:left;">Notas</th>' +
            '<th>Acciones</th>' +
        '</tr></thead><tbody>';

    filas.forEach(function(f) {
        var claseFila = '';
        if (f.estado === 'Inactivo') claseFila = 'fila-inactivo';
        else if (f.estado === 'Baja') claseFila = 'fila-baja';
        else if (!f.participo) claseFila = 'fila-no-participo';
        var claseHoras = '';
        if (f.esPrecReg && f.horas >= 50) claseHoras = 'si';
        else if (f.esPrecReg && f.horas > 0 && f.horas < 50) claseHoras = 'horas-bajas';

        if (modoEdicionMasiva) {
            var nombreConEstado = escapeHtml(f.nombre);
            if (f.estado === 'Inactivo') nombreConEstado += ' <span class="badge-estado badge-estado-inactivo">INACTIVO</span>';
            if (f.estado === 'Baja') nombreConEstado += ' <span class="badge-estado badge-estado-baja">BAJA</span>';
            tablaHtml += '<tr data-id="' + f.id + '" class="' + claseFila + '">' +
                '<td style="text-align:left;">' + nombreConEstado + '</td>' +
                '<td style="font-size:12px;">' + f.servicio + '</td>' +
                '<td><input type="checkbox" class="edit-participo"' + (f.participo ? ' checked' : '') + '></td>' +
                '<td><input type="number" class="edit-cursos" value="' + f.cursos + '" min="0" style="width:50px;"></td>' +
                '<td class="' + claseHoras + '"><input type="number" class="edit-horas" value="' + f.horas + '" min="0" step="0.5" style="width:60px;"></td>' +
                '<td><input type="text" class="edit-notas" value="' + f.notas.replace(/"/g, '&quot;') + '" style="width:120px;"></td>' +
                '<td></td>' +
                '</tr>';
        } else if (editandoFilaId === f.id) {
            var nombreConEstado2 = escapeHtml(f.nombre);
            if (f.estado === 'Inactivo') nombreConEstado2 += ' <span class="badge-estado badge-estado-inactivo">INACTIVO</span>';
            if (f.estado === 'Baja') nombreConEstado2 += ' <span class="badge-estado badge-estado-baja">BAJA</span>';
            tablaHtml += '<tr data-id="' + f.id + '" class="' + claseFila + '">' +
                '<td style="text-align:left;">' + nombreConEstado2 + '</td>' +
                '<td style="font-size:12px;">' + f.servicio + '</td>' +
                '<td><input type="checkbox" class="edit-participo"' + (f.participo ? ' checked' : '') + '></td>' +
                '<td><input type="number" class="edit-cursos" value="' + f.cursos + '" min="0" style="width:50px;"></td>' +
                '<td class="' + claseHoras + '"><input type="number" class="edit-horas" value="' + f.horas + '" min="0" step="0.5" style="width:60px;"></td>' +
                '<td><input type="text" class="edit-notas" value="' + f.notas.replace(/"/g, '&quot;') + '" style="width:120px;"></td>' +
                '<td><button class="btn-guardar-fila" onclick="guardarFila(\'' + f.id + '\')" style="padding:4px 10px;font-size:12px;">Guardar</button> ' +
                '<button class="btn-guardar-fila" style="background-color:#f7768e;color:#1a1b26;padding:4px 10px;font-size:12px;" onclick="editandoFilaId=null;mostrarMes();">Cancelar</button></td>' +
                '</tr>';
        } else {
            var nombreConEstado3 = escapeHtml(f.nombre);
            if (f.estado === 'Inactivo') nombreConEstado3 += ' <span class="badge-estado badge-estado-inactivo">INACTIVO</span>';
            if (f.estado === 'Baja') nombreConEstado3 += ' <span class="badge-estado badge-estado-baja">BAJA</span>';
            tablaHtml += '<tr data-id="' + f.id + '" class="' + claseFila + '">' +
                '<td style="text-align:left;">' + nombreConEstado3 + '</td>' +
                '<td style="font-size:12px;">' + f.servicio + '</td>' +
                '<td class="' + (f.participo ? 'si' : 'no') + '">' + (f.participo ? '\u2713' : '\u2717') + '</td>' +
                '<td>' + f.cursos + '</td>' +
                '<td class="' + claseHoras + '">' + f.horas + '</td>' +
                '<td style="text-align:left;font-size:12px;">' + escapeHtml(f.notas) + (f.observaciones ? ' <em style="color:#bb9af7;">(' + escapeHtml(f.observaciones) + ')</em>' : '') + '</td>' +
                '<td><button class="btn-guardar-fila" onclick="editarFila(\'' + f.id + '\')" style="padding:4px 10px;font-size:12px;background-color:#7aa2f7;">Editar</button></td>' +
                '</tr>';
        }
    });

    tablaHtml += '<tr class="total-row">' +
        '<td style="text-align:left;">TOTAL</td>' +
        '<td></td>' +
        '<td>' + totalParticipo + '/' + filas.length + '</td>' +
        '<td>' + totalCursos + '</td>' +
        '<td>' + totalHoras + '</td>' +
        '<td></td>' +
        '<td></td>' +
        '</tr>';

    tablaHtml += '</tbody></table>';

    document.getElementById('contenedor-mes').innerHTML = '<div class="table-responsive">' + tablaHtml + '</div>';
}

function cargarAnioDesdeDatos() {
    var lista = cargarLista();
    var anios = {};
    lista.forEach(function(f) {
        if (f.anioServicio) anios[f.anioServicio] = true;
    });
    var select = document.getElementById('select-anio-servicio');
    var valorActual = select.value;
    select.innerHTML = '<option value="todos">Todos</option>';
    Object.keys(anios).sort().forEach(function(a) {
        var opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        select.appendChild(opt);
    });
    if (valorActual && valorActual !== 'todos' && anios[valorActual]) {
        select.value = valorActual;
    }
}

document.getElementById('select-mes').addEventListener('change', function() { modoEdicionMasiva = false; mostrarMes(); });
document.getElementById('select-grupo-mes').addEventListener('change', function() { modoEdicionMasiva = false; mostrarMes(); });
document.getElementById('select-anio-servicio').addEventListener('change', function() { modoEdicionMasiva = false; mostrarMes(); });
document.getElementById('btn-editar-masivo').addEventListener('click', function() {
    if (modoEdicionMasiva) {
        guardarEdicionMasiva();
    } else {
        toggleEdicionMasiva();
    }
});

document.getElementById('btn-pdf-mes').addEventListener('click', function() {
    var idxMes = parseInt(document.getElementById('select-mes').value);
    var nombreMes = nombresMeses[idxMes];
    var valorGrupo = document.getElementById('select-grupo-mes').value;
    var grupoTexto = valorGrupo === 'todos' ? 'Todos los grupos' : 'Grupo ' + valorGrupo;

    var tempDiv = document.createElement('div');
    tempDiv.style.color = '#000';
    tempDiv.style.backgroundColor = '#fff';
    tempDiv.style.padding = '15px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.width = '750px';

    var stats = document.getElementById('estadisticas-container');
    var statNums = stats.querySelectorAll('.stat-card');
    var labels = [];
    statNums.forEach(function(sc) {
        var n = sc.querySelector('.numero');
        var l = sc.querySelector('.label');
        if (n && l) labels.push({ num: n.textContent, text: l.textContent });
    });

    var statsFila = '';
    for (var i = 0; i < labels.length; i += 2) {
        statsFila += '<tr>' +
            '<td style="border:1px solid #000;padding:6px 10px;font-weight:bold;">' + labels[i].text + '</td>' +
            '<td style="border:1px solid #000;padding:6px 10px;text-align:right;font-weight:bold;font-size:16px;">' + labels[i].num + '</td>';
        if (i + 1 < labels.length) {
            statsFila += '<td style="border:1px solid #000;padding:6px 10px;font-weight:bold;">' + labels[i+1].text + '</td>' +
                '<td style="border:1px solid #000;padding:6px 10px;text-align:right;font-weight:bold;font-size:16px;">' + labels[i+1].num + '</td>';
        } else {
            statsFila += '<td style="border:1px solid #000;padding:6px 10px;"></td>' +
                '<td style="border:1px solid #000;padding:6px 10px;"></td>';
        }
        statsFila += '</tr>';
    }

    var tabla = document.querySelector('.tabla-mes');
    var tablaHtml = '';
    if (tabla) {
        var tablaClon = tabla.cloneNode(true);
        tablaClon.querySelectorAll('.btn-guardar-fila').forEach(function(b) { b.remove(); });
        tablaClon.querySelectorAll('input').forEach(function(inp) {
            var val = '';
            if (inp.type === 'checkbox') val = inp.checked ? 'Si' : 'No';
            else val = inp.value || '-';
            var span = document.createElement('span');
            span.textContent = val;
            inp.parentNode.replaceChild(span, inp);
        });
        tablaClon.querySelectorAll('td, th').forEach(function(c) {
            c.style.color = '#000';
            c.style.borderColor = '#000';
            c.style.background = 'transparent';
            c.style.padding = '5px 8px';
        });
        tablaClon.querySelectorAll('th').forEach(function(th) {
            th.style.backgroundColor = '#ddd';
            th.style.color = '#000';
            th.style.border = '1px solid #000';
        });
        tablaClon.querySelectorAll('tr').forEach(function(tr) {
            tr.style.borderBottom = '1px solid #ccc';
        });
        tablaClon.style.width = '100%';
        tablaClon.style.borderCollapse = 'collapse';
        tablaClon.style.fontSize = '12px';
        tablaHtml = tablaClon.outerHTML;
    }

    tempDiv.innerHTML =
        '<h1 style="text-align:center;color:#000;margin:0 0 2px 0;font-size:18px;">Congregacion Agua Azul</h1>' +
        '<h2 style="text-align:center;color:#000;margin:0 0 3px 0;font-size:15px;">' + nombreMes + '</h2>' +
        '<p style="text-align:center;color:#555;margin:0 0 10px 0;font-size:12px;">' + grupoTexto + '</p>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:12px;">' + statsFila + '</table>' +
        tablaHtml;

    document.body.appendChild(tempDiv);

    html2pdf().set({
        margin: [8, 8, 8, 8],
        filename: nombreMes + '_' + grupoTexto + '.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }).from(tempDiv).save().then(function() {
        document.body.removeChild(tempDiv);
    });
});

cargarDatosIniciales(function() {
    actualizarSelectorGrupos();
    cargarAnioDesdeDatos();
    mostrarMes();
});

window.addEventListener('storage', function(e) {
    if (e.key === 'publicadores') {
        var local = JSON.parse(localStorage.getItem('publicadores')) || [];
        cacheLista = local.filter(function(f) { return f && f.nombre; });
        actualizarSelectorGrupos();
        cargarAnioDesdeDatos();
        mostrarMes();
    }
});

var canal = new BroadcastChannel('publicadores_sync');
canal.onmessage = function(e) {
    if (e.data === 'actualizar') {
        var local = JSON.parse(localStorage.getItem('publicadores')) || [];
        cacheLista = local.filter(function(f) { return f && f.nombre; });
        actualizarSelectorGrupos();
        cargarAnioDesdeDatos();
        mostrarMes();
    }
};
