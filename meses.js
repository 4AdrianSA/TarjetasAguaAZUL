var nombresMeses = ['Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'];
var modoEdicionMasiva = false;

function cargarLista() {
    var datos = JSON.parse(localStorage.getItem('publicadores')) || [];
    return datos.filter(function(f) { return f && f.nombre; });
}

function guardarLista(lista) {
    localStorage.setItem('publicadores', JSON.stringify(lista));
    canal.postMessage('actualizar');
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
    if (cargos.indexOf('Precusor Regular') !== -1) return 2;
    if (cargos.indexOf('Precsor Especial') !== -1) return 3;
    if (cargos.indexOf('Anciano') !== -1) return 4;
    if (cargos.indexOf('Siervo ministerial') !== -1) return 5;
    return 6;
}

function toggleEdicionMasiva() {
    modoEdicionMasiva = !modoEdicionMasiva;
    var btn = document.getElementById('btn-editar-masivo');
    btn.textContent = modoEdicionMasiva ? 'Guardar Todos' : 'Editar Todos';
    btn.style.backgroundColor = modoEdicionMasiva ? '#9ece6a' : '#7aa2f7';
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
        if (horasIn) f.meses[idxMes].horas = parseInt(horasIn.value) || 0;
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
        lista = lista.filter(function(f) { return f.grupoNumero === valorGrupo; });
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

        if (cargos.indexOf('Precusor Regular') !== -1) {
            precRegHoras += horas;
            precRegCursos += cursos;
            if (participo) precRegParticipo++;
        }
        if (cargos.indexOf('Precsor Especial') !== -1) {
            precAuxHoras += horas;
            precAuxCursos += cursos;
            if (participo) precAuxParticipo++;
        }

        return {
            id: f.id,
            nombre: f.nombre,
            servicio: cargoPrincipal || 'Publicador',
            participo: participo,
            cursos: cursos,
            horas: horas,
            notas: notas,
            peso: pesoCargo(cargos, f.rolGrupo),
            esPrecReg: cargos.indexOf('Precusor Regular') !== -1
        };
    });

    filas.sort(function(a, b) {
        if (a.peso !== b.peso) return a.peso - b.peso;
        return a.nombre.localeCompare(b.nombre);
    });

    var statsHtml = '<div class="estadisticas">' +
        '<div class="stat-card verde"><div class="numero">' + totalParticipo + '</div><div class="label">Participaron</div></div>' +
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
        '</tr></thead><tbody>';

    filas.forEach(function(f) {
        var claseFila = '';
        if (!f.participo) claseFila = 'fila-no-participo';
        var claseHoras = '';
        if (f.esPrecReg && f.horas >= 50) claseHoras = 'si';
        else if (f.esPrecReg && f.horas > 0 && f.horas < 50) claseHoras = 'horas-bajas';

        if (modoEdicionMasiva) {
            tablaHtml += '<tr data-id="' + f.id + '" class="' + claseFila + '">' +
                '<td style="text-align:left;">' + f.nombre + '</td>' +
                '<td style="font-size:12px;">' + f.servicio + '</td>' +
                '<td><input type="checkbox" class="edit-participo"' + (f.participo ? ' checked' : '') + '></td>' +
                '<td><input type="number" class="edit-cursos" value="' + f.cursos + '" min="0" style="width:50px;"></td>' +
                '<td class="' + claseHoras + '"><input type="number" class="edit-horas" value="' + f.horas + '" min="0" style="width:60px;"></td>' +
                '<td><input type="text" class="edit-notas" value="' + f.notas.replace(/"/g, '&quot;') + '" style="width:120px;"></td>' +
                '</tr>';
        } else {
            tablaHtml += '<tr data-id="' + f.id + '" class="' + claseFila + '">' +
                '<td style="text-align:left;">' + f.nombre + '</td>' +
                '<td style="font-size:12px;">' + f.servicio + '</td>' +
                '<td class="' + (f.participo ? 'si' : 'no') + '">' + (f.participo ? '\u2713' : '\u2717') + '</td>' +
                '<td>' + f.cursos + '</td>' +
                '<td class="' + claseHoras + '">' + f.horas + '</td>' +
                '<td style="text-align:left;font-size:12px;">' + f.notas + '</td>' +
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
        '</tr>';

    tablaHtml += '</tbody></table>';

    document.getElementById('contenedor-mes').innerHTML = tablaHtml;
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

    var tabla = document.querySelector('.tabla-mes');
    var stats = document.getElementById('estadisticas-container');

    var tempDiv = document.createElement('div');
    tempDiv.style.color = '#000000';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.padding = '15px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.width = '750px';
    tempDiv.style.maxWidth = '750px';

    tempDiv.innerHTML = '<h1 style="text-align:center;color:#000;margin-bottom:5px;">' + nombreMes + '</h1>' +
        '<p style="text-align:center;color:#555;margin-bottom:15px;">' + grupoTexto + '</p>' +
        stats.innerHTML;

    if (tabla) {
        var tablaClon = tabla.cloneNode(true);
        var celdas = tablaClon.querySelectorAll('td, th');
        celdas.forEach(function(c) {
            c.style.color = '#000';
            c.style.borderColor = '#000';
        });
        var filasTabla = tablaClon.querySelectorAll('tr');
        filasTabla.forEach(function(f) { f.style.color = '#000'; });
        var ths = tablaClon.querySelectorAll('th');
        ths.forEach(function(th) {
            th.style.backgroundColor = '#eee';
            th.style.color = '#000';
        });
        tempDiv.appendChild(tablaClon);
    }

    document.body.appendChild(tempDiv);

    html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: nombreMes + '_' + grupoTexto + '.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }).from(tempDiv).save().then(function() {
        document.body.removeChild(tempDiv);
    });
});

actualizarSelectorGrupos();
cargarAnioDesdeDatos();
mostrarMes();

window.addEventListener('storage', function(e) {
    if (e.key === 'publicadores') {
        actualizarSelectorGrupos();
        cargarAnioDesdeDatos();
        mostrarMes();
    }
});

var canal = new BroadcastChannel('publicadores_sync');
canal.onmessage = function(e) {
    if (e.data === 'actualizar') {
        actualizarSelectorGrupos();
        cargarAnioDesdeDatos();
        mostrarMes();
    }
};
