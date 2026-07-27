var _k = ['P','a','n','d','a','2','0','0','4','2'];
var _s = ['A','g','u','a','A','z','u','l','1','2','3','4'];
var CONTRASENA_SECRETARIO = _k.join('');
var CONTRASENA_SIMPLE = _s.join('');

function verificarSesion() {
    return sessionStorage.getItem('acceso');
}

function iniciarSesion(nivel) {
    sessionStorage.setItem('acceso', nivel);
}

function cerrarSesion() {
    sessionStorage.removeItem('acceso');
}

var nivelActual = verificarSesion();
if (nivelActual === 'secretario') {
    window.location.href = 'index.html';
} else if (nivelActual === 'simple') {
    window.location.href = 'meses.html';
}

document.getElementById('btn-entrar').addEventListener('click', function() {
    var clave = document.getElementById('input-password').value;
    if (clave === CONTRASENA_SECRETARIO) {
        iniciarSesion('secretario');
        window.location.href = 'index.html';
    } else if (clave === CONTRASENA_SIMPLE) {
        iniciarSesion('simple');
        window.location.href = 'meses.html';
    } else {
        document.getElementById('error-msg').style.display = 'block';
        document.getElementById('input-password').value = '';
        document.getElementById('input-password').focus();
    }
});

document.getElementById('input-password').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('btn-entrar').click();
    }
});
