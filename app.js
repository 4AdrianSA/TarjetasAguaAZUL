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
    if (!Array.isArray(meses) || meses.length === 0) return '';
    var totalHoras = 0;
    var totalCursos = 0;
    meses.forEach(function(m) { totalHoras += m.horas || 0; totalCursos += m.cursos || 0; });

    var html = '<table style="width:100%;table-layout:fixed;border-collapse:collapse;margin:6px 0;font-size:12px;border-color:#000;">' +
        '<thead><tr>' +
        '<th style="border:1px solid #000;padding:4px 5px;text-align:left;background:#eee;color:#000;">Mes</th>' +
        '<th style="border:1px solid #000;padding:4px 5px;text-align:center;background:#eee;color:#000;">Participo</th>' +
        '<th style="border:1px solid #000;padding:4px 5px;text-align:center;background:#eee;color:#000;">Cursos</th>' +
        '<th style="border:1px solid #000;padding:4px 5px;text-align:center;background:#eee;color:#000;">Auxiliar</th>' +
        '<th style="border:1px solid #000;padding:4px 5px;text-align:center;background:#eee;color:#000;">Horas</th>' +
        '<th style="border:1px solid #000;padding:4px 5px;text-align:left;background:#eee;color:#000;">Notas</th>' +
        '</tr></thead><tbody>';
    meses.forEach(function(m) {
        html += '<tr>' +
            '<td style="border:1px solid #000;padding:4px 5px;color:#000;">' + m.nombre + '</td>' +
            '<td style="border:1px solid #000;padding:4px 5px;text-align:center;color:#000;">' + (m.participo ? '\u2713' : '') + '</td>' +
            '<td style="border:1px solid #000;padding:4px 5px;text-align:center;color:#000;">' + m.cursos + '</td>' +
            '<td style="border:1px solid #000;padding:4px 5px;text-align:center;color:#000;">' + (m.auxiliar ? '\u2713' : '') + '</td>' +
            '<td style="border:1px solid #000;padding:4px 5px;text-align:center;color:#000;">' + m.horas + '</td>' +
            '<td style="border:1px solid #000;padding:4px 5px;color:#000;">' + m.notas + '</td>' +
            '</tr>';
    });
    html += '<tr style="font-weight:bold;">' +
        '<td style="border:1px solid #000;padding:4px 5px;background:#eee;color:#000;" colspan="2">Total</td>' +
        '<td style="border:1px solid #000;padding:4px 5px;text-align:center;background:#eee;color:#000;">' + totalCursos + '</td>' +
        '<td style="border:1px solid #000;background:#eee;color:#000;"></td>' +
        '<td style="border:1px solid #000;padding:4px 5px;text-align:center;background:#eee;font-size:14px;color:#000;">' + totalHoras + '</td>' +
        '<td style="border:1px solid #000;background:#eee;color:#000;"></td>' +
        '</tr>';
    html += '</tbody></table>';
    return html;
}

function calcularResumenGrupo(datos) {
    var nombresMeses = ['Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'];

    var resumen = {
        totalPublicadores: datos.length,
        ancianos: 0,
        siervos: 0,
        precRegHoras: 0,
        precRegCursos: 0,
        precAuxHoras: 0,
        precAuxCursos: 0,
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
            pubCursos: 0,
            totalHoras: 0,
            totalCursos: 0,
            noParticipo: []
        });
    }

    datos.forEach(function(f) {
        var cargos = Array.isArray(f.cargo) ? f.cargo : (f.cargo ? [f.cargo] : []);
        var esPrecReg = cargos.indexOf('Precursor Regular') !== -1;
        var esPrecAux = cargos.indexOf('Precursor Especial') !== -1;

        if (cargos.indexOf('Anciano') !== -1) resumen.ancianos++;
        if (cargos.indexOf('Siervo ministerial') !== -1) resumen.siervos++;

        if (f.meses && Array.isArray(f.meses)) {
            f.meses.forEach(function(m, i) {
                resumen.totalHoras += m.horas || 0;
                resumen.totalCursos += m.cursos || 0;
                resumen.porMes[i].totalHoras += m.horas || 0;
                resumen.porMes[i].totalCursos += m.cursos || 0;

                if (m.participo) {
                    if (esPrecReg) {
                        resumen.precRegHoras += m.horas || 0;
                        resumen.precRegCursos += m.cursos || 0;
                        resumen.porMes[i].precRegHoras += m.horas || 0;
                        resumen.porMes[i].precRegCursos += m.cursos || 0;
                        resumen.porMes[i].precRegParticipo++;
                    }
                    if (esPrecAux) {
                        resumen.precAuxHoras += m.horas || 0;
                        resumen.precAuxCursos += m.cursos || 0;
                        resumen.porMes[i].precAuxHoras += m.horas || 0;
                        resumen.porMes[i].precAuxCursos += m.cursos || 0;
                        resumen.porMes[i].precAuxParticipo++;
                    }
                } else {
                    resumen.porMes[i].noParticipo.push(f.nombre);
                }
            });
        }
    });

    return resumen;
}

function renderizarResumen(resumen, titulo) {
    var html = '<div style="margin-top:15px;padding:10px;border:2px solid #000;background:#fff;color:#000;page-break-inside:avoid;">' +
        '<h3 style="margin:0 0 8px 0;border-bottom:1px solid #000;padding-bottom:4px;color:#000;">Resumen - ' + titulo + '</h3>' +
        '<p style="margin:2px 0;color:#000;"><strong>Total publicadores:</strong> ' + resumen.totalPublicadores + '</p>' +
        '<p style="margin:2px 0;color:#000;"><strong>Ancianos:</strong> ' + resumen.ancianos + ' | <strong>Siervos ministeriales:</strong> ' + resumen.siervos + '</p>' +
        '<p style="margin:2px 0;color:#000;"><strong>Prec. Reg. Horas:</strong> ' + resumen.precRegHoras + ' | <strong>Cursos:</strong> ' + resumen.precRegCursos + '</p>' +
        '<p style="margin:2px 0;color:#000;"><strong>Prec. Aux. Horas:</strong> ' + resumen.precAuxHoras + ' | <strong>Cursos:</strong> ' + resumen.precAuxCursos + '</p>' +
        '<p style="margin:2px 0;color:#000;"><strong>Total Horas:</strong> ' + resumen.totalHoras + ' | <strong>Total Cursos:</strong> ' + resumen.totalCursos + '</p>';

    html += '<table style="width:100%;table-layout:fixed;border-collapse:collapse;margin:8px 0;font-size:9px;border-color:#000;">' +
        '<thead><tr>' +
        '<th style="border:1px solid #000;padding:2px;background:#eee;color:#000;">Mes</th>' +
        '<th style="border:1px solid #000;padding:2px;background:#eee;color:#000;">PR.H</th>' +
        '<th style="border:1px solid #000;padding:2px;background:#eee;color:#000;">PR.C</th>' +
        '<th style="border:1px solid #000;padding:2px;background:#eee;color:#000;">PA.H</th>' +
        '<th style="border:1px solid #000;padding:2px;background:#eee;color:#000;">PA.C</th>' +
        '<th style="border:1px solid #000;padding:2px;background:#eee;color:#000;">TH</th>' +
        '<th style="border:1px solid #000;padding:2px;background:#eee;color:#000;">TC</th>' +
        '<th style="border:1px solid #000;padding:2px;background:#eee;color:#000;">No Part.</th>' +
        '</tr></thead><tbody>';

    resumen.porMes.forEach(function(m) {
        html += '<tr>' +
            '<td style="border:1px solid #000;padding:2px;color:#000;">' + m.nombre + '</td>' +
            '<td style="border:1px solid #000;padding:2px;text-align:center;color:#000;">' + m.precRegHoras + '</td>' +
            '<td style="border:1px solid #000;padding:2px;text-align:center;color:#000;">' + m.precRegCursos + '</td>' +
            '<td style="border:1px solid #000;padding:2px;text-align:center;color:#000;">' + m.precAuxHoras + '</td>' +
            '<td style="border:1px solid #000;padding:2px;text-align:center;color:#000;">' + m.precAuxCursos + '</td>' +
            '<td style="border:1px solid #000;padding:2px;text-align:center;color:#000;">' + m.totalHoras + '</td>' +
            '<td style="border:1px solid #000;padding:2px;text-align:center;color:#000;">' + m.totalCursos + '</td>' +
            '<td style="border:1px solid #000;padding:2px;font-size:8px;color:#000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (m.noParticipo.length > 0 ? m.noParticipo.join(', ') : '-') + '</td>' +
            '</tr>';
    });

    html += '</tbody></table></div>';
    return html;
}

function renderizarFichaPDF(ficha) {
    var cargo = Array.isArray(ficha.cargo) ? ficha.cargo.join(', ') : ficha.cargo;
    return '<div style="border:2px solid #000;margin:10px 0;padding:10px 12px;font-family:Arial,sans-serif;color:#000;background:#fff;page-break-inside:avoid;">' +
        '<div style="border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:6px;">' +
            '<h3 style="margin:0;font-size:17px;color:#000;">' + ficha.nombre + '</h3>' +
            '<p style="margin:1px 0 0 0;font-size:12px;color:#333;">' +
                (ficha.grupo ? 'Grupo ' + ficha.grupoNumero : '') +
                (ficha.rolGrupo ? ' - ' + ficha.rolGrupo : '') +
            '</p>' +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:6px;">' +
            '<tr>' +
                '<td style="padding:2px 5px;width:50%;"><strong>Nacimiento:</strong> ' + (ficha.fechaNacimiento || '-') + '</td>' +
                '<td style="padding:2px 5px;width:50%;"><strong>Bautismo:</strong> ' + (ficha.fechaBautismo || '-') + '</td>' +
            '</tr>' +
            '<tr>' +
                '<td style="padding:2px 5px;"><strong>Servicio:</strong> ' + (ficha.anioServicio || '-') + '</td>' +
                '<td style="padding:2px 5px;"><strong>Cargo:</strong> ' + (cargo || '-') + '</td>' +
            '</tr>' +
            '<tr>' +
                '<td style="padding:2px 5px;"><strong>Genero:</strong> ' + (ficha.genero || '-') + '</td>' +
            '</tr>' +
        '</table>' +
        (ficha.meses ? renderizarTablaMesesPDF(ficha.meses) : '') +
    '</div>';
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
        tempDiv.innerHTML += renderizarResumen(opciones.resumen, opciones.resumenTitulo || 'Resumen');
    }

    document.body.appendChild(tempDiv);

    html2pdf().set({
        margin: 10,
        filename: opciones.filename || ('Ficha_' + (ficha.nombre || 'Publicador') + '.pdf'),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'letter', orientation: opciones.orientation || 'portrait' },
        pagebreak: { mode: ['css'] }
    }).from(tempDiv).save().then(function() {
        if (tempDiv.parentNode) document.body.removeChild(tempDiv);
    }).catch(function(err) {
        console.error('Error generando PDF:', err);
        alert('Error al generar PDF: ' + err.message);
        if (tempDiv.parentNode) document.body.removeChild(tempDiv);
    });
}

function renderizarFicha(ficha) {
    var cargo = Array.isArray(ficha.cargo) ? ficha.cargo.join(', ') : ficha.cargo;
    var cargoChecks = '';
    var cargosDisponibles = ['Anciano','Siervo ministerial','Precursor Regular','Precursor Especial','Misionero que sirve en el campo'];
    cargosDisponibles.forEach(function(c) {
        var marcado = Array.isArray(ficha.cargo) && ficha.cargo.indexOf(c) !== -1 ? ' checked' : '';
        cargoChecks += '<label style="font-weight:normal;margin-right:8px;"><input type="checkbox" name="edit-cargo" value="' + c + '"' + marcado + '> ' + c + '</label>';
    });

    var html = '<div class="ficha" data-id="' + ficha.id + '">' +
        '<div class="ficha-header">' +
            '<h3>' + ficha.nombre + '</h3>' +
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
        '</div>';

    if (ficha.meses && Array.isArray(ficha.meses)) {
        html += '<table class="ficha-tabla"><thead><tr>' +
            '<th>Mes</th><th>Part.</th><th>Cursos</th><th>Aux.</th><th>Horas</th><th>Notas</th>' +
            '</tr></thead><tbody>';
        ficha.meses.forEach(function(m) {
            html += '<tr>' +
                '<td>' + m.nombre + '</td>' +
                '<td>' + (m.participo ? '\u2713' : '') + '</td>' +
                '<td>' + m.cursos + '</td>' +
                '<td>' + (m.auxiliar ? '\u2713' : '') + '</td>' +
                '<td>' + m.horas + '</td>' +
                '<td>' + (m.notas || '') + '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
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
    if (!texto) {
        mostrarFichas(lista);
        return;
    }
    var filtrada = lista.filter(function(f) {
        return f.nombre.toLowerCase().indexOf(texto) !== -1;
    });
    mostrarFichas(filtrada);
});

document.getElementById('select-grupo-pdf').addEventListener('change', function() {
    var lista = cargarLista();
    var valor = this.value;
    if (valor === 'todos') {
        mostrarFichas(lista);
    } else {
        mostrarFichas(lista.filter(function(f) { return f.grupoNumero === valor; }));
    }
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
        resumenTitulo: 'Ficha Individual'
    });
});

document.getElementById('btn-pdf-grupo').addEventListener('click', function() {
    var lista = cargarLista();
    var valor = document.getElementById('select-grupo-pdf').value;
    var grupoNombre = valor === 'todos' ? 'Todos los grupos' : 'Grupo ' + valor;

    var datos;
    if (valor === 'todos') {
        datos = lista;
    } else {
        datos = lista.filter(function(f) { return f.grupoNumero === valor; });
    }

    if (datos.length === 0) {
        alert('No hay publicadores en este grupo.');
        return;
    }

    var tempDiv = document.createElement('div');
    tempDiv.style.color = '#000000';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.padding = '15px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.width = '680px';

    tempDiv.innerHTML = '<h1 style="text-align:center;color:#000;margin-bottom:5px;">' + grupoNombre + '</h1>' +
        '<p style="text-align:center;color:#333;margin-bottom:15px;">Total: ' + datos.length + ' publicadores</p>';

    datos.forEach(function(f) {
        tempDiv.innerHTML += renderizarFichaPDF(f);
    });

    var resumen = calcularResumenGrupo(datos);
    tempDiv.innerHTML += renderizarResumen(resumen, grupoNombre);

    document.body.appendChild(tempDiv);

    html2pdf().set({
        margin: 10,
        filename: 'Grupo_' + valor + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'landscape' },
        pagebreak: { mode: ['css'] }
    }).from(tempDiv).save().then(function() {
        if (tempDiv.parentNode) document.body.removeChild(tempDiv);
    }).catch(function(err) {
        console.error('Error generando PDF:', err);
        alert('Error al generar PDF: ' + err.message);
        if (tempDiv.parentNode) document.body.removeChild(tempDiv);
    });
});

canal.onmessage = function(e) {
    if (e.data === 'actualizar') {
        mostrarFichas(cargarLista());
    }
};

window.addEventListener('storage', function(e) {
    if (e.key === 'publicadores') {
        mostrarFichas(cargarLista());
    }
});
