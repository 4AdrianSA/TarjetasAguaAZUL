var modoEdicionMasiva = false;
var editandoFilaId = null;
var modoEditarNombres = false;
var CONTRASENA_SECRETARIO = ['P','a','n','d','a','2','0','0','4','2'].join('');

function solicitudesPendientes() {
    return cargarSolicitudes().filter(function(s) { return s.estado === 'pendiente'; });
}

function mesesVaciosParaPublicador() {
    return nombresMeses.map(function(n) {
        return { nombre: n, participo: false, cursos: 0, auxiliar: false, horas: 0, notas: '', precursorRegular: false };
    });
}

function badgePendiente() {
    return ' <span class="badge-estado badge-pendiente">&#9203; esperando aprobaci\u00F3n</span>';
}

function nombreConBadges(f) {
    var html = escapeHtml(f.nombre);
    if (f.estado === 'Inactivo') html += ' <span class="badge-estado badge-estado-inactivo">INACTIVO</span>';
    if (f.estado === 'Baja') html += ' <span class="badge-estado badge-estado-baja">BAJA</span>';
    if (f._pendiente) html += badgePendiente();
    return html;
}

function anioServicioActual() {
    var hoy = new Date();
    return hoy.getMonth() >= 8 ? hoy.getFullYear() + 1 : hoy.getFullYear();
}

function esMesLibre(idxMes) {
    var hoy = new Date();
    var idxActual = (hoy.getMonth() + 4) % 12;
    var idxAnterior = (hoy.getMonth() + 3) % 12;
    return idxMes === idxActual || idxMes === idxAnterior;
}

function verificarAccesoMes() {
    var idxMes = parseInt(document.getElementById('select-mes').value);
    var valorAnio = document.getElementById('select-anio-servicio').value;
    var esAnioActual = valorAnio === 'todos' || String(valorAnio) === String(anioServicioActual());
    if (esAnioActual && esMesLibre(idxMes)) return true;
    if (!confirm('Estás editando otro mes que no corresponde (' + nombresMeses[idxMes] + '). ¿Seguro que deseas continuar?')) return false;
    var clave = prompt('Contraseña del Secretario:');
    if (clave === CONTRASENA_SECRETARIO) return true;
    alert('Contraseña incorrecta.');
    return false;
}

function tieneOpcionGrupo(select, valor) {
    for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === String(valor)) return true;
    }
    return false;
}

function seleccionarGrupoUsuario() {
    var select = document.getElementById('select-grupo-mes');
    var guardado = localStorage.getItem('grupoUsuario');
    if (guardado) {
        if (tieneOpcionGrupo(select, guardado)) select.value = String(guardado);
        return;
    }
    var numero = prompt('¿Qué grupo eres? (número)');
    if (numero === null || numero.trim() === '') return;
    numero = numero.trim();
    if (!/^\d{1,2}$/.test(numero)) return;
    localStorage.setItem('grupoUsuario', numero);
    if (tieneOpcionGrupo(select, numero)) select.value = String(numero);
}

function volverAlRegistro() {
    var clave = prompt('Contraseña del Secretario:');
    if (clave === CONTRASENA_SECRETARIO) {
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
    if (!verificarAccesoMes()) return;
    modoEdicionMasiva = !modoEdicionMasiva;
    modoEditarNombres = false;
    editandoFilaId = null;
    var btn = document.getElementById('btn-editar-masivo');
    btn.textContent = modoEdicionMasiva ? 'Guardar Todos' : 'Editar Todos';
    btn.style.backgroundColor = modoEdicionMasiva ? '#9ece6a' : '#7aa2f7';
    mostrarMes();
}

function toggleEditarNombres() {
    modoEditarNombres = !modoEditarNombres;
    modoEdicionMasiva = false;
    editandoFilaId = null;
    var btn = document.getElementById('btn-editar-masivo');
    btn.textContent = 'Editar Todos';
    btn.style.backgroundColor = '#7aa2f7';
    var btnNombres = document.getElementById('btn-editar-nombres');
    if (btnNombres) {
        btnNombres.textContent = modoEditarNombres ? 'Guardar Nombres' : '✏️ Editar Nombres';
        btnNombres.style.backgroundColor = modoEditarNombres ? '#9ece6a' : '#e0af68';
    }
    mostrarMes();
}

function cancelarEditarNombres() {
    modoEditarNombres = false;
    var btnNombres = document.getElementById('btn-editar-nombres');
    if (btnNombres) {
        btnNombres.textContent = '✏️ Editar Nombres';
        btnNombres.style.backgroundColor = '#e0af68';
    }
    mostrarMes();
}

function guardarNombres() {
    var solicitudes = cargarSolicitudes();
    var creadas = 0;
    document.querySelectorAll('.tabla-mes tr[data-id] .edit-nombre').forEach(function(input) {
        var tr = input.closest('tr');
        var id = parseInt(tr.dataset.id);
        var nuevoNombre = input.value.trim();
        if (!nuevoNombre) return;

        var listaReal = cargarLista();
        var fActual = null;
        for (var i = 0; i < listaReal.length; i++) {
            if (Number(listaReal[i].id) === id) { fActual = listaReal[i]; break; }
        }
        if (!fActual) return;
        if (fActual.nombre === nuevoNombre) return;

        var actualizada = false;
        solicitudes.forEach(function(s) {
            if (s.estado === 'pendiente' && s.tipo === 'renombrar' && Number(s.publicadorId) === id) {
                s.nombre = nuevoNombre;
                s.fecha = new Date().toISOString();
                actualizada = true;
            }
        });
        if (!actualizada) {
            solicitudes.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                tipo: 'renombrar',
                nombre: nuevoNombre,
                nombreAnterior: fActual.nombre,
                publicadorId: id,
                autor: localStorage.getItem('grupoUsuario') || 'Grupo ?',
                fecha: new Date().toISOString(),
                estado: 'pendiente',
                detalle: {}
            });
        }
        creadas++;
    });

    guardarSolicitudes(solicitudes);
    modoEditarNombres = false;
    var btnNombres = document.getElementById('btn-editar-nombres');
    if (btnNombres) {
        btnNombres.textContent = '✏️ Editar Nombres';
        btnNombres.style.backgroundColor = '#e0af68';
    }
    mostrarMes();
    mostrarToast(creadas > 0 ? (creadas + ' cambio(s) de nombre enviados para aprobaci\u00F3n') : 'No hubo cambios de nombre', 'ok');
}

function agregarPublicador() {
    var nombre = prompt('Nombre completo del nuevo publicador:');
    if (nombre === null || nombre.trim() === '') return;
    nombre = nombre.trim();
    var grupo = prompt('N\u00FAmero de grupo del nuevo publicador (1-6):');
    if (grupo === null) return;
    grupo = grupo.trim();
    if (!/^\d{1,2}$/.test(grupo)) grupo = '';

    var id = Date.now();
    var solicitudes = cargarSolicitudes();
    solicitudes.push({
        id: id,
        tipo: 'nuevo',
        nombre: nombre,
        nombreAnterior: '',
        grupoNumero: grupo,
        autor: localStorage.getItem('grupoUsuario') || 'Grupo ?',
        fecha: new Date().toISOString(),
        estado: 'pendiente',
        detalle: {
            id: id,
            nombre: nombre,
            grupoNumero: grupo,
            anioServicio: anioServicioActual(),
            estado: 'Activo',
            cargo: [],
            genero: '',
            grupo: 'Otras ovejas',
            rolGrupo: '',
            fechaNacimiento: '',
            fechaBautismo: '',
            observaciones: '',
            meses: mesesVaciosParaPublicador()
        }
    });
    guardarSolicitudes(solicitudes);
    mostrarToast('Solicitud de alta enviada: ' + nombre, 'ok');
    mostrarMes();
}

function editarFila(id) {
    if (!verificarAccesoMes()) return;
    editandoFilaId = parseInt(id);
    mostrarMes();
}

function guardarFila(id) {
    id = parseInt(id);
    var idxMes = parseInt(document.getElementById('select-mes').value);

    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    var participoCb = tr.querySelector('.edit-participo');
    var cursosIn = tr.querySelector('.edit-cursos');
    var horasIn = tr.querySelector('.edit-horas');
    var auxiliarCb = tr.querySelector('.edit-auxiliar');
    var notasIn = tr.querySelector('.edit-notas');

    var pendientes = solicitudesPendientes();
    var solicitud = null;
    for (var p = 0; p < pendientes.length; p++) {
        if (pendientes[p].tipo === 'nuevo' && Number(pendientes[p].id) === id) { solicitud = pendientes[p]; break; }
    }

    if (solicitud) {
        if (!solicitud.detalle) solicitud.detalle = {};
        var mesPend = (solicitud.detalle.meses && Array.isArray(solicitud.detalle.meses)) ? solicitud.detalle.meses : mesesVaciosParaPublicador();
        if (!mesPend[idxMes]) mesPend[idxMes] = { participo: false, cursos: 0, auxiliar: false, horas: 0, notas: '' };
        if (participoCb) mesPend[idxMes].participo = participoCb.checked;
        if (cursosIn) mesPend[idxMes].cursos = parseInt(cursosIn.value) || 0;
        if (horasIn) mesPend[idxMes].horas = parseFloat(horasIn.value) || 0;
        if (auxiliarCb) mesPend[idxMes].auxiliar = auxiliarCb.checked;
        if (notasIn) mesPend[idxMes].notas = notasIn.value;
        solicitud.detalle.meses = mesPend;
        var solicitudes = cargarSolicitudes();
        for (var q = 0; q < solicitudes.length; q++) {
            if (Number(solicitudes[q].id) === id) { solicitudes[q] = solicitud; break; }
        }
        guardarSolicitudes(solicitudes);
        editandoFilaId = null;
        mostrarMes();
        return;
    }

    var lista = cargarLista();
    var f = null;
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].id === id) { f = lista[i]; break; }
    }
    if (!f) return;

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
    if (auxiliarCb) f.meses[idxMes].auxiliar = auxiliarCb.checked;
    if (notasIn) f.meses[idxMes].notas = notasIn.value;

    guardarLista(lista);
    editandoFilaId = null;
    mostrarMes();
}

function guardarEdicionMasiva() {
    var idxMes = parseInt(document.getElementById('select-mes').value);
    var lista = cargarLista();

    function aplicarFilaMes(f) {
        var tr = document.querySelector('tr[data-id="' + f.id + '"]');
        if (!tr) return;
        var participoCb = tr.querySelector('.edit-participo');
        var cursosIn = tr.querySelector('.edit-cursos');
        var horasIn = tr.querySelector('.edit-horas');
        var auxiliarCb = tr.querySelector('.edit-auxiliar');
        var notasIn = tr.querySelector('.edit-notas');
        if (!f.meses || !Array.isArray(f.meses)) {
            f.meses = mesesVaciosParaPublicador();
        }
        if (!f.meses[idxMes]) {
            f.meses[idxMes] = { participo: false, cursos: 0, auxiliar: false, horas: 0, notas: '' };
        }
        if (participoCb) f.meses[idxMes].participo = participoCb.checked;
        if (cursosIn) f.meses[idxMes].cursos = parseInt(cursosIn.value) || 0;
        if (horasIn) f.meses[idxMes].horas = parseFloat(horasIn.value) || 0;
        if (auxiliarCb) f.meses[idxMes].auxiliar = auxiliarCb.checked;
        if (notasIn) f.meses[idxMes].notas = notasIn.value;
    }

    lista.forEach(aplicarFilaMes);

    var solicitudes = cargarSolicitudes();
    solicitudes.forEach(function(s) {
        if (s.tipo === 'nuevo' && s.estado === 'pendiente') {
            if (!s.detalle) s.detalle = {};
            if (!Array.isArray(s.detalle.meses)) s.detalle.meses = mesesVaciosParaPublicador();
            aplicarFilaMes(s.detalle);
        }
    });

    guardarSolicitudes(solicitudes);
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

    var solicitudes = solicitudesPendientes();
    solicitudes.forEach(function(s) {
        if (s.tipo === 'nuevo') {
            var detalle = s.detalle || {};
            lista.push({
                id: s.id,
                nombre: s.nombre,
                grupoNumero: s.grupoNumero || detalle.grupoNumero || '',
                anioServicio: detalle.anioServicio || anioServicioActual(),
                estado: detalle.estado || 'Activo',
                cargo: detalle.cargo || [],
                rolGrupo: detalle.rolGrupo || '',
                genero: detalle.genero || '',
                fechaNacimiento: detalle.fechaNacimiento || '',
                fechaBautismo: detalle.fechaBautismo || '',
                observaciones: detalle.observaciones || 'Esperando aprobaci\u00F3n',
                meses: detalle.meses || mesesVaciosParaPublicador(),
                _pendiente: true
            });
        } else if (s.tipo === 'renombrar') {
            for (var i = 0; i < lista.length; i++) {
                if (Number(lista[i].id) === Number(s.publicadorId)) {
                    lista[i]._pendiente = true;
                    lista[i]._nombreOriginal = lista[i].nombre;
                    lista[i].nombre = s.nombre;
                    break;
                }
            }
        }
    });

    if (valorGrupo !== 'todos') {
        lista = lista.filter(function(f) { return String(f.grupoNumero) === String(valorGrupo); });
    }
    if (valorAnio !== 'todos') {
        lista = lista.filter(function(f) { return String(f.anioServicio) === String(valorAnio); });
    }
    var busqueda = (document.getElementById('input-buscar').value || '').toLowerCase().trim();
    if (busqueda) {
        lista = lista.filter(function(f) { return (f.nombre || '').toLowerCase().indexOf(busqueda) !== -1; });
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
        var auxiliar = mes ? mes.auxiliar : false;
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
            auxiliar: auxiliar,
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
    } else if (modoEditarNombres) {
        accionHtml = '<button class="btn-guardar-fila" onclick="guardarNombres()" style="padding:8px 18px;font-size:14px;">Guardar Nombres</button> ' +
            '<button class="btn-guardar-fila" style="background-color:#f7768e;color:#1a1b26;padding:8px 18px;font-size:14px;" onclick="cancelarEditarNombres()">Cancelar</button>';
    }

    var anioTexto = (valorAnio && valorAnio !== 'todos') ? ' - Año: ' + valorAnio : '';
    var tablaHtml = '<div class="resumen-header">' +
        '<h2>' + nombreMes + ' - ' + filas.length + ' publicadores' + anioTexto + '</h2>' +
        accionHtml +
        '</div>' +
        '<table class="tabla-mes">' +
        '<thead><tr>' +
            '<th style="width:30px;">N°</th>' +
            '<th style="text-align:left;">Nombre</th>' +
            '<th>Servicio</th>' +
            '<th>Participo</th>' +
            '<th>Cursos</th>' +
            '<th>Horas</th>' +
            '<th>Prec. Auxiliar</th>' +
            '<th style="text-align:left;">Notas</th>' +
            '<th>Acciones</th>' +
        '</tr></thead><tbody>';

    filas.forEach(function(f, numFila) {
        var claseFila = '';
        if (f.estado === 'Inactivo') claseFila = 'fila-inactivo';
        else if (f.estado === 'Baja') claseFila = 'fila-baja';
        else if (!f.participo) claseFila = 'fila-no-participo';
        var claseHoras = '';
        if (f.esPrecReg && f.horas >= 50) claseHoras = 'si';
        else if (f.esPrecReg && f.horas > 0 && f.horas < 50) claseHoras = 'horas-bajas';

        if (modoEdicionMasiva) {
            tablaHtml += '<tr data-id="' + f.id + '" class="' + claseFila + '">' +
                '<td>' + (numFila + 1) + '</td>' +
                '<td style="text-align:left;">' + nombreConBadges(f) + '</td>' +
                '<td style="font-size:12px;">' + f.servicio + '</td>' +
                '<td><input type="checkbox" class="edit-participo"' + (f.participo ? ' checked' : '') + '></td>' +
                '<td><input type="number" class="edit-cursos" value="' + f.cursos + '" min="0" style="width:50px;"></td>' +
                '<td class="' + claseHoras + '"><input type="number" class="edit-horas" value="' + f.horas + '" min="0" step="0.5" style="width:60px;"></td>' +
                '<td><input type="checkbox" class="edit-auxiliar"' + (f.auxiliar ? ' checked' : '') + '></td>' +
                '<td><input type="text" class="edit-notas" value="' + f.notas.replace(/"/g, '&quot;') + '" style="width:120px;"></td>' +
                '<td></td>' +
                '</tr>';
        } else if (modoEditarNombres) {
            tablaHtml += '<tr data-id="' + f.id + '" class="' + claseFila + '">' +
                '<td>' + (numFila + 1) + '</td>' +
                '<td style="text-align:left;"><input type="text" class="edit-nombre" value="' + escapeHtml(f.nombre) + '" style="width:220px;"' + (f._pendiente ? ' data-pendiente="1"' : '') + '>' + (f._pendiente ? badgePendiente() : '') + '</td>' +
                '<td style="font-size:12px;">' + f.servicio + '</td>' +
                '<td class="' + (f.participo ? 'si' : 'no') + '">' + (f.participo ? '\u2713' : '\u2717') + '</td>' +
                '<td>' + f.cursos + '</td>' +
                '<td class="' + claseHoras + '">' + f.horas + '</td>' +
                '<td class="' + (f.auxiliar ? 'si' : 'no') + '">' + (f.auxiliar ? '\u2713' : '\u2717') + '</td>' +
                '<td style="text-align:left;font-size:12px;">' + escapeHtml(f.notas) + '</td>' +
                '<td></td>' +
                '</tr>';
        } else if (editandoFilaId === f.id) {
            tablaHtml += '<tr data-id="' + f.id + '" class="' + claseFila + '">' +
                '<td>' + (numFila + 1) + '</td>' +
                '<td style="text-align:left;">' + nombreConBadges(f) + '</td>' +
                '<td style="font-size:12px;">' + f.servicio + '</td>' +
                '<td><input type="checkbox" class="edit-participo"' + (f.participo ? ' checked' : '') + '></td>' +
                '<td><input type="number" class="edit-cursos" value="' + f.cursos + '" min="0" style="width:50px;"></td>' +
                '<td class="' + claseHoras + '"><input type="number" class="edit-horas" value="' + f.horas + '" min="0" step="0.5" style="width:60px;"></td>' +
                '<td><input type="checkbox" class="edit-auxiliar"' + (f.auxiliar ? ' checked' : '') + '></td>' +
                '<td><input type="text" class="edit-notas" value="' + f.notas.replace(/"/g, '&quot;') + '" style="width:120px;"></td>' +
                '<td><button class="btn-guardar-fila" onclick="guardarFila(\'' + f.id + '\')" style="padding:4px 10px;font-size:12px;">Guardar</button> ' +
                '<button class="btn-guardar-fila" style="background-color:#f7768e;color:#1a1b26;padding:4px 10px;font-size:12px;" onclick="editandoFilaId=null;mostrarMes();">Cancelar</button></td>' +
                '</tr>';
        } else {
            tablaHtml += '<tr data-id="' + f.id + '" class="' + claseFila + '">' +
                '<td>' + (numFila + 1) + '</td>' +
                '<td style="text-align:left;">' + nombreConBadges(f) + '</td>' +
                '<td style="font-size:12px;">' + f.servicio + '</td>' +
                '<td class="' + (f.participo ? 'si' : 'no') + '">' + (f.participo ? '\u2713' : '\u2717') + '</td>' +
                '<td>' + f.cursos + '</td>' +
                '<td class="' + claseHoras + '">' + f.horas + '</td>' +
                '<td class="' + (f.auxiliar ? 'si' : 'no') + '">' + (f.auxiliar ? '\u2713' : '\u2717') + '</td>' +
                '<td style="text-align:left;font-size:12px;">' + escapeHtml(f.notas) + (f.observaciones ? ' <em style="color:#bb9af7;">(' + escapeHtml(f.observaciones) + ')</em>' : '') + '</td>' +
                '<td><button class="btn-guardar-fila" onclick="editarFila(\'' + f.id + '\')" style="padding:4px 10px;font-size:12px;background-color:#7aa2f7;">Editar</button></td>' +
                '</tr>';
        }
    });

    tablaHtml += '<tr class="total-row">' +
        '<td></td>' +
        '<td style="text-align:left;">TOTAL</td>' +
        '<td></td>' +
        '<td>' + totalParticipo + '/' + filas.length + '</td>' +
        '<td>' + totalCursos + '</td>' +
        '<td>' + totalHoras + '</td>' +
        '<td></td>' +
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
    anios[String(anioServicioActual())] = true;
    var select = document.getElementById('select-anio-servicio');
    var valorActual = select.value;
    select.innerHTML = '<option value="todos">Todos</option>';
    Object.keys(anios).sort().forEach(function(a) {
        var opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        select.appendChild(opt);
    });
    if (valorActual === 'todos' || !anios[valorActual]) {
        select.value = String(anioServicioActual());
    } else {
        select.value = valorActual;
    }
}

function seleccionarMesAutomatico() {
    document.getElementById('select-mes').value = String((new Date().getMonth() + 3) % 12);
}

document.getElementById('select-mes').addEventListener('change', function() { modoEdicionMasiva = false; mostrarMes(); });
document.getElementById('input-buscar').addEventListener('input', function() {
    modoEdicionMasiva = false;
    editandoFilaId = null;
    mostrarMes();
});
document.getElementById('select-grupo-mes').addEventListener('change', function() {
    modoEdicionMasiva = false;
    var val = this.value;
    if (val !== 'todos') localStorage.setItem('grupoUsuario', val);
    mostrarMes();
});
document.getElementById('select-anio-servicio').addEventListener('change', function() { modoEdicionMasiva = false; mostrarMes(); });
document.getElementById('btn-editar-masivo').addEventListener('click', function() {
    if (modoEdicionMasiva) {
        guardarEdicionMasiva();
    } else {
        toggleEdicionMasiva();
    }
});

document.getElementById('btn-editar-nombres').addEventListener('click', toggleEditarNombres);
document.getElementById('btn-agregar-publicador').addEventListener('click', agregarPublicador);

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
    tempDiv.style.filter = 'grayscale(1)';
    tempDiv.style.webkitFilter = 'grayscale(1)';

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
            c.style.setProperty('color', '#000', 'important');
            c.style.setProperty('border-color', '#000', 'important');
            c.style.setProperty('background-color', '#fff', 'important');
            c.style.setProperty('border-left', '1px solid #000', 'important');
            c.style.setProperty('border-right', '1px solid #000', 'important');
            c.style.padding = '5px 8px';
        });
        tablaClon.querySelectorAll('th').forEach(function(th) {
            th.style.setProperty('background-color', '#fff', 'important');
            th.style.setProperty('color', '#000', 'important');
            th.style.setProperty('border', '1px solid #000', 'important');
        });
        tablaClon.querySelectorAll('tr').forEach(function(tr) {
            tr.style.setProperty('background-color', '#fff', 'important');
            tr.style.setProperty('border-bottom', '1px solid #ccc', 'important');
        });
        tablaClon.querySelectorAll('.badge-estado').forEach(function(b) {
            b.style.setProperty('background-color', '#ddd', 'important');
            b.style.setProperty('color', '#000', 'important');
            b.style.setProperty('border', '1px solid #000', 'important');
        });
        tablaClon.style.width = '100%';
        tablaClon.style.borderCollapse = 'collapse';
        tablaClon.style.fontSize = '12px';
        tablaHtml = tablaClon.outerHTML;
    }

    tempDiv.innerHTML =
        '<h1 style="text-align:center;color:#000;margin:0 0 2px 0;font-size:18px;">Congregacion Agua Azul - Anio de servicio ' + anioServicioActual() + '</h1>' +
        '<h2 style="text-align:center;color:#000;margin:0 0 3px 0;font-size:15px;">' + nombreMes + '</h2>' +
        '<p style="text-align:center;color:#555;margin:0 0 10px 0;font-size:12px;">' + grupoTexto + '</p>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:12px;background-color:#fff;">' + statsFila + '</table>' +
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
    seleccionarMesAutomatico();
    seleccionarGrupoUsuario();
    mostrarMes();
});

window.addEventListener('storage', function(e) {
    if (e.key === 'publicadores' || e.key === 'solicitudes') {
        var local = JSON.parse(localStorage.getItem('publicadores')) || [];
        cacheLista = local.filter(function(f) { return f && f.nombre; });
        cacheSolicitudes = (JSON.parse(localStorage.getItem('solicitudes')) || []).filter(function(s) { return s && s.id; });
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
        cacheSolicitudes = (JSON.parse(localStorage.getItem('solicitudes')) || []).filter(function(s) { return s && s.id; });
        actualizarSelectorGrupos();
        cargarAnioDesdeDatos();
        mostrarMes();
    }
};
